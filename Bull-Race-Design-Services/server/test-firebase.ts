
import { storage } from "./storage";
import { db } from "./firebase";

async function testConnection() {
    console.log("Testing Firebase connection...");

    if (!db) {
        console.error("FAIL: Firebase DB not initialized. Check server/firebase.ts and credentials.");
        return;
    }

    try {
        console.log("Attempting to fetch categories...");
        const categories = await storage.getCategories();
        console.log("SUCCESS: Fetched categories:", categories);

        // Optional: Try write connection
        // const testCat = await storage.createCategory({
        //   type: "Test",
        //   raceDate: "2024-01-01",
        //   categoryTime: 100,
        //   categoryDistance: 100,
        //   createdBy: "test-script"
        // });
        // console.log("SUCCESS: Created test category:", testCat);

    } catch (error) {
        console.error("FAIL: Database operation failed:");
        console.error(error);
    }
}

testConnection().catch(console.error);
