import { type User, type InsertUser, type Habit, type InsertHabit, type Reward, type UserReward } from "@shared/schema";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

type Row = Record<string, any>;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User | undefined>;
  updateUserStreak(userId: string, streak: number): Promise<User | undefined>;
  updateUserProfile(userId: string, profile: { username: string; avatarUrl?: string }): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getUserHabitsForDate(userId: string, date: string): Promise<Habit[]>;
  createOrUpdateHabit(habit: InsertHabit): Promise<Habit>;
  getTotalUserHabits(userId: string): Promise<number>;
  getDailyActivity(userId: string, days: number): Promise<{ date: string; count: number }[]>;
  getUserHabitHistory(userId: string, limit: number): Promise<Habit[]>;

  getLeaderboard(limit?: number): Promise<User[]>;
  getUserRank(userId: string): Promise<number>;

  getAllRewards(): Promise<Reward[]>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  claimReward(userId: string, rewardId: string): Promise<UserReward>;
}

export class NeonStorage implements IStorage {
  private sql: any;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Missing DATABASE_URL environment variable. Please set it to your Neon connection string.");
    }
    this.sql = neon(databaseUrl);
  }

  // --- User Methods ---

  async getUser(id: string): Promise<User | undefined> {
    const rows = await this.sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return undefined;
    return this.mapToUser(rows[0]);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await this.sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
    if (!rows.length) return undefined;
    return this.mapToUser(rows[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existing = await this.getUserByEmail(insertUser.email);
    if (existing) {
      throw new Error("User already exists with this email");
    }

    const rows = await this.sql`
      INSERT INTO users (username, email, password, points, streak, last_login_date, created_at)
      VALUES (
        ${insertUser.username},
        ${insertUser.email.toLowerCase()},
        ${insertUser.password},
        0, 0,
        NOW(), NOW()
      )
      RETURNING *
    `;

    if (!rows.length) throw new Error("Failed to create user");
    return this.mapToUser(rows[0]);
  }

  async updateUserPoints(userId: string, points: number): Promise<User | undefined> {
    const rows = await this.sql`
      UPDATE users SET points = ${points} WHERE id = ${userId} RETURNING *
    `;
    if (!rows.length) return undefined;
    return this.mapToUser(rows[0]);
  }

  async updateUserStreak(userId: string, streak: number): Promise<User | undefined> {
    const rows = await this.sql`
      UPDATE users SET streak = ${streak}, last_login_date = NOW()
      WHERE id = ${userId} RETURNING *
    `;
    if (!rows.length) return undefined;
    return this.mapToUser(rows[0]);
  }

  async updateUserProfile(userId: string, profile: { username: string; avatarUrl?: string }): Promise<User | undefined> {
    let rows;
    if (profile.avatarUrl !== undefined) {
      rows = await this.sql`
        UPDATE users SET username = ${profile.username}, avatar_url = ${profile.avatarUrl}
        WHERE id = ${userId} RETURNING *
      `;
    } else {
      rows = await this.sql`
        UPDATE users SET username = ${profile.username}
        WHERE id = ${userId} RETURNING *
      `;
    }
    if (!rows.length) return undefined;
    return this.mapToUser(rows[0]);
  }

  async deleteUser(id: string): Promise<void> {
    await this.sql`DELETE FROM user_rewards WHERE user_id = ${id}`;
    await this.sql`DELETE FROM habits WHERE user_id = ${id}`;
    await this.sql`DELETE FROM users WHERE id = ${id}`;
  }

  // --- Habit Methods ---

  async getUserHabitsForDate(userId: string, date: string): Promise<Habit[]> {
    const rows = await this.sql`
      SELECT * FROM habits WHERE user_id = ${userId} AND date = ${date}
    `;
    return rows.map(this.mapToHabit);
  }

  async createOrUpdateHabit(habitData: InsertHabit): Promise<Habit> {
    const existing = await this.sql`
      SELECT * FROM habits
      WHERE user_id = ${habitData.userId}
        AND habit_type = ${habitData.habitType}
        AND date = ${habitData.date}
      LIMIT 1
    `;

    if (existing.length) {
      const row = existing[0];
      const rows = await this.sql`
        UPDATE habits SET
          count = ${habitData.count ?? row.count},
          points_earned = ${habitData.pointsEarned ?? row.points_earned},
          distance = ${habitData.distance ?? row.distance},
          start_location = ${habitData.startLocation ?? row.start_location},
          end_location = ${habitData.endLocation ?? row.end_location},
          recycled_item = ${habitData.recycledItem ?? row.recycled_item},
          image_url = ${habitData.imageUrl ?? row.image_url},
          verified = ${habitData.verified !== undefined ? habitData.verified : row.verified},
          description = ${habitData.description ?? row.description}
        WHERE id = ${row.id}
        RETURNING *
      `;
      if (!rows.length) throw new Error("Failed to update habit");
      return this.mapToHabit(rows[0]);
    }

    const rows = await this.sql`
      INSERT INTO habits (user_id, habit_type, count, date, points_earned, distance, start_location, end_location, recycled_item, image_url, verified, description, created_at)
      VALUES (
        ${habitData.userId},
        ${habitData.habitType},
        ${habitData.count ?? 0},
        ${habitData.date},
        ${habitData.pointsEarned ?? 0},
        ${habitData.distance ?? null},
        ${habitData.startLocation ?? null},
        ${habitData.endLocation ?? null},
        ${habitData.recycledItem ?? null},
        ${habitData.imageUrl ?? null},
        ${habitData.verified !== undefined ? habitData.verified : 1},
        ${habitData.description ?? null},
        NOW()
      )
      RETURNING *
    `;
    if (!rows.length) throw new Error("Failed to create habit");
    return this.mapToHabit(rows[0]);
  }

  async getTotalUserHabits(userId: string): Promise<number> {
    const rows = await this.sql`
      SELECT COALESCE(SUM(count), 0) as total FROM habits WHERE user_id = ${userId}
    `;
    return Number(rows[0]?.total ?? 0);
  }

  async getDailyActivity(userId: string, days: number): Promise<{ date: string; count: number }[]> {
    const rows = await this.sql`
      SELECT date, COALESCE(SUM(count), 0) as total_count
      FROM habits
      WHERE user_id = ${userId}
        AND date >= (CURRENT_DATE - ${days}::int)::text
      GROUP BY date
      ORDER BY date ASC
    `;

    const activityMap = new Map<string, number>();
    for (const row of rows) {
      activityMap.set(row.date, Number(row.total_count));
    }

    const result: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, count: activityMap.get(dateStr) ?? 0 });
    }

    return result;
  }

  async getUserHabitHistory(userId: string, limit: number): Promise<Habit[]> {
    const rows = await this.sql`
      SELECT * FROM habits
      WHERE user_id = ${userId}
      ORDER BY date DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(this.mapToHabit);
  }

  // --- Leaderboard ---

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    const rows = await this.sql`
      SELECT * FROM users ORDER BY points DESC LIMIT ${limit}
    `;
    return rows.map(this.mapToUser);
  }

  async getUserRank(userId: string): Promise<number> {
    const rows = await this.sql`
      SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY points DESC) as rank FROM users
      ) ranked WHERE id = ${userId}
    `;
    if (!rows.length) return 0;
    return Number(rows[0].rank);
  }

  // --- Rewards ---

  async getAllRewards(): Promise<Reward[]> {
    const rows = await this.sql`SELECT * FROM rewards WHERE is_active = 1`;
    return rows.map(this.mapToReward);
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    const rows = await this.sql`SELECT * FROM user_rewards WHERE user_id = ${userId}`;
    return rows.map(this.mapToUserReward);
  }

  async claimReward(userId: string, rewardId: string): Promise<UserReward> {
    const rows = await this.sql`
      INSERT INTO user_rewards (user_id, reward_id, claimed_at)
      VALUES (${userId}, ${rewardId}, NOW())
      RETURNING *
    `;
    if (!rows.length) throw new Error("Failed to claim reward");
    return this.mapToUserReward(rows[0]);
  }

  // --- Mappers ---

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

export const storage = new NeonStorage();
