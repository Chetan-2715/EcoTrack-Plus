import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./supabase-storage";
import { insertUserSchema, loginSchema, habitUpdateSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      // Ensure email uniqueness is case-insensitive
      data.email = data.email.toLowerCase();
      
      const user = await storage.createUser(data);
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          points: user.points,
          avatarUrl: (user as any).avatarUrl || null,
          createdAt: user.createdAt
        } 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      if (error.message === "User already exists with this email") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Upsert app user profile after Supabase signup/login
  app.post("/api/auth/upsert", async (req, res) => {
    try {
      const { id, email, username } = req.body as { id: string; email: string; username?: string };
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.json({ user: { id: existing.id, username: existing.username, email: existing.email, points: existing.points } });
      }
      const created = await storage.createUser({ username: username || email.split("@")[0], email: email.toLowerCase(), password: "" } as any);
      res.json({ user: { id: created.id, username: created.username, email: created.email, points: created.points } });
    } catch (error) {
      res.status(500).json({ message: "Failed to upsert user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      data.email = data.email.toLowerCase();
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          points: user.points,
          avatarUrl: (user as any).avatarUrl || null,
          createdAt: user.createdAt
        } 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const rank = await storage.getUserRank(user.id);
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          points: user.points, 
          streak: user.streak,
          avatarUrl: (user as any).avatarUrl || null,
          createdAt: user.createdAt,
          rank 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update profile (name and avatar)
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { username, avatarUrl, removeAvatar } = req.body as { username?: string; avatarUrl?: string; removeAvatar?: boolean };
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      // Only update fields that are provided
      const updateData: { username: string; avatarUrl?: string } = {
        username: username ?? user.username,
      };
      
      // Handle avatar removal
      if (removeAvatar === true) {
        updateData.avatarUrl = "";
      } else if (avatarUrl !== undefined) {
        updateData.avatarUrl = avatarUrl;
      } else if ((user as any).avatarUrl) {
        updateData.avatarUrl = (user as any).avatarUrl;
      }
      
      const updated = await storage.updateUserProfile(id, updateData);
      if (!updated) return res.status(500).json({ message: "Failed to update profile" });
      res.json({ user: { id: updated.id, username: updated.username, email: updated.email, points: updated.points, streak: updated.streak, avatarUrl: (updated as any).avatarUrl, createdAt: updated.createdAt } });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Delete profile
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      // 1. Verify user password
      const user = await storage.getUser(id);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 2. Delete user from storage
      await storage.deleteUser(id);

      res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error('Profile deletion error:', error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // Habit routes
  app.post("/api/habits/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const data = habitUpdateSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const existingHabits = await storage.getUserHabitsForDate(userId, today);
      const existingHabit = existingHabits.find(h => h.habitType === data.habitType);

      // Distance-based points calculation function
      const calculatePoints = (habitType: string, data: any) => {
        switch (habitType) {
          case "transport":
            const distance = data.distance || 0;
            if (distance <= 5) return 1;
            if (distance <= 10) return 2;
            if (distance <= 20) return 3;
            return 4;
          case "recycle": return 5;
          case "water": return 4;
          case "trees": return 5;
          default: return 1;
        }
      };

      const newCount = (existingHabit?.count || 0) + data.increment;
      const pointsEarned = data.increment * calculatePoints(data.habitType, data);
      
      // Create or update habit
      const habit = await storage.createOrUpdateHabit({
        userId,
        habitType: data.habitType,
        count: newCount,
        date: today,
        pointsEarned: (existingHabit?.pointsEarned || 0) + pointsEarned,
        distance: data.habitType === 'transport' ? data.distance : undefined,
        startLocation: data.habitType === 'transport' ? data.startLocation : undefined,
        endLocation: data.habitType === 'transport' ? data.endLocation : undefined,
        recycledItem: data.habitType === 'recycle' ? data.recycledItem : undefined,
        imageUrl: data.imageUrl,
        verified: 1, // Always verified
        description: data.description,
      });

      // Update user points
      const updatedUser = await storage.updateUserPoints(userId, user.points + pointsEarned);

      res.json({ habit, user: updatedUser });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update habit" });
    }
  });

  app.get("/api/habits/:userId/today", async (req, res) => {
    try {
      const { userId } = req.params;
      const today = new Date().toISOString().split('T')[0];
      const habits = await storage.getUserHabitsForDate(userId, today);
      
      // Create a map of habit types to counts
      const habitMap = habits.reduce((acc, habit) => {
        acc[habit.habitType] = habit.count;
        return acc;
      }, {} as Record<string, number>);

      res.json({ habits: habitMap });
    } catch (error) {
      res.status(500).json({ message: "Failed to get habits" });
    }
  });

  // Daily activity heatmap-like data: counts per day for last 12 weeks
  app.get("/api/activity/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const days = parseInt((req.query.days as string) || "84");
      const data = await storage.getDailyActivity(userId, days);
      res.json({ days: data });
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity" });
    }
  });

  // Get user's action history with details
  app.get("/api/habits/:userId/history", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt((req.query.limit as string) || "50");
      const history = await storage.getUserHabitHistory(userId, limit);
      res.json({ history });
    } catch (error) {
      res.status(500).json({ message: "Failed to get habit history" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      
      // Only show real users (no demo users), all users from database are real
      const leaderboardWithRanks = leaderboard.map((user, index) => ({
        id: user.id,
        username: user.username,
        points: user.points,
        streak: user.streak,
        rank: index + 1,
        avatarUrl: (user as any).avatarUrl || null,
      }));

      res.json({ leaderboard: leaderboardWithRanks });
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // Rewards routes
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json({ rewards });
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  app.get("/api/rewards/:userId/claimed", async (req, res) => {
    try {
      const { userId } = req.params;
      const userRewards = await storage.getUserRewards(userId);
      res.json({ userRewards });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user rewards" });
    }
  });

  app.post("/api/rewards/:userId/claim/:rewardId", async (req, res) => {
    try {
      const { userId, rewardId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const rewards = await storage.getAllRewards();
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }

      if (user.points < reward.pointsRequired) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Check if already claimed
      const userRewards = await storage.getUserRewards(userId);
      const alreadyClaimed = userRewards.some(ur => ur.rewardId === rewardId);
      if (alreadyClaimed) {
        return res.status(400).json({ message: "Reward already claimed" });
      }

      const userReward = await storage.claimReward(userId, rewardId);
      res.json({ userReward });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
