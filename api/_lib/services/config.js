import { COLLECTIONS } from "../constants.js";
import { getDb, toApiId } from "../mongodb.js";

export const PROTOTYPE_CONFIGS = [
  {
    jurisdiction: "IN",
    name: "India",
    languages: ["en", "hi"],
    default_language: "en",
    timezone: "Asia/Kolkata",
    branding: {
      app_name: "SwipeWise India",
      regulator_name: "SEBI",
      regulator_url: "https://sebi.gov.in",
      hotline: "1800-22-7575",
      wisebot_avatar_default: "neutral",
    },
    qotd_interval_minutes: 30,
    active: false,
  },
  {
    jurisdiction: "ES",
    name: "Spain",
    languages: ["es", "en"],
    default_language: "es",
    timezone: "Europe/Madrid",
    branding: {
      app_name: "SwipeWise España",
      regulator_name: "CNMV",
      regulator_url: "https://cnmv.es",
      hotline: "+34 900 533 240",
      wisebot_avatar_default: "neutral",
    },
    qotd_interval_minutes: 30,
    active: false,
  },
  {
    jurisdiction: "FR",
    name: "France",
    languages: ["fr", "en"],
    default_language: "fr",
    timezone: "Europe/Paris",
    branding: {
      app_name: "SwipeWise France",
      regulator_name: "AMF",
      regulator_url: "https://amf-france.org",
      hotline: "+33 1 53 45 62 00",
      wisebot_avatar_default: "neutral",
    },
    qotd_interval_minutes: 30,
    active: false,
  },
];

function normalizeConfig(body) {
  const jurisdiction = String(body.jurisdiction || "").trim().toUpperCase();
  if (!jurisdiction) throw new Error("jurisdiction is required.");

  const languages = Array.isArray(body.languages)
    ? body.languages.map((l) => String(l).trim()).filter(Boolean)
    : String(body.languages || "")
        .split(/[,;|]/)
        .map((l) => l.trim())
        .filter(Boolean);

  if (!languages.length) throw new Error("At least one language is required.");

  const branding = body.branding || {};
  const qotdInterval = Number(body.qotd_interval_minutes ?? 30);

  return {
    jurisdiction,
    name: String(body.name || jurisdiction).trim(),
    languages,
    default_language: String(body.default_language || languages[0]).trim(),
    timezone: String(body.timezone || "UTC").trim(),
    branding: {
      app_name: String(branding.app_name || `SwipeWise ${jurisdiction}`).trim(),
      regulator_name: String(branding.regulator_name || "").trim(),
      regulator_url: String(branding.regulator_url || "").trim(),
      hotline: String(branding.hotline || "").trim(),
      wisebot_avatar_default: String(branding.wisebot_avatar_default || "neutral").trim(),
    },
    qotd_interval_minutes: Number.isNaN(qotdInterval) ? 30 : qotdInterval,
    active: Boolean(body.active),
  };
}

export async function listConfigs() {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.CONFIG)
    .find({})
    .sort({ jurisdiction: 1 })
    .toArray();
  return docs.map(toApiId);
}

export async function upsertConfig(body) {
  const config = normalizeConfig(body);
  const now = new Date();
  const db = await getDb();

  await db.collection(COLLECTIONS.CONFIG).updateOne(
    { jurisdiction: config.jurisdiction },
    {
      $set: { ...config, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const doc = await db.collection(COLLECTIONS.CONFIG).findOne({ jurisdiction: config.jurisdiction });
  return toApiId(doc);
}

export async function setConfigActive(jurisdiction, active) {
  const code = String(jurisdiction || "").trim().toUpperCase();
  if (!code) throw new Error("jurisdiction is required.");

  const db = await getDb();
  const result = await db.collection(COLLECTIONS.CONFIG).updateOne(
    { jurisdiction: code },
    { $set: { active: Boolean(active), updatedAt: new Date() } }
  );
  return result.matchedCount > 0;
}

export async function seedPrototypeConfigs() {
  const results = [];
  for (const template of PROTOTYPE_CONFIGS) {
    results.push(await upsertConfig(template));
  }
  return { seeded: results.length, configs: results };
}
