import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";

const DRAFT_APPROVAL = { published: false, reviewed_at: null };

function publishUpdate() {
  return { $set: { "approval.published": true, "approval.reviewed_at": new Date() } };
}

export async function listContent() {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.CONTENT)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toApiId);
}

export async function importContent(cards) {
  const db = await getDb();
  const now = new Date();
  const docs = cards.map((card) => ({
    ...card,
    approval: DRAFT_APPROVAL,
    createdAt: now,
  }));

  const result = await db.collection(COLLECTIONS.CONTENT).insertMany(docs);
  return {
    saved: docs.length,
    ids: Object.values(result.insertedIds).map((id) => id.toString()),
  };
}

export async function publishContent(id) {
  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.CONTENT)
    .updateOne({ _id: new ObjectId(id) }, publishUpdate());
  return result.matchedCount > 0;
}

export async function publishContentBatch(ids) {
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (!objectIds.length) return { published: 0 };

  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.CONTENT)
    .updateMany({ _id: { $in: objectIds } }, publishUpdate());
  return { published: result.modifiedCount };
}
