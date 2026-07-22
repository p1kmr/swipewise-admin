import * as XLSX from "xlsx";
import {
  JURISDICTION_CODES,
  REGULATORS,
  LANGUAGE_CODES,
  MODULES,
  QUESTION_FORMATS,
  DIFFICULTIES,
  STATUSES,
  QUESTION_REQUIRED_COLUMNS,
  MCQ_OPTION_KEYS,
} from "../constants/enums.js";

// Enum columns that must match a Lookup_Values entry (README C17). Category is free text.
const ENUM_COLUMNS = {
  Jurisdiction_Code: JURISDICTION_CODES,
  Regulator: REGULATORS,
  Language_Code: LANGUAGE_CODES,
  Module: MODULES,
  Question_Format: QUESTION_FORMATS,
  Difficulty: DIFFICULTIES,
  Status: STATUSES,
};

const LEGEND_VALUES = new Set(["mandatory", "optional"]);

function clean(value) {
  if (value == null) return "";
  return typeof value === "string" ? value.trim() : value;
}

function splitTags(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// A row is the "Mandatory/Optional" legend row if every non-empty cell is one of those words.
function isLegendRow(row) {
  const values = Object.values(row).filter((v) => v !== "" && v != null);
  if (!values.length) return false;
  return values.every((v) => LEGEND_VALUES.has(String(v).trim().toLowerCase()));
}

function normalizeBoolAnswer(raw) {
  const v = String(raw).trim().toUpperCase();
  if (v === "TRUE" || v === "T" || v === "YES") return "TRUE";
  if (v === "FALSE" || v === "F" || v === "NO") return "FALSE";
  return null;
}

// Validate + normalise a single answer against its format. Returns { value, options, errors }.
function resolveAnswer(format, correctRaw, options) {
  const errors = [];
  const filledKeys = MCQ_OPTION_KEYS.filter((k) => options[k]);

  if (format === "Swipe_TrueFalse" || format === "Scenario_Card") {
    const bool = normalizeBoolAnswer(correctRaw);
    if (!bool) {
      errors.push(`Correct_Answer must be TRUE or FALSE for ${format}`);
    }
    if (format === "Swipe_TrueFalse" && filledKeys.length) {
      errors.push("Option_A–D must be blank for Swipe_TrueFalse");
    }
    return { value: bool, options: {}, errors };
  }

  if (format === "MCQ_Single" || format === "MCQ_Multi") {
    if (filledKeys.length < 2) {
      errors.push(`${format} needs at least two options (Option_A–D)`);
    }
    const letters = String(correctRaw)
      .split(/[,;|]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!letters.length) {
      errors.push("Correct_Answer must contain option letter(s)");
    }
    if (format === "MCQ_Single" && letters.length > 1) {
      errors.push("MCQ_Single allows only one correct letter");
    }
    letters.forEach((l) => {
      if (!MCQ_OPTION_KEYS.includes(l)) errors.push(`invalid option letter "${l}"`);
      else if (!options[l]) errors.push(`Correct_Answer "${l}" has no matching option`);
    });

    const pickedOptions = {};
    filledKeys.forEach((k) => {
      pickedOptions[k] = options[k];
    });
    return { value: letters, options: pickedOptions, errors };
  }

  errors.push(`unknown Question_Format "${format}"`);
  return { value: null, options: {}, errors };
}

// Parse an uploaded .xlsx (v3 Question Bank template) in the browser and validate each row.
// Returns { valid: [questionDoc], skipped: [{ row, reason }], total }.
export async function parseQuestionsFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  // The template has README / Questions / Lookup_Values — parse the Questions sheet.
  const sheetName = workbook.SheetNames.includes("Questions")
    ? "Questions"
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const valid = [];
  const skipped = [];

  rows.forEach((raw, index) => {
    const rowNum = index + 2; // +1 header, +1 for 1-based

    const row = {};
    Object.keys(raw).forEach((k) => {
      row[k.trim()] = clean(raw[k]);
    });

    // ignore fully blank rows and the Mandatory/Optional legend row
    const hasAny = Object.values(row).some((v) => v !== "" && v != null);
    if (!hasAny) return;
    if (isLegendRow(row)) return;

    const errors = [];

    QUESTION_REQUIRED_COLUMNS.forEach((col) => {
      if (row[col] === "" || row[col] == null) errors.push(`missing ${col}`);
    });

    Object.entries(ENUM_COLUMNS).forEach(([col, allowed]) => {
      const value = col === "Jurisdiction_Code" || col === "Regulator"
        ? String(row[col] || "").trim().toUpperCase()
        : String(row[col] || "").trim();
      if (value && !allowed.includes(value)) {
        errors.push(`invalid ${col} "${row[col]}"`);
      }
    });

    const format = String(row.Question_Format || "").trim();
    const options = {
      A: String(row.Option_A || "").trim(),
      B: String(row.Option_B || "").trim(),
      C: String(row.Option_C || "").trim(),
      D: String(row.Option_D || "").trim(),
    };

    let answer = { value: null, options: {}, errors: [] };
    if (format && QUESTION_FORMATS.includes(format) && row.Correct_Answer !== "") {
      answer = resolveAnswer(format, row.Correct_Answer, options);
      errors.push(...answer.errors);
    }

    let points = 10;
    if (row.Points !== "" && row.Points != null) {
      points = Number(row.Points);
      if (Number.isNaN(points)) errors.push("Points must be a number");
    }

    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join("; ") });
      return;
    }

    valid.push({
      question_id: String(row.Question_ID || "").trim() || null,
      jurisdiction: String(row.Jurisdiction_Code).trim().toUpperCase(),
      regulator: String(row.Regulator).trim().toUpperCase(),
      language_code: String(row.Language_Code).trim(),
      module: String(row.Module).trim(),
      category: String(row.Category).trim(),
      question_format: format,
      question_text: String(row.Question_Text).trim(),
      scenario_context: String(row.Scenario_Context || "").trim(),
      options: answer.options,
      correct_answer: answer.value,
      explanation_feedback: String(row.Explanation_Feedback).trim(),
      ai_explainer_context: String(row.AI_Explainer_Context || "").trim(),
      regulatory_reference: String(row.Regulatory_Reference || "").trim(),
      difficulty: String(row.Difficulty).trim(),
      points,
      media_url: String(row.Media_URL || "").trim(),
      tags: splitTags(row.Tags),
      status: String(row.Status).trim(),
      effective_date: String(row.Effective_Date || "").trim() || null,
      expiry_date: String(row.Expiry_Date || "").trim() || null,
      created_by: String(row.Created_By || "").trim(),
      reviewer: String(row.Reviewer || "").trim(),
    });
  });

  return { valid, skipped, total: rows.length };
}
