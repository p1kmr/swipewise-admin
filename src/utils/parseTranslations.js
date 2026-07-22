import * as XLSX from "xlsx";

const REQUIRED = ["content_type", "source_id", "target_language"];
const CONTENT_TYPES = new Set(["content", "script", "qotd"]);

function clean(value) {
  return typeof value === "string" ? value.trim() : value;
}

export async function parseTranslationFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const valid = [];
  const skipped = [];

  rows.forEach((raw, index) => {
    const rowNum = index + 2;
    const row = {};
    Object.keys(raw).forEach((k) => {
      row[k.trim()] = clean(raw[k]);
    });

    const hasAny = Object.values(row).some((v) => v !== "" && v != null);
    if (!hasAny) return;

    const errors = [];
    REQUIRED.forEach((f) => {
      if (!row[f]) errors.push(`missing ${f}`);
    });
    if (row.content_type && !CONTENT_TYPES.has(row.content_type)) {
      errors.push(`invalid content_type "${row.content_type}"`);
    }

    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join("; ") });
      return;
    }

    valid.push({
      content_type: row.content_type,
      source_id: row.source_id,
      jurisdiction: row.jurisdiction ? String(row.jurisdiction).toUpperCase() : "",
      target_language: row.target_language,
      question_text: row.question_text || "",
      explanation_feedback: row.explanation_feedback || "",
      scenario_context: row.scenario_context || "",
      title: row.title || "",
      nodes_json: row.nodes_json || "",
      question_description: row.question_description || "",
      answer: row.answer || "",
    });
  });

  return { valid, skipped, total: rows.length };
}
