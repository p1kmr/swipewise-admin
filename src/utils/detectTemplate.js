import * as XLSX from "xlsx";

// Human-readable page each template belongs on (used in "wrong page" messages).
export const TEMPLATE_LABELS = {
  questions: "Upload Questions",
  qotd: "QOTD",
  jurisdiction_data: "Jurisdictions → Data",
  registry: "Jurisdictions → Registry",
  translation: "Jurisdictions → Translations",
};

// Signature columns that uniquely identify each single-sheet template.
const SIGNATURES = [
  { name: "translation", cols: ["content_type", "source_id", "target_language"] },
  { name: "registry", cols: ["entity_name", "registration_number"] },
  { name: "jurisdiction_data", cols: ["data_type", "title", "summary"] },
  { name: "qotd", cols: ["question_description", "answer", "difficulty_level"] },
  { name: "questions", cols: ["Question_Text", "Correct_Answer", "Question_Format"] },
];

function firstHeaderRow(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const header = rows.find((r) => r.some((c) => String(c).trim() !== "")) || [];
  return header.map((h) => String(h).trim());
}

// Best-guess which known template a workbook is, or null if it matches none.
export function detectTemplate(workbook) {
  const names = workbook.SheetNames || [];

  // The Question Bank workbook is unmistakable: it carries Questions + Lookup_Values sheets.
  if (names.includes("Questions") && names.includes("Lookup_Values")) return "questions";

  const keys = new Set(firstHeaderRow(workbook, names[0]));
  let best = null;
  let bestScore = 0;
  for (const sig of SIGNATURES) {
    const score = sig.cols.filter((c) => keys.has(c)).length / sig.cols.length;
    if (score > bestScore) {
      bestScore = score;
      best = sig.name;
    }
  }
  return bestScore >= 0.6 ? best : null;
}

// Throw a friendly "wrong page" error when the file clearly belongs to a different importer.
export function assertExpectedTemplate(workbook, expected) {
  const detected = detectTemplate(workbook);
  if (detected && detected !== expected) {
    throw new Error(
      `This looks like the "${TEMPLATE_LABELS[detected]}" template, not the ` +
        `"${TEMPLATE_LABELS[expected]}" one. Upload it on the "${TEMPLATE_LABELS[detected]}" page instead.`
    );
  }
}
