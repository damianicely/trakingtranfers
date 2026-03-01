# API Reference

## Overview

All API endpoints are located under `src/routes/api/`. This document describes both REST API endpoints and form actions.

## REST API Endpoints

### POST `/api/booking/check`

Validates booking data before checkout. Used by booking form for UX feedback.

**Rate Limit:** 20 requests per minute per IP

**Request Body:**

```typescript
// Type: 'email'
{
  type: 'email',
  email: string  // Email to check
}

// Type: 'availability'
{
  type: 'availability',
  departureDate: string,  // YYYY-MM-DD
  route: [string, string][]  // Array of [fromStageId, toStageId] pairs
}
```

**Response:**

```typescript
// Success
{ ok: true }

// Failure
{ ok: false, message: string }

// Rate limited (429)
{ ok: false, message: 'Too many requests. Please try again later.' }
```

**Messages:**

- Email already registered: `"An account with this email is already registered."`
- Dates fully booked: `"The selected dates are fully booked. Please choose different dates."`

**Implementation:** `src/routes/api/booking/check/+server.ts`

---

### POST `/api/webhook/stripe`

Stripe webhook handler for payment events.

**Security:** Validates Stripe signature using `STRIPE_WEBHOOK_SECRET`

**Events Handled:**

- `checkout.session.completed` - Payment successful

**Process:**

1. Verify webhook signature
2. Extract `bookingId` from session metadata
3. Find or create user by email
4. Mark booking as `paid`
5. Link booking to user
6. Create bags and bag legs for tracking
7. Generate password reset token for new users
8. Log password setup URL to console (email integration pending)

**Response:**

- `200 OK` - Event processed (or failed gracefully)
- `400 Bad Request` - Invalid signature or missing data

**Implementation:** `src/routes/api/webhook/stripe/+server.ts`

---

## Form Actions

Form actions are server-side handlers for form submissions. Located in `+page.server.ts` files.

### Homepage Actions (`src/routes/+page.server.ts`)

#### `createCheckout`

Creates a Stripe checkout session for a new booking.

**Form Data:**

```typescript
{
  amount: string,           // Total EUR amount
  bookingPayload: string    // JSON stringified booking data
}
```

**Booking Payload Structure:**

```typescript
{
  basicDetails: {
    firstName: string,
    lastName: string,
    bookingNames: string,  // Other names for hotels
    email: string,
    phone: string
  },
  aboutTrip: {
    departureDate: string,   // YYYY-MM-DD
    departure: string,       // Stage ID
    destination: string,     // Stage ID
    direction: string,       // 'NS' or 'SN'
    bags: string            // Number of bags
  },
  route: [string, string][]  // Generated route segments
}
```

**Validation:**

- Checks email not registered (unless logged in)
- Verifies email matches logged-in user (if authenticated)
- Validates daily capacity via `checkDailyCapacity()`

**Process:**

1. Parse and validate form data
2. Run email and availability checks
3. Create booking record (status: `pending`)
4. Create booking_segment rows for each leg
5. Create Stripe checkout session
6. Update booking with Stripe session ID
7. Return checkout URL

**Response:**

```typescript
// Success
{
  url: string,      // Stripe checkout URL
  bookingId: string // UUID of created booking
}

// Error
{ message: string }  // HTTP 400 via fail()
```

---

### Dashboard Actions (`src/routes/dashboard/+page.server.ts`)

#### `createHotel`

**Auth:** Admin/Owner only

Creates a new hotel.

**Form Data:**

```typescript
{
  locationId: string,  // Stage ID (e.g., 'PC')
  name: string,
  contactInfo?: string
}
```

---

#### `updateHotel`

**Auth:** Admin/Owner only

Updates hotel information.

**Form Data:**

```typescript
{
  hotelId: string,
  name: string,
  contactInfo?: string
}
```

---

#### `deleteHotel`

**Auth:** Admin/Owner only

Deletes a hotel.

**Form Data:**

```typescript
{
	hotelId: string;
}
```

---

#### `updateBookingHotels`

**Auth:** Customer only

Updates hotel selections for customer's booking segments.

**Form Data:**

```typescript
{
  bookingId: string,
  [`segment_${segmentId}_startHotel`]: string,  // First segment only
  [`segment_${segmentId}_endHotel`]: string,    // All segments
  [`segment_${segmentId}_notes`]: string        // Optional notes
}
```

---

#### `updateBooking`

**Auth:** Admin/Owner only

Updates booking status.

**Form Data:**

```typescript
{
  bookingId: string,
  status: 'pending' | 'paid' | 'cancelled'
}
```

---

#### `deleteBooking`

**Auth:** Admin/Owner only

Deletes a booking and all related data.

**Form Data:**

```typescript
{
	bookingId: string;
}
```

**Cascading Deletes:**

- Booking segments
- Bags
- Bag legs

---

#### `updateCustomer`

**Auth:** Admin/Owner only

Updates customer email (username).

**Form Data:**

```typescript
{
  customerId: string,
  username: string  // New email
}
```

---

#### `deleteCustomer`

**Auth:** Admin/Owner only

Deletes customer and all related data.

**Form Data:**

```typescript
{
	customerId: string;
}
```

**Cascading Deletes:**

- User account
- All sessions
- All bookings (with segments, bags, bag legs)
- Password reset tokens

---

#### `updateDriver`

**Auth:** Admin/Owner only

Updates driver information.

**Form Data:**

```typescript
{
  driverId: string,
  username: string,       // Email
  licenseNumber?: string
}
```

---

#### `deleteDriver`

**Auth:** Admin/Owner only

Deletes driver and all related data.

**Form Data:**

```typescript
{
	driverId: string;
}
```

---

#### `assignDriverToStep`

**Auth:** Admin/Owner only

Assigns or removes driver from a delivery step on a specific date.

**Form Data:**

```typescript
{
  date: string,           // YYYY-MM-DD
  fromStageId: string,    // Stage code
  toStageId: string,      // Stage code
  driverId: string,       // Driver user ID (empty to clear)
  calendarMonth?: string  // For redirect
}
```

**Behavior:**

- If `driverId` provided: Assign driver to step
- If `driverId` empty: Clear assignment
- Redirects back to dashboard with calendar params preserved

---

#### `assignDriversForDay`

**Auth:** Admin/Owner only

Bulk assignment of drivers for all booked steps on a date.

**Form Data:**

```typescript
{
  date: string,                    // YYYY-MM-DD
  calendarMonth: string,           // YYYY-MM
  [`step_${fromId}_${toId}`]: string  // Driver ID for each step
}
```

**Behavior:**

- Loops through all booked steps for the date
- Sets or clears assignment based on form values
- Redirects back to dashboard

---

#### `createStaff`

**Auth:** Owner only

Creates a new staff member (admin or driver).

**Form Data:**

```typescript
{
  username: string,       // Email
  password: string,       // Min 6 characters
  firstName: string,
  lastName: string,
  role: 'admin' | 'driver',
  licenseNumber?: string  // Required if role='driver'
}
```

**Process:**

1. Hash password with Argon2id
2. Create user record
3. If driver, create driver_profile
4. Handle duplicate email error

---

#### `removeStaff`

**Auth:** Owner only

Removes a staff member.

**Form Data:**

```typescript
{
	staffId: string;
}
```

**Restrictions:**

- Cannot remove yourself
- Target must have role 'admin' or 'driver'

---

### Login Actions (`src/routes/login/+page.server.ts`)

#### `login`

Authenticates user and creates session.

**Form Data:**

```typescript
{
  username: string,  // Email
  password: string,
  redirectTo?: string // Path to redirect after login
}
```

**Response Behavior:**

- Normal form submit: Returns 302 redirect
- AJAX request (`Accept: application/json`): Returns JSON `{ success: true, redirectTo: string }`

**Error Responses:**

- `400`: Invalid credentials
- `400`: Account not found

---

### Registration Actions (`src/routes/register/+page.server.ts`)

#### `register`

Creates new customer account.

**Form Data:**

```typescript
{
  username: string,   // Email
  password: string,   // Min 6 characters
  firstName: string,
  lastName: string
}
```

**Response:**

- Success: Redirects to `/login` with `?registered=1`
- Error: Returns 400 with `message`

---

### Logout Actions (`src/routes/logout/+page.server.ts`)

#### `logout`

Destroys session and clears cookie.

**Response:**

- Redirects to `/` (homepage)

---

### Password Reset Actions (`src/routes/reset-password/[token]/+page.server.ts`)

#### `resetPassword`

Sets new password using reset token.

**Form Data:**

```typescript
{
  password: string,      // New password
  confirmPassword: string // Must match
}
```

**Validation:**

- Token must exist and not be expired
- Passwords must match
- Password min 6 characters

**Response:**

- Success: Redirects to `/login?reset=1`
- Error: Returns 400 with `message`

---

## Server Helper Functions

### Driver Assignment (`src/lib/server/driver-assignment/`)

#### `getCalendarSummaryForMonth(yearMonth: string)`

Returns summary data for calendar view.

```typescript
{
  date: string,              // YYYY-MM-DD
  hasActiveJourneys: boolean,
  hasDriverAssignments: boolean
}[]
```

#### `getStepsWithBookingsOnDate(dateStr: string)`

Returns steps that have bookings on a specific date.

```typescript
[fromStageId: string, toStageId: string][]
```

#### `getAssignmentsForDate(dateStr: string)`

Returns all driver assignments for a date.

```typescript
Record<stepKey, driverId[]>; // stepKey = "fromId:toId"
```

#### `setAssignment(dateStr, fromStageId, toStageId, driverId)`

Assigns driver to step.

#### `clearAssignment(dateStr, fromStageId, toStageId)`

Removes assignment from step.

#### `getAssignmentsForDriver(driverId, startStr, endStr)`

Gets all assignments for a driver in date range.

```typescript
{
  date: string,
  fromStageId: string,
  toStageId: string
}[]
```

---

### Booking Checks (`src/lib/server/booking/checks.ts`)

#### `checkEmailExists(email: string): Promise<CheckResult>`

Checks if email is already registered.

#### `checkDailyCapacity(departureDateStr: string, route: [string, string][]): Promise<CheckResult>`

Checks if booking would exceed daily transfer limit.

---

### Bag Creation (`src/lib/server/bag/create-bags-for-booking.ts`)

#### `createBagsForBooking(db, bookingId): Promise<{ created: number }>`

Creates bag and bag_leg records after payment. Idempotent (safe to call multiple times).

---

### Password Reset (`src/lib/server/auth/password-reset.ts`)

#### `createPasswordResetToken(userId, hoursValid?, baseUrl?)`

Creates password reset token and returns URL.

**Returns:**

```typescript
{
  token: string,
  resetUrl: string
}
```

---

## Client-Side Fetching

### Login Modal (AJAX)

The login modal uses `fetch()` instead of form submit for better UX:

```typescript
const response = await fetch('/login?/login', {
	method: 'POST',
	body: formData,
	credentials: 'include',
	headers: {
		Accept: 'application/json'
	}
});

const result = await response.json();
// result.type = 'success' | 'failure'
// result.data = serialized form action result
```

After successful login:

```typescript
window.location.href = redirectUrl; // Full page reload to refresh auth state
```

---

## Error Handling

All endpoints follow these patterns:

### REST API Errors

```typescript
// 400 Bad Request
{ ok: false, message: string }

// 429 Too Many Requests
{ ok: false, message: 'Too many requests. Please try again later.' }

// 500 Internal Server Error
// Response varies, usually logged to server console
```

### Form Action Errors

```typescript
// Using SvelteKit fail()
return fail(400, { message: 'Error description' });

// Access in component via form prop
export let form: ActionData;
// form?.message contains error
```

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `MAX_TRANSFERS_PER_DAY` - (Optional) Daily capacity limit
