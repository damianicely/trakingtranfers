-- Add canonical first/last name to user (booking.first_name/last_name kept for transition, see CONTRIBUTIONS_AI.md)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_name" text;
