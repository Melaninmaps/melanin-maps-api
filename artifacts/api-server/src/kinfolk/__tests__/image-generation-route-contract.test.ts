import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

const creationRoute = routeSource.slice(
  routeSource.indexOf('router.post("/kinfolk/images/generate"'),
  routeSource.indexOf('router.post("/kinfolk/chat"'),
);

describe("Kinfolk image generation route contract", () => {
  it("requires an authenticated member and two explicit acknowledgements", () => {
    expect(creationRoute).toContain('if (!req.user?.id)');
    expect(creationRoute).toContain("providerDisclosureAccepted");
    expect(creationRoute).toContain("noRealPersonOrPrivateInfoConfirmed");
    expect(creationRoute).toContain("decideKinfolkImageCreation");
  });

  it("returns an ephemeral labeled data URL without storage, chat, or memory persistence", () => {
    expect(creationRoute).toContain("generateImageBuffer");
    expect(creationRoute).toContain("imageDataUrl");
    expect(creationRoute).toContain("KINFOLK_IMAGE_CREATION_LABEL");
    expect(creationRoute).toContain('"Cache-Control", "no-store"');
    expect(creationRoute).not.toContain("kinfolkPrivateMemoriesTable");
    expect(creationRoute).not.toContain("objectStorage");
    expect(creationRoute).not.toContain("persistExplicitMemberMemory");
  });
});
