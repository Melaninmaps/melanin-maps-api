const MAX_EDIT_INSTRUCTION = 800;
const BLOCKED = /\b(?:face[ -]?swap|impersonat|deepfake|nude|sexuali[sz]e|undress|remove (?:their |the )?clothes|change (?:their |the )?(?:race|ethnicity|age|body|identity)|forge|counterfeit|passport|driver'?s? license|medical record)\b/i;
export const KINFOLK_IMAGE_EDIT_LABEL = "AI-edited visual";
export function decideKinfolkImageEdit(input: { imageAssetId: unknown; instruction: unknown; providerDisclosureAccepted: unknown; editConsentAccepted: unknown }) {
  const imageAssetId = typeof input.imageAssetId === "string" ? input.imageAssetId.trim().toLowerCase() : "";
  const instruction = typeof input.instruction === "string" ? input.instruction.trim().replace(/\s+/g, " ") : "";
  if (!imageAssetId || !/^[0-9a-f-]{36}$/i.test(imageAssetId)) return { ok: false as const, code: "KINFOLK_IMAGE_EDIT_SOURCE_REQUIRED", error: "Choose one private image to edit." };
  if (instruction.length < 4 || instruction.length > MAX_EDIT_INSTRUCTION) return { ok: false as const, code: "KINFOLK_IMAGE_EDIT_INSTRUCTION_INVALID", error: "Describe a short, specific image change." };
  if (!input.providerDisclosureAccepted || !input.editConsentAccepted) return { ok: false as const, code: "KINFOLK_IMAGE_EDIT_CONSENT_REQUIRED", error: "Confirm private provider processing before editing this image." };
  if (BLOCKED.test(instruction)) return { ok: false as const, code: "KINFOLK_IMAGE_EDIT_UNSAFE", error: "Kinfolk cannot make that kind of image change." };
  return { ok: true as const, imageAssetId, prompt: `Edit the provided image only as requested: ${instruction}\n\nPreserve the original person's identity, body, age, race, ethnicity, and dignity. Do not create sexual content, deceive, forge documents, or infer private facts. Return only the edited image.`, providerDisclosure: "The selected private image and edit instruction are sent once to Kinfolk's configured image provider. The result remains in this session and is not added to memory." };
}
