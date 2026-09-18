import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const profile = readFileSync(
  fileURLToPath(new URL("../pages/profile.tsx", import.meta.url)),
  "utf8",
);

describe("profile settings viewport", () => {
  it("opens retained account controls without reinstating a second profile header or off-screen avatar", () => {
    expect(profile).toContain('const legacyAccountControlsRef = useRef<HTMLDivElement>(null)');
    expect(profile).toContain('legacyAccountControlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })');
    expect(profile).toContain('ref={legacyAccountControlsRef}');
    expect(profile).toContain('id="legacy-account-controls"');
    expect(profile).toContain('className="container mx-auto max-w-6xl scroll-mt-24 px-4 pb-12 md:px-6"');
    expect(profile).toContain("Profile & account controls");
    expect(profile).not.toContain('bg-[#2B1507] h-72 sm:h-60 md:h-52 w-full absolute top-0 z-0');
    expect(profile).not.toContain('text-3xl md:text-5xl font-serif font-bold text-white tracking-tight');
    expect(profile).not.toContain('relative w-24 h-24 mx-auto -mt-16 mb-4');
  });

  it("keeps existing profile editing, privacy, badge, and account actions reachable", () => {
    for (const marker of [
      "Profile Visibility",
      "Change Password",
      "All Devices",
      "Sign Out",
      "Community Badges",
      "api/auth/user/privacy",
      "api/auth/change-password",
      "api/users/avatar",
      "Save Changes",
    ]) {
      expect(profile).toContain(marker);
    }
  });
});
