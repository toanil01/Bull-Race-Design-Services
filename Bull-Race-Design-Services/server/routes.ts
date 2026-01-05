import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertBullPairSchema, insertLapSchema, registrationStatuses } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== CATEGORIES ====================

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get single category
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Create category
  app.post("/api/categories", async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid category data", errors: parsed.error.errors });
      }
      const category = await storage.createCategory(parsed.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update category
  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ==================== BULL PAIRS (REGISTRATIONS) ====================

  // Get all bull pairs
  app.get("/api/bull-pairs", async (req, res) => {
    try {
      const { categoryId } = req.query;
      let bullPairs;
      if (categoryId && typeof categoryId === "string") {
        bullPairs = await storage.getBullPairsByCategory(categoryId);
      } else {
        bullPairs = await storage.getBullPairs();
      }
      res.json(bullPairs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bull pairs" });
    }
  });

  // Get single bull pair
  app.get("/api/bull-pairs/:id", async (req, res) => {
    try {
      const bullPair = await storage.getBullPair(req.params.id);
      if (!bullPair) {
        return res.status(404).json({ message: "Bull pair not found" });
      }
      res.json(bullPair);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bull pair" });
    }
  });

  // Create bull pair (registration)
  app.post("/api/bull-pairs", async (req, res) => {
    try {
      const parsed = insertBullPairSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid registration data", errors: parsed.error.errors });
      }

      // Verify category exists
      const category = await storage.getCategory(parsed.data.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }

      const bullPair = await storage.createBullPair(parsed.data);
      res.status(201).json(bullPair);
    } catch (error) {
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  // Update bull pair status (approve/reject)
  app.patch("/api/bull-pairs/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !registrationStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const bullPair = await storage.updateBullPairStatus(req.params.id, status);
      if (!bullPair) {
        return res.status(404).json({ message: "Bull pair not found" });
      }
      res.json(bullPair);
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // ==================== RACES ====================

  // Get all races
  app.get("/api/races", async (req, res) => {
    try {
      const races = await storage.getRaces();
      res.json(races);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch races" });
    }
  });

  // Get single race
  app.get("/api/races/:id", async (req, res) => {
    try {
      const race = await storage.getRace(req.params.id);
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      res.json(race);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch race" });
    }
  });

  // Create race with ordered pairs
  app.post("/api/races", async (req, res) => {
    try {
      const { categoryId, orderedPairIds } = req.body;

      if (!categoryId || !Array.isArray(orderedPairIds)) {
        return res.status(400).json({ message: "Invalid race data" });
      }

      // Create race
      const race = await storage.createRace({ categoryId });

      // Create race entries in order
      for (let i = 0; i < orderedPairIds.length; i++) {
        await storage.createRaceEntry({
          raceId: race.id,
          bullPairId: orderedPairIds[i],
          raceOrder: i + 1,
        });
        await storage.updateBullPairRaceOrder(orderedPairIds[i], i + 1);
      }

      // Lock the race order and start
      await storage.lockRaceOrder(race.id);

      res.status(201).json(race);
    } catch (error) {
      res.status(500).json({ message: "Failed to create race" });
    }
  });

  // Update race status
  app.patch("/api/races/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const race = await storage.updateRaceStatus(req.params.id, status);
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      res.json(race);
    } catch (error) {
      res.status(500).json({ message: "Failed to update race status" });
    }
  });

  // Get race entries
  app.get("/api/races/:id/entries", async (req, res) => {
    try {
      const entries = await storage.getRaceEntries(req.params.id);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching race entries:", error);
      res.status(500).json({ message: "Failed to fetch race entries" });
    }
  });

  // Get race details (full state)
  app.get("/api/races/:id/details", async (req, res) => {
    try {
      const race = await storage.getRaceWithDetails(req.params.id);
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      res.json(race);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch race details" });
    }
  });

  // Update race entry status
  app.patch("/api/race-entries/:id", async (req, res) => {
    try {
      const { status, startTime, endTime, totalTimeMs } = req.body;
      const entry = await storage.updateRaceEntryStatus(
        req.params.id,
        status,
        startTime,
        endTime,
        totalTimeMs
      );
      if (!entry) {
        return res.status(404).json({ message: "Race entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update race entry" });
    }
  });

  // ==================== LAPS ====================

  // Get laps for a race entry
  app.get("/api/race-entries/:id/laps", async (req, res) => {
    try {
      const laps = await storage.getLaps(req.params.id);
      res.json(laps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch laps" });
    }
  });

  // Create lap
  app.post("/api/laps", async (req, res) => {
    try {
      const parsed = insertLapSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid lap data", errors: parsed.error.errors });
      }
      const lap = await storage.createLap(parsed.data);
      res.status(201).json(lap);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lap" });
    }
  });

  // ==================== LEADERBOARD ====================

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const leaderboard = await storage.getLeaderboard(
        categoryId && typeof categoryId === "string" ? categoryId : undefined
      );
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get historical results
  app.get("/api/history", async (req, res) => {
    try {
      const { year, categoryId } = req.query;
      const currentYear = new Date().getFullYear().toString();
      const results = await storage.getHistoricalResults(
        typeof year === "string" ? year : currentYear,
        categoryId && typeof categoryId === "string" ? categoryId : undefined
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch historical results" });
    }
  });

  // ==================== PHOTOS ====================

  // Get all photos
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Create photo
  app.post("/api/photos", async (req, res) => {
    try {
      const photo = await storage.createPhoto(req.body);
      res.status(201).json(photo);
    } catch (error) {
      res.status(500).json({ message: "Failed to create photo" });
    }
  });

  return httpServer;
}
