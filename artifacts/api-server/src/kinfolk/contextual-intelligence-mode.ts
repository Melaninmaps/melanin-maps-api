import { isStaffDemoEligible } from "./staff-demo-policy";

export type ContextualIntelligenceMode = "off" | "staff" | "on";

export function resolveContextualIntelligenceMode(value: string | undefined): ContextualIntelligenceMode {
  const normalized = value?.trim().toLowerCase();
  return normalized === "staff" || normalized === "on" || normalized === "off"
    ? normalized
    : "off";
}

/** This deliberately accepts server-derived authorization values only. */
export function mayUseContextualIntelligence(input: {
  mode: ContextualIntelligenceMode;
  authenticated: boolean;
  administrator: boolean;
  activeTester: boolean;
}): boolean {
  if (!input.authenticated || input.mode === "off") return false;
  return input.mode === "on" || isStaffDemoEligible(input);
}