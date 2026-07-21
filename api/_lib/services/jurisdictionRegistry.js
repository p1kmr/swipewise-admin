import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";

const ENTITY_TYPES = new Set(["broker", "adviser", "fund", "bank", "other"]);
const STATUSES = new Set(["active", "suspended", "revoked"]);

function normalizeItem(raw) {
  const jurisdiction = String(raw.jurisdiction || "").trim().toUpperCase();
  const entity_name = String(raw.entity_name || "").trim();
  const registration_number = String(raw.registration_number || "").trim();

  const errors = [];
  if (!jurisdiction) errors.push("jurisdiction is required.");
  if (!entity_name) errors.push("entity_name is required.");
  if (!registration_number) errors.push("registration_number is required.");
  if (errors.length) throw new Error(errors.join(" "));

  const entity_type = String(raw.entity_type || "other").trim();
  const status = String(raw.status || "active").trim();

  return {
    jurisdiction,
    entity_name,
    registration_number,
    entity_type: ENTITY_TYPES.has(entity_type) ? entity_type : "other",
    status: STATUSES.has(status) ? status : "active",
    regulator: String(raw.regulator || "").trim(),
    website: String(raw.website || "").trim(),
    createdAt: new Date(),
  };
}

export async function listJurisdictionRegistry(jurisdiction) {
  const db = await getDb();
  const filter = jurisdiction
    ? { jurisdiction: String(jurisdiction).trim().toUpperCase() }
    : {};
  const docs = await db
    .collection(COLLECTIONS.JURISDICTION_REGISTRY)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  return docs.map(toApiId);
}

export async function importJurisdictionRegistry(items) {
  const db = await getDb();
  const docs = items.map((item) => normalizeItem(item));
  const result = await db.collection(COLLECTIONS.JURISDICTION_REGISTRY).insertMany(docs);
  return {
    saved: docs.length,
    ids: Object.values(result.insertedIds).map((id) => id.toString()),
  };
}
