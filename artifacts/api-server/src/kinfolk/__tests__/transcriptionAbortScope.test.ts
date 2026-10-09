import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { createTranscriptionAbortScope } from "../transcriptionAbortScope";

function requestFixture() {
  const request = new EventEmitter() as EventEmitter & { aborted?: boolean };
  request.aborted = false;
  return request;
}

function responseFixture() {
  const response = new EventEmitter() as EventEmitter & { writableEnded?: boolean };
  response.writableEnded = false;
  return response;
}

describe("transcription abort scope", () => {
  it("is wired into the live transcription provider route", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
      "utf8",
    );

    expect(route).toContain("createTranscriptionAbortScope(req, res, 15_000)");
    expect(route).toContain("{ signal: transcriptionScope.signal }");
    expect(route).toContain("if (transcriptionScope.wasClientCancelled()) return;");
    expect(route).toContain("transcriptionScope.dispose()");
  });

  it("aborts provider work when the upload request is aborted", () => {
    const request = requestFixture();
    const response = responseFixture();
    const scope = createTranscriptionAbortScope(request, response, 15_000);

    request.emit("aborted");

    expect(scope.signal.aborted).toBe(true);
    expect(scope.wasClientCancelled()).toBe(true);
    scope.dispose();
  });

  it("aborts provider work when the response connection closes before completion", () => {
    const request = requestFixture();
    const response = responseFixture();
    const scope = createTranscriptionAbortScope(request, response, 15_000);

    response.emit("close");

    expect(scope.signal.aborted).toBe(true);
    expect(scope.wasClientCancelled()).toBe(true);
    scope.dispose();
  });

  it("does not misclassify a normally completed response as a cancellation", () => {
    const request = requestFixture();
    const response = responseFixture();
    response.writableEnded = true;
    const scope = createTranscriptionAbortScope(request, response, 15_000);

    response.emit("close");

    expect(scope.signal.aborted).toBe(false);
    expect(scope.wasClientCancelled()).toBe(false);
    scope.dispose();
  });

  it("removes listeners and clears the timeout on disposal", () => {
    vi.useFakeTimers();
    const request = requestFixture();
    const response = responseFixture();
    const scope = createTranscriptionAbortScope(request, response, 15_000);

    scope.dispose();
    vi.advanceTimersByTime(15_001);

    expect(scope.signal.aborted).toBe(false);
    expect(request.listenerCount("aborted")).toBe(0);
    expect(response.listenerCount("close")).toBe(0);
    vi.useRealTimers();
  });
});
