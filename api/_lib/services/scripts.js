import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";
import { DRAFT_APPROVAL, publishUpdate } from "./approval.js";

export async function listScripts() {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.SCRIPTS)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toApiId);
}

export async function importScripts(scripts) {
  const db = await getDb();
  const now = new Date();
  const docs = scripts.map((script) => ({
    ...script,
    approval: DRAFT_APPROVAL,
    createdAt: now,
  }));

  const result = await db.collection(COLLECTIONS.SCRIPTS).insertMany(docs);
  return {
    saved: docs.length,
    ids: Object.values(result.insertedIds).map((id) => id.toString()),
  };
}

export async function publishScript(id) {
  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.SCRIPTS)
    .updateOne({ _id: new ObjectId(id) }, publishUpdate());
  return result.matchedCount > 0;
}

export async function publishScriptsBatch(ids) {
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (!objectIds.length) return { published: 0 };

  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.SCRIPTS)
    .updateMany({ _id: { $in: objectIds } }, publishUpdate());
  return { published: result.modifiedCount };
}
