# Driver Assignment System

## Overview

Scheduling system that assigns drivers to specific delivery steps on specific dates. Enables efficient route planning and ensures all booked legs have assigned drivers.

## Key Concepts

### Delivery Step

A single leg of the trail where luggage needs to be transferred:

- Defined by: `(fromStageId, toStageId)`
- Example: `('PC', 'VM')` = Porto Covo → Vila Nova de Milfontes
- 26 total steps (13 North→South + 13 South→North)

### Assignment

Links a driver to a delivery step on a specific date:

```typescript
interface DriverStepAssignment {
	id: string;
	date: string; // YYYY-MM-DD
	fromStageId: string; // Starting stage
	toStageId: string; // Ending stage
	driverId: string; // Driver user ID
}
```

**Unique Constraint:** `(date, fromStageId, toStageId, driverId)`

- Only one driver per step per date
- Prevents duplicate assignments

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DRIVER ASSIGNMENT FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

ADMIN/OWNER DASHBOARD
       │
       ├─── Views Calendar
       │         │
       │         └─── Sees dates with bookings (green = all assigned, red = needs drivers)
       │
       └─── Selects Date
                 │
                 ├─── Sees all steps with bookings for that date
                 │
                 └─── Assigns drivers via dropdowns
                           │
                           ▼
                    ┌──────────────┐
                    │  Form Submit │
                    │ assignDriver │
                    │   ToStep()   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │    Update    │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Driver     │
                    │ Notification │
                    │  (Future)    │
                    └──────────────┘

DRIVER DASHBOARD
       │
       ├─── Views Calendar
       │         │
       │         └─── Sees assigned dates highlighted
       │
       └─── Selects Date
                 │
                 └─── Sees assigned steps with:
                           - Pickup hotels
                           - Bag counts
                           - Current bag statuses
                           - QR scanner link
```

## Calendar Summary

**Location:** `src/lib/server/driver-assignment/calendar-summary.ts`

### `getCalendarSummaryForMonth(yearMonth)`

Returns daily summary for calendar view.

**Algorithm:**

```typescript
1. Parse yearMonth (YYYY-MM)
2. Calculate date range (1st to last day of month)
3. Find all dates with active bookings
4. Find all dates with driver assignments
5. For each date:
   - hasActiveJourneys = has pending/paid booking segments
   - hasDriverAssignments = all booked steps have drivers
6. Return array of { date, hasActiveJourneys, hasDriverAssignments }
```

**Calendar Display Logic:**

```
Date Cell Colors:
┌─────────────────────────────────────┐
│ No color        = No bookings       │
│ Green border    = All assigned ✓    │
│ Red border      = Needs drivers ⚠   │
│ Yellow dot      = Selected date     │
└─────────────────────────────────────┘
```

### `getStepsWithBookingsOnDate(dateStr)`

Returns all steps that have bookings on a specific date.

**Query:**

```sql
SELECT DISTINCT from_stage_id, to_stage_id
FROM booking_segment
JOIN booking ON booking.id = booking_segment.booking_id
WHERE travel_date = ?
  AND booking.status IN ('pending', 'paid')
```

### `getBookedStepKeysByDateInRange(startStr, endStr)`

Batch query for calendar optimization.

### `getAssignedStepKeysByDateInRange(startStr, endStr)`

Returns which steps already have drivers assigned.

## Assignment Management

**Location:** `src/lib/server/driver-assignment/assignments.ts`

### `setAssignment(dateStr, fromStageId, toStageId, driverId)`

Creates or updates an assignment.

**Logic:**

```typescript
// 1. Check if assignment exists
const existing = await db
	.select()
	.from(driverStepAssignmentTable)
	.where(
		and(
			eq(driverStepAssignmentTable.date, dateStr),
			eq(driverStepAssignmentTable.fromStageId, fromStageId),
			eq(driverStepAssignmentTable.toStageId, toStageId)
		)
	);

// 2. If exists, update; otherwise insert
if (existing.length > 0) {
	await db
		.update(driverStepAssignmentTable)
		.set({ driverId })
		.where(eq(driverStepAssignmentTable.id, existing[0].id));
} else {
	await db.insert(driverStepAssignmentTable).values({
		id: randomUUID(),
		date: dateStr,
		fromStageId,
		toStageId,
		driverId
	});
}
```

### `clearAssignment(dateStr, fromStageId, toStageId)`

Removes driver assignment from a step.

```sql
DELETE FROM driver_step_assignment
WHERE date = ?
  AND from_stage_id = ?
  AND to_stage_id = ?;
```

### `getAssignmentsForDate(dateStr)`

Returns all assignments for a specific date.

**Return Format:**

```typescript
Record<stepKey, driverId[]>;
// stepKey = "fromId:toId"
// Example: { "PC:VM": ["driver-123"], "VM:AL": ["driver-456"] }
```

### `getAssignmentsForDriver(driverId, startStr, endStr)`

Returns all assignments for a driver in a date range.

**Use Case:** Driver dashboard calendar

## Admin UI

### Schedule Component

**Location:** `src/lib/components/dashboard/admin/AdminSchedule.svelte`

**Features:**

1. **Month Calendar:**
   - Shows all dates in month
   - Color-coded by assignment status
   - Click to select date

2. **Day Detail View:**
   - Lists all steps with bookings for selected date
   - Shows current driver assignment (if any)
   - Dropdown to assign/change driver
   - Real-time save on change

3. **Assignment Matrix:**
   ```
   Step                    │ Driver
   ────────────────────────┼──────────────
   Porto Covo → Milfontes  │ [John Doe ▼]
   Milfontes → Almograve   │ [Jane Smith ▼]
   Almograve → Zambujeira  │ [Unassigned ▼]
   ```

### Assignment Form Action

**Location:** `src/routes/dashboard/+page.server.ts`

```typescript
assignDriverToStep: async ({ request, locals }) => {
	// 1. Auth check
	if (!canPerformAdminActions(locals.user)) {
		return fail(403, { message: 'Unauthorized' });
	}

	// 2. Parse form data
	const { dateStr, fromStageId, toStageId, driverId, calendarMonth } = formData;

	// 3. Validate driver exists and is driver role
	const [driver] = await db
		.select()
		.from(userTable)
		.where(and(eq(userTable.id, driverId), eq(userTable.role, 'driver')));

	if (!driver) {
		return fail(400, { message: 'Invalid driver' });
	}

	// 4. Set assignment (or clear if empty)
	if (!driverId) {
		await clearAssignment(dateStr, fromStageId, toStageId);
	} else {
		await setAssignment(dateStr, fromStageId, toStageId, driverId);
	}

	// 5. Redirect preserving calendar state
	throw redirect(303, `/dashboard?calendarMonth=${calendarMonth}&selectedDate=${dateStr}`);
};
```

## Driver Dashboard

### Calendar View

**Location:** `src/routes/dashboard/+page.server.ts` (driver role branch)

**Load Logic:**

```typescript
if (user.role === 'driver') {
	// Get assignments for current month
	const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
	const endStr = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

	const baseAssignments = await getAssignmentsForDriver(user.id, startStr, endStr);

	// Enrich with hotel and bag data
	driverAssignments = await Promise.all(
		baseAssignments.map(async (a) => {
			// Get segment details
			const segments = await getSegmentsForAssignment(a);

			// Calculate pickup info
			const pickups = segments.map((s) => ({
				hotelName: s.startHotelName,
				bags: s.numBags
			}));

			// Get bag statuses
			const bags = await getBagStatusesForAssignment(a);

			return {
				...a,
				pickups,
				totalBags: sum(pickups.map((p) => p.bags)),
				bags
			};
		})
	);
}
```

### Assignment Display

```
┌─────────────────────────────────────────────────────────────┐
│ March 15, 2025                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Route: Porto Covo → Lagos                                   │
│                                                             │
│ Leg 1: Porto Covo → Milfontes                               │
│   Pickup: Hotel A (2 bags)                                  │
│   Bags: A, B                                                │
│   Status: [Scan QR]                                         │
│                                                             │
│ Leg 2: Milfontes → Almograve                                │
│   Pickup: Hotel B (1 bag)                                   │
│   Bags: C                                                   │
│   Status: [Scan QR]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Daily Capacity Limits

**Environment Variable:** `MAX_TRANSFERS_PER_DAY`

**Purpose:** Prevent overbooking by limiting transfers per calendar day.

**Calculation:**

```typescript
function proposedCountsByDate(departureDate, route) {
	const counts = {};
	for (let i = 0; i < route.length; i++) {
		const date = addDays(departureDate, i);
		counts[date] = (counts[date] || 0) + 1;
	}
	return counts;
}

// Check against existing
for (const date of Object.keys(proposed)) {
	const existing = await countExistingSegmentsForDate(date);
	if (existing + proposed[date] > MAX_TRANSFERS_PER_DAY) {
		return { ok: false, message: 'Dates fully booked' };
	}
}
```

**Admin Override:**

- Capacity check is advisory for booking flow
- Admin can manually add bookings beyond limit
- Used for capacity planning, not hard enforcement

## Best Practices

### Assignment Timing

**Recommended Workflow:**

1. **Weekly Review:** Admin reviews next 7-14 days
2. **Assign Early:** Assign drivers 3-7 days in advance
3. **Balance Load:** Distribute steps evenly among available drivers
4. **Consider Geography:** Assign adjacent steps to same driver when possible

### Handling Changes

**Customer Booking Change:**

```
1. Customer modifies booking dates
2. System recalculates segments
3. Old date assignments remain (manual cleanup needed)
4. Admin assigns drivers to new dates
```

**Driver Unavailability:**

```
1. Admin clears assignments for driver on affected dates
2. Reassigns to other drivers
3. Notifications sent (when implemented)
```

### Optimization Tips

**Route Efficiency:**

- Assign consecutive steps to same driver
- Minimize driver travel between pickup points
- Consider hotel clustering

**Load Balancing:**

```sql
-- View driver workload for date range
SELECT
  driver_id,
  COUNT(*) as total_assignments,
  SUM(total_bags) as total_bags
FROM driver_step_assignment dsa
JOIN (
  SELECT date, from_stage_id, to_stage_id, SUM(num_bags) as total_bags
  FROM booking_segment
  JOIN booking ON booking.id = booking_segment.booking_id
  WHERE status = 'paid'
  GROUP BY date, from_stage_id, to_stage_id
) segments ON segments.date = dsa.date
           AND segments.from_stage_id = dsa.from_stage_id
           AND segments.to_stage_id = dsa.to_stage_id
WHERE dsa.date BETWEEN '2025-06-01' AND '2025-06-30'
GROUP BY driver_id;
```

## Future Enhancements

### Notification System

- Email/SMS when assignment created
- Daily reminder to drivers
- Alert when step not assigned 24h before

### Mobile App

- Push notifications
- GPS tracking
- Photo proof of delivery

### Auto-Assignment

```
Algorithm:
1. Load all unassigned steps for date
2. Load all available drivers
3. For each step:
   - Find driver with fewest assignments that day
   - Prefer driver assigned to adjacent step
   - Balance total bag count
4. Auto-assign with admin review
```

### Capacity Dashboard

- Visual capacity by date
- Warning when approaching limit
- Historical booking patterns

## Key Files

| File                                                        | Purpose                        |
| ----------------------------------------------------------- | ------------------------------ |
| `src/lib/server/driver-assignment/calendar-summary.ts`      | Calendar data queries          |
| `src/lib/server/driver-assignment/assignments.ts`           | CRUD operations                |
| `src/lib/components/dashboard/admin/AdminSchedule.svelte`   | Admin assignment UI            |
| `src/lib/components/dashboard/admin/CompactCalendar.svelte` | Calendar component             |
| `src/lib/components/dashboard/DriverDashboard.svelte`       | Driver assignment view         |
| `src/routes/dashboard/+page.server.ts`                      | Load functions and actions     |
| `src/lib/delivery-steps.ts`                                 | Step definitions and utilities |

## Troubleshooting

### Assignment Not Saving

```bash
# Check database constraint
psql $DATABASE_URL -c "\d driver_step_assignment"

# Verify unique constraint not violated
psql $DATABASE_URL -c "
  SELECT date, from_stage_id, to_stage_id, COUNT(*)
  FROM driver_step_assignment
  GROUP BY date, from_stage_id, to_stage_id
  HAVING COUNT(*) > 1;
"
```

### Driver Not Seeing Assignments

```sql
-- Check if assignments exist
SELECT * FROM driver_step_assignment
WHERE driver_id = 'driver-uuid'
AND date = '2025-06-01';

-- Check if user has driver role
SELECT role FROM "user" WHERE id = 'driver-uuid';
```

### Calendar Not Updating

```typescript
// In component, after form submission
import { invalidateAll } from '$app/navigation';

// Call invalidateAll() to refresh data
// Or use enhance with callback
```
