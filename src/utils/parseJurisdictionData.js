import * as XLSX from "xlsx";
import { JURISDICTION_DATA_TYPES } from "../constants/enums.js";
import { assertExpectedTemplate } from "./detectTemplate.js";

const REQUIRED = ["jurisdiction", "data_type", "title", "summary"];

function clean(value) {
  return typeof value === "string" ? value.trim() : value;
}

function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function parseJurisdictionDataFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  assertExpectedTemplate(workbook, "jurisdiction_data");
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
    if (row.data_type && !JURISDICTION_DATA_TYPES.includes(row.data_type)) {
      errors.push(`invalid data_type "${row.data_type}"`);
    }

    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join("; ") });
      return;
    }

    valid.push({
      jurisdiction: String(row.jurisdiction).toUpperCase(),
      data_type: row.data_type,
      title: row.title,
      summary: row.summary,
      source_url: row.source_url || "",
      event_date: row.event_date || "",
      language_code: row.language_code || "en",
      tags: splitList(row.tags),
    });
  });

  return { valid, skipped, total: rows.length };
}
