// Server-side constants — keep collection names in sync with src/constants/collections.js
export const COLLECTIONS = {
  CONTENT: "content",
  SCRIPTS: "scripts",
  QOTD: "qotd",
  CONFIG: "config",
  JURISDICTION_DATA: "jurisdiction_data",
  JURISDICTION_REGISTRY: "jurisdiction_registry",
  RAW_DATA: "raw_data",
  GENERATION_LOGS: "generation_logs",
  // Internal: per-jurisdiction sequence counters for Question_ID generation.
  COUNTERS: "counters",
};

export const DEFAULT_DB_NAME = "swipewise_admin";
export const MAX_PDF_BYTES = 4 * 1024 * 1024;

// Question-bank enums (mirror src/constants/enums.js; source: Question Upload Template v3).
export const QUESTION_FORMATS = ["Swipe_TrueFalse", "MCQ_Single", "MCQ_Multi", "Scenario_Card"];
export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
export const STATUSES = ["Draft", "Active", "Inactive", "Archived"];
export const MCQ_OPTION_KEYS = ["A", "B", "C", "D"];
