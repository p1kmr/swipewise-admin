import * as XLSX from "xlsx";
import { SKILLS } from "../constants/enums.js";

const REQUIRED = ["question_description", "answer", "explanation", "jurisdiction", "difficulty_level"];

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

export async function parseQotdFile(file) {
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

    let difficulty_level = Number(row.difficulty_level);
    if (Number.isNaN(difficulty_level) || difficulty_level < 1 || difficulty_level > 5) {
      errors.push("difficulty_level must be a number from 1 to 5");
    }

    if (row.skill_tested && !SKILLS.includes(row.skill_tested)) {
      errors.push(`invalid skill_tested "${row.skill_tested}"`);
    }

    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join("; ") });
      return;
    }

    valid.push({
      question_description: row.question_description,
      answer: row.answer,
      explanation: row.explanation,
      jurisdiction: row.jurisdiction,
      difficulty_level,
      options: splitList(row.options),
      language_code: row.language_code || "en",
      skill_tested: row.skill_tested || "",
      active_from: row.active_from || null,
      active_to: row.active_to || null,
    });
  });

  return { valid, skipped, total: rows.length };
}
