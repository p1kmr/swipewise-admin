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
