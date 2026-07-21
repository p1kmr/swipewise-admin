import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";

const DATA_TYPES = new Set([
  "scam_case",
  "enforcement_order",
  "regulatory_rule",
  "investor_alert",
  "market_update",
  "scam_pattern",
  "regulator_notice",
]);

function normalizeItem(raw) {
  const jurisdiction = String(raw.jurisdiction || "").trim().toUpperCase();
  const data_type = String(raw.data_type || "").trim();
  const title = String(raw.title || "").trim();
  const summary = String(raw.summary || "").trim();

  const errors = [];
  if (!jurisdiction) errors.push("jurisdiction is required.");
  if (!data_type || !DATA_TYPES.has(data_type)) errors.push(`invalid data_type "${data_type}".`);
  if (!title) errors.push("title is required.");
  if (!summary) errors.push("summary is required.");
  if (errors.length) throw new Error(errors.join(" "));

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map(String).filter(Boolean)
    : String(raw.tags || "")
        .split(/[|;]/)
        .map((t) => t.trim())
        .filter(Boolean);

  return {
    jurisdiction,
    data_type,
    title,
    summary,
    source_url: String(raw.source_url || "").trim(),
    event_date: String(raw.event_date || "").trim(),
    language_code: String(raw.language_code || "en").trim(),
    tags,
    createdAt: new Date(),
  };
}

export async function listJurisdictionData(jurisdiction) {
  const db = await getDb();
  const filter = jurisdiction
    ? { jurisdiction: String(jurisdiction).trim().toUpperCase() }
    : {};
  const docs = await db
    .collection(COLLECTIONS.JURISDICTION_DATA)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  return docs.map(toApiId);
}

export async function importJurisdictionData(items) {
  const db = await getDb();
  const docs = items.map((item) => normalizeItem(item));
  const result = await db.collection(COLLECTIONS.JURISDICTION_DATA).insertMany(docs);
  return {
    saved: docs.length,
    ids: Object.values(result.insertedIds).map((id) => id.toString()),
  };
}
