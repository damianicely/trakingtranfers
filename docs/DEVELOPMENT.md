# Development Guide

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Stripe account (for payments)
- SSH access to production database (for development tunnel)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd trakingtranfers

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

Create `.env` file:

```bash
# Database (via SSH tunnel)
DATABASE_URL=postgres://user:pass@localhost:5433/dbname

# Stripe (test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From 'stripe listen' command

# Optional: Daily capacity limit
MAX_TRANSFERS_PER_DAY=50
```

## Development Workflow

### Terminal Setup

You need **4 terminals** running simultaneously:

#### Terminal 1: SSH Tunnel

```bash
ssh -L 5433:localhost:5432 transfers
```

Keeps database connection open. Don't close this window.

#### Terminal 2: Stripe Webhook

```bash
stripe listen --forward-to localhost:5173/api/webhook/stripe
```

Forwards Stripe events to your local server. Copy the webhook secret to `.env`.

#### Terminal 3: Dev Server

```bash
npm run dev
```

Starts SvelteKit dev server on http://localhost:5173

#### Terminal 4: Database Studio (Optional)

```bash
npx drizzle-kit studio
```

Opens Drizzle Studio at https://local.drizzle.studio/

### Testing Payments

Use Stripe test cards:

| Card                | Result   |
| ------------------- | -------- |
| 4242 4242 4242 4242 | Success  |
| 4000 0000 0000 9995 | Declined |

Use any future date and 3-digit CVC.

## Database Operations

### Schema Changes

**During Development (use `push`):**

```bash
npx drizzle-kit push
```

Syncs schema directly to database without migrations.

**For Production (use `generate` + `migrate`):**

```bash
# Generate migration file
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

### Seeding Data

#### Hotels

```bash
# Add hotels to data/hotels.json
npm run seed:hotels
```

#### Manual SQL

```bash
psql $DATABASE_URL -f scripts/seed-data.sql
```

### Common Queries

```bash
# View recent bookings
psql $DATABASE_URL -c "SELECT id, email, status, created_at FROM booking ORDER BY created_at DESC LIMIT 5;"

# View today's assignments
psql $DATABASE_URL -c "SELECT * FROM driver_step_assignment WHERE date = CURRENT_DATE;"

# Clear all sessions (force re-login)
psql $DATABASE_URL -c "DELETE FROM session;"

# Reset user password (set to 'password')
psql $DATABASE_URL -c "UPDATE \"user\" SET password_hash = '\$argon2id\$v=19\$m=19456,t=2,p=1\$...' WHERE username = 'user@test.com';"
```

## Debugging

### Server-Side Debugging

Add `console.log` in `+page.server.ts`:

```typescript
export const load = async ({ locals }) => {
	console.log('Current user:', locals.user);
	console.log('Request headers:', Object.fromEntries(request.headers));

	const data = await fetchData();
	console.log('Fetched data:', data);

	return data;
};
```

View logs in Terminal 3 (npm run dev).

### Client-Side Debugging

Browser DevTools:

- Network tab: View API requests
- Console: View client-side logs
- Application > Cookies: View session cookie

### Database Debugging

```bash
# Enable query logging
psql $DATABASE_URL -c "SET log_statement = 'all';"

# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Common Issues

#### "Cannot connect to database"

```bash
# Check tunnel is running
lsof -i :5433

# Test connection
psql postgres://user:pass@localhost:5433/dbname -c "SELECT 1;"
```

#### "Stripe webhook signature verification failed"

```bash
# Restart stripe listen and update .env
stripe listen --forward-to localhost:5173/api/webhook/stripe
```

#### "Session not persisting"

- Check browser accepts third-party cookies
- Verify cookie is being set (DevTools > Application > Cookies)
- Check `hooks.server.ts` is loading user correctly

#### "Changes not reflecting"

```bash
# Restart dev server
npm run dev

# Clear SvelteKit cache
rm -rf .svelte-kit
npm run dev
```

## Code Style

### Svelte 5 Runes

**Always use runes mode:**

```svelte
<script>
	// Props
	let { formData, user } = $props<{
		formData: BookingForm;
		user: User | null;
	}>();

	// State
	let count = $state(0);
	let doubled = $derived(count * 2);

	// Store subscription
	const t = $derived(translations[$language]);
</script>
```

**Never use old syntax:**

```svelte
<!-- DON'T -->
<script>
	export let formData; // ❌
	$: doubled = count * 2; // ❌
	let count = 0; // ❌ (if reactive)
</script>
```

### File Naming

- Components: `PascalCase.svelte`
- Server files: `+page.server.ts`, `+server.ts`
- Utilities: `camelCase.ts`
- Constants: `CONSTANTS.ts` or `constants.ts`

### Imports

Group imports:

```typescript
// 1. Svelte/SvelteKit
import { error, fail, redirect } from '@sveltejs/kit';

// 2. External libraries
import { eq, and } from 'drizzle-orm';

// 3. Internal ($lib)
import { db } from '$lib/server/db';
import { bookingTable } from '$lib/server/db/schema';

// 4. Relative
import type { PageServerLoad } from './$types';
```

### Error Handling

**Server actions:**

```typescript
export const actions = {
	createBooking: async ({ request }) => {
		try {
			const data = await validateAndSave(request);
			return { success: true, data };
		} catch (err) {
			console.error('Failed to create booking:', err);
			return fail(500, { message: 'Failed to create booking' });
		}
	}
};
```

**Client-side:**

```svelte
<script>
	export let form;

	$effect(() => {
		if (form?.message) {
			showToast(form.message, 'error');
		}
	});
</script>
```

## Testing

### Manual Testing Checklist

**Booking Flow:**

- [ ] Guest can complete booking
- [ ] Registered user can book while logged in
- [ ] Email validation works
- [ ] Capacity check works
- [ ] Stripe payment succeeds
- [ ] Bags created after payment
- [ ] User receives password reset email

**Authentication:**

- [ ] Can register new account
- [ ] Can log in
- [ ] Session persists across page reloads
- [ ] Can reset password
- [ ] Unauthorized access redirected

**Admin Functions:**

- [ ] Can assign drivers
- [ ] Can manage hotels
- [ ] Can view all bookings
- [ ] Can update booking status

**Driver Functions:**

- [ ] Can view assignments
- [ ] Can scan bag QR code
- [ ] Can update bag status

### Automated Testing (Future)

```bash
# Install testing libraries
npm install -D @playwright/test vitest

# Run tests
npx playwright test
npx vitest
```

## Git Workflow

### Branches

```bash
# Main branches
main          # Production
staging       # Pre-production testing
develop       # Integration branch

# Feature branches
feature/booking-flow-improvements
feature/driver-notifications
bugfix/fix-calendar-display
```

### Commit Messages

```
feat: Add driver assignment calendar
fix: Correct bag status update logic
docs: Update API documentation
refactor: Simplify booking form validation
test: Add payment flow tests
chore: Update dependencies
```

### Before Committing

```bash
# Check for errors
npm run check

# Format code
npm run format

# Lint
npm run lint
```

## Deployment

### Build

```bash
npm run build
```

Output in `.svelte-kit/output/`.

### Environment Variables (Production)

```bash
# Database (no tunnel needed)
DATABASE_URL=postgres://user:pass@db.host:5432/dbname

# Stripe (live keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other
MAX_TRANSFERS_PER_DAY=100
```

### Database Migration (Production)

```bash
# Apply migrations
DATABASE_URL=production_url npx drizzle-kit migrate

# Or use connection string directly
PGPASSWORD=pass psql -h db.host -U user -d dbname -f drizzle/migrate.sql
```

## Performance

### Optimization Tips

1. **Database:**
   - Add indexes for frequently queried columns
   - Use `select` with specific columns, not `*`
   - Batch queries when possible

2. **Frontend:**
   - Lazy load dashboard components
   - Use `$effect.pre` for DOM measurements
   - Debounce rapid events (search, email check)

3. **API:**
   - Cache expensive queries
   - Use pagination for large lists
   - Implement proper rate limiting

### Monitoring

```bash
# Check bundle size
npm run build
ls -lh .svelte-kit/output/client/

# Profile database queries
# Enable slow query log in PostgreSQL
```

## Troubleshooting Guide

### "Module not found" errors

```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"

```bash
# Find process using port 5173
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Database connection issues

```bash
# Test tunnel
ssh -L 5433:localhost:5432 transfers -v

# Check if PostgreSQL is running on remote
ssh transfers "sudo systemctl status postgresql"

# Verify credentials
psql postgres://user:pass@localhost:5433/dbname -c "SELECT version();"
```

### Stripe webhook not receiving events

1. Check `stripe listen` is running
2. Verify webhook secret matches `.env`
3. Check webhook endpoint URL is correct
4. Look for errors in server logs

### SvelteKit errors

```bash
# Clear all caches
rm -rf .svelte-kit node_modules
npm install
npm run dev

# Type checking
npm run check
```

## Useful Commands

```bash
# Database
psql $DATABASE_URL                    # Connect to DB
npx drizzle-kit studio                # Open Drizzle Studio
npx drizzle-kit push                  # Sync schema
npx drizzle-kit generate              # Create migration
npx drizzle-kit migrate               # Run migrations

# Development
npm run dev                           # Start dev server
npm run build                         # Production build
npm run preview                       # Preview production build
npm run check                         # TypeScript check
npm run lint                          # ESLint check
npm run format                        # Prettier format

# Utilities
stripe listen                         # Start webhook listener
npm run seed:hotels                   # Seed hotel data
```

## Resources

### Documentation

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Stripe API](https://stripe.com/docs/api)

### Project Docs

- `ARCHITECTURE.md` - System overview
- `DATABASE.md` - Schema documentation
- `API.md` - API reference
- `BOOKING_FLOW.md` - Booking process
- `BAG_TRACKING.md` - Tracking system
- `ROUTES.md` - Routes & access control
- `DRIVER_ASSIGNMENT.md` - Scheduling
- `LLM_RULES.md` - Svelte 5 coding rules

## Getting Help

1. Check existing documentation
2. Search error messages in codebase
3. Check browser/server console logs
4. Review similar implementations in codebase
5. Ask with specific error messages and context
