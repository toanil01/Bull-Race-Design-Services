import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Category types enum
export const categoryTypes = ["Sub-Juniors", "Juniors", "Seniors", "Super Seniors"] as const;
export type CategoryType = typeof categoryTypes[number];

// Registration status enum
export const registrationStatuses = ["pending", "approved", "rejected"] as const;
export type RegistrationStatus = typeof registrationStatuses[number];

// Race status enum
export const raceStatuses = ["upcoming", "in_progress", "completed"] as const;
export type RaceStatus = typeof raceStatuses[number];

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // Sub-Juniors, Juniors, Seniors, Super Seniors
  raceDate: text("race_date").notNull(), // ISO date string
  raceEndDate: text("race_end_date"), // ISO date string, optional
  categoryTime: integer("category_time").notNull(), // in seconds
  categoryDistance: integer("category_distance").notNull(), // meters per lap
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  modifiedBy: text("modified_by"),
  modifiedAt: text("modified_at"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Bull Pairs table (registrations)
export const bullPairs = pgTable("bull_pairs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pairName: text("pair_name").notNull(),
  ownerName1: text("owner_name_1").notNull(),
  ownerName2: text("owner_name_2"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  categoryId: varchar("category_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  registrationOrder: integer("registration_order"),
  raceOrder: integer("race_order"), // after shuffle/lock
  createdAt: text("created_at").notNull(),
  modifiedBy: text("modified_by"),
  modifiedAt: text("modified_at"),
});

export const insertBullPairSchema = createInsertSchema(bullPairs).omit({
  id: true,
  status: true,
  registrationOrder: true,
  raceOrder: true,
  createdAt: true,
  modifiedAt: true,
});

export type InsertBullPair = z.infer<typeof insertBullPairSchema>;
export type BullPair = typeof bullPairs.$inferSelect;

// Races table
export const races = pgTable("races", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, in_progress, completed
  isOrderLocked: boolean("is_order_locked").default(false),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});

export const insertRaceSchema = createInsertSchema(races).omit({
  id: true,
  status: true,
  isOrderLocked: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
});

export type InsertRace = z.infer<typeof insertRaceSchema>;
export type Race = typeof races.$inferSelect;

// Race Entries - pairs participating in a specific race
export const raceEntries = pgTable("race_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raceId: varchar("race_id").notNull(),
  bullPairId: varchar("bull_pair_id").notNull(),
  raceOrder: integer("race_order").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, racing, completed
  startTime: text("start_time"),
  endTime: text("end_time"),
  totalTimeMs: integer("total_time_ms"), // total race time in milliseconds
});

export const insertRaceEntrySchema = createInsertSchema(raceEntries).omit({
  id: true,
  status: true,
  startTime: true,
  endTime: true,
  totalTimeMs: true,
});

export type InsertRaceEntry = z.infer<typeof insertRaceEntrySchema>;
export type RaceEntry = typeof raceEntries.$inferSelect;

// Laps table
export const laps = pgTable("laps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raceEntryId: varchar("race_entry_id").notNull(),
  lapNumber: integer("lap_number").notNull(),
  lapTimeMs: integer("lap_time_ms").notNull(), // milliseconds
  totalTimeMs: integer("total_time_ms").notNull(), // cumulative time
  distanceCovered: integer("distance_covered").notNull(), // meters
  // Override distance fields for final lap
  overrideMeters: integer("override_meters"),
  overrideFeet: integer("override_feet"),
  overrideInches: integer("override_inches"),
  createdAt: text("created_at").notNull(),
});

export const insertLapSchema = createInsertSchema(laps).omit({
  id: true,
  createdAt: true,
});

export type InsertLap = z.infer<typeof insertLapSchema>;
export type Lap = typeof laps.$inferSelect;

// Photo gallery
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  caption: text("caption"),
  category: text("category"), // race, winners, atmosphere, bulls
  createdAt: text("created_at").notNull(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

// Extended types for frontend use with joined data
export type BullPairWithCategory = BullPair & {
  category: Category;
};

export type RaceEntryWithDetails = RaceEntry & {
  bullPair: BullPair;
  laps: Lap[];
};

export type RaceWithDetails = Race & {
  category: Category;
  entries: RaceEntryWithDetails[];
};

export type LeaderboardEntry = {
  rank: number;
  bullPairId: string;
  pairName: string;
  ownerName1: string;
  ownerName2?: string;
  totalTimeMs: number;
  laps: Lap[];
  isRacing: boolean;
  totalDistance: number;
};
