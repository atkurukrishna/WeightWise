import {
  users,
  weightEntries,
  activityLogs,
  type User,
  type UpsertUser,
  type WeightEntry,
  type InsertWeightEntry,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Weight tracking operations
  createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;
  getWeightEntries(userId: string, limit?: number): Promise<WeightEntry[]>;
  getWeightEntry(id: number, userId: string): Promise<WeightEntry | undefined>;
  deleteWeightEntry(id: number, userId: string): Promise<boolean>;
  
  // Activity logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Weight tracking operations
  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const [weightEntry] = await db
      .insert(weightEntries)
      .values(entry)
      .returning();
    return weightEntry;
  }

  async getWeightEntries(userId: string, limit: number = 50): Promise<WeightEntry[]> {
    return await db
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(desc(weightEntries.recordedAt))
      .limit(limit);
  }

  async getWeightEntry(id: number, userId: string): Promise<WeightEntry | undefined> {
    const [entry] = await db
      .select()
      .from(weightEntries)
      .where(and(eq(weightEntries.id, id), eq(weightEntries.userId, userId)));
    return entry;
  }

  async deleteWeightEntry(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(weightEntries)
      .where(and(eq(weightEntries.id, id), eq(weightEntries.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Activity logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [activityLog] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return activityLog;
  }

  async getActivityLogs(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();