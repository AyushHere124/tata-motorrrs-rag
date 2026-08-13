import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { DataAPIClient } from "@datastax/astra-db-ts";

const {
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_KEYSPACE,
    ASTRA_DB_COLLECTION,
} = process.env;

// ================================
// Validate Environment Variables
// ================================

if (!ASTRA_DB_API_ENDPOINT) {
    throw new Error("ASTRA_DB_API_ENDPOINT is missing");
}

if (!ASTRA_DB_APPLICATION_TOKEN) {
    throw new Error("ASTRA_DB_APPLICATION_TOKEN is missing");
}

if (!ASTRA_DB_KEYSPACE) {
    throw new Error("ASTRA_DB_KEYSPACE is missing");
}

if (!ASTRA_DB_COLLECTION) {
    throw new Error("ASTRA_DB_COLLECTION is missing");
}

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

export const db = client.db(ASTRA_DB_API_ENDPOINT, {
    keyspace: ASTRA_DB_KEYSPACE,
});

export function getCollection() {
    return db.collection(ASTRA_DB_COLLECTION!);
}

export async function testConnection() {
    try {
        const collection = getCollection();
        await collection.findOne({});
        console.log(" Astra DB Connected Successfully");
        return true;
    } catch (error) {
        console.error(" Astra DB Connection Failed");
        console.error(error);
        return false;
    }
}