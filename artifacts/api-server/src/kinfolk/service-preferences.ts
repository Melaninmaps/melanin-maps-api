import type { HairServiceKey } from "../businesses/serviceOfferingPolicy";

export type MemberServicePreference = Readonly<{
  preferredServiceKeys: HairServiceKey[];
  requiredInclusions: Array<"shampoo" | "conditioning" | "detangling" | "drying">;
  excludesPrewashedRequirement: boolean;
}>;

const EMPTY: MemberServicePreference = Object.freeze({ preferredServiceKeys: [], requiredInclusions: [], excludesPrewashedRequirement: false });
const HAIR_REQUEST = /\b(?:hair|hairstyl(?:ist|er)|stylist|salon|locs?|dreadlocks?|retwist|braids?|protective styl(?:e|ing)|silk press|wigs?|lace|sew[- ]?in|detangl|shampoo|condition|installs?)\b/i;

function keys(content: string): HairServiceKey[] {
  const result = new Set<HairServiceKey>();
  if (/\b(?:loc maintenance|locs?|dreadlocks?|retwist|loc styling)\b/i.test(content)) result.add("loc_maintenance");
  if (/\b(?:starter locs?|begin(?:ning)? locs?)\b/i.test(content)) result.add("starter_locs");
  if (/\bretwist(?:s|ing)?\b/i.test(content)) result.add("retwist");
  if (/\bmicrolocs?\b/i.test(content)) result.add("microlocs");
  if (/\b(?:natural hair|natural-hair)\b/i.test(content)) result.add("natural_hair_care");
  if (/\b(?:braids?|protective styl(?:e|ing))\b/i.test(content)) result.add("protective_styling");
  if (/\bsilk press(?:es)?\b/i.test(content)) result.add("silk_press");
  if (/\b(?:wigs?|lace (?:front|install)|install(?:s|ation)?)\b/i.test(content)) result.add("wig_install");
  if (/\bsew[- ]?ins?\b/i.test(content)) result.add("sew_in");
  if (/\b(?:wash and style|wash[- ]?and[- ]?style)\b/i.test(content)) result.add("wash_and_style");
  return [...result];
}

/** Only an explicitly saved member memory reaches this parser. */
export function parseMemberServicePreference(content: string): MemberServicePreference | null {
  if (!HAIR_REQUEST.test(content)) return null;
  const normalized = content.toLowerCase();
  const requiredInclusions: MemberServicePreference["requiredInclusions"] = [];
  if (/\b(?:require|only want|must include|need)\b[^.]{0,80}\bshampoo\b|\bshampoo\b[^.]{0,80}\b(?:require|included|must)\b/i.test(normalized)) requiredInclusions.push("shampoo");
  if (/\b(?:require|only want|must include|need)\b[^.]{0,80}\bcondition(?:ing|er)\b|\bcondition(?:ing|er)\b[^.]{0,80}\b(?:require|included|must)\b/i.test(normalized)) requiredInclusions.push("conditioning");
  if (/\b(?:require|only want|must include|need)\b[^.]{0,80}\bdetangl(?:e|ing)\b|\bdetangl(?:e|ing)\b[^.]{0,80}\b(?:require|included|must)\b/i.test(normalized)) requiredInclusions.push("detangling");
  if (/\b(?:require|only want|must include|need)\b[^.]{0,80}\b(?:blow[- ]?dry|drying)\b/i.test(normalized)) requiredInclusions.push("drying");
  return {
    preferredServiceKeys: keys(normalized),
    requiredInclusions,
    excludesPrewashedRequirement: /\b(?:will not|don't|do not|never)\b[^.]{0,80}\b(?:pre[- ]?washed|arrive pre[- ]?washed)\b/i.test(normalized),
  };
}

export function relevantMemberServicePreferences(memories: readonly { content: string; purpose: string }[], currentMessage: string): MemberServicePreference {
  if (!HAIR_REQUEST.test(currentMessage)) return EMPTY;
  const merged: { preferredServiceKeys: HairServiceKey[]; requiredInclusions: Array<"shampoo" | "conditioning" | "detangling" | "drying">; excludesPrewashedRequirement: boolean } = {
    preferredServiceKeys: [], requiredInclusions: [], excludesPrewashedRequirement: false,
  };
  for (const memory of memories) {
    if (memory.purpose !== "profile_context") continue;
    const parsed = parseMemberServicePreference(memory.content);
    if (!parsed) continue;
    merged.preferredServiceKeys.push(...parsed.preferredServiceKeys);
    merged.requiredInclusions.push(...parsed.requiredInclusions);
    merged.excludesPrewashedRequirement ||= parsed.excludesPrewashedRequirement;
  }
  return { preferredServiceKeys: [...new Set(merged.preferredServiceKeys)], requiredInclusions: [...new Set(merged.requiredInclusions)], excludesPrewashedRequirement: merged.excludesPrewashedRequirement };
}
