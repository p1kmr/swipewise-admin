import * as XLSX from "xlsx";
import { EXCEL_COLUMNS } from "../constants/enums.js";

// One filled example row so authors see the expected format (delimiters, verdict values, etc.).
const EXAMPLE_ROW = {
  jurisdiction: "IN",
  language_code: "en",
  visual_type: "whatsapp_bubble",
  scenario_text: "Guaranteed 30% monthly returns! Join our exclusive VIP trading group now.",
  verdict: "dont_trust",
  explanation:
    "No SEBI-registered adviser guarantees returns. Guaranteed high returns + urgency is a classic scam hook.",
  red_flags: "guaranteed returns | urgency | unregistered group",
  action_step: "Verify the adviser on the SEBI intermediary list before acting.",
  verification_link: "https://www.sebi.gov.in/intermediaries.html",
  ai_under_hood_why_shown: "You recently missed cards about guaranteed-return scams.",
  ai_under_hood_what_it_tests: "Recognising unrealistic return promises.",
  difficulty: 1,
  bucket: "mutual_funds",
  skill_tested: "Hallucination Detection",
};

// Build and download the Excel template with the canonical columns + one example row.
export function downloadCardTemplate() {
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: EXCEL_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "cards");
  XLSX.writeFile(wb, "swipewise-cards-template.xlsx");
}
