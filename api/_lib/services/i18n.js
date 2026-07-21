import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../constants.js";
import { getDb } from "../mongodb.js";
import { DRAFT_APPROVAL } from "./approval.js";

const CONTENT_TYPES = new Set(["content", "script", "qotd"]);

function collectionForType(contentType) {
  if (contentType === "content") return COLLECTIONS.CONTENT;
  if (contentType === "script") return COLLECTIONS.SCRIPTS;
  if (contentType === "qotd") return COLLECTIONS.QOTD;
  return null;
}

async function countByLanguage(db, collection, jurisdiction) {
  const pipeline = [
    { $match: { jurisdiction } },
    { $group: { _id: "$language_code", count: { $sum: 1 } } },
  ];
  const rows = await db.collection(collection).aggregate(pipeline).toArray();
  const counts = {};
  rows.forEach((r) => {
    counts[r._id || "unknown"] = r.count;
  });
  return counts;
}

function buildGaps(requiredLanguages, counts) {
  const baseline = Math.max(...Object.values(counts), 0);
  return requiredLanguages
    .filter((lang) => !counts[lang])
    .map((lang) => ({
      language: lang,
      count: 0,
      message: baseline
        ? `No ${lang} documents (baseline language has ${baseline})`
        : `No ${lang} documents`,
    }));
}

export async function getCoverageReport(jurisdictionFilter) {
  const db = await getDb();
  const configFilter = jurisdictionFilter
    ? { jurisdiction: String(jurisdictionFilter).trim().toUpperCase() }
    : {};
  const configs = await db.collection(COLLECTIONS.CONFIG).find(configFilter).toArray();

  const report = [];
  for (const config of configs) {
    const jurisdiction = config.jurisdiction;
    const languages = config.languages || [];

    const [contentCounts, scriptCounts, qotdCounts] = await Promise.all([
      countByLanguage(db, COLLECTIONS.CONTENT, jurisdiction),
      countByLanguage(db, COLLECTIONS.SCRIPTS, jurisdiction),
      countByLanguage(db, COLLECTIONS.QOTD, jurisdiction),
    ]);

    report.push({
      jurisdiction,
      name: config.name,
      active: config.active,
      languages,
      coverage: {
        content: { counts: contentCounts, gaps: buildGaps(languages, contentCounts) },
        scripts: { counts: scriptCounts, gaps: buildGaps(languages, scriptCounts) },
        qotd: { counts: qotdCounts, gaps: buildGaps(languages, qotdCounts) },
      },
    });
  }

  return report;
}

export async function importTranslations(rows) {
  const db = await getDb();
  const now = new Date();
  const saved = [];
  const skipped = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const content_type = String(row.content_type || "").trim();
    const source_id = String(row.source_id || "").trim();
    const target_language = String(row.target_language || "").trim();

    if (!CONTENT_TYPES.has(content_type)) {
      skipped.push({ row: rowNum, reason: `invalid content_type "${content_type}"` });
      continue;
    }
    if (!ObjectId.isValid(source_id)) {
      skipped.push({ row: rowNum, reason: "invalid source_id" });
      continue;
    }
    if (!target_language) {
      skipped.push({ row: rowNum, reason: "target_language is required" });
      continue;
    }

    const collection = collectionForType(content_type);
    const source = await db.collection(collection).findOne({ _id: new ObjectId(source_id) });
    if (!source) {
      skipped.push({ row: rowNum, reason: `source ${content_type} not found` });
      continue;
    }

    const { _id, approval, createdAt, ...rest } = source;
    let doc = {
      ...rest,
      language_code: target_language,
      approval: DRAFT_APPROVAL,
      translation_of: source_id,
      createdAt: now,
    };

    if (content_type === "content") {
      if (row.scenario_text) doc.scenario_text = String(row.scenario_text).trim();
      if (row.explanation) doc.explanation = String(row.explanation).trim();
      if (row.action_step) doc.action_step = String(row.action_step).trim();
    } else if (content_type === "script") {
      if (row.title) doc.title = String(row.title).trim();
      if (row.nodes_json) {
        try {
          doc.nodes = JSON.parse(String(row.nodes_json));
        } catch {
          skipped.push({ row: rowNum, reason: "invalid nodes_json" });
          continue;
        }
      }
    } else if (content_type === "qotd") {
      if (row.question_description) doc.question_description = String(row.question_description).trim();
      if (row.answer) doc.answer = String(row.answer).trim();
      if (row.explanation) doc.explanation = String(row.explanation).trim();
    }

    const result = await db.collection(collection).insertOne(doc);
    saved.push(result.insertedId.toString());
  }

  const jurisdictions = [...new Set(rows.map((r) => String(r.jurisdiction || "").trim().toUpperCase()).filter(Boolean))];
  const coverage = [];
  for (const jurisdiction of jurisdictions) {
    coverage.push(...(await getCoverageReport(jurisdiction)));
  }
  if (!coverage.length) {
    coverage.push(...(await getCoverageReport()));
  }

  return { saved: saved.length, ids: saved, skipped, coverage };
}
