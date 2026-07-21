import * as XLSX from "xlsx";
import { REGISTRY_COLUMNS } from "../constants/enums.js";

const EXAMPLE_ROW = {
  jurisdiction: "IN",
  entity_name: "Example Registered Broker Ltd",
  registration_number: "INB000123456",
  entity_type: "broker",
  status: "active",
  regulator: "SEBI",
  website: "https://example-regulator-entry.gov.in",
};

export function downloadRegistryTemplate() {
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: REGISTRY_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "registry");
  XLSX.writeFile(wb, "swipewise-registry-template.xlsx");
}
