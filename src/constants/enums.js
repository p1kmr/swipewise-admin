// Swipe-card enums and the canonical Excel columns (SOW Appendix A / swipewise_schema.json).

export const VERDICTS = ["trust", "dont_trust", "verify_first"];

// Full Tailwind class strings so the JIT scanner picks them up.
export const VERDICT_META = {
  trust: { label: "Trust", badge: "bg-verdict-trust/10 text-verdict-trust" },
  dont_trust: { label: "Don't trust", badge: "bg-verdict-dont_trust/10 text-verdict-dont_trust" },
  verify_first: { label: "Verify first", badge: "bg-verdict-verify_first/10 text-verdict-verify_first" },
};

export const VISUAL_TYPES = [
  "whatsapp_bubble",
  "email",
  "social_post",
  "advertisement",
  "plain_text",
];

// Nine Awareness Index skill dimensions (SOW §4.4).
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

// Excel template column order.
export const EXCEL_COLUMNS = [
  "jurisdiction",
  "language_code",
  "visual_type",
  "scenario_text",
  "verdict",
  "explanation",
  "red_flags",
  "action_step",
  "verification_link",
  "ai_under_hood_why_shown",
  "ai_under_hood_what_it_tests",
  "difficulty",
  "bucket",
  "skill_tested",
];

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

export const TRANSLATION_COLUMNS = [
  "content_type",
  "source_id",
  "jurisdiction",
  "target_language",
  "scenario_text",
  "explanation",
  "action_step",
  "title",
  "nodes_json",
  "question_description",
  "answer",
];

export const WISEBOT_AVATAR_OPTIONS = WISEBOT_AVATAR_STATES;
