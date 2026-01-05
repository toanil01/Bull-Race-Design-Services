
import { storage } from "./storage";
import { db } from "./firebase";
import { type InsertCategory, type InsertBullPair } from "@shared/schema";

async function seed() {
    console.log("Seeding database...");

    if (!db) {
        console.error("FAIL: Firebase DB not initialized.");
        return;
    }

    // Check if categories already exist
    const existing = await storage.getCategories();
    if (existing.length > 0) {
        console.log(`Found ${existing.length} existing categories. Deleting...`);
        for (const cat of existing) {
            await storage.deleteCategory(cat.id);
        }
        console.log("Deleted existing categories.");
    }

    const now = new Date();
    const categories: InsertCategory[] = [
        {
            type: "Sub-Juniors",
            raceDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            categoryTime: 300,
            categoryDistance: 100,
            createdBy: "system",
        },
        {
            type: "Juniors",
            raceDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            categoryTime: 360,
            categoryDistance: 120,
            createdBy: "system",
        },
        {
            type: "Seniors",
            raceDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            categoryTime: 420,
            categoryDistance: 150,
            createdBy: "system",
        },
        {
            type: "Super Seniors",
            raceDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            categoryTime: 480,
            categoryDistance: 180,
            createdBy: "system",
        },
        {
            type: "Demo Race (Today)",
            raceDate: new Date().toISOString().split("T")[0],
            categoryTime: 300,
            categoryDistance: 100,
            createdBy: "system",
        },
    ];

    let todayCategoryId = "";

    for (const cat of categories) {
        const created = await storage.createCategory(cat);
        console.log(`Created category: ${created.type}`);
        if (cat.type === "Demo Race (Today)") {
            todayCategoryId = created.id;
        }
    }

    // Create sample participants for Today's race
    if (todayCategoryId) {
        console.log("Creating sample participants for Demo Race...");
        const participants: InsertBullPair[] = [
            {
                pairName: "Thunder & Lightning",
                ownerName1: "Test Owner 1",
                phoneNumber: "1234567890",
                categoryId: todayCategoryId,
            },
            {
                pairName: "Storm & Fury",
                ownerName1: "Test Owner 2",
                phoneNumber: "0987654321",
                categoryId: todayCategoryId,
            }
        ];

        for (const p of participants) {
            await storage.createBullPair(p);
            console.log(`Created participant: ${p.pairName}`);
        }
    }

    // Create default admin user
    try {
        const existingAdmin = await storage.getUserByUsername("admin");
        if (!existingAdmin) {
            await storage.createUser({
                username: "admin",
                password: "admin123" // In a real app, hash this!
            });
            console.log("Created default admin user: admin / admin123");
        } else {
            console.log("Admin user already exists.");
        }
    } catch (e) {
        console.error("Failed to create admin user:", e);
    }

    console.log("Seeding complete.");
}

seed().catch(console.error);
