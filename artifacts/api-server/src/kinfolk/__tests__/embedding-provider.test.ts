import { describe, expect, it, vi } from "vitest";
import { createKinfolkEmbedding } from "../embedding-provider";

function vector(length = 1536): number[] {
  return Array.from({ length }, (_, index) => index / 1536);
}

describe("Kinfolk embedding provider boundary", () => {
  it("omits provider calls when semantic retrieval dimensions are not configured", async () => {
    const create = vi.fn();
    await expect(createKinfolkEmbedding("query", {}, create)).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("sends the validated model and exact dimensions and accepts an exact finite vector", async () => {
    const expected = vector();
    const create = vi.fn().mockResolvedValue({ data: [{ embedding: expected }] });
    await expect(createKinfolkEmbedding("x".repeat(9000), {
      KINFOLK_EMBEDDING_DIMENSIONS: "1536",
    }, create)).resolves.toEqual(expected);
    expect(create).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      dimensions: 1536,
      input: "x".repeat(8192),
    });
  });

  it.each([
    ["short", vector(1535)],
    ["long", vector(1537)],
    ["non-finite", [...vector(1535), Number.NaN]],
    ["malformed", "not-a-vector"],
  ])("rejects a %s provider vector", async (_label, embedding) => {
    const create = vi.fn().mockResolvedValue({ data: [{ embedding }] });
    await expect(createKinfolkEmbedding("query", {
      KINFOLK_EMBEDDING_DIMENSIONS: "1536",
    }, create)).resolves.toBeNull();
  });
});
