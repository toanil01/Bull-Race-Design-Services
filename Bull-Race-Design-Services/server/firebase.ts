import admin from "firebase-admin";
import { type ServiceAccount } from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin
let db: admin.firestore.Firestore;

try {
    // Try to load service account from file
    const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8")) as ServiceAccount;

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin initialized with serviceAccountKey.json");
        }
    } else {
        // Fallback to environment variables or default credential
        if (!admin.apps.length) {
            admin.initializeApp();
            console.log("Firebase Admin initialized with default credentials");
        }
    }

    db = admin.firestore();

    // Set settings if needed
    db.settings({ ignoreUndefinedProperties: true });

} catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    // We don't throw here to allow the app to start, but storage operations will fail
    // We'll let the storage class handle the error states
}

export { db, admin };
