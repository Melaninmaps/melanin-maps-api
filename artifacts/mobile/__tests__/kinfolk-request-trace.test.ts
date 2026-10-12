import { describe, expect, it } from "vitest";
import {
  createKinfolkClientTrace,
  KINFOLK_CLIENT_TRACE_HEADER,
  kinfolkTraceReference,
} from "../lib/kinfolkRequestTrace";

describe("Kinfolk mobile request trace", () => {
  it("creates an opaque per-attempt correlation code", () => {
    const trace = createKinfolkClientTrace();
    expect(trace).toMatch(/^mkm-[a-z0-9]{6,16}-[a-z0-9]{6,16}$/);
    expect(trace).not.toContain("@");
    expect(KINFOLK_CLIENT_TRACE_HEADER).toBe("X-Kinfolk-Client-Trace");
    expect(kinfolkTraceReference(trace)).toContain(trace);
  });
});
