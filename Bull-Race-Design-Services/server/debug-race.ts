
import { storage } from "./storage";
import { db } from "./firebase";

async function debugRace() {
    console.log("Debugging latest race...");

    if (!db) {
        console.error("FAIL: Firebase DB not initialized.");
        return;
    }

    const races = await storage.getRaces();
    if (races.length === 0) {
        console.log("No races found.");
        return;
    }

    // Get latest race (sort by createdAt desc)
    const latestRace = races.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    console.log("Latest Race:", JSON.stringify(latestRace, null, 2));

    console.log(`Fetching entries for race ${latestRace.id}...`);
    const entries = await storage.getRaceEntries(latestRace.id);

    console.log(`Found ${entries.length} entries:`);
    entries.forEach(e => {
        console.log(` - Entry ${e.id}: Pair ${e.bullPairId}, Order ${e.raceOrder}, Status ${e.status}`);
    });

    // Check raw collection if empty
    if (entries.length === 0) {
        console.log("Checking raw 'race_entries' collection for this raceId...");
        const snapshot = await db.collection("race_entries").where("raceId", "==", latestRace.id).get();
        console.log(`Raw query found ${snapshot.size} documents.`);
        snapshot.forEach(doc => console.log("Doc ID:", doc.id, "Data:", doc.data()));
    }
}

debugRace().catch(console.error);
