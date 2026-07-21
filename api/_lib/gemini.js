import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const MODEL = "gemini-2.5-flash";

const VERDICTS = ["trust", "dont_trust", "verify_first"];
const VISUAL_TYPES = ["whatsapp_bubble", "email", "social_post", "advertisement", "plain_text"];
const SKILLS = [
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

const cardSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scenario_text: { type: SchemaType.STRING },
    visual_type: { type: SchemaType.STRING, format: "enum", enum: VISUAL_TYPES },
    verdict: { type: SchemaType.STRING, format: "enum", enum: VERDICTS },
    explanation: { type: SchemaType.STRING },
    red_flags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    action_step: { type: SchemaType.STRING },
    verification_link: { type: SchemaType.STRING },
    ai_under_hood_why_shown: { type: SchemaType.STRING },
    ai_under_hood_what_it_tests: { type: SchemaType.STRING },
    difficulty: { type: SchemaType.NUMBER },
    skill_tested: { type: SchemaType.STRING, format: "enum", enum: SKILLS },
  },
  required: [
    "scenario_text",
    "visual_type",
    "verdict",
    "explanation",
    "red_flags",
    "action_step",
    "ai_under_hood_why_shown",
    "ai_under_hood_what_it_tests",
    "difficulty",
    "skill_tested",
  ],
};

const responseSchema = { type: SchemaType.ARRAY, items: cardSchema };

export function buildPrompt(params) {
  const {
    jurisdiction = "the target jurisdiction",
    language_code = "en",
    difficulty_min = 1,
    difficulty_max = 5,
    bucket = "",
    skills = [],
    count = 5,
  } = params;

  return [
    "You are a content designer for SwipeWise, an investor-literacy training app.",
    `Read the attached source document and design ${count} distinct "swipe card" scenarios`,
    "that teach retail investors to spot misinformation, scams, and AI-generated deception.",
    "",
    "Rules:",
    "- Ground every scenario in facts, rules, or examples found in the attached document. Do not invent regulations.",
    `- Jurisdiction: ${jurisdiction}. Write for that market's rules and context.`,
    `- Language: write all user-facing text using language code "${language_code}".`,
    `- difficulty is an integer from ${difficulty_min} to ${difficulty_max} (1 = easy, 5 = expert).`,
    bucket ? `- Content bucket / theme: ${bucket}.` : "",
    skills.length ? `- Prioritise these skills where the source supports them: ${skills.join(", ")}.` : "",
    '- "verdict" is the correct judgement a user should reach: "trust", "dont_trust", or "verify_first".',
    '- "visual_type" is how the scenario is framed: whatsapp_bubble, email, social_post, advertisement, or plain_text.',
    '- "red_flags" lists the specific warning signs present (use an empty array when verdict is "trust").',
    '- "explanation" says why the verdict is correct; "action_step" is one concrete next step for the user.',
    '- "ai_under_hood_why_shown" explains why this card was surfaced; "ai_under_hood_what_it_tests" names the skill it probes.',
    "- No personal data, no real named individuals, no real account numbers.",
    "Return ONLY the JSON array defined by the response schema.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function normalizeCards(cards, params) {
  const jurisdiction = params.jurisdiction || "";
  const language_code = params.language_code || "en";
  const bucket = params.bucket || "";

  return (Array.isArray(cards) ? cards : []).map((c) => ({
    jurisdiction,
    language_code,
    bucket,
    visual_type: c.visual_type || "plain_text",
    scenario_text: c.scenario_text || "",
    verdict: c.verdict || "",
    explanation: c.explanation || "",
    red_flags: Array.isArray(c.red_flags) ? c.red_flags : [],
    action_step: c.action_step || "",
    verification_link: c.verification_link || "",
    ai_under_hood: {
      why_shown: c.ai_under_hood_why_shown || "",
      what_it_tests: c.ai_under_hood_what_it_tests || "",
    },
    difficulty: Number(c.difficulty) || 3,
    skill_tested: c.skill_tested || "",
  }));
}

export async function generateCardsFromPdf(pdfBase64, mimeType, params) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    },
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType || "application/pdf", data: pdfBase64 } },
          { text: buildPrompt(params) },
        ],
      },
    ],
  });

  const cards = JSON.parse(result.response.text());
  return normalizeCards(cards, params);
}
