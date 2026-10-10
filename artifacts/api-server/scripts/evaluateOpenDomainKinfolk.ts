import { writeFile } from "node:fs/promises";
import OpenAI from "openai";
import { buildLeanGeneralChatPrompt } from "../src/kinfolk/lean-general-chat";
import { parseKinfolkModelPayload } from "../src/kinfolk/itinerary-response";
import { sanitizeKinfolkGeneralReply } from "../src/kinfolk/general-reply-presentation";

const MODEL = "gpt-5-mini";
const OUTPUT = "/home/ubuntu/work/ranking-score-audit/KINFOLKAI_OPEN_DOMAIN_MODEL_EVALUATION_SANITIZED_2026-10-10.json";

const cases = [
  {
    id: "stable_explanation",
    prompt: "Why can a sourdough starter rise quickly and then collapse? Explain it to a beginner.",
  },
  {
    id: "comparison",
    prompt: "Compare a paper journal and a digital journal for someone who wants privacy, searchability, and a low-friction daily habit.",
  },
  {
    id: "practical_planning",
    prompt: "Give me a simple way to choose one next task when I feel scattered, without assuming anything about my life.",
  },
  {
    id: "writing",
    prompt: "Rewrite this so it is warm and direct: I need more time to consider the offer and will respond by Friday.",
  },
  {
    id: "creative",
    prompt: "Write a short bedtime story about a shy moon explorer who learns to ask for help.",
  },
  {
    id: "social_interpretation",
    prompt: "A friend stopped replying after we made plans. What are a few respectful interpretations, and what is a calm message I could send?",
  },
  {
    id: "technical_explanation",
    prompt: "Explain what a checksum is to someone who has never written code, using one everyday analogy.",
  },
  {
    id: "cultural_reasoning",
    prompt: "How can I talk about the difference between popularity, criticism, and cultural influence without presenting my opinion as a fact?",
  },
] as const;

function text(content: unknown): string {
  return typeof content === "string" ? content.trim() : "";
}

async function main() {
  const client = new OpenAI();
  const system = buildLeanGeneralChatPrompt("big_cousin");
  const results = [] as Array<Record<string, unknown>>;

  for (const item of cases) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: item.prompt },
      ],
      max_completion_tokens: 2_400,
    });
    const raw = text(response.choices[0]?.message?.content);
    const parsed = parseKinfolkModelPayload(raw, { allowPlainTextReply: true });
    const reply = parsed.valid
      ? sanitizeKinfolkGeneralReply(parsed.reply)
      : parsed.reply;
    const hasEnvelopeLeak = /(?:^|\n)\s*(?:recommendations|followUpSuggestions|smartPromotion|taskAction)\s*:/i.test(reply);
    results.push({
      id: item.id,
      prompt: item.prompt,
      finishReason: response.choices[0]?.finish_reason ?? null,
      parsed: parsed.valid,
      replyLength: reply.length,
      hasEnvelopeLeak,
      usable: parsed.valid && reply.length >= 80,
      reply,
    });
  }

  const usable = results.filter((item) => item.usable === true).length;
  const envelopeLeaks = results.filter((item) => item.hasEnvelopeLeak === true).length;
  await writeFile(
    OUTPUT,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      model: MODEL,
      promptContract: "buildLeanGeneralChatPrompt(big_cousin)",
      total: results.length,
      usable,
      envelopeLeaks,
      results,
    }, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify({ output: OUTPUT, model: MODEL, total: results.length, usable, envelopeLeaks }));
}

void main();
