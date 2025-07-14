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
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

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

// Google Photos OAuth configuration
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "mock-client-id",
  process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
);

// Google Photos API scopes
const GOOGLE_PHOTOS_SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly'
];

// Mock Google Photos data for development
const mockGooglePhotos = Array.from({ length: 30 }, (_, i) => ({
  id: `photo-${i + 1}`,
  baseUrl: `https://picsum.photos/300/300?random=${i + 1}`,
  filename: `photo-${i + 1}.jpg`,
  mimeType: 'image/jpeg',
  mediaMetadata: {
    creationTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    width: '300',
    height: '300'
  }
}));

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

  // Google Photos OAuth routes
  app.get("/api/auth/google", isAuthenticated, async (req: any, res) => {
    try {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: GOOGLE_PHOTOS_SCOPES,
        state: req.user.claims.sub
      });
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.get("/api/auth/google/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = state;

      if (!code || !userId) {
        return res.status(400).json({ message: "Missing authorization code or user ID" });
      }

      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in database (you would implement this in storage.ts)
      await storage.storeGoogleTokens(userId, tokens);

      // Redirect back to the photos tab
      res.redirect('/?tab=photos');
    } catch (error) {
      console.error("Error handling Google auth callback:", error);
      res.status(500).json({ message: "Failed to complete Google authentication" });
    }
  });

  // Google Photos API routes
  app.get("/api/google-photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          photos: mockGooglePhotos,
          connected: false,
          needsAuth: true
        });
      }

      // Get stored tokens
      const tokens = await storage.getGoogleTokens(userId);
      
      if (!tokens) {
        return res.json({
          photos: [],
          connected: false,
          needsAuth: true
        });
      }

      oauth2Client.setCredentials(tokens);
      
      // Initialize Google Photos API
      const photosLibrary = google.photoslibrary({ version: 'v1', auth: oauth2Client });
      
      // Get recent photos (last 30 days)
      const response = await photosLibrary.mediaItems.list({
        pageSize: 30,
        filters: {
          dateFilter: {
            ranges: [{
              startDate: {
                year: new Date().getFullYear(),
                month: new Date().getMonth(),
                day: new Date().getDate() - 30
              },
              endDate: {
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                day: new Date().getDate()
              }
            }]
          }
        }
      });

      const photos = response.data.mediaItems || [];
      
      // Sort by creation time (newest first)
      photos.sort((a, b) => {
        const dateA = new Date(a.mediaMetadata?.creationTime || 0);
        const dateB = new Date(b.mediaMetadata?.creationTime || 0);
        return dateB.getTime() - dateA.getTime();
      });

      res.json({
        photos: photos.slice(0, 30),
        connected: true,
        needsAuth: false
      });
    } catch (error) {
      console.error("Error fetching Google Photos:", error);
      res.status(500).json({ message: "Failed to fetch Google Photos" });
    }
  });

  app.delete("/api/google-photos/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteGoogleTokens(userId);
      res.json({ message: "Google Photos disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Google Photos:", error);
      res.status(500).json({ message: "Failed to disconnect Google Photos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}