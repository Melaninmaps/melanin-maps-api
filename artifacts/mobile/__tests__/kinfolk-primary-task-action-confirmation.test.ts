import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("expo-secure-store", () => ({ getItemAsync: vi.fn() }));
vi.mock("@/lib/api", () => ({ getApiBase: () => "https://api.example.test" }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ refreshUser: vi.fn() }) }));
vi.mock("@/lib/kinfolkRequestTrace", () => ({
  createKinfolkClientTrace: () => "trace",
  KINFOLK_CLIENT_TRACE_HEADER: "X-Kinfolk-Client-Trace",
  kinfolkTraceReference: () => "trace",
}));
vi.mock("@/lib/sourceLinks", () => ({ parseSafeSourceLink: () => null }));
vi.mock("@/lib/kinfolkConversationHandoff", () => ({
  clearKinfolkConversation: vi.fn(),
  getKinfolkConversation: vi.fn(() => null),
  recordKinfolkConversation: vi.fn(),
}));
vi.mock("@workspace/constants", () => ({ canRenderKinfolkBusinessCards: () => false }));

const { saveKinfolkTaskAction } = await import("../hooks/useKinfolk");

const hook = readFileSync(
  fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)),
  "utf8",
);
const travel = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);

function between(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

const reminder = {
  type: "create_task" as const,
  tasks: [{ title: "Call the clinic", notes: null, dueAt: null, dueTimeLabel: null, category: "reminder" }],
};

const groceryList = {
  type: "create_list" as const,
  list: { name: "Grocery run", icon: "🛒" },
  tasks: [{ title: "Oat milk", notes: null, dueAt: null, dueTimeLabel: null, category: "grocery" }],
};

function response(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("primary Kinfolk task-action confirmation", () => {
  it("keeps absent authentication and received non-OK responses unsaved and recoverable", async () => {
    const missingSessionFetch = vi.fn<typeof fetch>();
    const missingSession = await saveKinfolkTaskAction({
      action: reminder,
      token: null,
      apiBase: "https://api.example.test",
      fetchImpl: missingSessionFetch,
    });
    expect(missingSession).toMatchObject({ kind: "retryable" });
    expect(missingSessionFetch).not.toHaveBeenCalled();

    const rejectedFetch = vi.fn<typeof fetch>().mockResolvedValue(response(401));
    const rejected = await saveKinfolkTaskAction({
      action: reminder,
      token: "session-token",
      apiBase: "https://api.example.test",
      fetchImpl: rejectedFetch,
    });
    expect(rejected).toMatchObject({ kind: "retryable" });
    expect(rejectedFetch).toHaveBeenCalledTimes(1);
  });

  it("reports success only after the required task write returns OK", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(200, { task: { id: "task-1" } }));
    const result = await saveKinfolkTaskAction({
      action: reminder,
      token: "session-token",
      apiBase: "https://api.example.test",
      fetchImpl: fetchMock,
    });
    expect(result).toEqual({ kind: "saved" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/kinfolk/tasks",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("retries a known failed list-item write without creating a duplicate confirmed list", async () => {
    const initialFetch = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(200, { list: { id: "list-1" } }))
      .mockResolvedValueOnce(response(400));
    const partial = await saveKinfolkTaskAction({
      action: groceryList,
      token: "session-token",
      apiBase: "https://api.example.test",
      fetchImpl: initialFetch,
    });
    expect(partial).toMatchObject({
      kind: "retryable",
      progress: { listId: "list-1", listName: "Grocery run" },
    });
    expect(initialFetch).toHaveBeenCalledTimes(2);

    const retryFetch = vi.fn<typeof fetch>().mockResolvedValue(response(200, { tasks: [{ id: "task-1" }] }));
    const retried = await saveKinfolkTaskAction({
      action: groceryList,
      token: "session-token",
      apiBase: "https://api.example.test",
      progress: partial.kind === "saved" ? undefined : partial.progress,
      fetchImpl: retryFetch,
    });
    expect(retried).toEqual({ kind: "saved" });
    expect(retryFetch).toHaveBeenCalledTimes(1);
    expect(retryFetch).toHaveBeenCalledWith(
      "https://api.example.test/api/kinfolk/tasks/bulk",
      expect.objectContaining({ body: expect.stringContaining('"listId":"list-1"') }),
    );
  });

  it("reports transport and 5xx outcomes as uncertain without automatically repeating writes", async () => {
    const transportFetch = vi.fn<typeof fetch>().mockRejectedValue(new Error("network unavailable"));
    const transport = await saveKinfolkTaskAction({
      action: reminder,
      token: "session-token",
      apiBase: "https://api.example.test",
      fetchImpl: transportFetch,
    });
    expect(transport).toMatchObject({ kind: "uncertain" });
    expect(transportFetch).toHaveBeenCalledTimes(1);

    const serverFetch = vi.fn<typeof fetch>().mockResolvedValue(response(503));
    const server = await saveKinfolkTaskAction({
      action: reminder,
      token: "session-token",
      apiBase: "https://api.example.test",
      fetchImpl: serverFetch,
    });
    expect(server).toMatchObject({ kind: "uncertain" });
    expect(serverFetch).toHaveBeenCalledTimes(1);
  });

  it("checks session readiness before a task-action write and never treats a missing session as saved", () => {
    const helper = between(hook, "export async function saveKinfolkTaskAction", "export function useKinfolk");
    const readiness = helper.slice(
      helper.indexOf("if (!input.token || !input.apiBase)"),
      helper.indexOf("const send = input.fetchImpl ?? fetch"),
    );
    expect(helper).toContain("if (!input.token || !input.apiBase)");
    expect(readiness).toContain("retryableTaskActionFailure(");
    expect(readiness).not.toContain('kind: "saved"');
    expect(helper.indexOf("if (!input.token || !input.apiBase)")).toBeLessThan(helper.indexOf("const send = input.fetchImpl ?? fetch"));
    expect(helper).toContain("Please sign in again before saving this reminder");
  });

  it("requires an OK receipt for every list, single-task, and bulk-task write", () => {
    const helper = between(hook, "export async function saveKinfolkTaskAction", "export function useKinfolk");
    expect(helper).toContain("if (!listResponse.ok)");
    expect(helper).toContain("if (!taskResponse.ok)");
    expect(helper.match(/if \(!tasksResponse\.ok\)/g)).toHaveLength(2);
    expect(helper).toContain("`${input.apiBase}/api/kinfolk/lists`");
    expect(helper).toContain("`${input.apiBase}/api/kinfolk/tasks`");
    expect(helper).toContain("`${input.apiBase}/api/kinfolk/tasks/bulk`");
  });

  it("retains a confirmed list receipt so a known failed bulk write retries only unfinished items", () => {
    const helper = between(hook, "export async function saveKinfolkTaskAction", "export function useKinfolk");
    expect(helper).toContain("progress = { listId: listPayload.list.id, listName: input.action.list.name }");
    expect(helper).toContain("if (!progress)");
    expect(helper).toContain("listId: progress.listId");
    expect(helper).toContain("Your list was created, but its items were not saved");

    const confirmer = between(hook, "const confirmTaskAction", "const dismissTaskAction");
    expect(confirmer).toContain("progress: existing?.taskActionProgress");
    expect(confirmer).toContain("taskActionProgress: result.progress ?? message.taskActionProgress ?? null");
  });

  it("blocks automatic repeats after ambiguous network or server outcomes", () => {
    const helper = between(hook, "export async function saveKinfolkTaskAction", "export function useKinfolk");
    const responseFailure = between(hook, "function responseTaskActionFailure", "/**\n * Performs only");
    expect(responseFailure).toContain("response.status >= 500");
    expect(responseFailure).toContain("uncertainTaskActionFailure");
    expect(helper).toContain("Open My Lists to check before trying again.");

    const confirmer = between(hook, "const confirmTaskAction", "const dismissTaskAction");
    expect(confirmer).toContain('existing?.taskActionFailure?.kind === "uncertain"');
    expect(confirmer).toContain("savingTaskActionIdsRef.current.has(messageId)");
    expect(confirmer).toContain("savingTaskActionIdsRef.current.add(messageId)");
  });

  it("marks the proposed action complete only after the full save result is confirmed", () => {
    const confirmer = between(hook, "const confirmTaskAction", "const dismissTaskAction");
    const successBranch = confirmer.indexOf('if (result.kind === "saved")');
    const completion = confirmer.indexOf("taskActionDone: true");
    expect(successBranch).toBeGreaterThanOrEqual(0);
    expect(completion).toBeGreaterThan(successBranch);
    expect(confirmer).toContain("taskActionDone: false");
    expect(confirmer).toContain("taskActionFailure: { kind: result.kind, message: result.message }");
  });

  it("keeps primary failure recoverable while preserving explicit Not now dismissal", () => {
    expect(travel).toContain("saving={msg.taskActionSaving}");
    expect(travel).toContain("failure={msg.taskActionFailure}");
    expect(travel).toContain('failure ? "Try again" : "Add to My Lists"');
    expect(travel).toContain("Review My Lists");
    expect(travel).toContain('accessibilityLabel="Not now"');
    expect(travel).toContain(">Not now</Text>");
    expect(travel).toContain('result.kind === "uncertain" ? "Save needs review" : "Reminder not saved"');
    expect(travel).toContain("if (result.kind === \"saved\")");
  });
});
