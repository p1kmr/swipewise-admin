// Question enums and the canonical Excel columns.
// Source of truth: SwipeWise Question Master Upload Template (Questions + Lookup_Values sheets).

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

// Category is a required free-text field (not a hard dropdown); these are suggested values.
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

// --- Questions sheet column order (21-col master; importer maps by header name) ---
export const QUESTION_COLUMNS = [
  "Jurisdiction_Code",
  "Language_Code",
  "Module",
  "Category",
  "Question_Format",
  "Question_Text",
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
  "Status",
  "Effective_Date",
  "Expiry_Date",
  "Reviewer",
];

// Mandatory columns (per the master's Mandatory/Optional legend row).
export const QUESTION_REQUIRED_COLUMNS = [
  "Jurisdiction_Code",
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
