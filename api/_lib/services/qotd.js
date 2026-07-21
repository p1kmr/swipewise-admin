import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";
import { DRAFT_APPROVAL, publishUpdate } from "./approval.js";

export async function listQotd() {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.QOTD)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toApiId);
}

export async function importQotd(items) {
  const db = await getDb();
  const now = new Date();
  const docs = items.map((item) => ({
    ...item,
    approval: DRAFT_APPROVAL,
    createdAt: now,
  }));

  const result = await db.collection(COLLECTIONS.QOTD).insertMany(docs);
  return {
    saved: docs.length,
    ids: Object.values(result.insertedIds).map((id) => id.toString()),
  };
}

export async function publishQotd(id) {
  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.QOTD)
    .updateOne({ _id: new ObjectId(id) }, publishUpdate());
  return result.matchedCount > 0;
}

export async function publishQotdBatch(ids) {
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (!objectIds.length) return { published: 0 };

  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.QOTD)
    .updateMany({ _id: { $in: objectIds } }, publishUpdate());
  return { published: result.modifiedCount };
}
