# Routes & Access Control

## Overview

All routes defined in `src/routes/`. Access control enforced via `hooks.server.ts` and layout files.

## Route Map

```
src/routes/
├── +page.svelte                    # Homepage (public)
├── +page.server.ts                 # Booking form actions
├── +layout.svelte                  # Root layout
├── +layout.server.ts               # Load user for all pages
│
├── account/
│   ├── +page.svelte               # Account settings (auth)
│   └── +page.server.ts            # Update account actions
│
├── admin/
│   ├── +layout.svelte             # Admin layout (admin/owner only)
│   ├── +layout.server.ts          # Role check
│   ├── +page.svelte               # Admin dashboard
│   ├── +page.server.ts            # Owner sales data
│   ├── [slug]/
│   │   └── +page.svelte           # Dynamic admin pages
│   ├── calendar/
│   │   ├── +page.svelte           # Calendar view
│   │   └── +page.server.ts        # Calendar data
│   ├── contacts/
│   │   ├── +page.svelte           # Contacts management
│   │   └── +page.server.ts        # Contacts CRUD
│   ├── locations/
│   │   ├── +page.svelte           # Hotel/locations
│   │   └── +page.server.ts        # Hotel CRUD
│   ├── sales/
│   │   ├── +page.svelte           # Sales reports
│   │   └── +page.server.ts        # Sales data
│   └── team/
│       ├── +page.svelte           # Team management
│       └── +page.server.ts        # Staff CRUD
│
├── api/
│   ├── booking/
│   │   └── check/
│   │       └── +server.ts         # POST booking validation
│   └── webhook/
│       └── stripe/
│           └── +server.ts         # POST Stripe webhook
│
├── booking-success/
│   ├── +page.svelte               # Success page (public)
│   └── +page.server.ts            # Verify session
│
├── dashboard/
│   ├── +page.svelte               # Main dashboard (auth)
│   ├── +page.server.ts            # Role-based data loading
│   └── booking/
│       └── [bookingId]/
│           └── bags/
│               ├── +page.svelte   # Booking bag details
│               └── +page.server.ts # Bag data
│
├── driver/
│   └── bag/
│       └── [bagId]/
│           ├── +page.svelte       # Bag scan page (driver auth)
│           └── +page.server.ts    # Status update actions
│
├── eg/                             # Example/demo pages (dev)
│   ├── db/
│   ├── start_direction/
│   └── start_end/
│
├── login/
│   ├── +page.svelte               # Login page (public)
│   └── +page.server.ts            # Login action
│
├── logout/
│   └── +page.server.ts            # Logout action
│
├── register/
│   ├── +page.svelte               # Registration (public)
│   └── +page.server.ts            # Register action
│
└── reset-password/
    └── [token]/
        ├── +page.svelte           # Password reset (public)
        └── +page.server.ts        # Reset action
```

## Access Control Matrix

### Public Routes (No Authentication Required)

| Route                     | Purpose                    | Notes                                               |
| ------------------------- | -------------------------- | --------------------------------------------------- |
| `/`                       | Homepage with booking form | Booking form handles both guest and logged-in users |
| `/login`                  | Login page                 | Redirects to dashboard if already logged in         |
| `/register`               | Registration               | Creates customer account                            |
| `/reset-password/[token]` | Password reset             | Token-based, time-limited                           |
| `/booking-success`        | Payment success            | Shows confirmation, public                          |
| `/eg/*`                   | Example pages              | Development/demos                                   |

### Authenticated Routes (Login Required)

| Route                          | Minimum Role | Redirect if No Auth |
| ------------------------------ | ------------ | ------------------- |
| `/dashboard`                   | customer     | `/login`            |
| `/account`                     | customer     | `/login`            |
| `/dashboard/booking/[id]/bags` | customer     | `/login`            |
| `/driver/bag/[id]`             | driver       | `/login`            |

### Admin Routes (Admin or Owner Only)

| Route              | Layout Protection   | Server Check               |
| ------------------ | ------------------- | -------------------------- |
| `/admin`           | `+layout.server.ts` | `canPerformAdminActions()` |
| `/admin/calendar`  | Layout redirect     | Load check                 |
| `/admin/contacts`  | Layout redirect     | Load check                 |
| `/admin/locations` | Layout redirect     | Load check                 |
| `/admin/sales`     | Layout redirect     | Owner-only in load         |
| `/admin/team`      | Layout redirect     | Owner-only in load         |

### Role-Specific Actions

| Action             | Customer | Driver | Admin | Owner |
| ------------------ | -------- | ------ | ----- | ----- |
| View own bookings  | ✅       | -      | ✅    | ✅    |
| View all bookings  | -        | -      | ✅    | ✅    |
| Update own hotels  | ✅       | -      | -     | -     |
| Manage hotels      | -        | -      | ✅    | ✅    |
| Manage customers   | -        | -      | ✅    | ✅    |
| Manage drivers     | -        | -      | ✅    | ✅    |
| Assign drivers     | -        | -      | ✅    | ✅    |
| View sales reports | -        | -      | -     | ✅    |
| Manage staff       | -        | -      | -     | ✅    |
| Update bag status  | -        | ✅     | -     | -     |

## Authentication Flow

### Session Validation

**Location:** `src/hooks.server.ts`

```typescript
export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	// Validate session in database
	const result = await db
		.select({ user: userTable, session: sessionTable })
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.where(eq(sessionTable.id, sessionId));

	if (!result || session.expired) {
		event.cookies.delete('session');
		event.locals.user = null;
	} else {
		event.locals.user = {
			id: user.id,
			username: user.username,
			role: user.role
		};
	}

	return resolve(event);
};
```

### Layout Data Loading

**Location:** `src/routes/+layout.server.ts`

```typescript
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null // Available to all pages
	};
};
```

### Admin Layout Protection

**Location:** `src/routes/admin/+layout.server.ts`

```typescript
export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect if not admin or owner
	if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	return { user };
};
```

### Server-Side Role Checks

**Helper Function:**

```typescript
// src/routes/dashboard/+page.server.ts
function canPerformAdminActions(user: { role: string } | null): boolean {
	return !!user && (user.role === 'admin' || user.role === 'owner');
}
```

**Usage in Actions:**

```typescript
export const actions: Actions = {
	createHotel: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}
		// ... action logic
	},

	createStaff: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { message: 'Unauthorized' });
		}
		// ... owner-only logic
	}
};
```

## Dashboard Routing

### Single Dashboard Pattern

All authenticated users go to `/dashboard`, which renders different components based on role:

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script>
	import CustomerDashboard from '$lib/components/dashboard/CustomerDashboard.svelte';
	import DriverDashboard from '$lib/components/dashboard/DriverDashboard.svelte';
	import AdminDashboard from '$lib/components/dashboard/AdminDashboard.svelte';
	import OwnerDashboard from '$lib/components/dashboard/OwnerDashboard.svelte';

	export let data;

	const dashboardComponents = {
		customer: CustomerDashboard,
		driver: DriverDashboard,
		admin: AdminDashboard,
		owner: OwnerDashboard
	};

	$: DashboardComponent = dashboardComponents[data.user.role];
</script>

<DashboardComponent {data} />
```

### Dashboard Load Function

**Location:** `src/routes/dashboard/+page.server.ts`

```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const user = locals.user;
	let data = { user };

	// Load role-specific data
	if (user.role === 'customer') {
		data = { ...data, bookings, segmentsByBooking, bagsByBooking };
	}

	if (user.role === 'driver') {
		data = { ...data, driverAssignments, calendarMonth, selectedDate };
	}

	if (user.role === 'admin' || user.role === 'owner') {
		data = {
			...data,
			allBookings,
			allCustomers,
			allDrivers,
			calendarSummary,
			stepAssignments
		};
	}

	if (user.role === 'owner') {
		data = { ...data, ownerBookings, dailySales, allStaff };
	}

	return data;
};
```

## URL Parameters

### Query Parameters

| Parameter       | Routes                   | Purpose                                 |
| --------------- | ------------------------ | --------------------------------------- |
| `calendarMonth` | `/dashboard`, `/admin/*` | Format: YYYY-MM, controls calendar view |
| `selectedDate`  | `/dashboard`, `/admin/*` | Format: YYYY-MM-DD, selected day        |
| `canceled`      | `/`                      | Stripe checkout canceled flag           |
| `session_id`    | `/booking-success`       | Stripe session ID for verification      |
| `registered`    | `/login`                 | Show registration success message       |
| `reset`         | `/login`                 | Show password reset success message     |

### Path Parameters

| Parameter   | Route                                 | Pattern                      |
| ----------- | ------------------------------------- | ---------------------------- |
| `token`     | `/reset-password/[token]`             | Password reset token         |
| `bookingId` | `/dashboard/booking/[bookingId]/bags` | UUID format                  |
| `bagId`     | `/driver/bag/[bagId]`                 | Format: {bookingRef}-{label} |
| `slug`      | `/admin/[slug]`                       | Dynamic admin page ID        |

## Redirect Behavior

### Successful Login

```
POST /login → 302 → /dashboard (or ?redirectTo param)
```

### Failed Auth

```
Protected route without session → 302 → /login
Admin route without permission → 302 → /dashboard
```

### Successful Registration

```
POST /register → 302 → /login?registered=1
```

### Password Reset

```
POST /reset-password/[token] → 302 → /login?reset=1
```

### Logout

```
POST /logout → 302 → /
```

## Navigation Patterns

### Header Navigation

```
LOGGED OUT:
[Logo]                    [EN/PT toggle] [Login]

LOGGED IN:
[Logo]                    [EN/PT toggle] [Dashboard] [Log out]
```

### Dashboard Navigation

**Customer:**

```
My Bookings | Account Settings
```

**Admin:**

```
Overview | Bookings | Customers | Drivers | Hotels | Schedule | Sales
```

**Owner:**

```
Overview | Bookings | Customers | Drivers | Hotels | Schedule | Sales | Staff
```

**Driver:**

```
My Assignments | Scan Bag
```

## Security Considerations

### CSRF Protection

- All form actions include CSRF token via SvelteKit
- Cookie is SameSite=Lax
- State-changing actions use POST

### Session Security

- HttpOnly cookie (not accessible via JavaScript)
- Secure flag in production
- 30-day expiration (configurable)
- Database-stored sessions (can revoke)

### Authorization Checks

- Always check on server (load + actions)
- Never trust client-side role display
- Defense in depth: layout + load + action checks

### Rate Limiting

- `/api/booking/check` limited to 20 req/min per IP
- Login attempts not currently rate limited (add if needed)

## Testing Authentication

### Test User Creation

```sql
-- Create admin
INSERT INTO "user" (id, username, password_hash, role, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '$argon2id$v=19$m=19456,t=2,p=1$...', -- hash of 'password'
  'admin',
  'Admin',
  'User'
);
```

### Stripe Webhook Testing

```bash
# Start Stripe CLI
stripe listen --forward-to localhost:5173/api/webhook/stripe

# Get webhook secret from output
# Add to .env: STRIPE_WEBHOOK_SECRET=whsec_...
```

## Future Route Additions

### Planned Routes

| Route                  | Purpose                    | Priority |
| ---------------------- | -------------------------- | -------- |
| `/track/[bookingRef]`  | Public booking tracking    | Medium   |
| `/api/bag/[id]/status` | API for mobile app         | Low      |
| `/reports`             | Advanced reporting (owner) | Low      |

### Route Structure Guidelines

When adding new routes:

1. **Public routes:** Directly under `src/routes/`
2. **Protected routes:** Under existing protected directories
3. **Admin routes:** Under `/admin/` with layout protection
4. **API routes:** Under `/api/` with proper HTTP methods
5. **Actions:** Always validate authentication server-side
6. **Layouts:** Use `+layout.server.ts` for group protection

## Troubleshooting Routes

### 404 Errors

```bash
# Check if file exists
ls src/routes/[path]/+page.svelte

# Check build output
npm run build
ls .svelte-kit/output/client/
```

### Auth Redirects

```typescript
// Debug in +page.server.ts
export const load = async ({ locals }) => {
	console.log('User:', locals.user); // Check what user data is available

	if (!locals.user) {
		console.log('No user, redirecting');
		throw redirect(302, '/login');
	}

	return { user: locals.user };
};
```

### Session Issues

```bash
# Clear all sessions (database)
psql $DATABASE_URL -c "DELETE FROM session;"

# Or clear specific user
psql $DATABASE_URL -c "DELETE FROM session WHERE user_id = '...';"
```
