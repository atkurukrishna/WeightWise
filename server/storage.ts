import {
  users,
  businessProfiles,
  customerPreferences,
  businessReviews,
  recommendations,
  activityLogs,
  type User,
  type UpsertUser,
  type BusinessProfile,
  type InsertBusinessProfile,
  type CustomerPreferences,
  type InsertCustomerPreferences,
  type BusinessReview,
  type InsertBusinessReview,
  type Recommendation,
  type InsertRecommendation,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql, like, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Business operations
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  getBusinessProfile(id: number): Promise<BusinessProfile | undefined>;
  getBusinessProfileByUserId(userId: string): Promise<BusinessProfile | undefined>;
  updateBusinessProfile(id: number, userId: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;
  searchBusinesses(query: string, category?: string): Promise<BusinessProfile[]>;
  getAllBusinesses(limit?: number): Promise<BusinessProfile[]>;
  
  // Customer preferences
  createCustomerPreferences(preferences: InsertCustomerPreferences): Promise<CustomerPreferences>;
  getCustomerPreferences(userId: string): Promise<CustomerPreferences | undefined>;
  updateCustomerPreferences(userId: string, preferences: Partial<InsertCustomerPreferences>): Promise<CustomerPreferences | undefined>;
  
  // Reviews
  createBusinessReview(review: InsertBusinessReview): Promise<BusinessReview>;
  getBusinessReviews(businessId: number): Promise<BusinessReview[]>;
  getUserReviews(userId: string): Promise<BusinessReview[]>;
  
  // Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getUserRecommendations(userId: string, limit?: number): Promise<(Recommendation & { business: BusinessProfile })[]>;
  markRecommendationAsViewed(id: number, userId: string): Promise<boolean>;
  
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

  // Business operations
  async createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    const [businessProfile] = await db
      .insert(businessProfiles)
      .values(profile)
      .returning();
    return businessProfile;
  }

  async getBusinessProfile(id: number): Promise<BusinessProfile | undefined> {
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, id));
    return profile;
  }

  async getBusinessProfileByUserId(userId: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId));
    return profile;
  }

  async updateBusinessProfile(id: number, userId: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined> {
    const [updatedProfile] = await db
      .update(businessProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(and(eq(businessProfiles.id, id), eq(businessProfiles.userId, userId)))
      .returning();
    return updatedProfile;
  }

  async searchBusinesses(query: string, category?: string): Promise<BusinessProfile[]> {
    let whereClause = and(
      eq(businessProfiles.isActive, true),
      like(businessProfiles.businessName, `%${query}%`)
    );

    if (category) {
      whereClause = and(whereClause, eq(businessProfiles.category, category));
    }

    return await db
      .select()
      .from(businessProfiles)
      .where(whereClause)
      .orderBy(businessProfiles.businessName);
  }

  async getAllBusinesses(limit: number = 50): Promise<BusinessProfile[]> {
    return await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.isActive, true))
      .orderBy(desc(businessProfiles.createdAt))
      .limit(limit);
  }

  // Customer preferences
  async createCustomerPreferences(preferences: InsertCustomerPreferences): Promise<CustomerPreferences> {
    const [customerPrefs] = await db
      .insert(customerPreferences)
      .values(preferences)
      .returning();
    return customerPrefs;
  }

  async getCustomerPreferences(userId: string): Promise<CustomerPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(customerPreferences)
      .where(eq(customerPreferences.userId, userId));
    return prefs;
  }

  async updateCustomerPreferences(userId: string, preferences: Partial<InsertCustomerPreferences>): Promise<CustomerPreferences | undefined> {
    const [updatedPrefs] = await db
      .update(customerPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(customerPreferences.userId, userId))
      .returning();
    return updatedPrefs;
  }

  // Reviews
  async createBusinessReview(review: InsertBusinessReview): Promise<BusinessReview> {
    const [businessReview] = await db
      .insert(businessReviews)
      .values(review)
      .returning();
    return businessReview;
  }

  async getBusinessReviews(businessId: number): Promise<BusinessReview[]> {
    return await db
      .select()
      .from(businessReviews)
      .where(eq(businessReviews.businessId, businessId))
      .orderBy(desc(businessReviews.createdAt));
  }

  async getUserReviews(userId: string): Promise<BusinessReview[]> {
    return await db
      .select()
      .from(businessReviews)
      .where(eq(businessReviews.customerId, userId))
      .orderBy(desc(businessReviews.createdAt));
  }

  // Recommendations
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [rec] = await db
      .insert(recommendations)
      .values(recommendation)
      .returning();
    return rec;
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<(Recommendation & { business: BusinessProfile })[]> {
    const results = await db
      .select({
        id: recommendations.id,
        userId: recommendations.userId,
        businessId: recommendations.businessId,
        recommendationType: recommendations.recommendationType,
        score: recommendations.score,
        reason: recommendations.reason,
        isViewed: recommendations.isViewed,
        createdAt: recommendations.createdAt,
        business: businessProfiles,
      })
      .from(recommendations)
      .innerJoin(businessProfiles, eq(recommendations.businessId, businessProfiles.id))
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.score), desc(recommendations.createdAt))
      .limit(limit);

    return results;
  }

  async markRecommendationAsViewed(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(recommendations)
      .set({ isViewed: true })
      .where(and(eq(recommendations.id, id), eq(recommendations.userId, userId)));
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
