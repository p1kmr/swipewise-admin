import * as XLSX from "xlsx";
import { QOTD_EXCEL_COLUMNS } from "../constants/enums.js";
import { SKILLS } from "../constants/enums.js";

const EXAMPLE_ROW = {
  question_description: "What is the safest first step when someone promises guaranteed stock returns?",
  answer: "Verify the adviser on the official regulator list",
  explanation:
    "SEBI-registered advisers must follow disclosure rules. Unregistered tipsters often run pump-and-dump schemes.",
  jurisdiction: "IN",
  difficulty_level: 2,
  options: "Invest immediately | Verify on regulator list | Ask friends on WhatsApp",
  language_code: "en",
  skill_tested: "Source Verification",
  active_from: "2026-01-01",
  active_to: "",
};

export function downloadQotdTemplate() {
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: QOTD_EXCEL_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "qotd");
  XLSX.writeFile(wb, "swipewise-qotd-template.xlsx");
}
