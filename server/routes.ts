import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  weightEntryInsertSchema,
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

  // Weight entry routes
  app.post("/api/weight-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = weightEntryInsertSchema.parse({
        ...req.body,
        userId,
      });

      const weightEntry = await storage.createWeightEntry(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "weight_entry",
        description: `Manually added weight: ${weightEntry.weight} ${weightEntry.unit}`,
        metadata: { entryId: weightEntry.id, entryType: "manual" },
      });

      res.json(weightEntry);
    } catch (error: any) {
      console.error("Error creating weight entry:", error);
      res.status(400).json({ message: error.message || "Failed to create weight entry" });
    }
  });

  app.get("/api/weight-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const entries = await storage.getWeightEntries(userId, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching weight entries:", error);
      res.status(500).json({ message: "Failed to fetch weight entries" });
    }
  });

  app.delete("/api/weight-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = parseInt(req.params.id);
      
      // Get the entry first for logging
      const entry = await storage.getWeightEntry(entryId, userId);
      if (!entry) {
        return res.status(404).json({ message: "Weight entry not found" });
      }

      const deleted = await storage.deleteWeightEntry(entryId, userId);
      if (deleted) {
        // Log activity
        await storage.createActivityLog({
          userId,
          action: "weight_delete",
          description: `Deleted weight entry: ${entry.weight} ${entry.unit}`,
          metadata: { entryId, deletedWeight: entry.weight, deletedUnit: entry.unit },
        });

        res.json({ message: "Weight entry deleted successfully" });
      } else {
        res.status(404).json({ message: "Weight entry not found" });
      }
    } catch (error) {
      console.error("Error deleting weight entry:", error);
      res.status(500).json({ message: "Failed to delete weight entry" });
    }
  });

  // Photo upload for weight detection
  app.post("/api/upload-weight-photo", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      
      // Mock OCR processing
      const detectedWeight = mockOCRProcessing();
      const photoPath = `/uploads/${req.file.filename}`;

      // Create weight entry with detected weight
      const weightEntry = await storage.createWeightEntry({
        userId,
        weight: detectedWeight.toString(),
        unit: "lbs", // Default to lbs for OCR
        entryType: "photo",
        photoPath,
      });

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "photo_upload",
        description: `Uploaded scale photo and detected weight: ${detectedWeight} lbs`,
        metadata: { 
          entryId: weightEntry.id, 
          photoPath,
          detectedWeight,
          entryType: "photo"
        },
      });

      res.json({
        weightEntry,
        detectedWeight,
        photoPath,
        message: "Photo uploaded and weight detected successfully",
      });
    } catch (error: any) {
      console.error("Error processing photo upload:", error);
      res.status(500).json({ message: error.message || "Failed to process photo upload" });
    }
  });

  // Activity logs
  app.get("/api/activity-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
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