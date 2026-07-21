import * as XLSX from "xlsx";
import { REGISTRY_ENTITY_TYPES, REGISTRY_STATUSES } from "../constants/enums.js";

const REQUIRED = ["jurisdiction", "entity_name", "registration_number"];

function clean(value) {
  return typeof value === "string" ? value.trim() : value;
}

export async function parseRegistryFile(file) {
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
    if (row.entity_type && !REGISTRY_ENTITY_TYPES.includes(row.entity_type)) {
      errors.push(`invalid entity_type "${row.entity_type}"`);
    }
    if (row.status && !REGISTRY_STATUSES.includes(row.status)) {
      errors.push(`invalid status "${row.status}"`);
    }

    if (errors.length) {
      skipped.push({ row: rowNum, reason: errors.join("; ") });
      return;
    }

    valid.push({
      jurisdiction: String(row.jurisdiction).toUpperCase(),
      entity_name: row.entity_name,
      registration_number: row.registration_number,
      entity_type: row.entity_type || "other",
      status: row.status || "active",
      regulator: row.regulator || "",
      website: row.website || "",
    });
  });

  return { valid, skipped, total: rows.length };
}
