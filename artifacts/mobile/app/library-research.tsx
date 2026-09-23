import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_ORIGIN) return process.env.EXPO_PUBLIC_API_ORIGIN;
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

type Source = { url: string; title: string; publisher: string | null; whyItMatters?: string | null };
type LibraryEntry = {
  id: string;
  title: string;
  summary: string;
  body: string;
  sourceCount: number;
  sources: Source[];
  refreshedAt: string;
  researchLenses?: string[];
  relatedQuestions?: string[];
  disclaimer?: string | null;
};
type LibrarySearch = {
  total: number;
  researchLenses: Array<{ tag: string; label: string }>;
  results: Array<({ kind: "entry" } & LibraryEntry) | { kind: "topic"; id: string; title: string; summary: string }>;
  searchClarification?: {
    kind: "possible_spelling";
    suggestedQuery: string;
    prompt: string;
    source: "returned_catalog_term";
  } | null;
};
type ResearchScope = {
  domain: string;
  sourceStandard: string;
  requestedGroup: string | null;
  groupGuidance: string;
  researchLenses: Array<{ tag: string; label: string }>;
  connectedTopics: Array<{ label: string; href: string }>;
};
type LibraryPurposeConsent = {
  granted: boolean;
  purpose: "library_saved_context";
  controlsSavedContextAugmentation: true;
  controlsRankingPersonalization: true;
};
type ResearchResponse = {
  answer: LibraryEntry;
  /** General current information for any reader; mirrors answer for compatibility. */
  foundation?: LibraryEntry;
  communityContext?: {
    status: "available" | "insufficient" | "operational_failure";
    researchLenses: string[];
    answer?: LibraryEntry;
    message: string;
    providerStatus: "available" | "degraded" | "unavailable";
    retryable: boolean;
  };
  origin: "internal" | "researched";
  provider: { status: "available" | "degraded"; message: string };
  researchScope: ResearchScope;
  memberContextApplied?: string[];
  libraryPurposeConsent?: LibraryPurposeConsent;
};

const RESEARCH_LENS_OPTIONS = [
  { tag: "#Diaspora", label: "Diaspora" },
  { tag: "#BlackWomen", label: "Black women" },
  { tag: "#BlackMen", label: "Black men & boys" },
  { tag: "#BlackStudents", label: "Black students" },
  { tag: "#HBCUStudents", label: "HBCU students & alumni" },
] as const;

const APPROVED_TOPIC_STARTERS = [
  "History of the Diaspora",
  "HBCU college admissions",
  "Breast cancer screening",
  "Buying a home",
  "Career and networking",
  "Health and wellness",
] as const;

function hasResearchLens(question: string, tag: string): boolean {
  return new RegExp(`(?:^|\\s)${tag.replace("#", "\\#")}\\b`, "i").test(question.normalize("NFKC"));
}

function toggleResearchLens(question: string, tag: string): string {
  const tagPattern = new RegExp(`(?:^|\\s)${tag.replace("#", "\\#")}\\b`, "ig");
  if (hasResearchLens(question, tag)) return question.replace(tagPattern, " ").replace(/\s+/g, " ").trim();
  return `${tag} ${question}`.replace(/\s+/g, " ").trim();
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || /^127\./.test(host)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function sections(body: string): Array<{ heading: string | null; copy: string }> {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const heading = part.match(/^##\s+(.+)$/);
      return heading ? { heading: heading[1], copy: "" } : { heading: null, copy: part };
    });
}

function AnswerCard({ answer, scope, onConnectedTopic, researchTrack = "foundation" }: { answer: LibraryEntry; scope?: ResearchScope; onConnectedTopic?: (topic: string) => void; researchTrack?: "foundation" | "community" }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const safeSources = useMemo(
    () => answer.sources.map((source) => ({ ...source, href: safeUrl(source.url) })).filter((source): source is Source & { href: string } => Boolean(source.href)),
    [answer.sources],
  );

  return (
    <View style={[styles.answerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.eyebrow, { color: "#936719" }]}>{researchTrack === "foundation" ? "CURRENT FOUNDATION · SOURCE-GOVERNED" : "DIRECTLY EVIDENCED COMMUNITY PACKET"}</Text>
      {answer.researchLenses?.length ? <Text style={[styles.researchLens, { color: "#70480F" }]}>{answer.researchLenses.join(" ")}</Text> : null}
      <Text style={[styles.answerTitle, { color: colors.foreground }]}>{answer.title}</Text>
      <Text style={[styles.summary, { color: colors.mutedForeground }]}>{answer.summary}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        activeOpacity={0.8}
        onPress={() => setExpanded((value) => !value)}
        style={[styles.expandButton, { borderColor: colors.border }]}
      >
        <Text style={[styles.expandText, { color: colors.primary }]}>{expanded ? "Show less" : "Read the research brief"}</Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.longForm}>
          {sections(answer.body).map((section, index) => section.heading ? (
            <Text key={`${section.heading}-${index}`} style={[styles.sectionHeading, { color: colors.foreground }]}>{section.heading}</Text>
          ) : (
            <Text key={`copy-${index}`} style={[styles.copy, { color: colors.foreground }]}>{section.copy}</Text>
          ))}
          {answer.disclaimer ? (
            <View style={[styles.disclaimer, { backgroundColor: "#F59E0B12", borderColor: "#F59E0B40" }]}>
              <Feather name="alert-circle" color="#B27621" size={15} />
              <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>{answer.disclaimer}</Text>
            </View>
          ) : null}
        </View>
      )}
      {scope ? (
        <View style={[styles.scopeCard, { backgroundColor: "#CA922B10", borderColor: "#CA922B45" }]}>
          <Text style={[styles.scopeTitle, { color: colors.foreground }]}>{researchTrack === "foundation" ? "How the current foundation was researched" : "How this was researched"}</Text>
          <Text style={[styles.scopeCopy, { color: colors.mutedForeground }]}>{researchTrack === "foundation" ? <><Text style={{ fontWeight: "800" }}>Current foundation: </Text>Current, authoritative information for any reader. An explicit community lens appears separately when directly evidenced.</> : <><Text style={{ fontWeight: "800" }}>Research lens: </Text>{scope.researchLenses.map((lens) => lens.tag).join(" ")}</>}</Text>
          <Text style={[styles.scopeCopy, { color: colors.mutedForeground }]}><Text style={{ fontWeight: "800" }}>Source standard: </Text>{scope.sourceStandard}</Text>
          <Text style={[styles.scopeCopy, { color: colors.mutedForeground }]}>{scope.groupGuidance}</Text>
          {scope.connectedTopics.length > 0 ? (
            <View style={styles.topicTagRow}>
              <Text style={[styles.scopeCopy, { color: colors.mutedForeground, width: "100%" }]}>Connected Library topics</Text>
              {scope.connectedTopics.map((topic) => (
                <TouchableOpacity key={topic.href} onPress={() => onConnectedTopic?.(topic.label)} activeOpacity={0.8} style={styles.topicTag}>
                  <Text style={styles.topicTagText}>{topic.label}</Text>
                  <Feather name="arrow-up-right" size={12} color="#70480F" />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      {safeSources.length > 0 ? (
        <View style={styles.sourceSection}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Sources</Text>
          {safeSources.map((source) => (
            <TouchableOpacity key={source.href} onPress={() => void Linking.openURL(source.href)} activeOpacity={0.8} style={[styles.sourceRow, { borderColor: colors.border }]}>
              <Feather name="external-link" size={14} color="#936719" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sourceTitle, { color: colors.primary }]} numberOfLines={2}>{source.title}</Text>
                {source.publisher ? <Text style={[styles.sourcePublisher, { color: colors.mutedForeground }]} numberOfLines={1}>{source.publisher}</Text> : null}
                {source.whyItMatters ? <Text style={[styles.sourceReason, { color: colors.mutedForeground }]}>{source.whyItMatters}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <Text style={[styles.freshness, { color: colors.mutedForeground }]}>{answer.sourceCount} {answer.sourceCount === 1 ? "source" : "sources"} · Updated {new Date(answer.refreshedAt).toLocaleDateString()}</Text>
    </View>
  );
}

export default function LibraryResearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { question: suggestedQuestion, research: researchOnOpen } = useLocalSearchParams<{ question?: string; research?: string }>();
  const [question, setQuestion] = useState("");
  const [searchedQuestion, setSearchedQuestion] = useState("");
  const [search, setSearch] = useState<LibrarySearch | null>(null);
  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [state, setState] = useState<"idle" | "searching" | "researching" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lensPickerOpen, setLensPickerOpen] = useState(false);
  const [contextConsent, setContextConsent] = useState<LibraryPurposeConsent | null>(null);
  const [contextConsentState, setContextConsentState] = useState<"idle" | "saving" | "error">("idle");
  const appliedSuggestedQuestion = useRef(false);
  const activeResearchLensTags = RESEARCH_LENS_OPTIONS.filter((lens) => hasResearchLens(question, lens.tag)).map((lens) => lens.tag);

  const internalEntry = search?.results.find((result): result is { kind: "entry" } & LibraryEntry => result.kind === "entry") ?? null;
  const matchingTopics = (search?.results ?? []).filter(
    (result): result is { kind: "topic"; id: string; title: string; summary: string } => result.kind === "topic",
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const headers = await authHeaders();
        const request = await fetch(`${getApiBase()}/api/library/context-consent`, {
          credentials: "include",
          headers: { ...headers, Accept: "application/json" },
          signal: controller.signal,
        });
        if (request.status === 401) return;
        if (!request.ok) throw new Error("LIBRARY_CONSENT_UNAVAILABLE");
        setContextConsent(await request.json() as LibraryPurposeConsent);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") setContextConsentState("error");
      }
    })();
    return () => controller.abort();
  }, []);

  async function updateContextConsent(granted: boolean) {
    if (!contextConsent || contextConsentState === "saving") return;
    setContextConsentState("saving");
    try {
      const headers = await authHeaders();
      const request = await fetch(`${getApiBase()}/api/library/context-consent`, {
        method: "PUT",
        credentials: "include",
        headers: { ...headers, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ granted }),
      });
      const body = await request.json() as LibraryPurposeConsent | { error?: string };
      if (!request.ok || !("granted" in body)) throw new Error("LIBRARY_CONSENT_UPDATE_FAILED");
      setContextConsent(body);
      setContextConsentState("idle");
      // The next search and research request both use this same consent state;
      // existing evidence is not silently rewritten when it changes.
    } catch {
      setContextConsentState("error");
    }
  }

  useEffect(() => {
    if (!appliedSuggestedQuestion.current && typeof suggestedQuestion === "string" && suggestedQuestion.trim()) {
      const routedQuestion = suggestedQuestion.trim().slice(0, 500);
      setQuestion(routedQuestion);
      appliedSuggestedQuestion.current = true;
      // Collection subjects are intentional, prefilled Library questions—not
      // decoration. Search approved Library material immediately, then obtain a
      // current source-governed brief without requiring the member to retype it.
      if (researchOnOpen === "true") void searchLibrary(routedQuestion, true);
    }
  }, [researchOnOpen, suggestedQuestion]);

  async function searchLibrary(questionOverride?: string, forceResearch = false) {
    const cleaned = (questionOverride ?? question).normalize("NFKC").trim().replace(/\s+/g, " ");
    if (cleaned.length < 3) {
      setMessage("Enter a question with at least three characters.");
      return;
    }
    setState("searching");
    setMessage("");
    setResearch(null);
    setSearchedQuestion(cleaned);
    try {
      const request = await fetch(`${getApiBase()}/api/library/search?q=${encodeURIComponent(cleaned)}`, { headers: { Accept: "application/json" } });
      const payload = await request.json() as LibrarySearch | { error?: string };
      if (!request.ok) throw new Error("error" in payload ? payload.error : "The Library search is temporarily unavailable.");
      const internal = payload as LibrarySearch;
      setSearch(internal);
      setState("ready");
      if (internal.searchClarification?.kind === "possible_spelling" && internal.searchClarification.source === "returned_catalog_term") {
        setMessage("Choose the possible spelling correction below if it matches what you meant. The Library will not assume a different topic.");
        return;
      }
      const hasPublishedEntry = internal.results.some((result) => result.kind === "entry");
      if (forceResearch || !hasPublishedEntry) {
        // First-time questions take longer: Library research gathers and checks
        // authorized sources before it returns a brief and next-question path.
        await researchVettedSources(cleaned, internal.total);
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The Library search is temporarily unavailable.");
    }
  }

  async function researchVettedSources(questionOverride?: string, internalResultCount?: number) {
    const targetQuestion = questionOverride ?? searchedQuestion;
    if (!targetQuestion || state === "researching") return;
    setState("researching");
    setMessage("");
    try {
      const headers = await authHeaders();
      const request = await fetch(`${getApiBase()}/api/library/research`, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ question: targetQuestion, internalResultCount: internalResultCount ?? search?.total ?? 0 }),
      });
      const payload = await request.json() as ResearchResponse | { error?: string; code?: string };
      if (request.status === 401) throw new Error("Sign in to request a new source-governed Library brief. Existing Library search remains available.");
      if (!request.ok || !("answer" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "The Library could not verify enough reliable sources for this question yet.");
      setResearch(payload as ResearchResponse);
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Live Library research is temporarily unavailable.");
    }
  }

  function startPrefilledResearch(nextQuestion: string) {
    const cleaned = nextQuestion.normalize("NFKC").trim().replace(/\s+/g, " ");
    setQuestion(cleaned);
    void searchLibrary(cleaned, true);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20) }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity accessibilityLabel="Back to Library" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/library" as never)} style={styles.backButton}>
          <Feather name="arrow-left" color={colors.foreground} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Library Research</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Evidence, context, and the next right question</Text>
        </View>
      </View>
      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 72 }]}>
        <View style={[styles.hero, { backgroundColor: "#2A0F05" }]}>
          <Text style={styles.heroEyebrow}>THE LIVING LIBRARY</Text>
          <Text style={styles.heroTitle}>Research that starts with reputable sources.</Text>
          <Text style={styles.heroCopy}>Every search begins with current, reputable information for anyone. Add a tag such as #BlackWomen or #BlackStudents for a separately labeled community-evidence packet. A tag is a research instruction, not an assumption about you.</Text>
        </View>
        <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>What would you like to understand?</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => void searchLibrary()}
            multiline
            placeholder="Example: What should Black women ages 45–50 know about planning for pregnancy?"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <View style={styles.lensFilterSection}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ expanded: lensPickerOpen }}
              activeOpacity={0.8}
              onPress={() => setLensPickerOpen((open) => !open)}
              style={[styles.lensPickerTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.lensFilterLabel, { color: colors.foreground }]}>Community research context <Text style={[styles.optionalLabel, { color: colors.mutedForeground }]}>optional</Text></Text>
                <Text style={[styles.lensFilterCopy, { color: colors.mutedForeground }]}>
                  {activeResearchLensTags.length > 0
                    ? `${activeResearchLensTags.join(" ")} will appear as a separately labeled evidence packet.`
                    : "Current foundation only. Add a community packet if you want one."}
                </Text>
              </View>
              <Feather name={lensPickerOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
            </TouchableOpacity>
            {lensPickerOpen ? (
              <View style={[styles.lensPickerList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.lensFilterCopy, { color: colors.mutedForeground }]}>Choose any contexts you want for this question. It is not saved as your identity. It does not replace general current information.</Text>
              {RESEARCH_LENS_OPTIONS.map((lens) => {
                const selected = activeResearchLensTags.includes(lens.tag);
                return (
                  <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    activeOpacity={0.8}
                    key={lens.tag}
                    onPress={() => setQuestion((current) => toggleResearchLens(current, lens.tag))}
                    style={[styles.lensFilterOption, { backgroundColor: selected ? "#70480F" : colors.background, borderColor: selected ? "#70480F" : colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lensFilterChipText, { color: selected ? "#FFFDF8" : colors.foreground }]}>{lens.label}</Text>
                      <Text style={[styles.lensOptionCopy, { color: selected ? "#F1DFCC" : colors.mutedForeground }]}>{lens.tag} community evidence</Text>
                    </View>
                    <Feather name={selected ? "check-circle" : "circle"} size={18} color={selected ? "#FFFDF8" : colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })}
              </View>
            ) : null}
          </View>
          {contextConsent ? (
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: contextConsent.granted, disabled: contextConsentState === "saving" }}
              activeOpacity={0.8}
              disabled={contextConsentState === "saving"}
              onPress={() => void updateContextConsent(!contextConsent.granted)}
              style={[styles.consentControl, { borderColor: contextConsent.granted ? "#CA922B" : colors.border, backgroundColor: contextConsent.granted ? "#CA922B10" : colors.background }]}
            >
              <Feather name={contextConsent.granted ? "check-square" : "square"} size={20} color={contextConsent.granted ? "#936719" : colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.consentTitle, { color: colors.foreground }]}>Use my saved context for the Library</Text>
                <Text style={[styles.consentCopy, { color: colors.mutedForeground }]}>This one revocable choice controls both optional saved-context community supplements and result ranking. It never changes the general foundation or asserts your identity.</Text>
              </View>
            </TouchableOpacity>
          ) : null}
          {contextConsentState === "error" ? <Text style={styles.consentError}>Library context consent could not be updated. Your current setting is unchanged.</Text> : null}
          <TouchableOpacity activeOpacity={0.85} disabled={state === "searching" || state === "researching"} onPress={() => void searchLibrary()} style={[styles.searchButton, { backgroundColor: colors.primary, opacity: state === "searching" || state === "researching" ? 0.65 : 1 }]}>
            {state === "searching" ? <ActivityIndicator color="#fff" /> : <><Feather name="search" color="#fff" size={16} /><Text style={styles.searchButtonText}>Search the Library</Text></>}
          </TouchableOpacity>
          <Text style={[styles.governanceCopy, { color: colors.mutedForeground }]}>Medical questions use clinical and public-health sources; financial questions use regulators and economic research. A brief is not personal medical, legal, or financial advice.</Text>
        </View>

        {message ? <View style={[styles.message, { backgroundColor: "#FFF1EF", borderColor: "#D59A9A" }]}><Text style={{ color: "#8A2424" }}>{message}</Text></View> : null}
        {research?.memberContextApplied?.length ? (
          <View style={[styles.lensCard, { borderColor: "#CA922B45", backgroundColor: "#CA922B10" }]}>
            <Text style={[styles.scopeCopy, { color: colors.mutedForeground }]}>
              <Text style={{ fontWeight: "800" }}>Private default context: </Text>
              {research.memberContextApplied.join(" ")} was added because you chose it in Kinfolk setup. The current foundation is still general and you can override this with “general only” or “this is for a friend.”
            </Text>
          </View>
        ) : null}
        {search?.researchLenses?.length ? (
          <View style={[styles.lensCard, { borderColor: "#CA922B45", backgroundColor: "#CA922B10" }]}>
            <Text style={[styles.scopeCopy, { color: colors.mutedForeground }]}>
              <Text style={{ fontWeight: "800" }}>Research lens: </Text>
              {search.researchLenses.map((lens) => lens.tag).join(" ")}. This scope guides evidence; it does not describe the reader.
            </Text>
          </View>
        ) : null}
        {search?.searchClarification?.kind === "possible_spelling" && search.searchClarification.source === "returned_catalog_term" ? (
          <View style={[styles.clarificationCard, { backgroundColor: "#FFF8E8", borderColor: "#CA922B" }]}>
            <Text style={[styles.clarificationTitle, { color: colors.foreground }]}>Possible spelling correction</Text>
            <Text style={[styles.clarificationCopy, { color: colors.mutedForeground }]}>Use this only if it is the topic you intended to search.</Text>
            <TouchableOpacity
              accessibilityLabel={search.searchClarification.prompt}
              activeOpacity={0.85}
              onPress={() => { setQuestion(search.searchClarification!.suggestedQuery); void searchLibrary(search.searchClarification!.suggestedQuery); }}
              style={[styles.clarificationButton, { borderColor: "#CA922B" }]}
            >
              <Text style={styles.clarificationButtonText}>{search.searchClarification.prompt}</Text>
              <Feather name="arrow-right" size={16} color="#70480F" />
            </TouchableOpacity>
          </View>
        ) : null}
        {internalEntry ? <AnswerCard answer={internalEntry} /> : null}
        {matchingTopics.length > 0 ? (
          <View style={[styles.topicResultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Available Library paths</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>These approved Library sections are available now while the current brief is prepared or refreshed.</Text>
            {matchingTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/library-topic", params: { topicId: topic.id } } as never)}
                style={[styles.topicResultRow, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.starterTopicText, { color: colors.foreground }]}>{topic.title}</Text>
                  {topic.summary ? <Text style={[styles.topicResultCopy, { color: colors.mutedForeground }]}>{topic.summary}</Text> : null}
                </View>
                <Feather name="arrow-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {search && !internalEntry && !search.searchClarification ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No approved Library entry answers this yet.</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>A current source-governed brief can be requested below. Until that service is available, browse a verified Library topic instead of seeing a dead end.</Text>
            <View style={styles.starterTopicList}>
              {APPROVED_TOPIC_STARTERS.map((topic) => (
                <TouchableOpacity key={topic} activeOpacity={0.8} onPress={() => startPrefilledResearch(topic)} style={[styles.starterTopicButton, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.starterTopicText, { color: colors.primary }]}>{topic}</Text>
                  <Feather name="arrow-up-right" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        {searchedQuestion && !research && !search?.searchClarification ? (
          <TouchableOpacity activeOpacity={0.85} disabled={state === "researching" || state === "searching"} onPress={() => void researchVettedSources()} style={[styles.researchButton, { borderColor: "#CA922B", backgroundColor: "#FFF8E8", opacity: state === "researching" || state === "searching" ? 0.65 : 1 }]}>
            {state === "researching" ? <ActivityIndicator color="#70480F" /> : <Feather name="book-open" size={18} color="#70480F" />}
            <View style={{ flex: 1 }}>
              <Text style={styles.researchButtonTitle}>{state === "researching" ? "Researching vetted sources…" : internalEntry ? "Refresh with vetted current sources" : "Research vetted sources"}</Text>
              <Text style={styles.researchButtonCopy}>Shows citations, why the evidence matters, and related next questions.</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#70480F" />
          </TouchableOpacity>
        ) : null}
        {research ? <AnswerCard answer={research.foundation ?? research.answer} researchTrack="foundation" scope={research.researchScope} onConnectedTopic={startPrefilledResearch} /> : null}
        {research?.communityContext?.status === "available" && research.communityContext.answer ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.communityContextEyebrow, { color: "#70480F" }]}>COMMUNITY CONTEXT · {research.communityContext.researchLenses.join(" ")}</Text>
            <Text style={[styles.communityContextCopy, { color: colors.mutedForeground }]}>{research.communityContext.message}</Text>
            <AnswerCard answer={research.communityContext.answer} researchTrack="community" scope={research.researchScope} onConnectedTopic={(topic) => startPrefilledResearch(`${research.communityContext!.researchLenses.join(" ")} ${topic}`)} />
          </View>
        ) : research?.communityContext ? (
          <View style={[styles.emptyCard, { backgroundColor: research.communityContext.status === "operational_failure" ? "#FFF1EF" : "#FFF8E8", borderColor: research.communityContext.status === "operational_failure" ? "#D59A9A" : "#CA922B" }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{research.communityContext.status === "operational_failure" ? "Community research service is temporarily unavailable" : "Community evidence is insufficient for now"}</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>{research.communityContext.message}</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>The current foundation remains complete and separately sourced above.</Text>
            {research.communityContext.retryable ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => void researchVettedSources()} style={[styles.retryButton, { borderColor: "#B95E5E" }]}>
                <Text style={styles.retryButtonText}>Retry community research</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {(research?.foundation ?? research?.answer)?.relatedQuestions?.length ? (
          <View style={[styles.relatedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Related next questions</Text>
            <Text style={[styles.relatedCopy, { color: colors.mutedForeground }]}>These are evidence-led branches from this brief, not claims about the reader or a report of other members&apos; private searches.</Text>
            {((research.foundation ?? research.answer).relatedQuestions ?? []).map((related) => (
              <TouchableOpacity key={related} activeOpacity={0.8} onPress={() => startPrefilledResearch(`${research.researchScope.researchLenses.map((lens) => lens.tag).join(" ")} ${related}`.trim())} style={[styles.relatedButton, { borderColor: colors.border }]}>
                <Text style={[styles.relatedText, { color: colors.primary }]}>{related}</Text>
                <Feather name="arrow-up-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { marginTop: 2, fontSize: 11, lineHeight: 15 },
  content: { padding: 16, gap: 14 },
  hero: { borderRadius: 18, padding: 20, gap: 8 },
  heroEyebrow: { color: "#F0CF63", fontSize: 10, letterSpacing: 1.4, fontWeight: "800" },
  heroTitle: { color: "#FFFDF7", fontSize: 25, lineHeight: 31, fontWeight: "800" },
  heroCopy: { color: "#F1DFCC", fontSize: 13, lineHeight: 20 },
  searchCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 15, fontWeight: "800" },
  input: { minHeight: 96, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, lineHeight: 20, textAlignVertical: "top" },
  lensFilterSection: { gap: 8 },
  lensFilterLabel: { fontSize: 13, fontWeight: "800" },
  lensFilterCopy: { fontSize: 11, lineHeight: 16 },
  optionalLabel: { fontSize: 11, fontWeight: "600" },
  lensPickerTrigger: { minHeight: 66, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  lensPickerList: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  lensFilterOption: { minHeight: 56, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  lensFilterChipText: { fontSize: 12, fontWeight: "800" },
  lensOptionCopy: { marginTop: 2, fontSize: 11, lineHeight: 15 },
  consentControl: { minHeight: 76, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  consentTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  consentCopy: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  consentError: { color: "#8A2424", fontSize: 11, lineHeight: 16 },
  searchButton: { minHeight: 46, borderRadius: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 },
  searchButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  governanceCopy: { fontSize: 11, lineHeight: 16 },
  message: { borderWidth: 1, borderRadius: 12, padding: 13 },
  lensCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  clarificationCard: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 8 },
  clarificationTitle: { fontSize: 15, fontWeight: "800" },
  clarificationCopy: { fontSize: 12, lineHeight: 18 },
  clarificationButton: { alignSelf: "flex-start", minHeight: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  clarificationButtonText: { color: "#70480F", fontSize: 13, fontWeight: "800" },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 7 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptyCopy: { fontSize: 13, lineHeight: 19 },
  starterTopicList: { gap: 7, marginTop: 5 },
  starterTopicButton: { minHeight: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  starterTopicText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  retryButton: { alignSelf: "flex-start", minHeight: 38, borderWidth: 1, borderRadius: 19, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  retryButtonText: { color: "#8A2424", fontSize: 12, fontWeight: "800" },
  topicResultsCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 },
  topicResultRow: { minHeight: 58, borderWidth: 1, borderRadius: 10, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  topicResultCopy: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  researchButton: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 11, flexDirection: "row", alignItems: "center" },
  researchButtonTitle: { color: "#70480F", fontSize: 14, fontWeight: "800" },
  researchButtonCopy: { color: "#765D41", fontSize: 11, lineHeight: 16, marginTop: 2 },
  answerCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 },
  eyebrow: { fontSize: 10, letterSpacing: 1.1, fontWeight: "800" },
  researchLens: { fontSize: 11, letterSpacing: 0.4, fontWeight: "800" },
  answerTitle: { fontSize: 21, lineHeight: 27, fontWeight: "800" },
  summary: { fontSize: 15, lineHeight: 22 },
  expandButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, minHeight: 37, flexDirection: "row", alignItems: "center", gap: 5 },
  expandText: { fontSize: 13, fontWeight: "800" },
  longForm: { gap: 8 },
  sectionHeading: { fontSize: 16, lineHeight: 22, fontWeight: "800", marginTop: 6 },
  copy: { fontSize: 14, lineHeight: 22 },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: 10, padding: 11, marginTop: 4 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17 },
  scopeCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  scopeTitle: { fontSize: 14, fontWeight: "800" },
  scopeCopy: { fontSize: 12, lineHeight: 18 },
  topicTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  topicTag: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#C9AD7F" },
  topicTagText: { color: "#70480F", fontSize: 11, fontWeight: "800" },
  sourceSection: { gap: 6 },
  sourceRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderTopWidth: 1, paddingTop: 9 },
  sourceTitle: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  sourcePublisher: { marginTop: 2, fontSize: 11 },
  sourceReason: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  freshness: { fontSize: 11, marginTop: 2 },
  relatedCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 },
  communityContextEyebrow: { fontSize: 10, letterSpacing: 1.1, fontWeight: "800", paddingHorizontal: 2 },
  communityContextCopy: { fontSize: 12, lineHeight: 18, paddingHorizontal: 2 },
  relatedCopy: { fontSize: 12, lineHeight: 18 },
  relatedButton: { borderWidth: 1, borderRadius: 10, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  relatedText: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18 },
});
