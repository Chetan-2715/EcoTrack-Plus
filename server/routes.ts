import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, habitUpdateSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const user = await storage.createUser(data);
      res.json({ user: { id: user.id, username: user.username, email: user.email, points: user.points } });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username, email: user.email, points: user.points } });
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
          rank 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
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

      // Points per habit type
      const pointsPerAction = {
        recycle: 5,
        transport: 8,
        energy: 6,
        water: 4,
      };

      const newCount = (existingHabit?.count || 0) + data.increment;
      const pointsEarned = data.increment * pointsPerAction[data.habitType];

      // Create or update habit
      const habit = await storage.createOrUpdateHabit({
        userId,
        habitType: data.habitType,
        count: newCount,
        date: today,
        pointsEarned: (existingHabit?.pointsEarned || 0) + pointsEarned,
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

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      
      const leaderboardWithRanks = leaderboard.map((user, index) => ({
        id: user.id,
        username: user.username,
        points: user.points,
        streak: user.streak,
        rank: index + 1,
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
