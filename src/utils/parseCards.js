import * as XLSX from "xlsx";
import { VERDICTS, VISUAL_TYPES, SKILLS } from "../constants/enums.js";

const REQUIRED = [
  "jurisdiction",
  "language_code",
  "visual_type",
  "scenario_text",
  "verdict",
  "explanation",
];

// red_flags is a single cell with items separated by | or ;
function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function clean(value) {
  return typeof value === "string" ? value.trim() : value;
}

// Parse an uploaded .xlsx in the browser and validate each row.
// Returns { valid: [cardDoc], skipped: [{ row, reason }], total }.
export async function parseCardsFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const valid = [];
  const skipped = [];

  rows.forEach((raw, index) => {
    const rowNum = index + 2; // +1 for header, +1 for 1-based

    // normalise keys/values
    const row = {};
    Object.keys(raw).forEach((k) => {
      row[k.trim()] = clean(raw[k]);
    });

    // ignore fully blank rows
    const hasAny = Object.values(row).some((v) => v !== "" && v != null);
    if (!hasAny) return;

    const errors = [];
    REQUIRED.forEach((f) => {
      if (!row[f]) errors.push(`missing ${f}`);
    });
    if (row.verdict && !VERDICTS.includes(row.verdict)) {
      errors.push(`invalid verdict "${row.verdict}"`);
    }
    if (row.visual_type && !VISUAL_TYPES.includes(row.visual_type)) {
      errors.push(`invalid visual_type "${row.visual_type}"`);
    }
    if (row.skill_tested && !SKILLS.includes(row.skill_tested)) {
      errors.push(`invalid skill_tested "${row.skill_tested}"`);
    }

    let difficulty = 1;
    if (row.difficulty !== "" && row.difficulty != null) {
      difficulty = Number(row.difficulty);
      if (Number.isNaN(difficulty)) errors.push("difficulty must be a number");
    }

    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join("; ") });
      return;
    }

    valid.push({
      jurisdiction: row.jurisdiction,
      language_code: row.language_code,
      visual_type: row.visual_type,
      scenario_text: row.scenario_text,
      verdict: row.verdict,
      explanation: row.explanation,
      red_flags: splitList(row.red_flags),
      action_step: row.action_step || "",
      verification_link: row.verification_link || "",
      ai_under_hood: {
        why_shown: row.ai_under_hood_why_shown || "",
        what_it_tests: row.ai_under_hood_what_it_tests || "",
      },
      difficulty,
      bucket: row.bucket || "",
      skill_tested: row.skill_tested || "",
    });
  });

  return { valid, skipped, total: rows.length };
}
