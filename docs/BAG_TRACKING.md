# Bag Tracking System

## Overview

Real-time luggage tracking system that allows customers to see where their bags are and drivers to update bag status throughout the delivery process.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BAG TRACKING FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

PAYMENT COMPLETED
       │
       ▼
┌──────────────┐
│ createBags   │
│ ForBooking() │
└──────┬───────┘
       │
       ├─── Create bag rows (A, B, C...)
       │         │
       │         └─── Bag ID: {bookingRef}-{label}
       │
       └─── Create bag_leg rows for each segment
                 │
                 └─── Status: 'at_hotel'

CUSTOMER VIEW                    DRIVER VIEW
       │                              │
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│  Dashboard   │              │  Dashboard   │
│   Shows      │              │   Shows      │
│  Locations   │              │  Assignments │
└──────────────┘              └──────┬───────┘
                                     │
                                     ▼
                            ┌──────────────┐
                            │ Scan QR Code │
                            │   (/driver/  │
                            │  bag/{id})   │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  Update Leg  │
                            │   Status     │
                            └──────────────┘
```

## Data Model

### Bag Entity

```typescript
interface Bag {
	id: string; // Composite ID: "43ab33a6949e-A"
	bookingId: string; // UUID of parent booking
	label: string; // A, B, C... (unique per booking)
}
```

**ID Generation:**

- First 12 characters of booking UUID (no dashes)
- Dash separator
- Label letter(s)
- Example: `43ab33a6949e-A`, `43ab33a6949e-B`

**Labels:**

- Single letters: A-Z (26 bags)
- Double letters: AA-ZZ (if more needed)

### Bag Leg Entity

```typescript
interface BagLeg {
	id: string; // UUID
	bagId: string; // Parent bag
	segmentId: string; // Route segment
	status: 'at_hotel' | 'with_driver' | 'delivered';
	pickedUpAt?: Date; // Timestamp when collected
	deliveredAt?: Date; // Timestamp when delivered
}
```

**One bag per booking segment:**

```
Booking: Porto Covo → Lagos (5 days)
├── Bag A
│   ├── Leg 1: PC → VM (Day 1)
│   ├── Leg 2: VM → AL (Day 2)
│   ├── Leg 3: AL → ZM (Day 3)
│   ├── Leg 4: ZM → OD (Day 4)
│   └── Leg 5: OD → AJ (Day 5)
│
└── Bag B
    ├── Leg 1: PC → VM (Day 1)
    ├── Leg 2: VM → AL (Day 2)
    └── ...etc
```

## Bag Creation Process

**Triggered by:** Stripe webhook after successful payment

**Location:** `src/lib/server/bag/create-bags-for-booking.ts`

```typescript
async function createBagsForBooking(db, bookingId): Promise<{ created: number }>;
```

**Algorithm:**

1. **Fetch Booking Data:**

   ```typescript
   SELECT num_bags FROM booking WHERE id = bookingId
   ```

2. **Check for Existing Bags:**
   - Prevents duplicate creation (idempotent)
   - If bags exist, return `{ created: 0 }`

3. **Generate Bag Rows:**

   ```typescript
   for i from 0 to numBags - 1:
     label = bagLabel(i)  // A, B, C...
     bagId = `${bookingRef}-${label}`
     insert bag { id: bagId, bookingId, label }
   ```

4. **Fetch Segments:**

   ```typescript
   SELECT id, segment_index
   FROM booking_segment
   WHERE booking_id = bookingId
   ORDER BY segment_index
   ```

5. **Create Bag Legs:**

   ```typescript
   for each bag:
     for each segment:
       insert bag_leg {
         id: randomUUID(),
         bagId: bag.id,
         segmentId: segment.id,
         status: 'at_hotel'
       }
   ```

6. **Return count of bags created**

## Status Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATUS FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Day 1 Morning (Hotel 1)
┌──────────────┐
│   AT_HOTEL   │◄─────────────────────────────────────────────┐
└──────┬───────┘                                              │
       │ Driver arrives, scans QR                              │
       ▼                                                       │
┌──────────────┐                                               │
│ WITH_DRIVER  │                                               │
└──────┬───────┘                                               │
       │ Driver drives to next hotel                           │
       ▼                                                       │
┌──────────────┐                                               │
│  DELIVERED   │                                               │
└──────────────┘                                               │
                                                               │
Day 2 Morning (Hotel 2)                                        │
       │                                                       │
       └───────────────────────────────────────────────────────┘
       Next leg becomes 'at_hotel' (implicitly, driver pickup)

LEG STATUS UPDATES:
- Only ONE leg per bag can be non-delivered at a time
- When driver delivers, that leg = 'delivered'
- Next leg automatically becomes active (shown in UI)
- Customer sees location based on current (non-delivered) leg
```

## Customer View

### Dashboard Display

**Location:** `src/routes/dashboard/+page.server.ts`

**Query for Bag Locations:**

```typescript
// 1. Get customer's bags
SELECT bag.id, bag.booking_id, bag.label
FROM bag
WHERE bag.booking_id IN (user's booking IDs)

// 2. Get all legs for these bags
SELECT
  bag_leg.bag_id,
  bag_leg.segment_id,
  bag_leg.status,
  segment.segment_index,
  segment.start_hotel_id,
  segment.end_hotel_id
FROM bag_leg
JOIN booking_segment ON booking_segment.id = bag_leg.segment_id
WHERE bag_leg.bag_id IN (bag IDs)

// 3. Get hotel names
SELECT id, name FROM hotel WHERE id IN (start/end hotel IDs)
```

**Location Logic:**

```typescript
function getBagLocation(bagLegs, hotelMap) {
	// Sort by segment index
	const sortedLegs = bagLegs.sort((a, b) => a.segmentIndex - b.segmentIndex);

	// Find first non-delivered leg
	const currentLeg = sortedLegs.find((l) => l.status !== 'delivered');

	if (!currentLeg) {
		// All delivered - show final location
		const last = sortedLegs[sortedLegs.length - 1];
		return `Delivered at ${hotelMap[last.endHotelId]}`;
	}

	if (currentLeg.status === 'at_hotel') {
		return `At ${hotelMap[currentLeg.startHotelId]}`;
	}

	if (currentLeg.status === 'with_driver') {
		return 'With driver';
	}
}
```

### UI Display

**Customer Dashboard Shows:**

```
Your Bags
┌─────────────────────────────────────┐
│ Booking #43ab33a6949e               │
│ Route: Porto Covo → Lagos           │
│                                     │
│ Bag A: With driver                  │
│ Bag B: At Hotel Porto Covo          │
│                                     │
│ [View Details]                      │
└─────────────────────────────────────┘
```

## Driver Operations

### Assignment System

**Admin assigns drivers to delivery steps:**

- Date: YYYY-MM-DD
- Step: (fromStageId, toStageId)
- Driver: User ID

**Driver Dashboard Shows:**

- Calendar with assigned dates
- List of steps for selected date
- Total bags to collect/deliver
- Pickup hotels with bag counts

### QR Code Scanning

**Bag ID Format:** `{bookingRef}-{label}`

- URL: `/driver/bag/{bagId}`
- Example: `/driver/bag/43ab33a6949e-A`

**Scanning Page Flow:**

```
1. Driver scans QR code
2. Page loads /driver/bag/{bagId}
3. Shows:
   - Bag label (A, B, C...)
   - Current segment
   - Current status
   - Pickup hotel
   - Delivery hotel
   - Action buttons:
     * [Mark Picked Up] (if at_hotel)
     * [Mark Delivered] (if with_driver)
```

**Status Update Form:**

```typescript
// POST to same page with action
action: 'updateLegStatus'
formData: {
  bagId: string,
  segmentId: string,
  newStatus: 'with_driver' | 'delivered'
}
```

**Server Action:**

```typescript
// 1. Verify driver is assigned to this step on this date
// 2. Verify bag leg belongs to this step
// 3. Update status
// 4. Set pickedUpAt or deliveredAt timestamp
// 5. Return success + redirect back to driver dashboard
```

## Bag Leg Status Update Logic

```typescript
// Valid transitions:
'at_hotel' → 'with_driver'  // Driver picks up
'with_driver' → 'delivered' // Driver drops off

// Invalid (prevented):
'at_hotel' → 'delivered'     // Must go through with_driver
'delivered' → any            // Completed leg

// Timestamp updates:
'at_hotel' → 'with_driver': set pickedUpAt = NOW()
'with_driver' → 'delivered': set deliveredAt = NOW()
```

## Driver Dashboard Queries

**Load Driver Assignments:**

```typescript
// Get assignments for month
SELECT date, from_stage_id, to_stage_id
FROM driver_step_assignment
WHERE driver_id = ?
  AND date BETWEEN ? AND ?

// For each assignment, enrich with:
// - Pickup hotels and bag counts
// - Individual bag details
// - Current leg status per bag
```

**Enrichment Query:**

```typescript
SELECT
  segment.id as segment_id,
  segment.start_hotel_id,
  hotel.name as start_hotel_name,
  booking.num_bags,
  booking.id as booking_id
FROM booking_segment segment
JOIN booking ON booking.id = segment.booking_id
LEFT JOIN hotel ON hotel.id = segment.start_hotel_id
WHERE segment.travel_date = ?
  AND segment.from_stage_id = ?
  AND segment.to_stage_id = ?
```

## Real-Time Updates

**Current Implementation:**

- Server-side rendering on page load
- No WebSocket/SSE (yet)
- Customer refreshes page to see updates
- Driver sees updates after form submission (page reload)

**Future Enhancement:**

- WebSocket or Server-Sent Events for live updates
- Push notifications when bag status changes
- SMS updates for customers

## Edge Cases

### Multiple Drivers on Same Step

**Current Design:**

- One driver per step per date (enforced by unique constraint)
- If multiple drivers needed, assign to different sub-steps

**Alternative (Future):**

- Allow multiple drivers per step
- Divide bags between drivers
- Track which driver has which bags

### Bag Recovery

**Scenario:** Bag marked delivered but was actually lost

**Recovery Process:**

1. Admin updates bag_leg status back to 'at_hotel'
2. Clears deliveredAt timestamp
3. Driver can re-scan and re-deliver

### Partial Delivery

**Scenario:** Multi-bag booking, some delivered, some not

**Handling:**

- Each bag has independent legs
- Each leg has independent status
- Customer sees mixed status: "Bag A: Delivered, Bag B: With driver"

## Key Files

| File                                            | Purpose                           |
| ----------------------------------------------- | --------------------------------- |
| `src/lib/server/bag/create-bags-for-booking.ts` | Creates bags after payment        |
| `src/routes/dashboard/+page.server.ts`          | Loads bag data for customer view  |
| `src/routes/driver/bag/[bagId]/+page.server.ts` | Driver scanning and updates       |
| `src/routes/driver/bag/[bagId]/+page.svelte`    | Driver scan UI                    |
| `src/lib/server/db/schema.ts`                   | Bag and bag_leg table definitions |

## Database Queries

### Get All Bags for Booking

```sql
SELECT * FROM bag WHERE booking_id = ? ORDER BY label;
```

### Get Bag with All Legs

```sql
SELECT
  b.*,
  bl.id as leg_id,
  bl.status,
  bl.picked_up_at,
  bl.delivered_at,
  s.segment_index,
  s.from_stage_id,
  s.to_stage_id
FROM bag b
JOIN bag_leg bl ON bl.bag_id = b.id
JOIN booking_segment s ON s.id = bl.segment_id
WHERE b.id = ?
ORDER BY s.segment_index;
```

### Update Leg Status

```sql
UPDATE bag_leg
SET
  status = ?,
  picked_up_at = CASE WHEN ? = 'with_driver' THEN NOW() ELSE picked_up_at END,
  delivered_at = CASE WHEN ? = 'delivered' THEN NOW() ELSE delivered_at END
WHERE id = ?;
```

### Get Driver's Active Bags

```sql
SELECT DISTINCT
  b.id as bag_id,
  b.label,
  bk.id as booking_id,
  bl.status,
  s.from_stage_id,
  s.to_stage_id,
  h_start.name as pickup_hotel,
  h_end.name as dropoff_hotel
FROM driver_step_assignment dsa
JOIN booking_segment s ON
  s.travel_date = dsa.date
  AND s.from_stage_id = dsa.from_stage_id
  AND s.to_stage_id = dsa.to_stage_id
JOIN bag_leg bl ON bl.segment_id = s.id
JOIN bag b ON b.id = bl.bag_id
JOIN booking bk ON bk.id = b.booking_id
LEFT JOIN hotel h_start ON h_start.id = s.start_hotel_id
LEFT JOIN hotel h_end ON h_end.id = s.end_hotel_id
WHERE dsa.driver_id = ?
  AND dsa.date = ?
  AND bl.status IN ('at_hotel', 'with_driver');
```
