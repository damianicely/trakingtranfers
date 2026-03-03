# Product Backlog

## Bugs

### BUG - Travel date does not appear on admin calendar until user adds hotel

**Priority:** High  
**Status:** Open

**Description:** When a customer creates a new booking, the travel/departure date does not show up on the admin calendar until the customer adds hotel information. This creates visibility gaps for upcoming trips in the admin dashboard.

**Expected Behavior:** Travel dates should appear on the admin calendar immediately when a booking is created, regardless of hotel status.

**Actual Behavior:** Travel dates only appear after hotel information is added to the booking.

---

## Issues

### ISSUE - Creating driver should not submit form if license not included

**Priority:** Medium  
**Status:** Open

**Description:** The driver creation form currently allows submission without a required license number. This needs client-side validation to prevent incomplete driver records.

**Acceptance Criteria:**

- [ ] Form validation prevents submission when license field is empty
- [ ] Display clear error message indicating license is required
- [ ] Field should be marked as required visually

---

### ISSUE - Enable user see and user edit

**Priority:** Medium  
**Status:** Open

**Description:** Users need the ability to view and edit their profile/account information. This functionality is currently missing or incomplete.

**Acceptance Criteria:**

- [ ] Users can view their profile information
- [ ] Users can edit their personal details (name, email, phone, etc.)
- [ ] Changes should be saved and reflected immediately
- [ ] Appropriate validation on edit form
- [ ] Consider adding password change capability

---

## Completed

_Move items here once resolved_

---

**Document Last Updated:** 2026-03-03
