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

// 2. Bookings
export const bookingTable = pgTable("booking", {
    id: text("id").primaryKey(),
    // Link to user (optional initially for guest bookings; can be set once the user is created)
    userId: text("user_id").references(() => userTable.id),
    status: text("status").default("pending"), // 'pending', 'paid', 'cancelled'
    stripeSessionId: text("stripe_session_id"),

    // Customer details
    firstName: text("first_name"),
    lastName: text("last_name"),
    bookingOtherNames: text("booking_other_names"), // any other names used in hotel reservations
    email: text("email"),
    phone: text("phone"),

    // Trip details
    departureDate: timestamp("departure_date", {
        withTimezone: true,
        mode: "date",
    }),
    direction: text("direction"), // e.g. 'north_south' | 'south_north'
    departureStageId: text("departure_stage_id"),
    destinationStageId: text("destination_stage_id"),

    // Pricing and counts
    numBags: text("num_bags"), // stored as text for now, parsed from form; can be changed to integer later
    numTransfers: text("num_transfers"),
    totalPrice: text("total_price"), // EUR amount as string for now

    // Timestamps
    createdAt: timestamp("created_at", {
        withTimezone: true,
        mode: "date",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
        mode: "date",
    }),
});

// 3. Hotels (associated with trail stages/locations)
export const hotelTable = pgTable("hotel", {
    id: text("id").primaryKey(),
    locationId: text("location_id").notNull(), // Stage ID (e.g., 'PC' for Porto Covo)
    name: text("name").notNull(),
    contactInfo: text("contact_info"), // Phone, email, address
    createdAt: timestamp("created_at", {
        withTimezone: true,
        mode: "date",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
        mode: "date",
    }),
});

// 4. Booking segments (route legs per booking)
export const bookingSegmentTable = pgTable("booking_segment", {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
        .notNull()
        .references(() => bookingTable.id),
    segmentIndex: text("segment_index"), // 0-based index as string for now
    fromStageId: text("from_stage_id").notNull(),
    toStageId: text("to_stage_id").notNull(),
    travelDate: timestamp("travel_date", {
        withTimezone: true,
        mode: "date",
    }).notNull(),
    // Hotel selections
    startHotelId: text("start_hotel_id").references(() => hotelTable.id),
    endHotelId: text("end_hotel_id").references(() => hotelTable.id),
    hotelNotes: text("hotel_notes"), // Extra details for hotels
    createdAt: timestamp("created_at", {
        withTimezone: true,
        mode: "date",
    }).defaultNow(),
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

// 3. Password reset / setup tokens
export const passwordResetTokenTable = pgTable("password_reset_token", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userTable.id),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
        mode: "date",
    }).notNull(),
});