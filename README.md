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

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

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