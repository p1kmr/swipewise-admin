import * as XLSX from "xlsx";
import { TRANSLATION_COLUMNS } from "../constants/enums.js";

const EXAMPLE_ROW = {
  content_type: "content",
  source_id: "paste-source-mongodb-id-here",
  jurisdiction: "IN",
  target_language: "hi",
  scenario_text: "Translated scenario text",
  explanation: "Translated explanation",
  action_step: "Translated action step",
  title: "",
  nodes_json: "",
  question_description: "",
  answer: "",
};

export function downloadTranslationTemplate() {
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: TRANSLATION_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "translations");
  XLSX.writeFile(wb, "swipewise-translation-template.xlsx");
}
