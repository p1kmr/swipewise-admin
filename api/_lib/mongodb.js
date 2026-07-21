import { MongoClient } from "mongodb";
import { DEFAULT_DB_NAME } from "./constants.js";

const DB_NAME = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

let cached = global._mongoCached;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!cached) {
    const client = new MongoClient(uri);
    await client.connect();
    cached = { client, db: client.db(DB_NAME) };
    global._mongoCached = cached;
  }

  return cached.db;
}

export function toApiId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}
