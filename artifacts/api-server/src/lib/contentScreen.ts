import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

export type ContentWarningType = "violence" | "nudity" | "disturbing" | "other";

export interface ScreenResult {
  isGraphic: boolean;
  warningType: ContentWarningType | null;
  warningLabel: string | null;
}

const WARNING_LABELS: Record<ContentWarningType, string> = {
  violence: "Graphic Violence",
  nudity: "Explicit Content",
  disturbing: "Disturbing Imagery",
  other: "Sensitive Content",
};

export async function screenImageUrl(imageUrl: string): Promise<ScreenResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Does this image contain graphic violence, explicit nudity, disturbing imagery, or other content that warrants a sensitive content warning? Reply with exactly one of: NO / YES:VIOLENCE / YES:NUDITY / YES:DISTURBING / YES:OTHER",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
      max_tokens: 10,
    });

    const text = (response.choices[0]?.message?.content ?? "").trim().toUpperCase();

    if (!text.startsWith("YES")) return { isGraphic: false, warningType: null, warningLabel: null };

    const warningType: ContentWarningType = text.includes("VIOLENCE") ? "violence"
      : text.includes("NUDITY") ? "nudity"
      : text.includes("DISTURBING") ? "disturbing"
      : "other";

    return {
      isGraphic: true,
      warningType,
      warningLabel: WARNING_LABELS[warningType],
    };
  } catch (err) {
    logger.error({ err }, "[contentScreen] Vision screening failed — defaulting to safe");
    return { isGraphic: false, warningType: null, warningLabel: null };
  }
}

export async function screenVideoBuffer(_buffer: Buffer): Promise<ScreenResult> {
  return {
    isGraphic: true,
    warningType: "other",
    warningLabel: "Video Content",
  };
}
