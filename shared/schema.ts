import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business profile table for local businesses
export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  socialLinks: jsonb("social_links"), // Instagram, Facebook, etc.
  operatingHours: jsonb("operating_hours"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer preferences table
export const customerPreferences = pgTable("customer_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  preferredCategories: text("preferred_categories").array(),
  budgetRange: varchar("budget_range", { length: 50 }),
  location: varchar("location", { length: 255 }),
  dietaryRestrictions: text("dietary_restrictions").array(),
  interests: text("interests").array(),
  preferredDistance: decimal("preferred_distance", { precision: 5, scale: 2 }), // in miles
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business reviews and ratings
export const businessReviews = pgTable("business_reviews", {
  id: serial("id").primaryKey(),
  businessId: serial("business_id").notNull().references(() => businessProfiles.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  reviewText: text("review_text"),
  visitDate: timestamp("visit_date"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Personalized recommendations table
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessId: serial("business_id").notNull().references(() => businessProfiles.id),
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(), // 'preference', 'location', 'trending'
  score: decimal("score", { precision: 3, scale: 2 }).notNull(),
  reason: text("reason"),
  isViewed: boolean("is_viewed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity logs for tracking user actions
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // 'login', 'view_business', 'add_review', 'update_preferences'
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const businessProfileInsertSchema = createInsertSchema(businessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const customerPreferencesInsertSchema = createInsertSchema(customerPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const businessReviewInsertSchema = createInsertSchema(businessReviews).omit({
  id: true,
  createdAt: true,
});

export const recommendationInsertSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export const activityLogInsertSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof businessProfileInsertSchema>;
export type CustomerPreferences = typeof customerPreferences.$inferSelect;
export type InsertCustomerPreferences = z.infer<typeof customerPreferencesInsertSchema>;
export type BusinessReview = typeof businessReviews.$inferSelect;
export type InsertBusinessReview = z.infer<typeof businessReviewInsertSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof recommendationInsertSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof activityLogInsertSchema>;
