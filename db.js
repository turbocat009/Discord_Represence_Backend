import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// File adapter
const adapter = new JSONFile("db.json");

// Create DB instance with default data
const db = new Low(adapter, { users: [] });

// Async function to initialize DB
async function initDB() {
    await db.read();

    // Provide default data if db.json is empty
    if (!db.data) {
        db.data = { users: [] };
        await db.write(); // make sure file is initialized
    }
}

await initDB(); // top-level await is allowed in Node 18+ with "type": "module"

export default db;