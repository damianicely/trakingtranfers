# Booking Flow Documentation

## Overview

Complete end-to-end flow for booking luggage transfers on the Rota Vicentina trail.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BOOKING FLOW SEQUENCE                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────┐
│  GUEST   │────►│  HOME PAGE   │────►│    FORM      │────►│   STRIPE     │────►│ SUCCESS│
│          │     │              │     │   STEP 1     │     │  CHECKOUT    │     │  PAGE  │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └────────┘
                                                                           │
                                                                           ▼
                                                                   ┌──────────────┐
                                                                   │   WEBHOOK    │
                                                                   │  (Stripe →   │
                                                                   │   Server)    │
                                                                   └──────┬───────┘
                                                                          │
                                                                          ▼
                                                                   ┌──────────────┐
                                                                   │  BAG CREATION│
                                                                   │  USER LINK   │
                                                                   └──────────────┘
```

## Detailed Steps

### 1. Landing Page (`/`)

**Components:**

- `+page.svelte` - Main page
- `BookingForm.svelte` - Two-step booking form
- `BasicDetailsStep.svelte` - Step 1: Contact info
- `Route.svelte` - Step 2: Trip details

**User Flow:**

```
User arrives on homepage
        │
        ├─── Sees hero section with trail info
        │
        └─── Scrolls to booking form
                    │
                    ├─── Step 1: Basic Details
                    │         - First Name (hidden if logged in)
                    │         - Last Name (hidden if logged in)
                    │         - Email (readonly if logged in)
                    │         - Phone (hidden if logged in)
                    │         - Other Booking Names (optional)
                    │         - Email validation on blur
                    │
                    └─── Step 2: Trip Details
                              - Departure Date (calendar picker)
                              - Starting Stage (dropdown)
                              - Ending Stage (dropdown)
                              - Number of Bags
                              - Price calculation (real-time)
                              - "Pay Now" button
```

**Logged In User Variation:**

- Email field is readonly (matches account)
- Name/phone fields hidden
- Proceeds with existing account

---

### 2. Form Validation

**Client-Side Validation:**

```typescript
// Basic Details
- First name: Required (unless logged in)
- Last name: Required (unless logged in)
- Email: Valid email format, required
- Phone: Required (unless logged in)

// Trip Details
- Departure date: Required, must be future date
- Starting stage: Required
- Ending stage: Required, must differ from start
- Number of bags: Required, min 1
```

**Server-Side Checks:**

**Email Check (on blur + before pay):**

```
POST /api/booking/check
Body: { type: 'email', email: string }

Response:
  { ok: true } → Proceed
  { ok: false, message } → Show error: "An account with this email is already registered."
```

**Availability Check (on Pay Now):**

```
POST /api/booking/check
Body: {
  type: 'availability',
  departureDate: '2025-06-01',
  route: [['PC', 'VM'], ['VM', 'AL'], ...]
}

Response:
  { ok: true } → Proceed to checkout
  { ok: false, message } → Show error: "The selected dates are fully booked."
```

**Logged In Check:**

- If `locals.user` exists, email must match `user.username`
- Skip email-exists check (user already authenticated)

---

### 3. Checkout Creation

**When user clicks "Pay Now":**

```
1. Client validates form
2. Calls checkEmailWithServer() if not logged in
3. Calls checkAvailabilityWithServer()
4. If all checks pass:

   POST /?/createCheckout
   FormData: {
     amount: '150.00',
     bookingPayload: JSON.stringify({
       basicDetails: { ... },
       aboutTrip: { ... },
       route: [['PC', 'VM'], ['VM', 'AL'], ...]
     })
   }
```

**Server Processing (`+page.server.ts`):**

```typescript
1. Parse form data
2. Validate amount is positive number
3. Parse bookingPayload JSON
4. If logged in:
   - Verify email matches locals.user.username
5. If not logged in:
   - Run checkEmailExists(email)
6. Run checkDailyCapacity(departureDate, route)
7. Generate bookingId (UUID v4)
8. Create booking record:
   {
     id: bookingId,
     userId: locals.user?.id ?? null,
     status: 'pending',
     stripeSessionId: null,
     firstName, lastName, bookingOtherNames,
     email, phone,
     departureDate, direction,
     departureStageId, destinationStageId,
     numBags, numTransfers, totalPrice,
     createdAt: NOW()
   }
9. Create booking_segment rows:
   For each route segment [from, to] at index i:
   {
     id: segmentId,
     bookingId,
     segmentIndex: i.toString(),
     fromStageId: from,
     toStageId: to,
     travelDate: departureDate + i days
   }
10. Create Stripe Checkout Session:
    {
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Luggage transfer booking' },
          unit_amount: amount * 100  // Convert to cents
        },
        quantity: 1
      }],
      metadata: { bookingId },
      success_url: '/booking-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: '/?canceled=1'
    }
11. Update booking with stripeSessionId
12. Return { url: session.url, bookingId }
```

**Client Response Handling:**

```typescript
const result = await response.json();
if (result.url) {
	window.location.href = result.url; // Redirect to Stripe
} else {
	showError(result.message || 'Failed to create checkout');
}
```

---

### 4. Stripe Checkout

**User Experience:**

```
User lands on Stripe-hosted checkout page
        │
        ├─── Pre-filled with email from booking
        │
        ├─── Enters test card (4242 4242 4242 4242)
        │
        └─── Completes payment
                    │
                    ├─── Success → Redirects to /booking-success
                    │
                    └─── Cancel → Redirects to /?canceled=1
```

**Test Cards:**
| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |

---

### 5. Payment Webhook

**Stripe sends `checkout.session.completed`:**

```
POST /api/webhook/stripe
Headers: stripe-signature

1. Verify signature with STRIPE_WEBHOOK_SECRET
2. Extract bookingId from session.metadata
3. Extract email from session.customer_details.email
4. Check if booking exists
5. Find or create user:

   IF user exists with email:
     - Use existing userId
     - Backfill first/last name if empty

   ELSE:
     - Generate random password
     - Hash with Argon2id
     - Create user: { id, username: email, passwordHash, firstName, lastName }
     - Set userId

6. Update booking:
   - status: 'paid'
   - userId: userId
   - stripeSessionId: session.id

7. Create bags for booking:
   - Generate bag labels: A, B, C...
   - Bag IDs: {bookingRef}-{label}
   - Create bag_legs for each segment

8. Generate password reset token
   - 24 hour expiry
   - URL: /reset-password/{token}
   - Log to console (email integration pending)

9. Return 200 OK
```

**Error Handling:**

- If booking not found: Log error, return 200 (don't retry)
- If no email in session: Mark paid but can't create user
- Always return 200 to prevent Stripe retries

---

### 6. Success Page

**Route:** `/booking-success`

**Function:**

- Displays confirmation message
- Shows booking reference
- Instructions to check email for account setup
- Link to dashboard (after login)

---

### 7. Post-Booking Actions

**User Account:**

- New users receive password setup email (logged to console in dev)
- Visit `/reset-password/{token}` to set password
- Can then log in and view bookings

**Bag Tracking:**

- Bags visible in customer dashboard
- Each bag shows current location
- Real-time updates as driver scans

**Driver Assignment:**

- Admin assigns drivers to delivery steps
- Driver sees assignments on their dashboard
- Driver scans QR codes to update status

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

FORM SUBMISSION
       │
       ▼
┌──────────────┐
│  Form Data   │
│  Validation  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Create     │
│   Booking    │ ─────┐
│  (pending)   │      │
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│   Create     │      │
│  Segments    │      │
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│    Stripe    │      │
│   Checkout   │      │
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│   Payment    │      │
│  Completed   │      │
└──────┬───────┘      │
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Update     │  │    Create    │
│   Booking    │  │     Bags     │
│   (paid)     │  │    & Legs    │
└──────┬───────┘  └──────────────┘
       │
       ▼
┌──────────────┐
│  Link/User   │
│   Create     │
└──────────────┘
```

## State Transitions

### Booking Status

```
┌──────────┐    Payment     ┌──────────┐    Cancel     ┌──────────┐
│ PENDING  │ ──────────────►│   PAID   │ ─────────────►│CANCELLED │
└──────────┘   Webhook      └──────────┘   (admin)    └──────────┘
     │                            │
     │ Timeout (not implemented) │
     ▼                            ▼
[Could add: Expired]    [Driver updates bag_legs]
```

### Bag Leg Status

```
┌───────────┐   Pickup    ┌───────────┐  Delivery  ┌───────────┐
│ AT_HOTEL  │ ───────────►│WITH_DRIVER│ ──────────►│ DELIVERED │
└───────────┘             └───────────┘            └───────────┘
       ▲                                                  │
       └──────────────────────────────────────────────────┘
                    (Reset for re-delivery if needed)
```

## Error Scenarios

### Email Already Registered

```
User enters registered email
        │
        ▼
API returns: { ok: false, message: "An account with this email is already registered." }
        │
        ▼
UI shows: "This email is already registered. Log in to book with this email."
        │
        └─── Shows "Log in" button
              │
              └─── Opens login modal
                    │
                    └─── User logs in
                          │
                          └─── Form continues with logged-in user
```

### Dates Fully Booked

```
User clicks Pay Now
        │
        ▼
API returns: { ok: false, message: "The selected dates are fully booked." }
        │
        ▼
UI shows: "The selected dates are fully booked. Please choose different dates."
        │
        └─── Highlights date picker
              │
              └─── User selects new dates
                    │
                    └─── Re-validates availability
```

### Payment Failed

```
User on Stripe checkout
        │
        ▼
Card declined (4000 0000 0000 9995)
        │
        ▼
Stripe shows decline message
        │
        ▼
User can retry with different card
        │
        └─── Or cancel and return to /?canceled=1
```

## Key Files

| File                                                 | Purpose                         |
| ---------------------------------------------------- | ------------------------------- |
| `src/routes/+page.svelte`                            | Homepage with booking form      |
| `src/routes/+page.server.ts`                         | Checkout creation action        |
| `src/lib/components/BookingForm.svelte`              | Main booking form component     |
| `src/lib/components/booking/BasicDetailsStep.svelte` | Step 1 component                |
| `src/lib/components/booking/Route.svelte`            | Step 2 component                |
| `src/routes/api/booking/check/+server.ts`            | Validation API                  |
| `src/routes/api/webhook/stripe/+server.ts`           | Payment webhook                 |
| `src/lib/server/booking/checks.ts`                   | Validation logic                |
| `src/lib/trail.ts`                                   | Trail stages & route generation |
| `src/lib/booking/price.ts`                           | Pricing calculation             |

## Pricing Logic

**Base Calculation:**

```typescript
// Simple per-transfer pricing
pricePerTransfer = 15 EUR  // Configurable
numTransfers = route.length
totalPrice = numTransfers * pricePerTransfer * numBags
```

**Example:**

- Porto Covo to Lagos: 12 transfers
- 2 bags
- Price: 12 × €15 × 2 = €360

**Implementation:** See `src/lib/booking/price.ts`
