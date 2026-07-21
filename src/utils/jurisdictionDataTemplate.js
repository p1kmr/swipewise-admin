import * as XLSX from "xlsx";
import { JURISDICTION_DATA_COLUMNS } from "../constants/enums.js";

const EXAMPLE_ROW = {
  jurisdiction: "IN",
  data_type: "investor_alert",
  title: "SEBI warning on unregistered WhatsApp stock tips",
  summary:
    "Regulator alerts investors about channels promising guaranteed returns via unregistered advisory services.",
  source_url: "https://sebi.gov.in",
  event_date: "2026-01-15",
  language_code: "en",
  tags: "investment scam | telegram",
};

export function downloadJurisdictionDataTemplate() {
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: JURISDICTION_DATA_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "jurisdiction_data");
  XLSX.writeFile(wb, "swipewise-jurisdiction-data-template.xlsx");
}
