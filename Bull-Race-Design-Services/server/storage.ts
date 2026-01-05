import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type BullPair,
  type InsertBullPair,
  type Race,
  type InsertRace,
  type RaceEntry,
  type InsertRaceEntry,
  type Lap,
  type InsertLap,
  type Photo,
  type InsertPhoto,
  type LeaderboardEntry,
  type RegistrationStatus,
  type RaceWithDetails,
  type RaceEntryWithDetails,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Bull Pairs (Registrations)
  getBullPairs(): Promise<BullPair[]>;
  getBullPairsByCategory(categoryId: string): Promise<BullPair[]>;
  getBullPair(id: string): Promise<BullPair | undefined>;
  createBullPair(bullPair: InsertBullPair): Promise<BullPair>;
  updateBullPairStatus(id: string, status: RegistrationStatus): Promise<BullPair | undefined>;
  updateBullPairRaceOrder(id: string, raceOrder: number): Promise<BullPair | undefined>;

  // Races
  getRaces(): Promise<Race[]>;
  getRace(id: string): Promise<Race | undefined>;
  getRaceByCategory(categoryId: string): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  updateRaceStatus(id: string, status: string): Promise<Race | undefined>;
  lockRaceOrder(id: string): Promise<Race | undefined>;

  // Race Entries
  getRaceEntries(raceId: string): Promise<RaceEntry[]>;
  createRaceEntry(entry: InsertRaceEntry): Promise<RaceEntry>;
  updateRaceEntryStatus(id: string, status: string, startTime?: string, endTime?: string, totalTimeMs?: number): Promise<RaceEntry | undefined>;

  // Laps
  getLaps(raceEntryId: string): Promise<Lap[]>;
  createLap(lap: InsertLap): Promise<Lap>;

  // Leaderboard
  getLeaderboard(categoryId?: string): Promise<LeaderboardEntry[]>;
  getHistoricalResults(year: string, categoryId?: string): Promise<LeaderboardEntry[]>;

  // Race with Details (for state persistence)
  getRaceWithDetails(id: string): Promise<RaceWithDetails | undefined>;

  // Photos
  getPhotos(): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
}

import { db } from "./firebase";
import { firestore } from "firebase-admin";

export class FirebaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    const doc = await db.collection("users").doc(id).get();
    return doc.exists ? ({ ...doc.data(), id: doc.id } as User) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const snapshot = await db.collection("users").where("username", "==", username).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { ...doc.data(), id: doc.id } as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    await db.collection("users").doc(id).set(user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!db) return [];
    const snapshot = await db.collection("categories").get();
    const categories: Category[] = [];
    snapshot.forEach((doc) => categories.push({ ...doc.data(), id: doc.id } as Category));
    return categories.sort((a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    if (!db) return undefined;
    const doc = await db.collection("categories").doc(id).get();
    return doc.exists ? ({ ...doc.data(), id: doc.id } as Category) : undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      id,
      raceEndDate: insertCategory.raceEndDate || null,
      createdBy: insertCategory.createdBy || null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      modifiedBy: null,
    };
    await db.collection("categories").doc(id).set(category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    if (!db) return undefined;
    const docRef = db.collection("categories").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const current = doc.data() as Category;
    const updated: Category = {
      ...current,
      ...updates,
      modifiedAt: new Date().toISOString(),
    };
    await docRef.set(updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!db) return false;
    await db.collection("categories").doc(id).delete();
    return true;
  }

  // Bull Pairs
  async getBullPairs(): Promise<BullPair[]> {
    if (!db) return [];
    const snapshot = await db.collection("bull_pairs").get();
    const bullPairs: BullPair[] = [];
    snapshot.forEach((doc) => bullPairs.push({ ...doc.data(), id: doc.id } as BullPair));
    return bullPairs.sort((a, b) => (a.registrationOrder || 0) - (b.registrationOrder || 0));
  }

  async getBullPairsByCategory(categoryId: string): Promise<BullPair[]> {
    if (!db) return [];
    const snapshot = await db.collection("bull_pairs").where("categoryId", "==", categoryId).get();
    const bullPairs: BullPair[] = [];
    snapshot.forEach((doc) => bullPairs.push({ ...doc.data(), id: doc.id } as BullPair));
    return bullPairs.sort((a, b) => (a.registrationOrder || 0) - (b.registrationOrder || 0));
  }

  async getBullPair(id: string): Promise<BullPair | undefined> {
    if (!db) return undefined;
    const doc = await db.collection("bull_pairs").doc(id).get();
    return doc.exists ? ({ ...doc.data(), id: doc.id } as BullPair) : undefined;
  }

  async createBullPair(insertBullPair: InsertBullPair): Promise<BullPair> {
    if (!db) throw new Error("Database not initialized");

    // Get next registration order using a transaction or simpler counter
    // For simplicity with Firestore, we'll confirm logic. 
    // Ideally we use a distributed counter, but for now we'll query for max
    // Get next registration order for THIS category
    // Using in-memory calculation to avoid Firestore composite index requirement for where() + orderBy()
    const snapshot = await db.collection("bull_pairs").where("categoryId", "==", insertBullPair.categoryId).get();
    let maxOrder = 0;

    snapshot.forEach(doc => {
      const data = doc.data() as BullPair;
      if (data.registrationOrder && data.registrationOrder > maxOrder) {
        maxOrder = data.registrationOrder;
      }
    });

    const nextOrder = maxOrder + 1;

    const id = randomUUID();
    const bullPair: BullPair = {
      ...insertBullPair,
      id,
      ownerName2: insertBullPair.ownerName2 || null,
      email: insertBullPair.email || null,
      status: "pending",
      registrationOrder: nextOrder,
      raceOrder: null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      modifiedBy: null,
    };
    await db.collection("bull_pairs").doc(id).set(bullPair);
    return bullPair;
  }

  async updateBullPairStatus(id: string, status: RegistrationStatus): Promise<BullPair | undefined> {
    if (!db) return undefined;
    const docRef = db.collection("bull_pairs").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const current = doc.data() as BullPair;
    const updated: BullPair = {
      ...current,
      status,
      modifiedAt: new Date().toISOString(),
    };
    await docRef.set(updated);
    return updated;
  }

  async updateBullPairRaceOrder(id: string, raceOrder: number): Promise<BullPair | undefined> {
    if (!db) return undefined;
    const docRef = db.collection("bull_pairs").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const current = doc.data() as BullPair;
    const updated: BullPair = {
      ...current,
      raceOrder,
      modifiedAt: new Date().toISOString(),
    };
    await docRef.set(updated);
    return updated;
  }

  // Races
  async getRaces(): Promise<Race[]> {
    if (!db) return [];
    const snapshot = await db.collection("races").get();
    const races: Race[] = [];
    snapshot.forEach((doc) => races.push({ ...doc.data(), id: doc.id } as Race));
    return races;
  }

  async getRace(id: string): Promise<Race | undefined> {
    if (!db) return undefined;
    const doc = await db.collection("races").doc(id).get();
    return doc.exists ? ({ ...doc.data(), id: doc.id } as Race) : undefined;
  }

  async getRaceByCategory(categoryId: string): Promise<Race | undefined> {
    if (!db) return undefined;
    const snapshot = await db.collection("races").where("categoryId", "==", categoryId).limit(1).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { ...doc.data(), id: doc.id } as Race;
  }

  async createRace(insertRace: InsertRace): Promise<Race> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const race: Race = {
      ...insertRace,
      id,
      status: "upcoming",
      isOrderLocked: false,
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    await db.collection("races").doc(id).set(race);
    return race;
  }

  async updateRaceStatus(id: string, status: string): Promise<Race | undefined> {
    if (!db) return undefined;
    const docRef = db.collection("races").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const current = doc.data() as Race;
    const updated: Race = {
      ...current,
      status,
      startedAt: status === "in_progress" ? new Date().toISOString() : current.startedAt,
      completedAt: status === "completed" ? new Date().toISOString() : current.completedAt,
    };
    await docRef.set(updated);
    return updated;
  }

  async lockRaceOrder(id: string): Promise<Race | undefined> {
    if (!db) return undefined;
    const docRef = db.collection("races").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const current = doc.data() as Race;
    const updated: Race = {
      ...current,
      isOrderLocked: true,
      status: "in_progress",
      startedAt: new Date().toISOString(),
    };
    await docRef.set(updated);
    return updated;
  }

  // Race Entries
  async getRaceEntries(raceId: string): Promise<RaceEntry[]> {
    if (!db) return [];
    const snapshot = await db.collection("race_entries").where("raceId", "==", raceId).get();
    const entries: RaceEntry[] = [];
    snapshot.forEach((doc) => entries.push({ ...doc.data(), id: doc.id } as RaceEntry));
    return entries.sort((a, b) => a.raceOrder - b.raceOrder);
  }

  async createRaceEntry(insertEntry: InsertRaceEntry): Promise<RaceEntry> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const entry: RaceEntry = {
      ...insertEntry,
      id,
      status: "waiting",
      startTime: null,
      endTime: null,
      totalTimeMs: null,
    };
    await db.collection("race_entries").doc(id).set(entry);
    return entry;
  }

  async updateRaceEntryStatus(
    id: string,
    status: string,
    startTime?: string,
    endTime?: string,
    totalTimeMs?: number
  ): Promise<RaceEntry | undefined> {
    if (!db) return undefined;
    const docRef = db.collection("race_entries").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const current = doc.data() as RaceEntry;
    const updated: RaceEntry = {
      ...current,
      status,
      startTime: startTime || current.startTime,
      endTime: endTime || current.endTime,
      totalTimeMs: totalTimeMs !== undefined ? totalTimeMs : current.totalTimeMs,
    };
    await docRef.set(updated);
    return updated;
  }

  // Laps
  async getLaps(raceEntryId: string): Promise<Lap[]> {
    if (!db) return [];
    const snapshot = await db.collection("laps").where("raceEntryId", "==", raceEntryId).get();
    const laps: Lap[] = [];
    snapshot.forEach((doc) => laps.push({ ...doc.data(), id: doc.id } as Lap));
    return laps.sort((a, b) => a.lapNumber - b.lapNumber);
  }

  async createLap(insertLap: InsertLap): Promise<Lap> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const lap: Lap = {
      ...insertLap,
      id,
      overrideMeters: insertLap.overrideMeters ?? null,
      overrideFeet: insertLap.overrideFeet ?? null,
      overrideInches: insertLap.overrideInches ?? null,
      createdAt: new Date().toISOString(),
    };
    await db.collection("laps").doc(id).set(lap);
    return lap;
  }

  // Leaderboard
  async getLeaderboard(categoryId?: string): Promise<LeaderboardEntry[]> {
    if (!db) return [];
    const entries: LeaderboardEntry[] = [];

    // Get all race entries
    // Note: In a real app we might want to optimize this query
    const entriesSnaps = await db.collection("race_entries").get();

    for (const doc of entriesSnaps.docs) {
      const entry = { ...doc.data(), id: doc.id } as RaceEntry;

      const bullPair = await this.getBullPair(entry.bullPairId);
      if (!bullPair) continue;

      // Filter by category if specified
      if (categoryId && categoryId !== "all" && bullPair.categoryId !== categoryId) continue;

      const laps = await this.getLaps(entry.id);
      // Use the distance from the last lap (or max distance) instead of summing cumulative distances
      // Assuming laps are ordered by lapNumber, the last lap has the total distance.
      const totalDistance = laps.length > 0
        ? laps.reduce((sum, lap) => {
          const lapDist = (lap.overrideMeters || 0) +
            ((lap.overrideFeet || 0) * 0.3048) +
            ((lap.overrideInches || 0) * 0.0254) || lap.distanceCovered;
          return sum + lapDist;
        }, 0)
        : 0;

      entries.push({
        rank: 0,
        bullPairId: entry.bullPairId,
        pairName: bullPair.pairName,
        ownerName1: bullPair.ownerName1,
        ownerName2: bullPair.ownerName2 || undefined,
        totalTimeMs: entry.totalTimeMs || laps.reduce((sum, l) => sum + l.lapTimeMs, 0),
        laps,
        isRacing: entry.status === "racing",
        totalDistance,
      });
    }

    entries.sort((a, b) => {
      // Sort by distance (descending) first
      // A pair with more distance (more laps) should ALWAYS be ranked higher
      if (Math.abs(b.totalDistance - a.totalDistance) > 0.01) {
        return b.totalDistance - a.totalDistance;
      }

      // If distances are equal, sort by time (ascending)
      // Faster time is better
      return a.totalTimeMs - b.totalTimeMs;
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  async getHistoricalResults(year: string, categoryId?: string): Promise<LeaderboardEntry[]> {
    if (!db) return [];

    // Get completed races first
    const racesRef = db.collection("races");
    const completedRacesSnap = await racesRef.where("status", "==", "completed").get();

    const completedRaces: Race[] = [];
    completedRacesSnap.forEach(doc => {
      const race = { ...doc.data(), id: doc.id } as Race;
      if (race.completedAt && new Date(race.completedAt).getFullYear() === parseInt(year)) {
        completedRaces.push(race);
      }
    });

    if (completedRaces.length === 0) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];

    for (const race of completedRaces) {
      if (categoryId && categoryId !== "all" && race.categoryId !== categoryId) continue;

      const raceEntries = await this.getRaceEntries(race.id);

      for (const entry of raceEntries) {
        const bullPair = await this.getBullPair(entry.bullPairId);
        if (!bullPair) continue;

        const laps = await this.getLaps(entry.id);
        const totalDistance = laps.reduce((sum, lap) => sum + lap.distanceCovered, 0);

        entries.push({
          rank: 0,
          bullPairId: entry.bullPairId,
          pairName: bullPair.pairName,
          ownerName1: bullPair.ownerName1,
          ownerName2: bullPair.ownerName2 || undefined,
          totalTimeMs: entry.totalTimeMs || 0,
          laps,
          isRacing: false,
          totalDistance,
        });
      }
    }

    entries.sort((a, b) => {
      if (b.laps.length !== a.laps.length) {
        return b.laps.length - a.laps.length;
      }
      return a.totalTimeMs - b.totalTimeMs;
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  async getRaceWithDetails(id: string): Promise<RaceWithDetails | undefined> {
    if (!db) return undefined;

    const race = await this.getRace(id);
    if (!race) return undefined;

    const category = await this.getCategory(race.categoryId);
    if (!category) return undefined;

    const entries = await this.getRaceEntries(race.id);
    const entriesWithDetails: RaceEntryWithDetails[] = [];

    for (const entry of entries) {
      const bullPair = await this.getBullPair(entry.bullPairId);
      if (!bullPair) continue;

      const laps = await this.getLaps(entry.id);
      entriesWithDetails.push({ ...entry, bullPair, laps });
    }

    // Sort entries by raceOrder
    entriesWithDetails.sort((a, b) => a.raceOrder - b.raceOrder);

    return { ...race, category, entries: entriesWithDetails };
  }

  // Photos
  async getPhotos(): Promise<Photo[]> {
    if (!db) return [];
    const snapshot = await db.collection("photos").get();
    const photos: Photo[] = [];
    snapshot.forEach((doc) => photos.push({ ...doc.data(), id: doc.id } as Photo));
    return photos;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    if (!db) throw new Error("Database not initialized");
    const id = randomUUID();
    const photo: Photo = {
      ...insertPhoto,
      id,
      caption: insertPhoto.caption || null,
      category: insertPhoto.category || null,
      createdAt: new Date().toISOString(),
    };
    await db.collection("photos").doc(id).set(photo);
    return photo;
  }
}

export const storage = new FirebaseStorage();
