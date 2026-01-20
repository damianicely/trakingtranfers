import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

// 1. Define the roles as a Postgres Enum
export const roleEnum = pgEnum("user_role", ["customer", "admin", "driver", "owner"]);

export const userTable = pgTable("user", {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").default("customer").notNull(), // Add this!
});

export const sessionTable = pgTable("session", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userTable.id),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
        mode: "date",
    }).notNull(),
});

// 2. Profile Tables (Role-Specific Data)
export const driverProfile = pgTable("driver_profile", {
    userId: text("user_id").primaryKey().references(() => userTable.id),
    licenseNumber: text("license_number").notNull(),
    vehicleType: text("vehicle_type"),
});

export const ownerProfile = pgTable("owner_profile", {
    userId: text("user_id").primaryKey().references(() => userTable.id),
    businessName: text("business_name").notNull(),
    taxId: text("tax_id"),
});

// Admin and Customer might not need profiles if they don't have extra fields yet,
// but you can add them later!