import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const mobileWaitlist = readFileSync(resolve(here, "../app/waitlist.tsx"), "utf8");
const mobileRecovery = readFileSync(resolve(here, "../app/forgot-password.tsx"), "utf8");

describe("mobile waitlist and password recovery contract", () => {
  it("submits one platform-specific source and never shows success after a failed join", () => {
    expect(mobileWaitlist).toContain('signupSource: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"');
    expect(mobileWaitlist).toContain("if (!res.ok)");
    expect(mobileWaitlist).toContain("setJoinError");
    expect(mobileWaitlist).toContain("setSubmitted(true);");
  });

  it("requires a member rollout city and submits it separately from a city nomination", () => {
    expect(mobileWaitlist).toContain('const [city, setCity] = useState("");');
    expect(mobileWaitlist).toContain('const [state, setState] = useState("");');
    expect(mobileWaitlist).toContain("const cityValid = city.trim().length >= 2;");
    expect(mobileWaitlist).toContain("const valid = emailValid && cityValid && websiteValid;");
    expect(mobileWaitlist).toContain("city: city.trim(),");
    expect(mobileWaitlist).toContain("state: state.trim().toUpperCase() || undefined,");
    expect(mobileWaitlist).toContain("Your City");
    expect(mobileWaitlist).toContain("cityNomination: cityNomination.trim() || undefined,");
  });

  it("does not show an active tester as awaiting approval after a waitlist submission", () => {
    expect(mobileWaitlist).toContain("testerAccessActive?: boolean;");
    expect(mobileWaitlist).toContain("setTesterAccessActive(data.testerAccessActive === true);");
    expect(mobileWaitlist).toContain('"Tester access is active"');
    expect(mobileWaitlist).toContain("No wait for approval is required");
  });

  it("uses the existing API's canonical referral code for post-signup sharing", () => {
    expect(mobileWaitlist).toContain('const [referralCode, setReferralCode] = useState("");');
    expect(mobileWaitlist).toContain("referralCode?: string;");
    expect(mobileWaitlist).toContain("setReferralCode(data.referralCode ?? code);");
    expect(mobileWaitlist.indexOf("setReferralCode(data.referralCode ?? code);")).toBeLessThan(
      mobileWaitlist.indexOf("setSubmitted(true);"),
    );
    expect(mobileWaitlist).toContain("referralLink = REFERRAL_URL + referralCode");
  });

  it("shows business-recommendation success only after a successful response", () => {
    const recommendModal = mobileWaitlist.slice(
      mobileWaitlist.indexOf("function RecommendModal"),
      mobileWaitlist.indexOf("export default function WaitlistScreen"),
    );
    const submit = recommendModal.slice(
      recommendModal.indexOf("const handleSubmit = async"),
      recommendModal.indexOf("const bottomPad"),
    );

    expect(recommendModal).toContain('const [error, setError] = useState("");');
    expect(recommendModal).toContain("{!!error && <View style={{ flexDirection: \"row\"");
    expect(submit).toContain("if (!res.ok)");
    expect(submit).toContain('setError(data.error ?? "We could not save this recommendation. Please try again.");');
    expect(submit).toContain('setError("We could not connect. Please check your connection and try again.");');
    expect(submit.indexOf("if (!res.ok)")).toBeLessThan(submit.indexOf("setDone(true);"));
    expect(submit).toContain("finally { setLoading(false); }");
    expect(submit).not.toContain("finally { setLoading(false); setDone(true); }");
  });

  it("keeps email recovery and adds verified-phone recovery rather than phone login", () => {
    expect(mobileRecovery).toContain('useState<"email" | "phone">("email")');
    expect(mobileRecovery).toContain('"/api/auth/phone/forgot-password/send"');
    expect(mobileRecovery).toContain('"/api/auth/phone/reset-password"');
    expect(mobileRecovery).toContain("Verified Phone Number");
  });
});
