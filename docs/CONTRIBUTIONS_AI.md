# Contributions guide (AI-oriented)

This document gives declarative, factual descriptions of the app architecture and the booking check system so that AIs and contributors can extend or integrate correctly.

---

## Overall architecture

### Stack and runtime

- **Framework:** SvelteKit 5. App runs in Node for SSR and adapts to the deployed environment.
- **UI:** Svelte 5 with runes mode. Use `$props()`, `$state()`, `$derived()` (and `$derived.by()`); avoid `$:` reactive statements and `export let` for component props. See `docs/LLM_RULES.md` for Svelte 5 rules.
- **Data:** PostgreSQL via Drizzle ORM. Connection and schema live under `src/lib/server/db/` (schema in `schema.ts`, pool in `index.ts`). Server-only code must stay in `$lib/server/` or `src/routes/**/+page.server.ts` / `+server.ts`.
- **Payments:** Stripe. Checkout is created in the `createCheckout` form action; after payment, Stripe sends a webhook to `POST /api/webhook/stripe`, which marks the booking paid and creates or links the user (email as username).

### Routes and access

- **Public (no auth):** `/` (landing + booking form), `/login`, `/register`, `/booking-success`, `/reset-password/[token]`, and example routes under `/eg/*`. The home page does not require a session; guests can complete the booking form and pay.
- **Protected:** `/dashboard` requires a valid session. `src/routes/dashboard/+page.server.ts` redirects unauthenticated users to `/login` and loads role-specific data. The dashboard page then renders one of: `CustomerDashboard`, `OwnerDashboard`, `DriverDashboard`, `AdminDashboard`, based on `user.role`.
- **API:**  
  - `POST /api/booking/check` — JSON API for booking checks (email, availability). Rate-limited per IP.  
  - `POST /api/webhook/stripe` — Stripe webhook; validates signature, then handles `checkout.session.completed` (update booking, find/create user, link booking to user, create password-setup token).

### Authentication and session

- **Session:** Stored in PostgreSQL (`session` table). Session id is sent to the client in a cookie and validated on every request in `src/hooks.server.ts`. The hook loads the user from `user` (join with `session`), checks expiry, and sets `event.locals.user` to `{ id, username, role }` or `null`. Deleted or expired sessions are removed and the cookie cleared.
- **Roles:** Enum `user_role`: `customer`, `admin`, `driver`, `owner`. Role is on `user`; role-specific data is in `driver_profile` and `owner_profile`. Login and register use server actions and set the session cookie on success.
- **Post-checkout users:** Guests who pay via Stripe do not have an account beforehand. The webhook uses the Stripe customer email as `username`, finds or creates a row in `user`, links the booking to that `userId`, and creates a password-reset token so they can set a password and log in later.

### Data model (high level)

- **user** — id, username (email after checkout), passwordHash, role.  
- **session** — id, userId, expiresAt.  
- **booking** — id, userId (nullable until after payment), status (pending | paid | cancelled), Stripe session id, customer and trip fields (firstName, lastName, email, phone, departureDate, departureStageId, destinationStageId, numBags, numTransfers, totalPrice), timestamps.  
- **booking_segment** — one row per leg of a booking’s route: bookingId, segmentIndex, fromStageId, toStageId, travelDate; optional hotel links and notes.  
- **hotel** — id, locationId (stage id), name, contactInfo.  
- **driver_profile** / **owner_profile** — extend `user` with role-specific fields.  
- **password_reset_token** — for password setup/reset flows.

Booking and segment rows are created in the `createCheckout` action; the webhook only updates booking status and `userId`.

### Front-end structure

- **Layout:** `src/routes/+layout.svelte` wraps the app with a header (logo, Login or Dashboard + Log out, EN/PT toggle) and footer. The root layout load in `+layout.server.ts` returns `{ user: locals.user ?? null }`, so every page receives `data.user`. Language is held in `$lib/stores/language` and used with `$lib/translations` for all copy.
- **Home:** `+page.svelte` composes hero, about, `BookingForm`, and gallery. It receives `data` from the layout and passes `user={data?.user ?? null}` into `BookingForm`. A visible “LOGGED IN” / “LOGGED OUT” label on the home page is for testing auth state (not translated).
- **Booking form:** `$lib/components/BookingForm.svelte` is a two-step form (basic details, then trip + pay). It accepts an optional `user` prop from the layout. It uses `BasicDetailsStep` and `Route`; calls `POST /api/booking/check` for email (on blur, debounced) and availability (on Pay Now); then POSTs to the `createCheckout` form action with `bookingPayload` and `amount`. Route and pricing come from `$lib/trail.ts` (stages, `generateRoute`) and `$lib/booking/price.ts`. Accommodation and payment-step UI exist in `$lib/components/booking/` but are not shown in the main two-step flow.
- **Dashboard:** Single route `/dashboard`; `+page.svelte` picks the dashboard component by role. Data (bookings, segments, hotels, owner sales, admin lists, etc.) is loaded in `+page.server.ts` and passed as `data`; some actions (e.g. cancel booking) are form actions on the same route.

### Auth on every page and in-header login

- **User on all pages:** `src/routes/+layout.server.ts` has a single `load` that returns `{ user: locals.user ?? null }`. No other root layout load exists, so every page and the layout receive `data.user`.
- **Header:** If `data.user` is set, the header shows a “Dashboard” link and a “Log out” control (POST to `/logout`). If not, it shows a “Login” button that opens an in-page login modal (no navigation).
- **Login modal:** Implemented in `+layout.svelte`. Opens when the user clicks Login in the header or when any page sets `openLoginModal.set(true)` (e.g. from the booking form when the email is already registered). The modal contains: (1) Login form (username, password, Sign In, “Forgot your password?”, “Need an account? Register”); (2) Forgot-password panel (email, Send Reset Link, Back to login). The login form is submitted via `fetch('/login?/login', { method: 'POST', body: formData, credentials: 'include', headers: { Accept: 'application/json' } })` with a hidden `redirectTo` field (current path). The login action in `src/routes/login/+page.server.ts` sets the session cookie; if the request has `Accept: application/json`, it returns `{ success: true, redirectTo: target }` instead of throwing a 302. The client then does a full page navigation to `redirectTo` via `window.location.href` so the cookie is applied and the layout re-renders with the user. The client must parse SvelteKit’s form action response: the body can be `{ type: 'success', status: 200, data: "..." }` where `data` is a stringified tuple (e.g. key indices and values); the redirect URL is taken from the parsed tuple (e.g. third element). The full-page login at `/login` still uses a normal form submit and gets a 302 redirect to `/dashboard` (or `redirectTo` if provided).
- **Store:** `$lib/stores/loginModal.ts` exports a writable `openLoginModal`. The layout subscribes and opens the modal when it is set to true; any page (e.g. the booking form) can open the modal by calling `openLoginModal.set(true)`.
- **Logout:** `POST /logout` is handled in `src/routes/logout/+page.server.ts`; after clearing the session it redirects to `/` (home), not `/login`.

### Bookings for existing (preregistered) users

- **Email already registered, user not logged in:** When the check API returns the message equal to `EMAIL_ALREADY_REGISTERED_MESSAGE` (from `$lib/booking/constants.ts`), the form shows that message and a “Log in” link/button that opens the login modal (`openLoginModal.set(true)`). The user can either log in or change the email. Pay Now is still blocked until the email is valid (or they log in). The same “Log in” link appears next to the Pay Now error when the failure is “email already registered.”
- **User logged in: basic details:** The home page passes `user={data?.user ?? null}` into `BookingForm`. When `user` is set: (1) `formData.basicDetails.email` is kept in sync with `user.username`; (2) `BasicDetailsStep` receives `loggedInUser={ user ? { username: user.username } : null }`. When `loggedInUser` is set, the email field is read-only and styled as such; first name, last name, and phone fields are hidden; only “Other booking names” remains visible and editable. Step 2 (trip details) is unchanged.
- **Validation when logged in:** `validateBasicDetails()` in `BookingForm.svelte` skips requiring first name, last name, and phone when `user` is set, so the user can proceed to step 2 with only email (and optional other booking names) filled.
- **createCheckout when logged in:** In `src/routes/+page.server.ts`, if `locals.user` is set, the email-exists check is skipped; the server only verifies that the submitted email (normalized) equals `locals.user.username`, and returns `fail(400, { message: 'Email must match your account.' })` if not. The booking is created with `userId: locals.user.id`. No new user is created; the Stripe webhook can re-link the same user by email.
- **Form: skip email check when logged in:** In `BookingForm.svelte`, `checkEmailWithServer()` returns `true` without calling the API when `user` is set and the form email (trimmed, lowercased) equals `user.username`.

### Booking and payment flow (end-to-end)

1. User fills the form on `/` (basic details + trip). Optional: email check on blur; availability check when clicking Pay Now.  
2. User clicks Pay Now. Form validates, calls the check API again for email and availability, then POSTs to `/?/createCheckout` with `bookingPayload` and `amount`.  
3. `createCheckout` (in `+page.server.ts`): runs server-side email and availability checks; creates a `booking` (status pending) and `booking_segment` rows; creates a Stripe Checkout Session with `bookingId` in metadata; returns the checkout URL.  
4. Client redirects to Stripe Checkout; user pays.  
5. Stripe sends `checkout.session.completed` to `POST /api/webhook/stripe`. Webhook marks the booking paid, finds or creates `user` by email (username), links booking to user, and creates a password-setup token (e.g. for email later).  
6. User is redirected to `/booking-success` (or cancel URL back to `/`).

### Where to put new code

- **Server-only (DB, secrets, checks):** `src/lib/server/` (e.g. `server/booking/checks.ts`, `server/db/`, `server/auth/`).  
- **Shared client/server types or pure logic:** `src/lib/` but outside `server/` (e.g. `lib/trail.ts`, `lib/booking/price.ts`).  
- **UI components:** `src/lib/components/`.  
- **New pages or API routes:** `src/routes/` (e.g. `routes/api/booking/check/+server.ts`).  
- **Auth and global request behavior:** `src/hooks.server.ts`.  
- **Env:** Use `$env/static/private` for build-time secrets (e.g. Stripe, DB); use `$env/dynamic/private` for optional or runtime config (e.g. `MAX_TRANSFERS_PER_DAY`).

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
