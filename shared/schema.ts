import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastLoginDate: timestamp("last_login_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
  avatarUrl: text("avatar_url"),
});

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  habitType: text("habit_type").notNull(), // recycle, transport, energy, water, trees
  count: integer("count").notNull().default(0),
  date: text("date").notNull(), // YYYY-MM-DD format
  pointsEarned: integer("points_earned").notNull().default(0),
  
  // New fields for enhanced tracking
  distance: integer("distance"), // Distance in kilometers for transport
  startLocation: text("start_location"), // Start point for transport
  endLocation: text("end_location"), // End point for transport
  recycledItem: text("recycled_item"), // Type of item recycled
  imageUrl: text("image_url"), // URL to uploaded verification image
  verified: integer("verified").notNull().default(0), // 0 = pending, 1 = verified, 2 = rejected
  description: text("description"), // Additional description
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  icon: text("icon").notNull(),
  isActive: integer("is_active").notNull().default(1), // 1 for active, 0 for inactive
});

export const userRewards = pgTable("user_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id),
  claimedAt: timestamp("claimed_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  userId: true,
  habitType: true,
  count: true,
  date: true,
  pointsEarned: true,
  distance: true,
  startLocation: true,
  endLocation: true,
  recycledItem: true,
  imageUrl: true,
  verified: true,
  description: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const habitUpdateSchema = z.object({
  habitType: z.enum(["recycle", "transport", "energy", "water", "trees"]),
  increment: z.number().min(1).default(1),
  // Optional fields for specific habit types
  distance: z.number().optional(), // For transport
  startLocation: z.string().optional(), // For transport
  endLocation: z.string().optional(), // For transport
  recycledItem: z.string().optional(), // For recycling
  imageUrl: z.string().optional(), // For verification
  description: z.string().optional(), // General description
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type UserReward = typeof userRewards.$inferSelect;
