# Redesign Implementation Plan & Progress

## Project Overview

Redesigning TrakingTransfers.pt with a new premium aesthetic while preserving all existing functionality.

---

## Phase 1-3: ✅ COMPLETE

See git history for detailed phase breakdown. Summary:

- Created new design system with premium aesthetic
- Built all landing page components
- Integrated booking form with Stripe
- Added login modal with new styling

---

## Phase 4: Route Swap ✅ COMPLETE

### What Was Done:

1. **Moved old site to `/old` route**:
   - Copied current root `+page.svelte` → `/old/+page.svelte`
   - Copied current root `+page.server.ts` → `/old/+page.server.ts`
   - Old site now accessible at `/old` with original header/footer

2. **Promoted new design to root**:
   - Moved `/new/+page.svelte` → `/+page.svelte`
   - Deleted `/new` directory
   - Root `/` now serves new design

3. **Updated layout logic**:
   - Changed `isNewLanding` check to `isOldSite`
   - Old header/footer only show on `/old/*` routes
   - New design shows everywhere else (has its own nav/footer)

### Current URL Structure:

| URL                                        | What It Shows                         |
| ------------------------------------------ | ------------------------------------- |
| `/`                                        | **NEW DESIGN** - Main landing page    |
| `/old`                                     | Old design with original booking form |
| `/dashboard`                               | Dashboard (unchanged)                 |
| `/admin/*`                                 | Admin panel (unchanged)               |
| `/login`, `/register`, `/reset-password/*` | Auth pages (unchanged)                |

---

## Final Structure

### Root `/` (New Design)

- New premium landing page
- Custom Nav, Hero, Booking Form, Features, Trail, Gallery, Footer
- No old header/footer
- Working Stripe checkout
- Login modal with new styling

### `/old` (Old Design - Reference)

- Original landing page preserved
- Original BookingForm component
- Old header and footer visible
- Still functional for comparison

---

## Testing Checklist

### Root `/` (New Site):

- [ ] New design loads correctly
- [ ] Navigation scrolls and changes color
- [ ] Language toggle works (EN/PT)
- [ ] Login modal opens with new styling
- [ ] Booking form validates fields
- [ ] Route calculation works
- [ ] Price displays correctly
- [ ] Stripe checkout redirects
- [ ] Footer displays correctly

### `/old` (Old Site):

- [ ] Old design loads correctly
- [ ] Old header visible
- [ ] Old footer visible
- [ ] Original booking form works
- [ ] Can still make bookings

---

## Next Steps (Phase 5 - Future):

### Backend Redesign

- Redesign dashboard layouts
- Update admin tables and forms
- Apply new sidebar navigation
- Update all dashboard components with new styling

---

## Key Files:

### New Landing (Root `/`):

- `src/routes/+page.svelte` - New landing page
- `src/lib/components/landing/Nav.svelte`
- `src/lib/components/landing/Hero.svelte`
- `src/lib/components/landing/BookingSection.svelte`
- `src/lib/components/landing/BookingForm.svelte`
- `src/lib/components/landing/Features.svelte`
- `src/lib/components/landing/Trail.svelte`
- `src/lib/components/landing/Gallery.svelte`
- `src/lib/components/landing/Footer.svelte`

### Old Site (`/old`):

- `src/routes/old/+page.svelte` - Old landing page
- `src/routes/old/+page.server.ts` - Old server actions

### Styles:

- `src/lib/styles/new-landing.css`

### Layout:

- `src/routes/+layout.svelte` - Handles old/new site switching

---

Last Updated: March 1, 2025
Current Phase: 4 COMPLETE - Route swap finished, new design is live at root
