-- EcoTrack+ Database Schema for Neon PostgreSQL
-- Run this SQL in the Neon SQL Editor to create all tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_login_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  avatar_url TEXT
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  distance INTEGER,
  start_location TEXT,
  end_location TEXT,
  recycled_item TEXT,
  image_url TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  icon TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- User rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id VARCHAR NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_date ON habits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_user_type_date ON habits(user_id, habit_type, date);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- Seed default rewards
INSERT INTO rewards (name, description, points_required, icon, is_active)
VALUES
  ('Eco Warrior Badge', 'Earned by reaching 100 eco points', 100, '🌿', 1),
  ('Tree Planter', 'Plant 10 trees virtually', 250, '🌳', 1),
  ('Carbon Neutral Champion', 'Offset 500 points worth of carbon', 500, '🏆', 1),
  ('Sustainability Star', 'Achieve 1000 eco points', 1000, '⭐', 1),
  ('Green Planet Guardian', 'The ultimate eco achievement at 2500 points', 2500, '🌍', 1)
ON CONFLICT DO NOTHING;
