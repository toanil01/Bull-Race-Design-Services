
import { db } from "./firebase";

async function debugData() {
    console.log("Debugging Latest Race Data...");
    if (!db) return;

    const raceEntriesSnap = await db.collection("race_entries").get();
    const allLapsSnap = await db.collection("laps").get();

    console.log(`Total Race Entries: ${raceEntriesSnap.size}`);
    console.log(`Total Laps: ${allLapsSnap.size}`);

    // Group laps by raceEntryId
    const lapsByEntry = new Map<string, number>();
    allLapsSnap.forEach(d => {
        const rid = d.data().raceEntryId;
        lapsByEntry.set(rid, (lapsByEntry.get(rid) || 0) + 1);
        if (rid === "") console.log(`[WARNING] Lap ${d.id} has EMPTY raceEntryId!`);
    });

    console.log("\n--- Race Entries with Laps ---");
    let foundMatches = 0;
    raceEntriesSnap.forEach(doc => {
        const count = lapsByEntry.get(doc.id) || 0;
        if (count > 0) {
            console.log(`Entry ${doc.id} (BullPair: ${doc.data().bullPairId}) has ${count} laps.`);
            foundMatches++;
        }
    });

    if (foundMatches === 0) {
        console.log("NO MATCHING LAPS FOUND for any existing Race Entry.");
        console.log("Dumping first 5 lap raceEntryIds:");
        let i = 0;
        allLapsSnap.forEach(d => {
            if (i++ < 5) console.log(`Lap ${d.id} -> raceEntryId: "${d.data().raceEntryId}"`);
        });
    }
}

debugData().catch(console.error);
