import { ObjectId } from "mongodb";
import { COLLECTIONS, STATUSES } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";
import { DRAFT_APPROVAL, publishUpdate, statusUpdate } from "./approval.js";

let indexesEnsured = false;

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  await db
    .collection(COLLECTIONS.CONTENT)
    .createIndex({ question_id: 1 }, { unique: true, sparse: true });
  indexesEnsured = true;
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

// Atomic per-jurisdiction sequence → Question_ID like "SW-IN-000123".
async function getNextQuestionId(db, jurisdiction) {
  const code = String(jurisdiction || "GLOBAL").trim().toUpperCase() || "GLOBAL";
  const result = await db.collection(COLLECTIONS.COUNTERS).findOneAndUpdate(
    { _id: `question:${code}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = result.value?.seq ?? result.seq ?? 1;
  return `SW-${code}-${String(seq).padStart(6, "0")}`;
}

// Import a batch of parsed questions.
// - rows without question_id → assigned a new id and inserted as unpublished Draft.
// - rows with question_id → upsert (update editable fields; status/approval preserved).
export async function importContent(questions) {
  const db = await getDb();
  await ensureIndexes(db);
  const now = new Date();

  let inserted = 0;
  let updated = 0;
  const ids = [];

  for (const raw of questions) {
    // strip fields the server owns
    const { question_id, status, ...fields } = raw;

    if (question_id) {
      const result = await db.collection(COLLECTIONS.CONTENT).updateOne(
        { question_id },
        {
          $set: { ...fields, updatedAt: now },
          $setOnInsert: {
            question_id,
            status: "Draft",
            approval: DRAFT_APPROVAL,
            createdAt: now,
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) inserted += 1;
      else updated += 1;
      ids.push(question_id);
    } else {
      const newId = await getNextQuestionId(db, fields.jurisdiction);
      await db.collection(COLLECTIONS.CONTENT).insertOne({
        ...fields,
        question_id: newId,
        status: "Draft",
        approval: DRAFT_APPROVAL,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
      ids.push(newId);
    }
  }

  return { saved: inserted + updated, inserted, updated, ids };
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

// Set Draft / Inactive / Archived (Active goes through publish for consistency).
export async function setContentStatus(ids, status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`invalid status "${status}"`);
  }
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (!objectIds.length) return { updated: 0 };

  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.CONTENT)
    .updateMany({ _id: { $in: objectIds } }, statusUpdate(status));
  return { updated: result.modifiedCount, status };
}
