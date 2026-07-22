// Question-bank enums and the canonical Excel columns.
// Source of truth: SwipeWise Question Upload Template v3 (README + Lookup_Values sheets).

// --- Lookup_Values dropdown enums (validated on upload) ---

export const JURISDICTION_CODES = [
  "GLOBAL",
  "IN",
  "US",
  "UK",
  "SG",
  "AU",
  "HK",
  "CA",
  "EU",
  "ZA",
  "AE",
  "JP",
  "BR",
];

export const REGULATORS = [
  "GLOBAL",
  "SEBI",
  "SEC",
  "FCA",
  "MAS",
  "ASIC",
  "SFC",
  "CSA",
  "ESMA",
  "FSCA",
  "SCA",
  "FSA",
  "CVM",
];

export const LANGUAGE_CODES = ["en", "hi", "mr", "es", "fr", "ar", "zh", "pt", "ja", "de"];

export const MODULES = [
  "Fraud Awareness",
  "Investing Basics",
  "Risk Management",
  "Digital & Cyber Safety",
  "Regulatory & Compliance",
  "Retirement Planning",
  "Market Manipulation",
];

// Category is a required free-text field (not a hard dropdown); these are the suggested values.
export const CATEGORIES = [
  "Ponzi Scheme",
  "Phishing",
  "Insider Trading",
  "Pump and Dump",
  "Fake Investment Advisor",
  "KYC/Identity Fraud",
  "Crypto Scam",
  "Social Media Fraud",
  "Guaranteed Returns Scam",
  "Unauthorized Trading",
  "Advance Fee Fraud",
  "Fake IPO/Bond Offer",
  "Mis-selling / Unsuitable Product",
  "Deepfake / Impersonation",
  "Job / Task Scam",
  "Legitimate Practice",
];

export const QUESTION_FORMATS = ["Swipe_TrueFalse", "MCQ_Single", "MCQ_Multi", "Scenario_Card"];

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export const STATUSES = ["Draft", "Active", "Inactive", "Archived"];

// Status badge styling (full Tailwind class strings so the JIT scanner picks them up).
export const STATUS_META = {
  Draft: { label: "Draft", badge: "bg-verdict-verify_first/10 text-verdict-verify_first" },
  Active: { label: "Active", badge: "bg-verdict-trust/10 text-verdict-trust" },
  Inactive: { label: "Inactive", badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  Archived: { label: "Archived", badge: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

export const MCQ_OPTION_KEYS = ["A", "B", "C", "D"];

// --- Questions sheet column order (importer maps by header name; keep this order for the template) ---
export const QUESTION_COLUMNS = [
  "Question_ID",
  "Jurisdiction_Code",
  "Regulator",
  "Language_Code",
  "Module",
  "Category",
  "Question_Format",
  "Question_Text",
  "Scenario_Context",
  "Option_A",
  "Option_B",
  "Option_C",
  "Option_D",
  "Correct_Answer",
  "Explanation_Feedback",
  "AI_Explainer_Context",
  "Regulatory_Reference",
  "Difficulty",
  "Points",
  "Media_URL",
  "Tags",
  "Status",
  "Effective_Date",
  "Expiry_Date",
  "Created_By",
  "Reviewer",
];

// Mandatory columns (per the template's Mandatory/Optional legend row).
export const QUESTION_REQUIRED_COLUMNS = [
  "Jurisdiction_Code",
  "Regulator",
  "Language_Code",
  "Module",
  "Category",
  "Question_Format",
  "Question_Text",
  "Correct_Answer",
  "Explanation_Feedback",
  "Difficulty",
  "Status",
];

// --- Nine Awareness Index skill dimensions (still used by QOTD, SOW §4.4) ---
export const SKILLS = [
  "Hallucination Detection",
  "Deepfake Recognition",
  "Source Verification",
  "AI Explainability",
  "Confidence Calibration",
  "Market Fundamentals",
  "Verification Behaviour",
  "Risk Awareness",
  "Critical Thinking",
];

export const WISEBOT_AVATAR_STATES = ["neutral", "happy", "concerned", "encouraging"];
export const WISEBOT_AVATAR_OPTIONS = WISEBOT_AVATAR_STATES;

// --- QOTD Excel columns (SOW Appendix C) — unchanged ---
export const QOTD_EXCEL_COLUMNS = [
  "question_description",
  "answer",
  "explanation",
  "jurisdiction",
  "difficulty_level",
  "options",
  "language_code",
  "skill_tested",
  "active_from",
  "active_to",
];

// --- Jurisdiction data / registry (unchanged) ---
export const JURISDICTION_DATA_TYPES = [
  "scam_case",
  "enforcement_order",
  "regulatory_rule",
  "investor_alert",
  "market_update",
  "scam_pattern",
  "regulator_notice",
];

export const JURISDICTION_DATA_COLUMNS = [
  "jurisdiction",
  "data_type",
  "title",
  "summary",
  "source_url",
  "event_date",
  "language_code",
  "tags",
];

export const REGISTRY_ENTITY_TYPES = ["broker", "adviser", "fund", "bank", "other"];
export const REGISTRY_STATUSES = ["active", "suspended", "revoked"];

export const REGISTRY_COLUMNS = [
  "jurisdiction",
  "entity_name",
  "registration_number",
  "entity_type",
  "status",
  "regulator",
  "website",
];

// --- Translation import columns (updated to the v3 content field names) ---
export const TRANSLATION_COLUMNS = [
  "content_type",
  "source_id",
  "jurisdiction",
  "target_language",
  "question_text",
  "explanation_feedback",
  "scenario_context",
  "title",
  "nodes_json",
  "question_description",
  "answer",
];
