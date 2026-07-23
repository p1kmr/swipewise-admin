import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";

function qotdSnapshot(doc) {
  return {
    content_id: doc._id,
    question_id: doc.question_id,
    jurisdiction: doc.jurisdiction,
    language_code: doc.language_code,
    module: doc.module,
    category: doc.category,
    question_format: doc.question_format,
    question_text: doc.question_text,
    options: doc.options,
    correct_answer: doc.correct_answer,
    explanation_feedback: doc.explanation_feedback,
    ai_explainer_context: doc.ai_explainer_context,
    regulatory_reference: doc.regulatory_reference,
    difficulty: doc.difficulty,
    points: doc.points,
    media_url: doc.media_url,
  };
}

async function getQuestion(db, id) {
  if (!ObjectId.isValid(id)) throw new Error("invalid id");
  const doc = await db.collection(COLLECTIONS.CONTENT).findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error("question not found");
  return doc;
}

// Push a question live as Question of the Day for its jurisdiction (marking is UI-only).
export async function publishQotd(id) {
  const db = await getDb();
  const doc = await getQuestion(db, id);
  const jurisdiction = String(doc.jurisdiction || "GLOBAL").toUpperCase();
  const now = new Date();

  await db.collection(COLLECTIONS.CONTENT).updateMany(
    {
      jurisdiction,
      _id: { $ne: doc._id },
      $or: [{ "qotd.published": true }, { "qotd.marked": true }],
    },
    {
      $set: {
        qotd: { marked: false, published: false, marked_at: null, published_at: null },
        updatedAt: now,
      },
    }
  );

  await db.collection(COLLECTIONS.QOTD).updateMany(
    { jurisdiction, active: true },
    { $set: { active: false, deactivated_at: now } }
  );

  const updates = {
    qotd: {
      marked: true,
      published: true,
      marked_at: now,
      published_at: now,
    },
    updatedAt: now,
  };

  if ((doc.status || "Draft") !== "Active") {
    Object.assign(updates, {
      status: "Active",
      "approval.published": true,
      "approval.reviewed_at": now,
    });
  }

  const result = await db.collection(COLLECTIONS.CONTENT).findOneAndUpdate(
    { _id: doc._id },
    { $set: updates },
    { returnDocument: "after" }
  );

  const updated = result?.value ?? result;
  await db.collection(COLLECTIONS.QOTD).insertOne({
    ...qotdSnapshot(updated),
    active: true,
    published_at: now,
    createdAt: now,
  });

  return { question: toApiId(updated), jurisdiction };
}

// Take the live QOTD offline (question stays Active in the bank).
export async function unpublishQotd(id) {
  const db = await getDb();
  const doc = await getQuestion(db, id);
  if (!doc.qotd?.published) {
    throw new Error("This question is not the live QOTD.");
  }

  const now = new Date();
  const result = await db.collection(COLLECTIONS.CONTENT).findOneAndUpdate(
    { _id: doc._id },
    {
      $set: {
        qotd: { marked: false, published: false, marked_at: null, published_at: null },
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  await db.collection(COLLECTIONS.QOTD).updateMany(
    { content_id: doc._id, active: true },
    { $set: { active: false, deactivated_at: now } }
  );

  const updated = result?.value ?? result;
  return { question: toApiId(updated) };
}

// Current live QOTD for a jurisdiction (user app reads this).
export async function getLiveQotd(jurisdiction = "IN") {
  const db = await getDb();
  const code = String(jurisdiction || "IN").toUpperCase();
  const doc = await db
    .collection(COLLECTIONS.QOTD)
    .find({ jurisdiction: code, active: true })
    .sort({ published_at: -1 })
    .limit(1)
    .next();
  return doc ? toApiId(doc) : null;
}
