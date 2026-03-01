# Architecture Overview

**TrakingTransfers.pt** - A luggage transfer booking system for the Rota Vicentina hiking trail in Portugal.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Public    │  │   Booking   │  │   Dashboard │  │   Driver Scanner    │ │
│  │   Website   │  │    Form     │  │  (Role-based)│  │    (Bag Tracking)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│         │                │                │                                  │
└─────────┼────────────────┼────────────────┼──────────────────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────────┐
│                           SERVER LAYER                                       │
│                              │                                               │
│  ┌───────────────────────────┴───────────────────────────────────────────┐  │
│  │                        SvelteKit 5 (SSR)                               │  │
│  │  ┌────────────────┬────────────────┬────────────────┬───────────────┐  │
│  │  │     Pages      │     API        │    Actions     │    Hooks      │  │
│  │  │   (+page.*)    │  (+server.ts)  │ (form actions) │(hooks.server) │  │
│  │  └────────────────┴────────────────┴────────────────┴───────────────┘  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Server-Only Modules ($lib/server)                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │   Database   │  │    Auth      │  │   Booking    │  │  Driver   │ │   │
│  │  │   (Drizzle)  │  │  (Session)   │  │   Checks     │  │  Assign   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────────┐
│                           DATA LAYER                                           │
│                                     │                                          │
│  ┌──────────────────────────────────┴─────────────────────────────────────┐   │
│  │                      PostgreSQL Database                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │   user   │  │ booking  │  │ segment  │  │   bag    │  │  driver  │  │   │
│  │  │  session │  │  hotel   │  │assignment│  │   leg    │  │  profile │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                       │
│                                     │                                          │
│  ┌────────────────┐  ┌─────────────┴──────────┐  ┌──────────────────────────┐  │
│  │     Stripe     │  │   Rota Vicentina       │  │     Email (Future)       │  │
│  │   (Payments)   │  │   (Trail Definition)   │  │  (Password Reset)        │  │
│  └────────────────┘  └────────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework

- **SvelteKit 5** - Full-stack framework with SSR
- **Svelte 5** - UI framework with Runes mode (`$state`, `$derived`, `$props`)
- **TypeScript** - Type safety throughout

### Database & ORM

- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe SQL query builder
- **drizzle-kit** - Database migrations and studio

### Authentication

- **Session-based auth** - PostgreSQL-stored sessions
- **Argon2id** - Password hashing via `@node-rs/argon2`
- **Cookie-based** - Secure, HttpOnly, SameSite=Lax cookies

### Payments

- **Stripe** - Payment processing
- **Checkout Sessions** - Hosted payment page
- **Webhooks** - Payment confirmation (`checkout.session.completed`)

### Styling & UI

- **CSS** - Plain CSS (no framework)
- **Responsive** - Mobile-first design

### Internationalization

- **Paraglide** - i18n with type-safe translations
- **Languages** - English, Portuguese

## Key Concepts

### User Roles

| Role       | Description                | Capabilities                                               |
| ---------- | -------------------------- | ---------------------------------------------------------- |
| `customer` | Booked luggage transfer    | View own bookings, track bags, update hotel info           |
| `driver`   | Picks up and delivers bags | View assigned routes, scan bag QR codes, update leg status |
| `admin`    | Manages operations         | Manage bookings, assign drivers, manage hotels/customers   |
| `owner`    | Business owner             | Admin capabilities + sales reports, staff management       |

### The Trail (Rota Vicentina)

The system manages luggage transfers along a 14-stage coastal trail:

**Stages (North to South):**

1. S. Torpes (ST)
2. Porto Covo (PC)
3. Vila Nova de Milfontes (VM)
4. Almograve (AL)
5. Zambujeira do Mar (ZM)
6. Odeceixe (OD)
7. Aljezur (AJ)
8. Arrifana (AR)
9. Carrapateira (CP)
10. Vila do Bispo (VB)
11. Sagres (SA)
12. Salema (SL)
13. Luz (LZ)
14. Lagos (LG)

**Route Generation:**

- Hikers walk the trail over multiple days
- Bags are transferred between hotels each day
- System calculates daily segments based on start/end points
- 26 possible delivery steps (13 NS + 13 SN)

### Data Flow

1. **Guest Booking Flow:**
   - Visitor fills booking form on homepage
   - System validates email (not registered) and availability
   - Stripe checkout created
   - After payment, user auto-created from email
   - Bags and bag legs created for tracking

2. **Driver Operations:**
   - Admin assigns drivers to delivery steps per day
   - Driver scans QR code on bag
   - Updates status: `at_hotel` → `with_driver` → `delivered`

3. **Bag Lifecycle:**
   - Created after payment (1 bag per piece of luggage)
   - Each bag has legs matching booking segments
   - Driver updates each leg status
   - Customer sees real-time location

## Project Structure

```
src/
├── routes/                      # SvelteKit routes (pages + API)
│   ├── +page.svelte            # Homepage with booking form
│   ├── +page.server.ts         # Booking form actions
│   ├── +layout.svelte          # Root layout (header, footer, login modal)
│   ├── +layout.server.ts       # Load user into layout data
│   ├── api/                     # API endpoints
│   │   ├── booking/check/      # Booking validation API
│   │   └── webhook/stripe/     # Stripe webhook handler
│   ├── admin/                   # Admin section
│   ├── dashboard/               # Main dashboard (role-based)
│   ├── driver/bag/[bagId]/     # Driver bag scanning page
│   ├── login/                   # Login page + API
│   ├── register/                # Registration page
│   └── reset-password/          # Password reset flow
│
├── lib/                         # Shared libraries
│   ├── components/              # Svelte components
│   │   ├── booking/             # Booking form components
│   │   └── dashboard/           # Dashboard components
│   │       ├── admin/           # Admin dashboard
│   │       ├── driver/          # Driver dashboard
│   │       └── owner/           # Owner dashboard
│   ├── server/                  # Server-only code
│   │   ├── db/                  # Database schema & connection
│   │   ├── auth/                # Password reset logic
│   │   ├── booking/             # Booking validation logic
│   │   ├── driver-assignment/   # Driver scheduling logic
│   │   └── bag/                 # Bag creation logic
│   ├── stores/                  # Svelte stores
│   ├── trail.ts                 # Trail stages & route generation
│   ├── delivery-steps.ts        # Delivery step utilities
│   ├── booking/price.ts         # Pricing logic
│   └── translations.ts          # i18n utilities
│
├── hooks.server.ts             # Session validation middleware
└── app.html                    # HTML template
```

## Security Considerations

- **CSRF Protection:** SvelteKit form actions include CSRF tokens
- **XSS Prevention:** All user input sanitized, no raw HTML rendering
- **SQL Injection:** Drizzle ORM parameterizes all queries
- **Session Security:** HttpOnly, Secure, SameSite=Lax cookies
- **Rate Limiting:** Booking check API limited to 20 req/min per IP
- **Password Security:** Argon2id with recommended parameters

## Performance Optimizations

- **SSR:** Server-side rendering for fast initial load
- **Database Indexing:** Foreign keys and frequently queried fields indexed
- **Selective Loading:** Dashboard only loads data for user's role
- **Form Actions:** Progressive enhancement with server-side fallback

## Development Environment

See `DEVELOPMENT.md` for:

- Local setup with SSH tunnel
- Stripe CLI webhook forwarding
- Database migrations
- Environment variables
