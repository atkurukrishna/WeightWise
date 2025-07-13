import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  businessProfileInsertSchema, 
  customerPreferencesInsertSchema,
  businessReviewInsertSchema,
  activityLogInsertSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Mock OCR function - simulates reading weight from image
function mockOCRProcessing(): number {
  // Generate a realistic weight reading between 100-250 lbs
  return parseFloat((Math.random() * 150 + 100).toFixed(1));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Business profile routes
  app.post("/api/business-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = businessProfileInsertSchema.parse({
        ...req.body,
        userId,
      });

      const businessProfile = await storage.createBusinessProfile(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "create_business_profile",
        description: `Business profile created: ${businessProfile.businessName}`,
        metadata: { businessId: businessProfile.id, category: businessProfile.category },
      });

      res.json(businessProfile);
    } catch (error) {
      console.error("Error creating business profile:", error);
      res.status(400).json({ message: "Invalid business profile data" });
    }
  });

  app.get("/api/business-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getBusinessProfileByUserId(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  app.put("/api/business-profile/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileId = parseInt(req.params.id);
      const validatedData = businessProfileInsertSchema.partial().parse(req.body);

      const updatedProfile = await storage.updateBusinessProfile(profileId, userId, validatedData);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: "Business profile not found" });
      }

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating business profile:", error);
      res.status(500).json({ message: "Failed to update business profile" });
    }
  });

  // Business search and discovery
  app.get("/api/businesses", async (req: any, res) => {
    try {
      const { search, category, limit } = req.query;
      let businesses;

      if (search) {
        businesses = await storage.searchBusinesses(search as string, category as string);
      } else {
        businesses = await storage.getAllBusinesses(parseInt(limit as string) || 50);
      }

      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/:id", async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const business = await storage.getBusinessProfile(businessId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  // Customer preferences
  app.post("/api/customer-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = customerPreferencesInsertSchema.parse({
        ...req.body,
        userId,
      });

      const preferences = await storage.createCustomerPreferences(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "update_preferences",
        description: "Customer preferences updated",
        metadata: { categories: preferences.preferredCategories, budgetRange: preferences.budgetRange },
      });

      res.json(preferences);
    } catch (error) {
      console.error("Error creating customer preferences:", error);
      res.status(400).json({ message: "Invalid customer preferences data" });
    }
  });

  app.get("/api/customer-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getCustomerPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching customer preferences:", error);
      res.status(500).json({ message: "Failed to fetch customer preferences" });
    }
  });

  app.put("/api/customer-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = customerPreferencesInsertSchema.partial().parse(req.body);

      const updatedPreferences = await storage.updateCustomerPreferences(userId, validatedData);
      
      if (!updatedPreferences) {
        return res.status(404).json({ message: "Customer preferences not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "update_preferences",
        description: "Customer preferences updated",
        metadata: { categories: updatedPreferences.preferredCategories, budgetRange: updatedPreferences.budgetRange },
      });

      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating customer preferences:", error);
      res.status(500).json({ message: "Failed to update customer preferences" });
    }
  });

  // Business reviews
  app.post("/api/businesses/:id/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businessId = parseInt(req.params.id);
      const validatedData = businessReviewInsertSchema.parse({
        ...req.body,
        businessId,
        customerId: userId,
      });

      const review = await storage.createBusinessReview(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "add_review",
        description: `Review added for business ID ${businessId}`,
        metadata: { businessId, rating: review.rating },
      });

      res.json(review);
    } catch (error) {
      console.error("Error creating business review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.get("/api/businesses/:id/reviews", async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const reviews = await storage.getBusinessReviews(businessId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching business reviews:", error);
      res.status(500).json({ message: "Failed to fetch business reviews" });
    }
  });

  app.get("/api/my-reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  // Personalized recommendations
  app.get("/api/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await storage.getUserRecommendations(userId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/:id/viewed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendationId = parseInt(req.params.id);
      const updated = await storage.markRecommendationAsViewed(recommendationId, userId);
      
      if (!updated) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking recommendation as viewed:", error);
      res.status(500).json({ message: "Failed to update recommendation" });
    }
  });

  // Activity logs
  app.get("/api/activity-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = await storage.getActivityLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
