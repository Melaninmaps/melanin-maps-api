import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
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
type ResearchResponse = {
  answer: LibraryEntry;
  origin: "internal" | "researched";
  provider: { status: "available" | "degraded"; message: string };
  researchScope: ResearchScope;
};

const RESEARCH_LENS_OPTIONS = [
  { tag: "#Diaspora", label: "Diaspora" },
  { tag: "#BlackWomen", label: "Black women" },
  { tag: "#BlackMen", label: "Black men & boys" },
  { tag: "#BlackStudents", label: "Black students" },
  { tag: "#HBCUStudents", label: "HBCU students & alumni" },
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

function AnswerCard({ answer, scope, onConnectedTopic }: { answer: LibraryEntry; scope?: ResearchScope; onConnectedTopic?: (topic: string) => void }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const safeSources = useMemo(
    () => answer.sources.map((source) => ({ ...source, href: safeUrl(source.url) })).filter((source): source is Source & { href: string } => Boolean(source.href)),
    [answer.sources],
  );

  return (
    <View style={[styles.answerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.eyebrow, { color: "#936719" }]}>SOURCE-GOVERNED LIBRARY BRIEF</Text>
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
          <Text style={[styles.scopeTitle, { color: colors.foreground }]}>How this was researched</Text>
          <Text style={[styles.scopeCopy, { color: colors.mutedForeground }]}><Text style={{ fontWeight: "800" }}>Research lens: </Text>{scope.researchLenses.map((lens) => lens.tag).join(" ")}</Text>
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
  const { question: suggestedQuestion } = useLocalSearchParams<{ question?: string }>();
  const [question, setQuestion] = useState("");
  const [searchedQuestion, setSearchedQuestion] = useState("");
  const [search, setSearch] = useState<LibrarySearch | null>(null);
  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [state, setState] = useState<"idle" | "searching" | "researching" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const activeResearchLensTags = RESEARCH_LENS_OPTIONS.filter((lens) => hasResearchLens(question, lens.tag)).map((lens) => lens.tag);

  const internalEntry = search?.results.find((result): result is { kind: "entry" } & LibraryEntry => result.kind === "entry") ?? null;

  useEffect(() => {
    if (!question && typeof suggestedQuestion === "string" && suggestedQuestion.trim()) {
      setQuestion(suggestedQuestion.trim().slice(0, 500));
    }
  }, [question, suggestedQuestion]);

  async function searchLibrary(questionOverride?: string) {
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
      if (!hasPublishedEntry) {
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
          <Text style={styles.heroCopy}>Library research starts with the diaspora lens. Add a tag such as #BlackWomen or #BlackStudents when that scope should lead the evidence. A tag is a research instruction, not an assumption about you.</Text>
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
            <Text style={[styles.lensFilterLabel, { color: colors.foreground }]}>Research lens</Text>
            <Text style={[styles.lensFilterCopy, { color: colors.mutedForeground }]}>Choose the community evidence that should lead this search. It is not saved as your identity.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lensFilterRow}>
              {RESEARCH_LENS_OPTIONS.map((lens) => {
                const selected = activeResearchLensTags.includes(lens.tag);
                return (
                  <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    activeOpacity={0.8}
                    key={lens.tag}
                    onPress={() => setQuestion((current) => toggleResearchLens(current, lens.tag))}
                    style={[styles.lensFilterChip, { backgroundColor: selected ? "#70480F" : colors.background, borderColor: selected ? "#70480F" : colors.border }]}
                  >
                    <Text style={[styles.lensFilterChipText, { color: selected ? "#FFFDF8" : colors.foreground }]}>{lens.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <TouchableOpacity activeOpacity={0.85} disabled={state === "searching" || state === "researching"} onPress={() => void searchLibrary()} style={[styles.searchButton, { backgroundColor: colors.primary, opacity: state === "searching" || state === "researching" ? 0.65 : 1 }]}>
            {state === "searching" ? <ActivityIndicator color="#fff" /> : <><Feather name="search" color="#fff" size={16} /><Text style={styles.searchButtonText}>Search the Library</Text></>}
          </TouchableOpacity>
          <Text style={[styles.governanceCopy, { color: colors.mutedForeground }]}>Medical questions use clinical and public-health sources; financial questions use regulators and economic research. A brief is not personal medical, legal, or financial advice.</Text>
        </View>

        {message ? <View style={[styles.message, { backgroundColor: "#FFF1EF", borderColor: "#D59A9A" }]}><Text style={{ color: "#8A2424" }}>{message}</Text></View> : null}
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
        {state === "ready" && search && !internalEntry && !search.searchClarification ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No approved Library entry answers this yet.</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>You can ask for a current brief from vetted sources. It will remain a pending research candidate until Library review; it is not automatically published for other members.</Text>
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
        {research ? <AnswerCard answer={research.answer} scope={research.researchScope} onConnectedTopic={(topic) => { setQuestion(topic); setSearchedQuestion(""); setSearch(null); setResearch(null); setState("idle"); }} /> : null}
        {research?.answer.relatedQuestions?.length ? (
          <View style={[styles.relatedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Related next questions</Text>
            <Text style={[styles.relatedCopy, { color: colors.mutedForeground }]}>These are evidence-led branches from this brief, not claims about the reader or a report of other members&apos; private searches.</Text>
            {research.answer.relatedQuestions.map((related) => (
              <TouchableOpacity key={related} activeOpacity={0.8} onPress={() => { setQuestion(`${research.researchScope.researchLenses.map((lens) => lens.tag).join(" ")} ${related}`.trim()); setSearchedQuestion(""); setSearch(null); setResearch(null); setState("idle"); }} style={[styles.relatedButton, { borderColor: colors.border }]}>
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
  lensFilterSection: { gap: 5 },
  lensFilterLabel: { fontSize: 13, fontWeight: "800" },
  lensFilterCopy: { fontSize: 11, lineHeight: 16 },
  lensFilterRow: { gap: 7, paddingTop: 3, paddingRight: 8 },
  lensFilterChip: { minHeight: 34, justifyContent: "center", paddingHorizontal: 11, borderRadius: 17, borderWidth: 1 },
  lensFilterChipText: { fontSize: 12, fontWeight: "800" },
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
  relatedCopy: { fontSize: 12, lineHeight: 18 },
  relatedButton: { borderWidth: 1, borderRadius: 10, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  relatedText: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18 },
});
