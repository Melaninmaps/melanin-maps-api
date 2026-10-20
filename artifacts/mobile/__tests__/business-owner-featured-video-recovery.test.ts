import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => {
  const state: unknown[] = [];
  const stateInitialized: boolean[] = [];
  const callbacks: Array<unknown> = [];
  const callbackDependencies: Array<readonly unknown[] | undefined> = [];
  const effectDependencies: Array<readonly unknown[] | undefined> = [];
  const pendingEffects: Array<() => void | (() => void)> = [];
  let stateCursor = 0;
  let callbackCursor = 0;
  let effectCursor = 0;

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
    },
    reset() {
      state.length = 0;
      stateInitialized.length = 0;
      callbacks.length = 0;
      callbackDependencies.length = 0;
      effectDependencies.length = 0;
      pendingEffects.length = 0;
      stateCursor = 0;
      callbackCursor = 0;
      effectCursor = 0;
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

function response(business: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue({ business }) };
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
    mocks.fetch.mockImplementation(() => Promise.resolve(response({ id: "owner-business" })));
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
    ["a non-OK response", () => mocks.fetch.mockResolvedValueOnce(response(undefined, false))],
    ["a rejected fetch", () => mocks.fetch.mockRejectedValueOnce(new Error("offline"))],
    ["a rejected response parse", () => mocks.fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockRejectedValue(new Error("bad json")) })],
    ["a rejected prompt-storage read", () => {
      mocks.fetch.mockResolvedValueOnce(response({ id: "owner-business" }));
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
  });

  it.each([
    ["a missing business record", null],
    ["a null business ID", { id: null }],
    ["a missing business ID", {}],
    ["a non-string business ID", { id: 42 }],
    ["a whitespace-only business ID", { id: "   " }],
  ])("does not expose controls when resolution returns %s", async (_scenario, business) => {
    mocks.fetch.mockResolvedValueOnce(response(business));
    const loading = renderScreen();
    assertNoVideoControls(loading);

    await settle();
    const errored = renderScreen();
    expect(textContent(errored)).toContain("We couldn't load your video settings");
    assertNoVideoControls(errored);
  });

  it("clears an unresolved prior business ID, reuses the resolver, and shows the success path only after retry resolves", async () => {
    let resolveRetry!: (value: ReturnType<typeof response>) => void;
    const retryResponse = new Promise<ReturnType<typeof response>>((resolve) => { resolveRetry = resolve; });
    mocks.fetch
      .mockResolvedValueOnce(response({ id: "previous-owner-business" }))
      .mockReturnValueOnce(retryResponse);
    mocks.getStoredPrompts.mockRejectedValueOnce(new Error("temporary storage error"));

    renderScreen();
    await settle();
    const errored = renderScreen();
    expect(textContent(errored)).toContain("We couldn't load your video settings");
    expect(runtime.state[1]).toBe("previous-owner-business");

    const retry = findPressableByText(errored, "Try again");
    expect(retry).toEqual(expect.any(Function));
    retry?.();
    const loading = renderScreen();
    expect(runtime.state[1]).toBeNull();
    assertNoVideoControls(loading);

    await settle();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch).toHaveBeenLastCalledWith(
      "/api/businesses/mine",
      { headers: { Authorization: "Bearer owner-token" } },
    );

    resolveRetry(response({ id: "resolved-owner-business", featuredVideoUrl: "" }));
    await settle();
    const resolved = renderScreen();
    expect(textContent(resolved)).toContain("Need some inspiration?");
    expect(textContent(resolved)).not.toContain("We couldn't load your video settings");
  });

  it("preserves the resolved linked-video controls and Back behavior", async () => {
    mocks.fetch.mockResolvedValueOnce(response({
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
  });
});
