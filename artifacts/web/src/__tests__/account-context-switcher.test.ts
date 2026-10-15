import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "../..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(webRoot, relativePath), "utf8");

const app = read("src/App.tsx");
const layout = read("src/components/layout.tsx");
const provider = read("src/contexts/account-context.tsx");
const switcher = read("src/components/AccountContextSwitcher.tsx");
const travel = read("src/pages/travel.tsx");
const dashboard = read("src/pages/business-dashboard.tsx");
const selectedBusinessEditor = read("src/features/businesses/SelectedBusinessProfileEditor.tsx");
const profile = read("src/pages/profile.tsx");
const map = read("src/pages/map.tsx");
const businesses = read("src/pages/businesses.tsx");
const onboarding = read("src/components/KinfolkOnboarding.tsx");
const supportLensActions = read("src/lib/supportLensActions.ts");

describe("persistent account context Web contract", () => {
  it("mounts a shared account context provider and persistent switcher", () => {
    expect(app).toContain("<AccountContextProvider>");
    expect(layout).toContain("<AccountContextSwitcher />");
    expect(layout).toContain("<AccountContextSwitcher compact />");
    expect(provider).toContain("api/users/me/account-contexts");
    expect(provider).toContain("Fail closed");
    expect(switcher).toContain('data-testid="account-context-switcher"');
    expect(switcher).toContain('data-testid="account-context-option-personal"');
    expect(switcher).toContain('data-testid="account-context-option-admin"');
  });

  it("clears Kinfolk state and sends the selected workspace as a server-validated header", () => {
    expect(travel).toContain('activeChatControllerRef.current?.abort("account_context_changed")');
    expect(travel).toContain('voiceGuardRef.current.invalidate("account_context_changed")');
    expect(travel).toContain("setSessionId(undefined)");
    expect(travel).toContain("setSessions([])");
    expect(travel).toContain("X-MWM-Account-Context");
    expect(travel).toContain("kinfolkAuthHeaders({ \"Content-Type\": \"application/json\" }, activeContext)");
    expect(travel).toContain("isPersonalAccountContext ? messages.slice(-6)");
    expect(travel).toContain('data-testid="kinfolk-nonpersonal-workspace-notice"');
    expect(travel).toContain("isPersonalAccountContext && showMemoryManager");
    expect(travel).toContain("const requestContextKey = activeAccountContextKey");
    expect((travel.match(/activeAccountContextKeyRef\.current !== requestContextKey/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(travel).toContain("setPrefs(DEFAULT_PREFS)");
    expect(travel).toContain("setKinfolkContinuityEnabled(false)");
  });

  it("keeps ordinary business edits bound to the selected business context", () => {
    expect(dashboard).toContain("SelectedBusinessProfileEditor");
    expect(dashboard).toContain("setActiveContext(selectedContext)");
    expect(selectedBusinessEditor).toContain("X-MWM-Account-Context");
    expect(selectedBusinessEditor).toContain("business:${businessId}");
    expect(selectedBusinessEditor).toContain("Select this business workspace before saving its profile.");
  });

  it("offers private member contact and locality editing without a street address", () => {
    expect(profile).toContain("Private contact &amp; home area");
    expect(profile).toContain("Private phone");
    expect(profile).toContain("Home city");
    expect(profile).not.toContain("Show city on my community profile");
    expect(profile).toContain("Mapping with Melanin does not ask for a street address here.");
  });

  it("keeps profile and map personalization inside Personal workspace", () => {
    expect(profile).toContain('const isPersonalAccountContext = activeContext.kind === "personal"');
    expect(profile).toContain('if (activeContext.kind === "business") return <Redirect to="/business-dashboard" />');
    expect(profile).toContain('if (activeContext.kind === "admin") return <Redirect to="/admin" />');
    expect(profile).toContain('headers: { "X-MWM-Account-Context": "personal" }');
    expect(map).toContain("if (!isPersonalAccountContext)");
    expect(map).toContain('accountContextHeader: "personal"');
    expect(map).toContain('"X-MWM-Account-Context": "personal"');
    expect(map).toContain("isPersonalAccountContextRef.current");
    expect(supportLensActions).toContain('"X-MWM-Account-Context": input.accountContextHeader');
  });

  it("gates directory personalization and onboarding to Personal workspace", () => {
    expect(layout).toContain('needsOnboarding && activeContext.kind === "personal"');
    expect(onboarding).toContain('"X-MWM-Account-Context": "personal"');
    expect(businesses).toContain('const isPersonalAccountContext = activeContext.kind === "personal"');
    expect(businesses).toContain("if (!isPersonalAccountContext)");
    expect(businesses).toContain('accountContextHeader: "personal"');
    expect(businesses).toContain("canAdjustSupportLens={isPersonalAccountContext}");
    expect(businesses).toContain("isPersonalAccountContextRef.current");
  });
});
