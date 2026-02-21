# Contributions guide (AI-oriented)

This document gives declarative, factual descriptions of the booking check system so that AIs and contributors can extend or integrate with it correctly.

---

## Booking check API: purpose and design

- **Single endpoint:** All “can this booking proceed?” checks go through one JSON API: `POST /api/booking/check`. The request body includes a `type` and a type-specific payload. The response is always `{ ok: boolean, message?: string }`. No emails, no per-day counts, and no other internal data are ever returned.
- **Server as source of truth:** The same checks (email existence, daily capacity) are run again inside the `createCheckout` form action before creating a booking or Stripe session. The form’s use of the API is for UX only; it does not replace server-side enforcement.
- **Security:** The API never returns the email or whether a given email exists in a way that would allow enumeration. It returns only a generic success/failure and a fixed message. Daily capacity is reported only as “available” or “not available” with a generic message; exact counts or “slots left” are not exposed.
- **Rate limiting:** The check endpoint is limited to 20 requests per minute per client (by IP, from `x-forwarded-for` or `x-real-ip`). When exceeded, the response is 429 with a generic message. `createCheckout` is not rate-limited the same way (one shot per booking).

---

## How the form uses the API

- **Email check:**  
  - The booking form calls `POST /api/booking/check` with `{ type: 'email', email }` in two places: (1) when the user leaves the email field (onblur), via a 400 ms debounced callback `scheduleEmailCheck` passed into `BasicDetailsStep` as `onEmailBlur`; (2) again when the user clicks Pay Now, via `checkEmailWithServer()` before submitting to `createCheckout`.  
  - If the response has `ok: false`, the form sets `fieldErrors.email` to `message` (and on Pay Now also sets `paymentError` from that message) and does not proceed. The form never sends the email to any other endpoint for “check only”; the only other place that sees the email is `createCheckout`, which re-runs the same check.

- **Availability (daily capacity) check:**  
  - The form calls `POST /api/booking/check` with `{ type: 'availability', departureDate, route }` only when the user clicks Pay Now, via `checkAvailabilityWithServer()`. It does not call this on every route or date change.  
  - If the response has `ok: false`, the form sets `availabilityError` and `paymentError` and does not call `createCheckout`. The `createCheckout` action also runs the same availability logic and can return `fail(400, { message })` if capacity would be exceeded.

- **Pay Now flow:**  
  - On Pay Now, the form (1) validates basic details and trip (client-side), (2) calls `checkEmailWithServer()`, (3) calls `checkAvailabilityWithServer()`, (4) only then sets `paymentProcessing = true` and POSTs to `/?/createCheckout` with `bookingPayload` and `amount`. Any failure from (2) or (3) is shown as `paymentError` or `fieldErrors.email` / `availabilityError` and the request to `createCheckout` is not sent.

---

## Shared check logic (server-only)

- **Location:** `src/lib/server/booking/checks.ts` exports `checkEmailExists(email)` and `checkDailyCapacity(departureDateStr, route)`. Both return `CheckResult`: either `{ ok: true }` or `{ ok: false, message: string }`.
- **Email:** Normalizes input (trim, toLowerCase), then checks for an existing user with that username (users are keyed by email-as-username after Stripe checkout). Uses the `user` table only; does not expose the email in the response.
- **Daily capacity:** Reads `MAX_TRANSFERS_PER_DAY` from env (`$env/dynamic/private`). If unset or invalid, the check is skipped (returns `ok: true`). Otherwise it computes proposed segment counts per calendar date from `departureDateStr` and `route`, loads existing segments for those dates for pending/paid bookings, and returns `ok: false` if any date would exceed the limit. Messages are the constants `EMAIL_ALREADY_REGISTERED_MESSAGE` and `DATES_FULLY_BOOKED_MESSAGE` from the same file; the API and `createCheckout` use these so wording is consistent.

---

## Adding new check types

- Add a new `type` in the request body (e.g. `type: 'blackout_dates'`).
- In `src/routes/api/booking/check/+server.ts`, parse the payload for that type, validate it, call a new function in `src/lib/server/booking/checks.ts` (or the same file), and return `{ ok, message? }`.
- If the check must also block checkout, call that same function in `src/routes/+page.server.ts` inside `createCheckout` before creating the booking, and return `fail(400, { message })` when it returns `ok: false`.
- Keep responses minimal: no internal IDs, counts, or lists. Use a single, generic message for each failure reason.

---

# API reference (human-readable)

## POST `/api/booking/check`

Use this endpoint to check whether a booking is allowed (e.g. email not already registered, dates within daily capacity). It is used by the booking form to show errors before the user clicks Pay Now. All responses are JSON.

**Rate limit:** 20 requests per minute per IP. If exceeded, the server responds with **429** and a generic “Too many requests” message.

**Request**

- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body:** JSON object with a `type` field and type-specific fields:

| `type`         | Required body fields     | Description |
|----------------|--------------------------|-------------|
| `email`        | `email` (string)         | Check if a user with this email (username) already exists. |
| `availability` | `departureDate` (string, YYYY-MM-DD), `route` (array of `[from, to]` stage IDs) | Check if the given trip would exceed the daily transfer limit on any date. |

**Response**

- **200:** JSON body is always one of:
  - `{ "ok": true }`
  - `{ "ok": false, "message": "…" }`
- **400:** Invalid or missing `type`, or invalid payload (e.g. bad email format, invalid date, invalid route). Body: `{ "ok": false, "message": "…" }` with a short, generic message.
- **429:** Rate limit exceeded. Body: `{ "ok": false, "message": "…" }` (no identifying details).

**Example: email check**

```http
POST /api/booking/check HTTP/1.1
Content-Type: application/json

{ "type": "email", "email": "guest@example.com" }
```

- If the email is not registered: `{ "ok": true }`
- If the email is already registered: `{ "ok": false, "message": "An account with this email is already registered." }`

**Example: availability check**

```http
POST /api/booking/check HTTP/1.1
Content-Type: application/json

{
  "type": "availability",
  "departureDate": "2025-06-01",
  "route": [["PC", "VC"], ["VC", "O"]]
}
```

- If every day is within capacity: `{ "ok": true }`
- If any day would exceed the limit: `{ "ok": false, "message": "The selected dates are fully booked. Please choose different dates." }`

**Configuration**

- **Daily transfer limit:** Set the env var `MAX_TRANSFERS_PER_DAY` (integer). If unset or invalid, the availability check always returns `ok: true` (no cap). See README for other env vars.
