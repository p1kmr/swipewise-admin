import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../constants.js";
import { getDb } from "../mongodb.js";
import { DRAFT_APPROVAL } from "./approval.js";
import { getNextQuestionId } from "./content.js";
import { translateStrings } from "../gemini.js";

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

    const { _id, approval, createdAt, question_id, ...rest } = source;
    let doc = {
      ...rest,
      language_code: target_language,
      approval: DRAFT_APPROVAL,
      translation_of: source_id,
      createdAt: now,
    };

    if (content_type === "content") {
      // translated copies are new Draft questions (own Question_ID assigned on next content import path is N/A;
      // translations insert directly, so keep them Draft with no question_id — set by a later edit if needed).
      doc.status = "Draft";
      if (row.question_text) doc.question_text = String(row.question_text).trim();
      if (row.explanation_feedback) doc.explanation_feedback = String(row.explanation_feedback).trim();
      if (row.scenario_context) doc.scenario_context = String(row.scenario_context).trim();
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

// --- AI translation: create translated Draft copies without any manual source_id ---

const AI_TRANSLATABLE = new Set(["content", "qotd"]);

// Collect the translatable strings from a source doc as [{ path, text }].
function collectTranslatable(contentType, doc) {
  const parts = [];
  const push = (path, val) => {
    if (val != null && String(val).trim()) parts.push({ path, text: String(val) });
  };

  if (contentType === "content") {
    push("question_text", doc.question_text);
    push("explanation_feedback", doc.explanation_feedback);
    push("scenario_context", doc.scenario_context);
    push("ai_explainer_context", doc.ai_explainer_context);
    ["A", "B", "C", "D"].forEach((k) => push(`options.${k}`, doc.options?.[k]));
  } else if (contentType === "qotd") {
    push("question_description", doc.question_description);
    push("answer", doc.answer);
    push("explanation", doc.explanation);
    (Array.isArray(doc.options) ? doc.options : []).forEach((opt, i) => push(`options.${i}`, opt));
  }
  return parts;
}

// Apply translated strings back onto a cloned doc by path.
function applyTranslations(doc, parts, translated) {
  parts.forEach((p, i) => {
    const value = translated[i];
    if (value == null) return;
    if (p.path.startsWith("options.")) {
      const key = p.path.slice("options.".length);
      if (Array.isArray(doc.options)) doc.options[Number(key)] = value;
      else {
        doc.options = { ...(doc.options || {}) };
        doc.options[key] = value;
      }
    } else {
      doc[p.path] = value;
    }
  });
  return doc;
}

export async function translateWithAI({ content_type, ids, target_language }) {
  const contentType = String(content_type || "content").trim();
  if (!AI_TRANSLATABLE.has(contentType)) {
    throw new Error(`AI translation supports content and qotd (got "${content_type}").`);
  }
  const target = String(target_language || "").trim();
  if (!target) throw new Error("target_language is required.");

  const db = await getDb();
  const now = new Date();
  const collection = collectionForType(contentType);

  const created = [];
  const skipped = [];

  for (const rawId of ids) {
    if (!ObjectId.isValid(rawId)) {
      skipped.push({ id: rawId, reason: "invalid id" });
      continue;
    }
    const source = await db.collection(collection).findOne({ _id: new ObjectId(rawId) });
    if (!source) {
      skipped.push({ id: rawId, reason: "not found" });
      continue;
    }
    if ((source.language_code || "") === target) {
      skipped.push({ id: rawId, reason: `already in ${target}` });
      continue;
    }

    const parts = collectTranslatable(contentType, source);
    const translated = parts.length ? await translateStrings(parts.map((p) => p.text), target) : [];

    const { _id, approval, createdAt, question_id, ...rest } = source;
    let doc = {
      ...rest,
      options: Array.isArray(source.options) ? [...source.options] : { ...(source.options || {}) },
      language_code: target,
      approval: DRAFT_APPROVAL,
      status: "Draft",
      translation_of: rawId,
      createdAt: now,
      updatedAt: now,
    };
    doc = applyTranslations(doc, parts, translated);

    if (contentType === "content") {
      doc.question_id = await getNextQuestionId(db, doc.jurisdiction);
    }

    const result = await db.collection(collection).insertOne(doc);
    created.push(result.insertedId.toString());
  }

  const coverage = await getCoverageReport();
  return { created: created.length, ids: created, skipped, coverage };
}
