import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Think of this like a Laravel Migration file + Eloquent Model combined
export const userTable = pgTable("user", {
    id: text("id").primaryKey(), // We use text for IDs in Svelte Auth
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
});

export const sessionTable = pgTable("session", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userTable.id), // Foreign Key!
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
        mode: "date",
    }).notNull(),
});