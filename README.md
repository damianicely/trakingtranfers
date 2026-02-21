# TrakingTransfers.pt

A modern web application built with SvelteKit 5 and Paraglide for internationalization.

## Features

- 🌍 Portuguese/English language switching
- 🎨 Modern, responsive landing page
- 📱 Mobile-friendly design
- ⚡ Built with SvelteKit 5

## Setup

1. Install dependencies:
```bash
npm install
```

## Development Workflow (Terminals & Commands)

When developing locally, you’ll typically have **three terminals** running:

1. **SSH tunnel for the database**
2. **Stripe CLI webhook listener**
3. **SvelteKit dev server**

### 1. Start the SSH tunnel (database)

In **Terminal 1**:

```bash
ssh -L 5433:localhost:5432 transfers
```

Keep this terminal open; it must stay connected while you develop.

### 2. Start Stripe CLI webhook listener

In **Terminal 2**:

```bash
stripe listen --forward-to localhost:5173/api/webhook/stripe
```

This forwards Stripe events (e.g. `checkout.session.completed`) to your SvelteKit webhook route at `/api/webhook/stripe`. You need this running any time you want to test payments locally.

### 3. Run the SvelteKit dev server

In **Terminal 3**:

```bash
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. View your Database through Drizzle-kit Studio

In **Terminal 4**

```bash
npx drizzle-kit studio
```

Then open [https://local.drizzle.studio/](https://local.drizzle.studio/)



## Testing Stripe Payments

When testing payments locally, you'll need to use Stripe's test card numbers. These cards work in test mode and simulate different payment scenarios without charging real money.

### Test Card Numbers

Use any of these card numbers in the Stripe Checkout form:

| Card Number | Scenario | Description |
|-------------|----------|-------------|
| `4242 4242 4242 4242` | Success | Standard successful payment |
| `4000 0025 0000 3155` | Requires authentication | 3D Secure authentication required |
| `4000 0000 0000 9995` | Declined | Card declined (insufficient funds) |
| `4000 0000 0000 0002` | Declined | Card declined (generic decline) |
| `4000 0027 6000 3184` | Requires authentication | 3D Secure authentication required (different flow) |

### Test Card Details

For all test cards, use:
- **Expiry date**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP/Postal code**: Any valid format (e.g., `12345`)

### Additional Test Scenarios

- **3D Secure**: Use `4000 0025 0000 3155` or `4000 0027 6000 3184` to test authentication flows
- **Declined payments**: Use `4000 0000 0000 9995` or `4000 0000 0000 0002` to test error handling
- **Success**: Use `4242 4242 4242 4242` for normal successful payments

> **Note**: These cards only work in **test mode** (when using test API keys). Make sure you're using your test publishable key (`pk_test_...`) and not your live key.

## Database Connection

This project uses PostgreSQL and connects to the database through an SSH tunnel during development. You need to establish the tunnel connection **before** running the development server.

### Setting up the SSH Tunnel

1. Open a **separate terminal window** (keep it running while developing)
2. Run the SSH tunnel command:
   ```bash
   ssh -L 5433:localhost:5432 transfers
   ```
   This command:
   - Creates a local port forward from `localhost:5433` to the remote database on port `5432`
   - Connects via SSH to the `transfers` host
   - The tunnel must remain active while you're developing

3. Keep this terminal window open - the tunnel will remain active as long as the SSH connection is maintained

4. The application will connect to the database through `localhost:5433` (configured via `DATABASE_URL` environment variable)

> **Note**: If the SSH tunnel disconnects, you'll need to restart it. The development server will not be able to connect to the database without an active tunnel.

### Environment variables

- **DATABASE_URL** – PostgreSQL connection string (e.g. `postgres://user:pass@localhost:5433/dbname` when using the tunnel).
- **STRIPE_SECRET_KEY** – Stripe secret key for payments (test or live).
- **STRIPE_WEBHOOK_SECRET** – For Stripe webhook signature verification (from `stripe listen` when testing locally).
- **MAX_TRANSFERS_PER_DAY** – (Optional) Maximum number of transfer legs (segments) allowed per calendar day. If set, the booking form and checkout will reject dates that would exceed this limit. If unset, no daily cap is applied.

## Database Schema Sync (Drizzle)

This project uses **drizzle-kit** to keep the database schema in sync with `src/lib/server/db/schema.ts`, configured via `drizzle.config.ts`. All commands rely on `DATABASE_URL`, which in development should point at your **tunnelled** database (for example `postgres://user:pass@localhost:5433/dbname`).

### Fast iteration in early development (recommended now) — `push`

While you’re in the heavy early stages (schemas changing a lot, no need for an audit trail), you can let Drizzle directly sync the schema to the database:

```bash
npx drizzle-kit push
```

Use this in both **dev** and **early-stage environments**, as long as you’re comfortable with Drizzle making direct changes without generating migration files.

Typical dev loop:

1. Start the SSH tunnel (see "Database Connection" above)
2. Ensure `DATABASE_URL` points at the tunnel (`localhost:5433`)
3. Run:

```bash
npx drizzle-kit push
```

### Auditable migrations later — `generate` + `migrate`

Once the schema stabilizes and you want an **auditable migration history** (for production, CI, rollbacks, code review, etc.), switch to the migration-based flow:

1. **Generate** migrations from schema changes:

```bash
npx drizzle-kit generate
```

2. **Apply** migrations to the target database:

```bash
npx drizzle-kit migrate
```

In production, you’d set `DATABASE_URL` to your production database (no SSH tunnel) and run `npx drizzle-kit migrate` as part of your deploy pipeline.

> **Summary**:  
> - **Now (early dev)**: use `npx drizzle-kit push` to iterate quickly.  
> - **Later (stable/prod)**: use `npx drizzle-kit generate` + `npx drizzle-kit migrate` for auditable, file-based migrations.

## Project Structure

- `src/routes/+page.svelte` - Main landing page with hero section
- `src/routes/+layout.svelte` - Layout with language toggle
- `messages/` - Translation files for English and Portuguese
- `project.inlang/` - Paraglide configuration

## Adding a Hero Image

Replace the placeholder in `src/routes/+page.svelte` with your actual hero image:

```svelte
<div class="hero-image">
  <img src="/path/to/your/hero-image.jpg" alt="Hero" />
</div>
```

## Building for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication Architecture

This project implements a session-based authentication system (Lucia-style) optimized for SvelteKit 5 and PostgreSQL. Unlike stateless JWTs, this approach provides full control over active sessions directly from the database.

### Technical Flow

1. **Registration**: Passwords are hashed using Argon2id before storage.
2. **Authentication**: Credentials are verified via server actions; upon success, a high-entropy session ID is generated.
3. **Session Persistence**: Session records are stored in the PostgreSQL session table and linked to the user.
4. **Transport**: The session ID is sent to the client via a Secure, HttpOnly, SameSite=Lax cookie.
5. **Validation**: A global handle hook (Middleware) intercepts requests, validates the session via Drizzle, and injects user state into `event.locals`.

### Core Packages

| Package | Purpose |
|---------|---------|
| `drizzle-orm` | Type-safe PostgreSQL interaction and schema management. |
| `oslo` | Secure password hashing (Argon2id) and binary/encoding utilities. |
| `pg` | Non-blocking PostgreSQL client for Node.js. |
| `drizzle-kit` | CLI migration tool and database studio (GUI). |

### Database Schema

- **user**: Stores unique identifiers and cryptographically hashed credentials.
- **session**: Maps active session tokens to users with explicit expiration timestamps.