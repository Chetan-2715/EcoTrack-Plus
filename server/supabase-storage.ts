import { type User, type InsertUser, type Habit, type InsertHabit, type Reward, type UserReward } from "@shared/schema";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User | undefined>;
  updateUserStreak(userId: string, streak: number): Promise<User | undefined>;
  updateUserProfile(userId: string, profile: { username: string; avatarUrl?: string }): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Habit methods
  getUserHabitsForDate(userId: string, date: string): Promise<Habit[]>;
  createOrUpdateHabit(habit: InsertHabit): Promise<Habit>;
  getTotalUserHabits(userId: string): Promise<number>;
  getDailyActivity(userId: string, days: number): Promise<{ date: string; count: number }[]>;
  getUserHabitHistory(userId: string, limit: number): Promise<Habit[]>;
  
  // Leaderboard methods
  getLeaderboard(limit?: number): Promise<User[]>;
  getUserRank(userId: string): Promise<number>;
  
  // Rewards methods
  getAllRewards(): Promise<Reward[]>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  claimReward(userId: string, rewardId: string): Promise<UserReward>;
}

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return this.mapToUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .single();

    if (error || !data) return undefined;
    return this.mapToUser(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check for existing email
    const existing = await this.getUserByEmail(insertUser.email);
    if (existing) {
      throw new Error("User already exists with this email");
    }

    const { data, error } = await this.supabase
      .from("users")
      .insert({
        username: insertUser.username,
        email: insertUser.email.toLowerCase(),
        password: insertUser.password,
        points: 0,
        streak: 0,
        last_login_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Failed to create user");
    }

    return this.mapToUser(data);
  }

  async updateUserPoints(userId: string, points: number): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .update({ points })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) return undefined;
    return this.mapToUser(data);
  }

  async updateUserStreak(userId: string, streak: number): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .update({ 
        streak,
        last_login_date: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) return undefined;
    return this.mapToUser(data);
  }

  async updateUserProfile(userId: string, profile: { username: string; avatarUrl?: string }): Promise<User | undefined> {
    const updateData: any = { username: profile.username };
    
    if (profile.avatarUrl !== undefined) {
      updateData.avatar_url = profile.avatarUrl;
    }

    const { data, error } = await this.supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) return undefined;
    return this.mapToUser(data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.supabase.from("users").delete().eq("id", id);
  }

  async getUserHabitsForDate(userId: string, date: string): Promise<Habit[]> {
    const { data, error } = await this.supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date);

    if (error || !data) return [];
    return data.map(this.mapToHabit);
  }

  async createOrUpdateHabit(habitData: InsertHabit): Promise<Habit> {
    // Check if habit exists
    const { data: existing } = await this.supabase
      .from("habits")
      .select("*")
      .eq("user_id", habitData.userId)
      .eq("habit_type", habitData.habitType)
      .eq("date", habitData.date)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await this.supabase
        .from("habits")
        .update({
          count: habitData.count || existing.count,
          points_earned: habitData.pointsEarned || existing.points_earned,
          distance: habitData.distance || existing.distance,
          start_location: habitData.startLocation || existing.start_location,
          end_location: habitData.endLocation || existing.end_location,
          recycled_item: habitData.recycledItem || existing.recycled_item,
          image_url: habitData.imageUrl || existing.image_url,
          verified: habitData.verified !== undefined ? habitData.verified : existing.verified,
          description: habitData.description || existing.description,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error || !data) throw new Error("Failed to update habit");
      return this.mapToHabit(data);
    } else {
      // Create new
      const { data, error } = await this.supabase
        .from("habits")
        .insert({
          user_id: habitData.userId,
          habit_type: habitData.habitType,
          count: habitData.count || 0,
          date: habitData.date,
          points_earned: habitData.pointsEarned || 0,
          distance: habitData.distance,
          start_location: habitData.startLocation,
          end_location: habitData.endLocation,
          recycled_item: habitData.recycledItem,
          image_url: habitData.imageUrl,
          verified: habitData.verified !== undefined ? habitData.verified : 1,
          description: habitData.description,
        })
        .select()
        .single();

      if (error || !data) throw new Error("Failed to create habit");
      return this.mapToHabit(data);
    }
  }

  async getTotalUserHabits(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("habits")
      .select("count")
      .eq("user_id", userId);

    if (error || !data) return 0;
    return data.reduce((sum, habit) => sum + habit.count, 0);
  }

  async getDailyActivity(userId: string, days: number): Promise<{ date: string; count: number }[]> {
    const today = new Date();
    const result: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const { data } = await this.supabase
        .from("habits")
        .select("count")
        .eq("user_id", userId)
        .eq("date", dateStr);

      const totalCount = data ? data.reduce((sum, h) => sum + h.count, 0) : 0;
      result.push({ date: dateStr, count: totalCount });
    }

    return result;
  }

  async getUserHabitHistory(userId: string, limit: number): Promise<Habit[]> {
    const { data, error } = await this.supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      habitType: row.habit_type,
      count: row.count,
      date: row.date,
      pointsEarned: row.points_earned,
      verified: row.verified,
      createdAt: row.created_at,
      distance: row.distance,
      startLocation: row.start_location,
      endLocation: row.end_location,
      recycledItem: row.recycled_item,
      imageUrl: row.image_url,
      description: row.description,
    }));
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .order("points", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapToUser);
  }

  async getUserRank(userId: string): Promise<number> {
    const { data: allUsers } = await this.supabase
      .from("users")
      .select("id, points")
      .order("points", { ascending: false });

    if (!allUsers) return 0;
    
    const index = allUsers.findIndex(u => u.id === userId);
    return index === -1 ? 0 : index + 1;
  }

  async getAllRewards(): Promise<Reward[]> {
    const { data, error } = await this.supabase
      .from("rewards")
      .select("*")
      .eq("is_active", 1);

    if (error || !data) return [];
    return data.map(this.mapToReward);
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    const { data, error } = await this.supabase
      .from("user_rewards")
      .select("*")
      .eq("user_id", userId);

    if (error || !data) return [];
    return data.map(this.mapToUserReward);
  }

  async claimReward(userId: string, rewardId: string): Promise<UserReward> {
    const { data, error } = await this.supabase
      .from("user_rewards")
      .insert({
        user_id: userId,
        reward_id: rewardId,
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) throw new Error("Failed to claim reward");
    return this.mapToUserReward(data);
  }

  // Helper mapping functions
  private mapToUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      password: data.password,
      points: data.points,
      streak: data.streak,
      lastLoginDate: data.last_login_date ? new Date(data.last_login_date) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      avatarUrl: data.avatar_url,
    } as User;
  }

  private mapToHabit(data: any): Habit {
    return {
      id: data.id,
      userId: data.user_id,
      habitType: data.habit_type,
      count: data.count,
      date: data.date,
      pointsEarned: data.points_earned,
      distance: data.distance,
      startLocation: data.start_location,
      endLocation: data.end_location,
      recycledItem: data.recycled_item,
      imageUrl: data.image_url,
      verified: data.verified,
      description: data.description,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
    } as Habit;
  }

  private mapToReward(data: any): Reward {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      pointsRequired: data.points_required,
      icon: data.icon,
      isActive: data.is_active,
    } as Reward;
  }

  private mapToUserReward(data: any): UserReward {
    return {
      id: data.id,
      userId: data.user_id,
      rewardId: data.reward_id,
      claimedAt: data.claimed_at ? new Date(data.claimed_at) : undefined,
    } as UserReward;
  }
}

export const storage = new SupabaseStorage();
