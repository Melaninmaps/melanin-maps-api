import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => {
  const state: unknown[] = [];
  const stateInitialized: boolean[] = [];
  const callbacks: Array<unknown> = [];
  const callbackDependencies: Array<readonly unknown[] | undefined> = [];
  const effectDependencies: Array<readonly unknown[] | undefined> = [];
  const pendingEffects: Array<() => void | (() => void)> = [];
  const refs: Array<{ current: unknown }> = [];
  let stateCursor = 0;
  let callbackCursor = 0;
  let effectCursor = 0;
  let refCursor = 0;

  const dependenciesMatch = (left: readonly unknown[] | undefined, right: readonly unknown[] | undefined) =>
    left?.length === right?.length && left?.every((value, index) => Object.is(value, right[index]));

  const createElement = (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => ({
    type,
    props: { ...(props ?? {}), children },
  });

  return {
    state,
    beginRender() {
      stateCursor = 0;
      callbackCursor = 0;
      effectCursor = 0;
      refCursor = 0;
    },
    reset() {
      state.length = 0;
      stateInitialized.length = 0;
      callbacks.length = 0;
      callbackDependencies.length = 0;
      effectDependencies.length = 0;
      pendingEffects.length = 0;
      refs.length = 0;
      stateCursor = 0;
      callbackCursor = 0;
      effectCursor = 0;
      refCursor = 0;
    },
    flushEffects() {
      const effects = pendingEffects.splice(0);
      for (const effect of effects) effect();
    },
    createElement,
    useState<T>(initial: T | (() => T)) {
      const index = stateCursor++;
      if (!stateInitialized[index]) {
        state[index] = typeof initial === "function" ? (initial as () => T)() : initial;
        stateInitialized[index] = true;
      }
      const setState = (value: T | ((previous: T) => T)) => {
        state[index] = typeof value === "function"
          ? (value as (previous: T) => T)(state[index] as T)
          : value;
      };
      return [state[index] as T, setState] as const;
    },
    useCallback<T extends (...args: never[]) => unknown>(callback: T, dependencies: readonly unknown[]) {
      const index = callbackCursor++;
      if (!dependenciesMatch(callbackDependencies[index], dependencies)) {
        callbacks[index] = callback;
        callbackDependencies[index] = dependencies;
      }
      return callbacks[index] as T;
    },
    useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]) {
      const index = effectCursor++;
      if (!dependenciesMatch(effectDependencies[index], dependencies)) {
        effectDependencies[index] = dependencies;
        pendingEffects.push(effect);
      }
    },
    useRef<T>(initial: T) {
      const index = refCursor++;
      if (!refs[index]) refs[index] = { current: initial };
      return refs[index] as { current: T };
    },
  };
});

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  getToken: vi.fn(),
  getStoredPrompts: vi.fn(),
  setStoredPrompts: vi.fn(),
  removeStoredPrompts: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("react", () => ({
  default: { createElement: runtime.createElement },
  useCallback: runtime.useCallback,
  useEffect: runtime.useEffect,
  useRef: runtime.useRef,
  useState: runtime.useState,
}));

vi.mock("react/jsx-runtime", () => ({
  Fragment: "Fragment",
  jsx: runtime.createElement,
  jsxs: runtime.createElement,
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: mocks.getStoredPrompts,
    setItem: mocks.setStoredPrompts,
    removeItem: mocks.removeStoredPrompts,
  },
}));

vi.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
vi.mock("expo-haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success" },
  ImpactFeedbackStyle: { Medium: "medium" },
}));
vi.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ canGoBack: () => true, back: mocks.back, replace: mocks.replace }),
}));
vi.mock("expo-secure-store", () => ({ getItemAsync: mocks.getToken }));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Alert: { alert: vi.fn() },
  Animated: {
    Value: class Value { constructor(_initial: number) {} },
    timing: () => ({ start: vi.fn() }),
  },
  Platform: { OS: "ios" },
  ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: "Text",
  TextInput: "TextInput",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));
vi.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0 }) }));
vi.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#fff",
    border: "#ddd",
    card: "#fff",
    foreground: "#111",
    mutedForeground: "#666",
    primary: "#123",
    secondary: "#eee",
  }),
}));
vi.mock("@/components/FeaturedVideoCard", () => ({
  VIDEO_PURPOSES: [],
  detectPlatform: () => "youtube",
}));

import FeaturedVideoScreen from "../app/business-owner/featured-video";

type Node = string | number | null | undefined | { type?: unknown; props?: { children?: Node[]; onPress?: () => void } } | Node[];

function textContent(node: Node): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(textContent).join("");
  return textContent(node.props?.children);
}

function findPressableByText(node: Node, text: string): (() => void) | undefined {
  if (!node) return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const result = findPressableByText(child, text);
      if (result) return result;
    }
    return undefined;
  }
  if (typeof node === "object") {
    if (node.type === "TouchableOpacity" && textContent(node).includes(text)) return node.props?.onPress;
    return findPressableByText(node.props?.children, text);
  }
  return undefined;
}

function includesIcon(node: Node, name: string): boolean {
  if (!node) return false;
  if (Array.isArray(node)) return node.some((child) => includesIcon(child, name));
  return typeof node === "object" && (
    (node.type === "Feather" && (node.props as { name?: string } | undefined)?.name === name)
    || includesIcon(node.props?.children, name)
  );
}

function findPressableByIcon(node: Node, name: string): (() => void) | undefined {
  if (!node) return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const result = findPressableByIcon(child, name);
      if (result) return result;
    }
    return undefined;
  }
  if (typeof node === "object") {
    if (node.type === "TouchableOpacity" && includesIcon(node, name)) return node.props?.onPress;
    return findPressableByIcon(node.props?.children, name);
  }
  return undefined;
}

function renderScreen(): Node {
  runtime.beginRender();
  const tree = FeaturedVideoScreen() as Node;
  runtime.flushEffects();
  return tree;
}

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await Promise.resolve();
}

function response(body: Record<string, unknown>, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) };
}

function managedResponse(businesses: unknown, ok = true) {
  return response({ businesses }, ok);
}

function selectedResponse(business: unknown, ok = true) {
  return response({ business }, ok);
}

function assertNoVideoControls(tree: Node) {
  const text = textContent(tree);
  expect(text).not.toContain("Choose Video from Library");
  expect(text).not.toContain("Save Featured Video");
  expect(text).not.toContain("Remove video");
  expect(text).not.toContain("Link to Social");
}

describe("native Business Owner Featured Video load recovery", () => {
  beforeEach(() => {
    runtime.reset();
    mocks.fetch.mockReset();
    mocks.fetch.mockImplementation((input: string) => {
      if (input.endsWith("/api/businesses/mine/managed")) {
        return Promise.resolve(managedResponse([{ id: "owner-business" }]));
      }
      if (input.endsWith("/api/businesses/owner-business")) {
        return Promise.resolve(selectedResponse({ id: "owner-business" }));
      }
      return Promise.reject(new Error(`Unexpected request: ${input}`));
    });
    mocks.getToken.mockReset();
    mocks.getToken.mockResolvedValue("owner-token");
    mocks.getStoredPrompts.mockReset();
    mocks.getStoredPrompts.mockResolvedValue(null);
    mocks.setStoredPrompts.mockReset();
    mocks.removeStoredPrompts.mockReset();
    mocks.back.mockReset();
    mocks.replace.mockReset();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it.each([
    ["a non-OK managed-list response", () => mocks.fetch.mockResolvedValueOnce(managedResponse([], false))],
    ["a rejected managed-list fetch", () => mocks.fetch.mockRejectedValueOnce(new Error("offline"))],
    ["a rejected managed-list parse", () => mocks.fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockRejectedValue(new Error("bad json")) })],
    ["a non-OK selected-business read", () => {
      mocks.fetch
        .mockResolvedValueOnce(managedResponse([{ id: "owner-business" }]))
        .mockResolvedValueOnce(selectedResponse(undefined, false));
    }],
    ["a rejected prompt-storage read", () => {
      mocks.fetch
        .mockResolvedValueOnce(managedResponse([{ id: "owner-business" }]))
        .mockResolvedValueOnce(selectedResponse({ id: "owner-business" }));
      mocks.getStoredPrompts.mockRejectedValueOnce(new Error("storage unavailable"));
    }],
  ])("shows generic retryable recovery for %s", async (_scenario, arrange) => {
    arrange();
    const loading = renderScreen();
    assertNoVideoControls(loading);
    expect(textContent(loading)).not.toContain("We couldn't load your video settings");

    await settle();
    const errored = renderScreen();
    expect(textContent(errored)).toContain("We couldn't load your video settings");
    expect(textContent(errored)).toContain("Please check your connection and try again.");
    assertNoVideoControls(errored);
    expect(findPressableByText(errored, "Try again")).toEqual(expect.any(Function));
    expect(findPressableByText(errored, "Back to Business Admin")).toEqual(expect.any(Function));
  });

  it.each([
    ["zero managed businesses", []],
    ["multiple managed businesses", [{ id: "owner-business" }, { id: "other-business" }]],
    ["a missing managed list", undefined],
    ["a non-array managed list", { id: "owner-business" }],
    ["a null managed business ID", [{ id: null }]],
    ["a missing managed business ID", [{}]],
    ["a non-string managed business ID", [{ id: 42 }]],
    ["a whitespace-only managed business ID", [{ id: "   " }]],
  ])("does not expose controls or make a selected read for %s", async (_scenario, businesses) => {
    mocks.fetch.mockResolvedValueOnce(managedResponse(businesses));
    const loading = renderScreen();
    assertNoVideoControls(loading);

    await settle();
    const errored = renderScreen();
    expect(textContent(errored)).toContain("We couldn't load your video settings");
    assertNoVideoControls(errored);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a missing selected business record", null],
    ["a null selected business ID", { id: null }],
    ["a mismatched selected business ID", { id: "other-business" }],
  ])("does not expose controls when the owner-authorized selected read returns %s", async (_scenario, business) => {
    mocks.fetch
      .mockResolvedValueOnce(managedResponse([{ id: "owner-business" }]))
      .mockResolvedValueOnce(selectedResponse(business));

    renderScreen();
    await settle();
    const errored = renderScreen();
    expect(textContent(errored)).toContain("We couldn't load your video settings");
    assertNoVideoControls(errored);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it("clears prior business, video, and prompt context before retry and reaches success only after the exact-one managed context resolves", async () => {
    let resolveRetry!: (value: ReturnType<typeof managedResponse>) => void;
    const retryResponse = new Promise<ReturnType<typeof managedResponse>>((resolve) => { resolveRetry = resolve; });
    mocks.fetch
      .mockResolvedValueOnce(managedResponse([{ id: "previous-owner-business" }]))
      .mockResolvedValueOnce(selectedResponse({
        id: "previous-owner-business",
        featuredVideoUrl: "",
        featuredVideoTitle: "Previous video",
      }))
      .mockReturnValueOnce(retryResponse)
      .mockResolvedValueOnce(selectedResponse({ id: "resolved-owner-business", featuredVideoUrl: "" }));
    mocks.getStoredPrompts.mockRejectedValueOnce(new Error("temporary storage error"));

    renderScreen();
    await settle();
    const errored = renderScreen();
    expect(textContent(errored)).toContain("We couldn't load your video settings");
    expect(runtime.state[1]).toBeNull();
    expect(runtime.state[2]).toEqual([]);
    expect(runtime.state[5]).toBeNull();
    expect(runtime.state[7]).toBe("");
    assertNoVideoControls(errored);

    const retry = findPressableByText(errored, "Try again");
    expect(retry).toEqual(expect.any(Function));
    retry?.();
    const loading = renderScreen();
    expect(runtime.state[1]).toBeNull();
    assertNoVideoControls(loading);

    await settle();
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(mocks.fetch).toHaveBeenLastCalledWith(
      "/api/businesses/mine/managed",
      { headers: { Authorization: "Bearer owner-token" } },
    );

    resolveRetry(managedResponse([{ id: "resolved-owner-business" }]));
    await settle();
    const resolved = renderScreen();
    expect(textContent(resolved)).toContain("Need some inspiration?");
    expect(textContent(resolved)).not.toContain("We couldn't load your video settings");
    expect(mocks.fetch).toHaveBeenLastCalledWith(
      "/api/businesses/resolved-owner-business",
      { headers: { Authorization: "Bearer owner-token" } },
    );
  });

  it("does not revive media controls from a stale managed-list response after returning to Business Admin", async () => {
    let resolveManaged!: (value: ReturnType<typeof managedResponse>) => void;
    const delayedManaged = new Promise<ReturnType<typeof managedResponse>>((resolve) => { resolveManaged = resolve; });
    mocks.fetch.mockReturnValueOnce(delayedManaged);

    const loading = renderScreen();
    await settle();
    const back = findPressableByIcon(loading, "arrow-left");
    expect(back).toEqual(expect.any(Function));
    back?.();
    expect(mocks.back).toHaveBeenCalledTimes(1);

    resolveManaged(managedResponse([{ id: "late-owner-business" }]));
    await settle();
    const stale = renderScreen();
    expect(runtime.state[1]).toBeNull();
    assertNoVideoControls(stale);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it("preserves the resolved linked-video controls, back behavior, and exact-one owner headers", async () => {
    mocks.fetch
      .mockResolvedValueOnce(managedResponse([{ id: "owner-business" }]))
      .mockResolvedValueOnce(selectedResponse({
        id: "owner-business",
        featuredVideoUrl: "https://youtube.com/watch?v=owned-video",
      }));
    renderScreen();
    await settle();
    const resolved = renderScreen();
    const text = textContent(resolved);
    expect(text).toContain("Link to Social");
    expect(text).toContain("Save Featured Video");
    expect(text).toContain("Remove featured video");
    const back = findPressableByIcon(resolved, "arrow-left");
    expect(back).toEqual(expect.any(Function));
    back?.();
    expect(mocks.back).toHaveBeenCalledTimes(1);
    expect(mocks.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/businesses/mine/managed",
      { headers: { Authorization: "Bearer owner-token" } },
    );
    expect(mocks.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/businesses/owner-business",
      { headers: { Authorization: "Bearer owner-token" } },
    );
  });
});
