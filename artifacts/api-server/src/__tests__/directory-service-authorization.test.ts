import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../directoryImport/automatedDirectoryRoutes.ts", import.meta.url)),
  "utf8",
);
const authorizationSource = readFileSync(
  fileURLToPath(new URL("../directoryImport/directoryServiceAuth.ts", import.meta.url)),
  "utf8",
);

describe("directory service authorization contract", () => {
  it("scopes machine authorization to directory ingress and receipt summary only", () => {
    expect(routeSource).toContain("authorizeDirectoryOperator(req)");
    expect(routeSource).toContain('app.get("/api/founder/directory-import/service/summary"');
    expect(routeSource).toContain('app.post("/api/founder/directory-import/ingress"');
    expect(authorizationSource).toContain("process.env.DIRECTORY_SERVICE_TOKEN");
    expect(authorizationSource).toContain("timingSafeEqual");
    expect(authorizationSource).toContain("x-directory-service-signature");
    expect(authorizationSource).toContain("usedNonces.has(nonce)");
  });

  it("does not grant the service token access to founder batch-control routes", () => {
    const batchRoutes = routeSource.slice(
      routeSource.indexOf('app.get("/api/founder/directory-import/batches"'),
      routeSource.indexOf('app.get("/api/founder/directory-import/service/summary"'),
    );
    expect(batchRoutes).toContain("if (!admin(req, res)) return;");
    expect(batchRoutes).not.toContain("authorizeDirectoryOperator(req)");
  });

  it("retains signed ingress and isolated review semantics", () => {
    expect(routeSource).toContain("verifyDirectoryIngress");
    expect(routeSource).toContain("verifyDirectoryManifest");
    expect(routeSource).toContain("classifyAutomatedReviewBatch");
    expect(routeSource).toContain("directory_review_outbox");
  });
});
