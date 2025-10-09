import { type User, type InsertUser, type Habit, type InsertHabit, type Reward, type UserReward } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User | undefined>;
  updateUserStreak(userId: string, streak: number): Promise<User | undefined>;
  updateUserProfile(userId: string, profile: { username: string; avatarUrl?: string }): Promise<User | undefined>;
  
  // Habit methods
  getUserHabitsForDate(userId: string, date: string): Promise<Habit[]>;
  createOrUpdateHabit(habit: InsertHabit): Promise<Habit>;
  getTotalUserHabits(userId: string): Promise<number>;
  getDailyActivity(userId: string, days: number): Promise<{ date: string; count: number }[]>;
  
  // Leaderboard methods
  getLeaderboard(limit?: number): Promise<User[]>;
  getUserRank(userId: string): Promise<number>;
  
  // Rewards methods
  getAllRewards(): Promise<Reward[]>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  claimReward(userId: string, rewardId: string): Promise<UserReward>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private habits: Map<string, Habit>;
  private rewards: Map<string, Reward>;
  private userRewards: Map<string, UserReward>;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.rewards = new Map();
    this.userRewards = new Map();
    
    // Initialize some default rewards and demo data
    this.initializeRewards();
    this.initializeDemoData();
  }

  private initializeRewards() {
    const defaultRewards: Reward[] = [
      {
        id: "reward-1",
        name: "Digital Eco Badge",
        description: "Get your first digital badge to showcase your commitment to sustainable living.",
        pointsRequired: 50,
        icon: "🌿",
        isActive: 1
      },
      {
        id: "reward-2",
        name: "Green Warrior Certificate",
        description: "Earn an official certificate recognizing your dedication to environmental protection.",
        pointsRequired: 100,
        icon: "🌍",
        isActive: 1
      },
      {
        id: "reward-3",
        name: "Surprise Gift",
        description: "A special surprise awaits eco-champions who reach this milestone!",
        pointsRequired: 200,
        icon: "🎁",
        isActive: 1
      },
      {
        id: "reward-4",
        name: "Eco Superstar",
        description: "Join the elite circle of environmental superheroes making real change.",
        pointsRequired: 350,
        icon: "⭐",
        isActive: 1
      },
      {
        id: "reward-5",
        name: "Planet Protector",
        description: "The ultimate recognition for true environmental champions and leaders.",
        pointsRequired: 500,
        icon: "🏆",
        isActive: 1
      },
      {
        id: "reward-6",
        name: "Eco Legend",
        description: "Reserved for the most dedicated eco-warriors who inspire global change.",
        pointsRequired: 1000,
        icon: "🌟",
        isActive: 1
      }
    ];

    defaultRewards.forEach(reward => {
      this.rewards.set(reward.id, reward);
    });
  }

  private initializeDemoData() {
    // Add demo users for leaderboard
    const demoUsers: User[] = [
      {
        id: "demo-user-1",
        username: "Ananya",
        email: "ananya@demo.com",
        password: "demo123",
        points: 220,
        streak: 15,
        lastLoginDate: new Date(),
        createdAt: new Date()
      },
      {
        id: "demo-user-2", 
        username: "Rohit",
        email: "rohit@demo.com",
        password: "demo123",
        points: 190,
        streak: 12,
        lastLoginDate: new Date(),
        createdAt: new Date()
      },
      {
        id: "demo-user-3",
        username: "Priya", 
        email: "priya@demo.com",
        password: "demo123",
        points: 150,
        streak: 8,
        lastLoginDate: new Date(),
        createdAt: new Date()
      }
    ];

    demoUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const needle = email.toLowerCase();
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === needle);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      points: 0,
      streak: 0,
      lastLoginDate: now,
      createdAt: now,
    };
    // normalize email for uniqueness
    (user as any).email = insertUser.email.toLowerCase();
    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(userId: string, points: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, points };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStreak(userId: string, streak: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, streak, lastLoginDate: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: string, profile: { username: string; avatarUrl?: string }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser: any = { ...user, username: profile.username };
    if (profile.avatarUrl !== undefined) updatedUser.avatarUrl = profile.avatarUrl;
    this.users.set(userId, updatedUser);
    return updatedUser as User;
  }

  async getUserHabitsForDate(userId: string, date: string): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      habit => habit.userId === userId && habit.date === date
    );
  }

  async createOrUpdateHabit(habitData: InsertHabit): Promise<Habit> {
    // Check if habit already exists for this user, type, and date
    const existingHabit = Array.from(this.habits.values()).find(
      habit => 
        habit.userId === habitData.userId && 
        habit.habitType === habitData.habitType && 
        habit.date === habitData.date
    );

    if (existingHabit) {
      // Update existing habit
      const updatedHabit: Habit = {
        ...existingHabit,
        count: habitData.count || existingHabit.count || 0,
        pointsEarned: habitData.pointsEarned || existingHabit.pointsEarned || 0,
        distance: habitData.distance || existingHabit.distance,
        startLocation: habitData.startLocation || existingHabit.startLocation,
        endLocation: habitData.endLocation || existingHabit.endLocation,
        recycledItem: habitData.recycledItem || existingHabit.recycledItem,
        imageUrl: habitData.imageUrl || existingHabit.imageUrl,
        verified: habitData.verified !== undefined ? habitData.verified : (existingHabit as any).verified || 1,
        description: habitData.description || existingHabit.description,
        createdAt: existingHabit.createdAt,
      } as any;
      this.habits.set(existingHabit.id, updatedHabit);
      return updatedHabit;
    } else {
      // Create new habit
      const id = randomUUID();
      const habit: Habit = { 
        ...habitData, 
        id,
        count: habitData.count || 0,
        pointsEarned: habitData.pointsEarned || 0,
        verified: habitData.verified !== undefined ? habitData.verified : 1,
        createdAt: new Date(),
      } as any;
      this.habits.set(id, habit);
      return habit;
    }
  }

  async getTotalUserHabits(userId: string): Promise<number> {
    return Array.from(this.habits.values())
      .filter(habit => habit.userId === userId)
      .reduce((total, habit) => total + habit.count, 0);
  }

  async getDailyActivity(userId: string, days: number): Promise<{ date: string; count: number }[]> {
    // Build a map of date -> total count from habits
    const today = new Date();
    const formatter = (d: Date) => d.toISOString().split('T')[0];
    const counts = new Map<string, number>();
    for (const habit of this.habits.values()) {
      if (habit.userId !== userId) continue;
      counts.set(habit.date, (counts.get(habit.date) || 0) + habit.count);
    }
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatter(d);
      result.push({ date: key, count: counts.get(key) || 0 });
    }
    return result;
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  async getUserRank(userId: string): Promise<number> {
    const sortedUsers = Array.from(this.users.values())
      .sort((a, b) => b.points - a.points);
    
    const userIndex = sortedUsers.findIndex(user => user.id === userId);
    return userIndex === -1 ? 0 : userIndex + 1;
  }

  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter(reward => reward.isActive === 1);
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    return Array.from(this.userRewards.values()).filter(
      userReward => userReward.userId === userId
    );
  }

  async claimReward(userId: string, rewardId: string): Promise<UserReward> {
    const id = randomUUID();
    const userReward: UserReward = {
      id,
      userId,
      rewardId,
      claimedAt: new Date(),
    };
    this.userRewards.set(id, userReward);
    return userReward;
  }
}

export const storage = new MemStorage();
