# Database Schema Documentation

## Overview

PostgreSQL database managed by Drizzle ORM. Schema defined in `src/lib/server/db/schema.ts`.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       USER & AUTH                                            │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────────────┐    │
│  │      user        │         │     session      │         │ password_reset_token    │    │
│  ├──────────────────┤         ├──────────────────┤         ├──────────────────────────┤    │
│  │ id (PK)          │◄────────┤ user_id (FK)     │         │ id (PK)                  │    │
│  │ username (UQ)    │         │ id (PK)          │         │ user_id (FK) ────────────┼───┐│
│  │ password_hash    │         │ expires_at       │         │ expires_at               │   ││
│  │ role             │         └──────────────────┘         └──────────────────────────┘   ││
│  │ first_name       │                                                                      ││
│  │ last_name        │         ┌──────────────────┐         ┌──────────────────────────┐   ││
│  └──────────────────┘         │  driver_profile  │         │    owner_profile         │   ││
│           │                   ├──────────────────┤         ├──────────────────────────┤   ││
│           │                   │ user_id (PK/FK)  │◄────────│ user_id (PK/FK)          │   ││
│           │                   │ license_number   │         │ business_name            │   ││
│           │                   │ vehicle_type     │         │ tax_id                   │   ││
│           │                   └──────────────────┘         └──────────────────────────┘   ││
│           │                                                                               ││
│           │                        ROLE ENUM: customer | admin | driver | owner           ││
│           │                                                                               ││
└───────────┼───────────────────────────────────────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      BOOKINGS                                                │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────────────┐    │
│  │     booking      │         │  booking_segment │         │         hotel            │    │
│  ├──────────────────┤         ├──────────────────┤         ├──────────────────────────┤    │
│  │ id (PK)          │◄────────┤ booking_id (FK)  │         │ id (PK)                  │    │
│  │ user_id (FK)     │         │ id (PK)          │         │ location_id              │    │
│  │ status           │         │ segment_index    │         │ name                     │    │
│  │ stripe_session_id│         │ from_stage_id    │         │ contact_info             │    │
│  ├──────────────────┤         │ to_stage_id      │         └──────────────────────────┘    │
│  │ first_name       │         │ travel_date      │                   ▲                     │
│  │ last_name        │         │ start_hotel_id   │───────────────────┘                     │
│  │ booking_other_...│         │ end_hotel_id     │                   ▲                     │
│  │ email            │         │ hotel_notes      │                   │                     │
│  │ phone            │         └────────┬─────────┘                   │                     │
│  ├──────────────────┤                  │                             │                     │
│  │ departure_date   │                  │ 1:N                         │                     │
│  │ direction        │                  ▼                             │                     │
│  │ departure_stg_id │         ┌──────────────────┐                   │                     │
│  │ destination_st...│         │       bag        │                   │                     │
│  │ num_bags         │         ├──────────────────┤                   │                     │
│  │ num_transfers    │         │ id (PK)          │                   │                     │
│  │ total_price      │         │ booking_id (FK)  │                   │                     │
│  │ created_at       │         │ label (UQ/book)  │                   │                     │
│  │ updated_at       │         └────────┬─────────┘                   │                     │
│  └──────────────────┘                  │                             │                     │
│                                        │ 1:N                         │                     │
│                                        ▼                             │                     │
│                               ┌──────────────────┐                   │                     │
│                               │     bag_leg      │                   │                     │
│                               ├──────────────────┤                   │                     │
│                               │ id (PK)          │                   │                     │
│                               │ bag_id (FK)      │                   │                     │
│                               │ segment_id (FK)──┼───────────────────┘                     │
│                               │ status           │ (at_hotel | with_driver | delivered)    │
│                               │ picked_up_at     │                                         │
│                               │ delivered_at     │                                         │
│                               └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DRIVER ASSIGNMENTS                                         │
│  ┌──────────────────────────────┐                                                           │
│  │   driver_step_assignment     │                                                           │
│  ├──────────────────────────────┤                                                           │
│  │ id (PK)                      │                                                           │
│  │ date (YYYY-MM-DD)            │                                                           │
│  │ from_stage_id                │                                                           │
│  │ to_stage_id                  │                                                           │
│  │ driver_id (FK) ──────────────┼───► user.id                                               │
│  └──────────────────────────────┘                                                           │
│                                                                                             │
│  UNIQUE: (date, from_stage_id, to_stage_id, driver_id)                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Table Details

### user

Primary user table storing all account types.

| Column        | Type      | Constraints                  | Description                          |
| ------------- | --------- | ---------------------------- | ------------------------------------ |
| id            | text      | PRIMARY KEY                  | UUID v4                              |
| username      | text      | NOT NULL, UNIQUE             | Email address used for login         |
| password_hash | text      | NOT NULL                     | Argon2id hashed password             |
| role          | user_role | NOT NULL, DEFAULT 'customer' | Enum: customer, admin, driver, owner |
| first_name    | text      |                              | Optional display name                |
| last_name     | text      |                              | Optional display name                |

**Indexes:**

- `username` - For login lookups
- `role` - For filtering by role

### session

Server-side session storage for authentication.

| Column     | Type           | Constraints            | Description                |
| ---------- | -------------- | ---------------------- | -------------------------- |
| id         | text           | PRIMARY KEY            | Session token (random hex) |
| user_id    | text           | NOT NULL, FK → user.id | Links to user              |
| expires_at | timestamp (tz) | NOT NULL               | Session expiration time    |

**Indexes:**

- `user_id` - For session cleanup on logout

### password_reset_token

One-time tokens for password reset/setup.

| Column     | Type           | Constraints            | Description      |
| ---------- | -------------- | ---------------------- | ---------------- |
| id         | text           | PRIMARY KEY            | Token value      |
| user_id    | text           | NOT NULL, FK → user.id | Target user      |
| expires_at | timestamp (tz) | NOT NULL               | Token expiration |

### driver_profile

Extended data for driver role users.

| Column         | Type | Constraints               | Description                     |
| -------------- | ---- | ------------------------- | ------------------------------- |
| user_id        | text | PRIMARY KEY, FK → user.id | Links to user                   |
| license_number | text | NOT NULL                  | Driver's license                |
| vehicle_type   | text |                           | **DEPRECATED** - No longer used |

### owner_profile

Extended data for owner role users.

| Column        | Type | Constraints               | Description         |
| ------------- | ---- | ------------------------- | ------------------- |
| user_id       | text | PRIMARY KEY, FK → user.id | Links to user       |
| business_name | text | NOT NULL                  | Business legal name |
| tax_id        | text |                           | Tax/VAT number      |

### booking

Core booking entity representing a luggage transfer reservation.

| Column               | Type           | Constraints       | Description                             |
| -------------------- | -------------- | ----------------- | --------------------------------------- |
| id                   | text           | PRIMARY KEY       | UUID v4                                 |
| user_id              | text           | FK → user.id      | Set after payment (nullable initially)  |
| status               | text           | DEFAULT 'pending' | pending, paid, cancelled                |
| stripe_session_id    | text           |                   | Stripe checkout session ID              |
| first_name           | text           |                   | **DEPRECATED** - Use user.first_name    |
| last_name            | text           |                   | **DEPRECATED** - Use user.last_name     |
| booking_other_names  | text           |                   | Additional names for hotel reservations |
| email                | text           |                   | Customer email (copied from form)       |
| phone                | text           |                   | Customer phone number                   |
| departure_date       | timestamp (tz) |                   | Trip start date                         |
| direction            | text           |                   | north_south or south_north              |
| departure_stage_id   | text           |                   | Starting stage code (e.g., 'PC')        |
| destination_stage_id | text           |                   | Ending stage code (e.g., 'LG')          |
| num_bags             | text           |                   | Number of bags as string (e.g., '2')    |
| num_transfers        | text           |                   | Number of daily transfers needed        |
| total_price          | text           |                   | Total EUR amount as string              |
| created_at           | timestamp (tz) | DEFAULT NOW()     | Booking creation time                   |
| updated_at           | timestamp (tz) |                   | Last update time                        |

**Indexes:**

- `user_id` - For fetching user bookings
- `status` - For filtering by status
- `departure_date` - For calendar views
- `created_at` - For sorting recent bookings

### booking_segment

Individual legs of a multi-day journey.

| Column         | Type           | Constraints               | Description                 |
| -------------- | -------------- | ------------------------- | --------------------------- |
| id             | text           | PRIMARY KEY               | UUID v4                     |
| booking_id     | text           | NOT NULL, FK → booking.id | Parent booking              |
| segment_index  | text           |                           | 0-based leg order as string |
| from_stage_id  | text           | NOT NULL                  | Starting stage (e.g., 'PC') |
| to_stage_id    | text           | NOT NULL                  | Ending stage (e.g., 'VM')   |
| travel_date    | timestamp (tz) | NOT NULL                  | Date for this leg           |
| start_hotel_id | text           | FK → hotel.id             | Pickup hotel                |
| end_hotel_id   | text           | FK → hotel.id             | Dropoff hotel               |
| hotel_notes    | text           |                           | Special instructions        |
| created_at     | timestamp (tz) | DEFAULT NOW()             | Creation time               |

**Indexes:**

- `booking_id` - For fetching booking segments
- `travel_date` - For calendar queries
- `(from_stage_id, to_stage_id, travel_date)` - For driver assignment queries

### hotel

Hotels at each trail stage.

| Column       | Type           | Constraints   | Description           |
| ------------ | -------------- | ------------- | --------------------- |
| id           | text           | PRIMARY KEY   | UUID v4               |
| location_id  | text           | NOT NULL      | Stage ID (e.g., 'PC') |
| name         | text           | NOT NULL      | Hotel name            |
| contact_info | text           |               | Phone, email, address |
| created_at   | timestamp (tz) | DEFAULT NOW() | Creation time         |
| updated_at   | timestamp (tz) |               | Last update           |

**Indexes:**

- `location_id` - For fetching hotels by stage

### driver_step_assignment

Assigns drivers to specific delivery steps on specific dates.

| Column        | Type | Constraints            | Description                  |
| ------------- | ---- | ---------------------- | ---------------------------- |
| id            | text | PRIMARY KEY            | UUID v4                      |
| date          | date | NOT NULL               | Assignment date (YYYY-MM-DD) |
| from_stage_id | text | NOT NULL               | Starting stage               |
| to_stage_id   | text | NOT NULL               | Ending stage                 |
| driver_id     | text | NOT NULL, FK → user.id | Assigned driver              |

**Unique Constraint:** (date, from_stage_id, to_stage_id, driver_id)

**Indexes:**

- `date` - For fetching assignments by date
- `driver_id` - For fetching driver's assignments

### bag

Represents a single piece of luggage.

| Column     | Type | Constraints               | Description                        |
| ---------- | ---- | ------------------------- | ---------------------------------- |
| id         | text | PRIMARY KEY               | Composite: `{booking_ref}-{label}` |
| booking_id | text | NOT NULL, FK → booking.id | Parent booking                     |
| label      | text | NOT NULL                  | A, B, C... (unique per booking)    |

**Unique Constraint:** (booking_id, label)

**ID Format:**

- First 12 chars of booking UUID (no dashes) + label
- Example: `43ab33a6949e-A`
- Used for QR codes and quick lookup

**Indexes:**

- `booking_id` - For fetching booking's bags

### bag_leg

Tracks each bag's journey through each segment.

| Column       | Type           | Constraints                       | Description                      |
| ------------ | -------------- | --------------------------------- | -------------------------------- |
| id           | text           | PRIMARY KEY                       | UUID v4                          |
| bag_id       | text           | NOT NULL, FK → bag.id             | Parent bag                       |
| segment_id   | text           | NOT NULL, FK → booking_segment.id | Route segment                    |
| status       | bag_leg_status | NOT NULL, DEFAULT 'at_hotel'      | at_hotel, with_driver, delivered |
| picked_up_at | timestamp (tz) |                                   | When driver picked up            |
| delivered_at | timestamp (tz) |                                   | When driver delivered            |

**Unique Constraint:** (bag_id, segment_id)

**Status Flow:**

```
at_hotel ──► with_driver ──► delivered
    ▲                              │
    └──────────────────────────────┘
    (can reset for re-delivery if needed)
```

**Indexes:**

- `bag_id` - For fetching bag's legs
- `segment_id` - For fetching segment's bags

## Enums

### user_role

- `customer` - Booked luggage transfer
- `admin` - Operations manager
- `driver` - Bag delivery driver
- `owner` - Business owner

### bag_leg_status

- `at_hotel` - Bag waiting at pickup hotel
- `with_driver` - Driver has collected bag
- `delivered` - Bag delivered to destination

## Key Relationships

### User Hierarchy

- One user → One role (via role enum)
- Driver role → Optional driver_profile
- Owner role → Optional owner_profile
- One user → Many sessions
- One user → Many bookings

### Booking Structure

- One booking → Many segments (one per day)
- One booking → Many bags (based on num_bags)
- One segment → Many bag_legs (one per bag)
- Segment links to hotels (start_hotel_id, end_hotel_id)

### Driver Operations

- Driver assigned to (date, from_stage_id, to_stage_id)
- Assignment determines which bags they'll handle
- Bag legs track pickup/delivery per segment

## Common Queries

### Get user's bookings with segments

```sql
SELECT b.*, s.*
FROM booking b
LEFT JOIN booking_segment s ON s.booking_id = b.id
WHERE b.user_id = ?
ORDER BY b.created_at DESC, s.segment_index ASC
```

### Get bags with current location

```sql
SELECT bag.*,
       CASE
         WHEN bl.status = 'delivered' THEN 'Delivered at ' || eh.name
         WHEN bl.status = 'with_driver' THEN 'With driver'
         ELSE 'At ' || sh.name
       END as location
FROM bag
JOIN bag_leg bl ON bl.bag_id = bag.id
JOIN booking_segment seg ON seg.id = bl.segment_id
LEFT JOIN hotel sh ON sh.id = seg.start_hotel_id
LEFT JOIN hotel eh ON eh.id = seg.end_hotel_id
WHERE bl.status != 'delivered' OR bl.segment_index = max_index
```

### Get driver's assignments for date

```sql
SELECT dsa.*,
       COUNT(DISTINCT b.id) as total_bags,
       json_agg(DISTINCT h.name) as pickup_hotels
FROM driver_step_assignment dsa
JOIN booking_segment seg ON seg.from_stage_id = dsa.from_stage_id
                        AND seg.to_stage_id = dsa.to_stage_id
                        AND seg.travel_date = dsa.date
JOIN booking book ON book.id = seg.booking_id
LEFT JOIN bag b ON b.booking_id = book.id
LEFT JOIN hotel h ON h.id = seg.start_hotel_id
WHERE dsa.driver_id = ? AND dsa.date = ?
GROUP BY dsa.id
```

## Migrations

Migration files are in `drizzle/` folder:

- `0001_rename_user_to_users.sql` - Initial schema
- `0002_add_user_first_last_name.sql` - Added name fields

**Commands:**

```bash
# Push schema changes (dev)
npx drizzle-kit push

# Generate migration (production)
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate

# View database
npx drizzle-kit studio
```
