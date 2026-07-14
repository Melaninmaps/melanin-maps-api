import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ExpoLinking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function getToken() {
  try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
}
async function authHeaders(): Promise<Record<string, string>> {
  const t = await getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ── Types ──────────────────────────────────────────────────────────────────

type OppTab = "jobs" | "mentors" | "scholarships" | "grants" | "volunteer";

interface JobListing {
  id: string;
  title: string;
  businessName: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
  isRemote: boolean | null;
  isHybrid: boolean | null;
  payMin: string | null;
  payMax: string | null;
  payType: string | null;
  salary: string | null;
  industry: string | null;
  applicationUrl: string | null;
  contactEmail: string | null;
  isPersonalReferral: boolean | null;
  postedByName: string | null;
  isSaved?: boolean;
  distanceKm?: number;
  createdAt: string;
}

interface MentorProfile {
  id: string;
  userId: string;
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[] | null;
  city: string | null;
  state: string | null;
  isRemote: boolean | null;
  available: boolean;
  sessionType: string | null;
  sessionRate: string | null;
  linkedinUrl: string | null;
  calendlyUrl: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const OPP_TABS: { id: OppTab; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { id: "jobs",         icon: "briefcase",  label: "Jobs"         },
  { id: "mentors",      icon: "users",      label: "Mentors"      },
  { id: "scholarships", icon: "award",      label: "Scholarships" },
  { id: "grants",       icon: "trending-up",label: "Grants"       },
  { id: "volunteer",    icon: "heart",      label: "Volunteer"    },
];

const JOB_TYPE_FILTERS: { id: string; label: string }[] = [
  { id: "all",           label: "All"           },
  { id: "full_time",     label: "Full-time"     },
  { id: "part_time",     label: "Part-time"     },
  { id: "gig",           label: "Gig / Freelance"},
  { id: "contract",      label: "Contract"      },
  { id: "remote",        label: "Remote"        },
  { id: "internship",    label: "Internship"    },
  { id: "volunteer",     label: "Volunteer"     },
  { id: "collaboration", label: "Collab Deal"   },
];

const SPECIALTIES = [
  "Entrepreneurship", "Finance & Investing", "Technology", "Legal",
  "Creative & Arts", "Beauty & Wellness", "Real Estate", "Marketing",
  "Media & Content", "Health & Medicine", "Education", "Music Industry",
  "Nonprofit & Advocacy", "Government & Policy", "Travel & Hospitality",
];

const JOB_TYPES_SELECTABLE = [
  "full_time", "part_time", "contract", "gig", "internship", "volunteer", "collaboration",
];
const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract",
  gig: "Gig / Freelance", internship: "Internship", volunteer: "Volunteer",
  collaboration: "Collab Deal",
};
const JOB_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  full_time:     { bg: "#16A34A20", text: "#16A34A" },
  part_time:     { bg: "#2563EB20", text: "#2563EB" },
  contract:      { bg: "#EA580C20", text: "#EA580C" },
  gig:           { bg: "#7C3AED20", text: "#7C3AED" },
  internship:    { bg: "#CA922B20", text: "#CA922B" },
  volunteer:     { bg: "#DC262620", text: "#DC2626" },
  collaboration: { bg: "#0891B220", text: "#0891B2" },
};

type ResourceItem = { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; url: string };
const FEATURED_RESOURCES: Record<OppTab, ResourceItem[]> = {
  jobs: [
    { icon: "briefcase",    title: "Jopwell",        subtitle: "Diversity career platform",  url: "https://jopwell.com" },
    { icon: "globe",        title: "UNCF CareerLink", subtitle: "HBCU career network",       url: "https://careers.uncf.org" },
    { icon: "archive",      title: "USAJOBS",         subtitle: "Federal government jobs",   url: "https://usajobs.gov" },
  ],
  scholarships: [
    { icon: "award",        title: "UNCF Scholarships",       subtitle: "Largest HBCU scholarship org",       url: "https://uncf.org/scholarships" },
    { icon: "book-open",    title: "Thurgood Marshall Fund",  subtitle: "HBCU student scholarships",          url: "https://tmcf.org" },
    { icon: "zap",          title: "Ron Brown Scholar",       subtitle: "Community leader scholarships",       url: "https://ronbrown.org" },
  ],
  grants: [
    { icon: "trending-up",  title: "SBA Minority Programs",   subtitle: "Small business grants & loans",      url: "https://sba.gov" },
    { icon: "star",         title: "NAACP Economic Programs", subtitle: "Business & community grants",         url: "https://naacp.org" },
    { icon: "grid",         title: "BlackEnterprise Grants",  subtitle: "Entrepreneur resources",             url: "https://blackenterprise.com" },
  ],
  mentors: [],
  volunteer: [
    { icon: "home",         title: "Habitat for Humanity",    subtitle: "Build affordable housing",           url: "https://habitat.org" },
    { icon: "book",         title: "Literacy Programs",       subtitle: "Community reading & tutoring",       url: "" },
    { icon: "sun",          title: "Urban Gardens",           subtitle: "Community food initiatives",         url: "" },
  ],
};

// ── Pay display helper ─────────────────────────────────────────────────────

function formatPay(job: JobListing): string | null {
  if (job.payType === "unpaid") return "Unpaid";
  const fmt = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n)) return null;
    return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toFixed(0)}`;
  };
  const suffix = job.payType === "hourly" ? "/hr" : job.payType === "salary" ? "/yr" : job.payType === "fixed" ? " fixed" : "";
  if (job.payMin && job.payMax) {
    const lo = fmt(job.payMin); const hi = fmt(job.payMax);
    if (lo && hi) return `${lo}–${hi}${suffix}`;
  }
  if (job.payMin) { const lo = fmt(job.payMin); if (lo) return `${lo}+${suffix}`; }
  if (job.salary) return job.salary;
  return null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OpportunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  // Tab state
  const [activeTab, setActiveTab] = useState<OppTab>("jobs");

  // Data
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Filters
  const [nearMe, setNearMe] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  // Post Job modal
  const [showPostJob, setShowPostJob] = useState(false);
  const [postStep, setPostStep] = useState(1);
  const [postJobType, setPostJobType] = useState("full_time");
  const [postBusinessName, setPostBusinessName] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postPayType, setPostPayType] = useState("hourly");
  const [postPayMin, setPostPayMin] = useState("");
  const [postPayMax, setPostPayMax] = useState("");
  const [postIsRemote, setPostIsRemote] = useState(false);
  const [postCity, setPostCity] = useState("");
  const [postState, setPostState] = useState("");
  const [postApplyUrl, setPostApplyUrl] = useState("");
  const [postApplyEmail, setPostApplyEmail] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Mentor modal
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorStep, setMentorStep] = useState(1);
  const [mentorName, setMentorName] = useState("");
  const [mentorHeadline, setMentorHeadline] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [mentorSpecialties, setMentorSpecialties] = useState<string[]>([]);
  const [mentorSessionType, setMentorSessionType] = useState("free");
  const [mentorRate, setMentorRate] = useState("");
  const [mentorCity, setMentorCity] = useState("");
  const [mentorState, setMentorState] = useState("");
  const [mentorCalendly, setMentorCalendly] = useState("");
  const [mentorLinkedin, setMentorLinkedin] = useState("");
  const [mentorSubmitting, setMentorSubmitting] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams({ status: "active", limit: "40" });
      if (nearMe && userCoords) {
        params.set("lat", String(userCoords.lat));
        params.set("lng", String(userCoords.lng));
        params.set("radius", "80");
      } else if (cityFilter.trim()) {
        params.set("city", cityFilter.trim());
      }
      if (typeFilter !== "all" && typeFilter !== "remote") params.set("type", typeFilter);
      if (typeFilter === "remote") params.set("isRemote", "true");

      const res = await fetch(`${getApiBase()}/api/jobs?${params.toString()}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { jobs?: JobListing[] };
        const list = data.jobs ?? [];
        setJobs(list);
        setSavedJobIds(new Set(list.filter((j) => j.isSaved).map((j) => j.id)));
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [nearMe, userCoords, cityFilter, typeFilter]);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams({ limit: "30" });
      if (specialtyFilter) params.set("specialty", specialtyFilter);
      if (nearMe && userCoords) {
        params.set("lat", String(userCoords.lat));
        params.set("lng", String(userCoords.lng));
        params.set("radius", "100");
      }
      const res = await fetch(`${getApiBase()}/api/mentorship?${params.toString()}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { mentors?: MentorProfile[]; profiles?: MentorProfile[] };
        setMentors(data.mentors ?? data.profiles ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [nearMe, userCoords, specialtyFilter]);

  useEffect(() => {
    if (activeTab === "jobs") loadJobs();
    else if (activeTab === "mentors") loadMentors();
    else setLoading(false);
  }, [activeTab, loadJobs, loadMentors]);

  // ── Near Me ──────────────────────────────────────────────────────────────

  const handleNearMeToggle = async () => {
    if (nearMe) { setNearMe(false); setUserCoords(null); return; }
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location needed", "Enable location access in Settings to use Near Me filtering.");
        setLocationLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setNearMe(true);
      setCityFilter("");
    } catch {
      Alert.alert("Location error", "Could not get your location. Try again.");
    } finally { setLocationLoading(false); }
  };

  // ── Save job ─────────────────────────────────────────────────────────────

  const toggleSaveJob = async (jobId: string) => {
    const t = await getToken();
    if (!t) { Alert.alert("Sign in required", "Create a free account to save jobs."); return; }
    const isSaved = savedJobIds.has(jobId);
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(jobId) : next.add(jobId);
      return next;
    });
    const method = isSaved ? "DELETE" : "POST";
    try {
      await fetch(`${getApiBase()}/api/jobs/${jobId}/save`, {
        method,
        headers: { Authorization: `Bearer ${t}` },
      });
    } catch { /* revert optimistic */ }
  };

  // ── Post job ─────────────────────────────────────────────────────────────

  const resetPostJob = () => {
    setPostStep(1); setPostJobType("full_time"); setPostBusinessName("");
    setPostTitle(""); setPostDesc(""); setPostPayType("hourly");
    setPostPayMin(""); setPostPayMax(""); setPostIsRemote(false);
    setPostCity(""); setPostState(""); setPostApplyUrl(""); setPostApplyEmail("");
  };

  const submitPostJob = async () => {
    if (!postTitle.trim()) { Alert.alert("Required", "Please enter a job title."); return; }
    setPostSubmitting(true);
    try {
      const h = await authHeaders();
      const body = {
        businessName: postBusinessName.trim() || undefined,
        title: postTitle.trim(),
        description: postDesc.trim(),
        type: postJobType,
        payType: postPayType,
        payMin: postPayMin ? parseFloat(postPayMin) : undefined,
        payMax: postPayMax ? parseFloat(postPayMax) : undefined,
        isRemote: postIsRemote,
        city: postCity.trim() || "Remote",
        state: postState.trim() || "N/A",
        applicationUrl: postApplyUrl.trim() || undefined,
        contactEmail: postApplyEmail.trim() || undefined,
      };
      const res = await fetch(`${getApiBase()}/api/jobs`, { method: "POST", headers: h, body: JSON.stringify(body) });
      if (res.ok) {
        setShowPostJob(false);
        resetPostJob();
        Alert.alert("Posted!", "Your listing is live. Thank you for supporting the community.");
        if (activeTab === "jobs") loadJobs();
      } else {
        Alert.alert("Error", "Could not post listing. Please try again.");
      }
    } catch { Alert.alert("Error", "Something went wrong. Please try again."); }
    finally { setPostSubmitting(false); }
  };

  // ── Register mentor ───────────────────────────────────────────────────────

  const resetMentorModal = () => {
    setMentorStep(1); setMentorName(""); setMentorHeadline(""); setMentorBio("");
    setMentorSpecialties([]); setMentorSessionType("free"); setMentorRate("");
    setMentorCity(""); setMentorState(""); setMentorCalendly(""); setMentorLinkedin("");
  };

  const submitMentorProfile = async () => {
    if (!mentorName.trim()) { Alert.alert("Required", "Please enter your name."); return; }
    setMentorSubmitting(true);
    try {
      const h = await authHeaders();
      const body = {
        fullName: mentorName.trim(),
        headline: mentorHeadline.trim() || undefined,
        bio: mentorBio.trim() || undefined,
        specialties: mentorSpecialties,
        sessionType: mentorSessionType,
        sessionRate: mentorRate.trim() || undefined,
        city: mentorCity.trim() || undefined,
        state: mentorState.trim() || undefined,
        calendlyUrl: mentorCalendly.trim() || undefined,
        linkedinUrl: mentorLinkedin.trim() || undefined,
        isRemote: true,
      };
      const res = await fetch(`${getApiBase()}/api/mentorship`, { method: "POST", headers: h, body: JSON.stringify(body) });
      if (res.ok) {
        setShowMentorModal(false);
        resetMentorModal();
        Alert.alert("Welcome!", "Your mentor profile is live. The community can now find you.");
        loadMentors();
      } else {
        Alert.alert("Error", "Could not save profile. Please try again.");
      }
    } catch { Alert.alert("Error", "Something went wrong."); }
    finally { setMentorSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const resources = FEATURED_RESOURCES[activeTab] ?? [];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Opportunity Center</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Jobs · Mentors · Scholarships · Grants</Text>
          </View>
          {(activeTab === "jobs" || activeTab === "mentors") && (
            <TouchableOpacity
              style={[s.postBtn, { backgroundColor: "#CA922B" }]}
              onPress={() => activeTab === "jobs" ? setShowPostJob(true) : setShowMentorModal(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={15} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBarInner}>
          {OPP_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tab, active && { borderBottomColor: "#CA922B" }]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Feather name={tab.icon} size={14} color={active ? "#CA922B" : colors.mutedForeground} />
                <Text style={[s.tabLabel, { color: active ? "#CA922B" : colors.mutedForeground }, active && { fontWeight: "700" }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: 8 }}>

        {/* ── Jobs tab ── */}
        {activeTab === "jobs" && (
          <>
            {/* Location bar */}
            <View style={[s.locationBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.cityInputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="map-pin" size={14} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
                <TextInput
                  style={[s.cityInput, { color: colors.foreground }]}
                  placeholder="City, state or zip…"
                  placeholderTextColor={colors.mutedForeground}
                  value={cityFilter}
                  onChangeText={(v) => { setCityFilter(v); setNearMe(false); }}
                  onSubmitEditing={loadJobs}
                  returnKeyType="search"
                  editable={!nearMe}
                />
                {cityFilter.length > 0 && !nearMe && (
                  <TouchableOpacity onPress={() => setCityFilter("")} style={{ padding: 6 }}>
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[s.nearMeBtn, { backgroundColor: nearMe ? "#CA922B" : colors.background, borderColor: nearMe ? "#CA922B" : colors.border }]}
                onPress={handleNearMeToggle}
                activeOpacity={0.8}
                disabled={locationLoading}
              >
                {locationLoading
                  ? <ActivityIndicator size="small" color={nearMe ? "#fff" : "#CA922B"} />
                  : <Feather name="navigation" size={14} color={nearMe ? "#fff" : "#CA922B"} />}
                <Text style={[s.nearMeTxt, { color: nearMe ? "#fff" : "#CA922B" }]}>Near Me</Text>
              </TouchableOpacity>
            </View>

            {/* Type filter chips */}
            <ScrollView keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
              {JOB_TYPE_FILTERS.map((f) => {
                const active = typeFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[s.chip, { backgroundColor: active ? "#CA922B" : colors.card, borderColor: active ? "#CA922B" : colors.border }]}
                    onPress={() => setTypeFilter(f.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipTxt, { color: active ? "#fff" : colors.foreground }]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Featured resources */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Featured Resources</Text>
              {FEATURED_RESOURCES.jobs.map((r, i) => (
                <TouchableOpacity key={i} style={[s.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => r.url && ExpoLinking.openURL(r.url)} activeOpacity={0.75}>
                  <View style={[s.resourceIcon, { backgroundColor: "#CA922B18" }]}>
                    <Feather name={r.icon} size={18} color="#CA922B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.resourceTitle, { color: colors.foreground }]}>{r.title}</Text>
                    <Text style={[s.resourceSub, { color: colors.mutedForeground }]}>{r.subtitle}</Text>
                  </View>
                  {!!r.url && <Feather name="external-link" size={14} color={colors.mutedForeground} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Job listings */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
                  {nearMe ? "Near You" : "Recent Listings"}
                </Text>
                <TouchableOpacity onPress={() => setShowPostJob(true)} activeOpacity={0.75}>
                  <Text style={[s.postLink, { color: "#CA922B" }]}>Post a Job</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator color="#CA922B" style={{ marginTop: 24 }} />
              ) : jobs.length === 0 ? (
                <View style={s.empty}>
                  <Feather name="briefcase" size={40} color={colors.mutedForeground} />
                  <Text style={[s.emptyTitle, { color: colors.foreground }]}>No listings yet</Text>
                  <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                    {nearMe ? "No jobs found near you. Try expanding your search or browsing all listings." : "Be the first to post a job in the community."}
                  </Text>
                  <TouchableOpacity style={[s.ctaBtn, { backgroundColor: "#CA922B", marginTop: 16 }]} onPress={() => setShowPostJob(true)} activeOpacity={0.8}>
                    <Text style={s.ctaTxt}>Post a Job</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                jobs.map((job) => {
                  const typeColor = JOB_TYPE_COLORS[job.type ?? ""] ?? { bg: "#CA922B20", text: "#CA922B" };
                  const pay = formatPay(job);
                  const location = job.isRemote ? "Remote" : [job.city, job.state].filter(Boolean).join(", ");
                  const poster = job.businessName ?? job.postedByName ?? "Community Member";
                  const isSaved = savedJobIds.has(job.id);
                  return (
                    <TouchableOpacity
                      key={job.id}
                      style={[s.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push({ pathname: "/jobs/[id]", params: { id: job.id } } as never)}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={s.jobBadgeRow}>
                          {job.type && (
                            <View style={[s.badge, { backgroundColor: typeColor.bg }]}>
                              <Text style={[s.badgeTxt, { color: typeColor.text }]}>{JOB_TYPE_LABELS[job.type] ?? job.type}</Text>
                            </View>
                          )}
                          {job.isRemote && (
                            <View style={[s.badge, { backgroundColor: "#0891B220" }]}>
                              <Feather name="wifi" size={10} color="#0891B2" />
                              <Text style={[s.badgeTxt, { color: "#0891B2" }]}>Remote</Text>
                            </View>
                          )}
                          {job.isHybrid && (
                            <View style={[s.badge, { backgroundColor: "#7C3AED20" }]}>
                              <Text style={[s.badgeTxt, { color: "#7C3AED" }]}>Hybrid</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[s.jobTitle, { color: colors.foreground }]} numberOfLines={2}>{job.title}</Text>
                        <Text style={[s.jobPoster, { color: colors.mutedForeground }]} numberOfLines={1}>{poster}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                          {location && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                              <Text style={[s.jobMeta, { color: colors.mutedForeground }]}>{location}</Text>
                            </View>
                          )}
                          {pay && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Feather name="dollar-sign" size={11} color="#16A34A" />
                              <Text style={[s.jobMeta, { color: "#16A34A", fontWeight: "600" }]}>{pay}</Text>
                            </View>
                          )}
                          {job.distanceKm != null && job.distanceKm > 0 && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Feather name="navigation" size={11} color={colors.mutedForeground} />
                              <Text style={[s.jobMeta, { color: colors.mutedForeground }]}>{Math.round(job.distanceKm)}km</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[s.jobAge, { color: colors.mutedForeground }]}>{timeAgo(job.createdAt)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleSaveJob(job.id)} style={s.saveBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name={isSaved ? "bookmark" : "bookmark"} size={18} color={isSaved ? "#CA922B" : colors.mutedForeground} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ── Mentors tab ── */}
        {activeTab === "mentors" && (
          <>
            {/* Near Me bar */}
            <View style={[s.locationBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.locationBarLabel, { color: colors.mutedForeground }]}>Find mentors</Text>
              <TouchableOpacity
                style={[s.nearMeBtn, { backgroundColor: nearMe ? "#CA922B" : colors.background, borderColor: nearMe ? "#CA922B" : colors.border }]}
                onPress={handleNearMeToggle}
                activeOpacity={0.8}
                disabled={locationLoading}
              >
                {locationLoading
                  ? <ActivityIndicator size="small" color={nearMe ? "#fff" : "#CA922B"} />
                  : <Feather name="navigation" size={14} color={nearMe ? "#fff" : "#CA922B"} />}
                <Text style={[s.nearMeTxt, { color: nearMe ? "#fff" : "#CA922B" }]}>Near Me</Text>
              </TouchableOpacity>
            </View>

            {/* Specialty filter */}
            <ScrollView keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
              {["All", ...SPECIALTIES].map((spec) => {
                const id = spec === "All" ? "" : spec;
                const active = specialtyFilter === id;
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[s.chip, { backgroundColor: active ? "#CA922B" : colors.card, borderColor: active ? "#CA922B" : colors.border }]}
                    onPress={() => setSpecialtyFilter(id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipTxt, { color: active ? "#fff" : colors.foreground }]}>{spec}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Available Mentors</Text>
                <TouchableOpacity onPress={() => setShowMentorModal(true)} activeOpacity={0.75}>
                  <Text style={[s.postLink, { color: "#CA922B" }]}>Become a Mentor</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator color="#CA922B" style={{ marginTop: 24 }} />
              ) : mentors.length === 0 ? (
                <View style={s.empty}>
                  <Feather name="users" size={40} color={colors.mutedForeground} />
                  <Text style={[s.emptyTitle, { color: colors.foreground }]}>No mentors found</Text>
                  <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Be the change. Register as a community mentor and help someone reach their next level.</Text>
                  <TouchableOpacity style={[s.ctaBtn, { backgroundColor: "#CA922B", marginTop: 16 }]} onPress={() => setShowMentorModal(true)} activeOpacity={0.8}>
                    <Text style={s.ctaTxt}>Register as Mentor</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                mentors.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: "/user/[id]", params: { id: m.userId } } as never)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.mentorAvatar, { backgroundColor: "#CA922B" }]}>
                      <Text style={s.mentorInitials}>{(m.fullName ?? "M").charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.jobTitle, { color: colors.foreground }]} numberOfLines={1}>{m.fullName ?? "Community Mentor"}</Text>
                      {m.headline && <Text style={[s.jobPoster, { color: colors.mutedForeground }]} numberOfLines={2}>{m.headline}</Text>}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {(m.specialties ?? []).slice(0, 3).map((spec) => (
                          <View key={spec} style={[s.badge, { backgroundColor: "#CA922B15" }]}>
                            <Text style={[s.badgeTxt, { color: "#CA922B" }]}>{spec}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                        {(m.city || m.isRemote) && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                            <Text style={[s.jobMeta, { color: colors.mutedForeground }]}>{m.isRemote ? "Remote" : `${m.city}, ${m.state ?? ""}`}</Text>
                          </View>
                        )}
                        {m.sessionType && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Feather name="clock" size={11} color={colors.mutedForeground} />
                            <Text style={[s.jobMeta, { color: colors.mutedForeground }]}>
                              {m.sessionType === "free" ? "Free sessions" : m.sessionType === "paid" ? (m.sessionRate ?? "Paid") : "By donation"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}

        {/* ── Static resource tabs ── */}
        {(activeTab === "scholarships" || activeTab === "grants" || activeTab === "volunteer") && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Featured Resources</Text>
            {resources.map((r, i) => (
              <TouchableOpacity key={i} style={[s.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => r.url && ExpoLinking.openURL(r.url)} activeOpacity={0.75}>
                <View style={[s.resourceIcon, { backgroundColor: "#CA922B18" }]}>
                  <Feather name={r.icon} size={18} color="#CA922B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.resourceTitle, { color: colors.foreground }]}>{r.title}</Text>
                  <Text style={[s.resourceSub, { color: colors.mutedForeground }]}>{r.subtitle}</Text>
                </View>
                {!!r.url && <Feather name="external-link" size={14} color={colors.mutedForeground} />}
              </TouchableOpacity>
            ))}
            <View style={s.empty}>
              <Feather name={OPP_TABS.find((t) => t.id === activeTab)?.icon ?? "star"} size={36} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>Community listings coming soon</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Community members will be able to post {activeTab} listings. Check back soon.</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Post Job Modal ── */}
      <Modal visible={showPostJob} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPostJob(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[s.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => { setShowPostJob(false); resetPostJob(); }} style={s.modalClose}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Post a Job</Text>
              <View style={s.stepIndicator}>
                {[1, 2, 3].map((n) => (
                  <View key={n} style={[s.stepDot, { backgroundColor: n <= postStep ? "#CA922B" : colors.border }]} />
                ))}
              </View>
            </View>
            <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={s.modalScroll}>
              {postStep === 1 && (
                <>
                  <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Step 1 of 3 — Job type & employer</Text>
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Business or your name</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="e.g. Queen's Café or Your Name" placeholderTextColor={colors.mutedForeground}
                    value={postBusinessName} onChangeText={setPostBusinessName} />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Opportunity type</Text>
                  <View style={s.chipGrid}>
                    {JOB_TYPES_SELECTABLE.map((t) => (
                      <TouchableOpacity key={t} style={[s.chipLg, { backgroundColor: postJobType === t ? "#CA922B" : colors.card, borderColor: postJobType === t ? "#CA922B" : colors.border }]}
                        onPress={() => setPostJobType(t)} activeOpacity={0.75}>
                        <Text style={[s.chipTxt, { color: postJobType === t ? "#fff" : colors.foreground }]}>{JOB_TYPE_LABELS[t]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {postStep === 2 && (
                <>
                  <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Step 2 of 3 — Role details</Text>
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Job title *</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="e.g. Senior Hair Stylist" placeholderTextColor={colors.mutedForeground}
                    value={postTitle} onChangeText={setPostTitle} />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Description</Text>
                  <TextInput style={[s.inputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="What will this person do? What makes this a great opportunity?" placeholderTextColor={colors.mutedForeground}
                    value={postDesc} onChangeText={setPostDesc} multiline numberOfLines={4} />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Pay type</Text>
                  <View style={s.payTypeRow}>
                    {["hourly", "salary", "fixed", "unpaid"].map((pt) => (
                      <TouchableOpacity key={pt} style={[s.chip, { backgroundColor: postPayType === pt ? "#CA922B" : colors.card, borderColor: postPayType === pt ? "#CA922B" : colors.border }]}
                        onPress={() => setPostPayType(pt)} activeOpacity={0.75}>
                        <Text style={[s.chipTxt, { color: postPayType === pt ? "#fff" : colors.foreground, textTransform: "capitalize" }]}>{pt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {postPayType !== "unpaid" && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fieldLabel, { color: colors.foreground }]}>Min pay</Text>
                        <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                          placeholder={postPayType === "hourly" ? "15" : "40000"} placeholderTextColor={colors.mutedForeground}
                          value={postPayMin} onChangeText={setPostPayMin} keyboardType="numeric" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fieldLabel, { color: colors.foreground }]}>Max pay</Text>
                        <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                          placeholder={postPayType === "hourly" ? "25" : "65000"} placeholderTextColor={colors.mutedForeground}
                          value={postPayMax} onChangeText={setPostPayMax} keyboardType="numeric" />
                      </View>
                    </View>
                  )}
                  <TouchableOpacity style={[s.toggleRow, { borderColor: colors.border }]} onPress={() => setPostIsRemote((v) => !v)} activeOpacity={0.8}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 14, fontWeight: "600", color: colors.foreground }]}>Remote / virtual</Text>
                      <Text style={[{ fontSize: 12, color: colors.mutedForeground }]}>This role can be done from anywhere</Text>
                    </View>
                    <View style={[s.toggleTrack, { backgroundColor: postIsRemote ? "#CA922B" : colors.border }]}>
                      <View style={[s.toggleThumb, { left: postIsRemote ? 18 : 2 }]} />
                    </View>
                  </TouchableOpacity>
                </>
              )}
              {postStep === 3 && (
                <>
                  <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Step 3 of 3 — Location & apply</Text>
                  {!postIsRemote && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 2 }}>
                        <Text style={[s.fieldLabel, { color: colors.foreground }]}>City</Text>
                        <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                          placeholder="Philadelphia" placeholderTextColor={colors.mutedForeground} value={postCity} onChangeText={setPostCity} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fieldLabel, { color: colors.foreground }]}>State</Text>
                        <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                          placeholder="PA" placeholderTextColor={colors.mutedForeground} value={postState} onChangeText={setPostState} maxLength={2} autoCapitalize="characters" />
                      </View>
                    </View>
                  )}
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Apply URL (optional)</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="https://yourbusiness.com/apply" placeholderTextColor={colors.mutedForeground}
                    value={postApplyUrl} onChangeText={setPostApplyUrl} keyboardType="url" autoCapitalize="none" />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Contact email (optional)</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="hiring@yourbusiness.com" placeholderTextColor={colors.mutedForeground}
                    value={postApplyEmail} onChangeText={setPostApplyEmail} keyboardType="email-address" autoCapitalize="none" />
                </>
              )}
            </ScrollView>
            <View style={[s.modalFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
              {postStep > 1 && (
                <TouchableOpacity style={[s.footerSecBtn, { borderColor: colors.border }]} onPress={() => setPostStep((v) => v - 1)} activeOpacity={0.8}>
                  <Text style={[{ fontSize: 15, fontWeight: "600", color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.footerPriBtn, { backgroundColor: "#CA922B", opacity: postSubmitting ? 0.6 : 1 }]}
                onPress={postStep < 3 ? () => setPostStep((v) => v + 1) : submitPostJob}
                disabled={postSubmitting}
                activeOpacity={0.85}
              >
                {postSubmitting ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{postStep < 3 ? "Next" : "Post Listing"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Mentor Register Modal ── */}
      <Modal visible={showMentorModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMentorModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[s.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => { setShowMentorModal(false); resetMentorModal(); }} style={s.modalClose}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Become a Mentor</Text>
              <View style={s.stepIndicator}>
                {[1, 2, 3].map((n) => (
                  <View key={n} style={[s.stepDot, { backgroundColor: n <= mentorStep ? "#CA922B" : colors.border }]} />
                ))}
              </View>
            </View>
            <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={s.modalScroll}>
              {mentorStep === 1 && (
                <>
                  <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Step 1 of 3 — About you</Text>
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Your name *</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="Aaliyah Johnson" placeholderTextColor={colors.mutedForeground} value={mentorName} onChangeText={setMentorName} />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Headline</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="e.g. Founder · 10+ years in real estate" placeholderTextColor={colors.mutedForeground} value={mentorHeadline} onChangeText={setMentorHeadline} />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Bio</Text>
                  <TextInput style={[s.inputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="Share your story, what you've built, and who you love to help." placeholderTextColor={colors.mutedForeground}
                    value={mentorBio} onChangeText={setMentorBio} multiline numberOfLines={4} />
                </>
              )}
              {mentorStep === 2 && (
                <>
                  <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Step 2 of 3 — Your expertise</Text>
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Specialties (select all that apply)</Text>
                  <View style={s.chipGrid}>
                    {SPECIALTIES.map((spec) => {
                      const sel = mentorSpecialties.includes(spec);
                      return (
                        <TouchableOpacity key={spec}
                          style={[s.chipLg, { backgroundColor: sel ? "#CA922B" : colors.card, borderColor: sel ? "#CA922B" : colors.border }]}
                          onPress={() => setMentorSpecialties((prev) => sel ? prev.filter((s) => s !== spec) : [...prev, spec])}
                          activeOpacity={0.75}>
                          <Text style={[s.chipTxt, { color: sel ? "#fff" : colors.foreground }]}>{spec}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[s.fieldLabel, { color: colors.foreground, marginTop: 16 }]}>Session type</Text>
                  <View style={s.payTypeRow}>
                    {["free", "paid", "donation"].map((st) => (
                      <TouchableOpacity key={st} style={[s.chip, { backgroundColor: mentorSessionType === st ? "#CA922B" : colors.card, borderColor: mentorSessionType === st ? "#CA922B" : colors.border }]}
                        onPress={() => setMentorSessionType(st)} activeOpacity={0.75}>
                        <Text style={[s.chipTxt, { color: mentorSessionType === st ? "#fff" : colors.foreground, textTransform: "capitalize" }]}>{st}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {mentorSessionType === "paid" && (
                    <>
                      <Text style={[s.fieldLabel, { color: colors.foreground }]}>Rate</Text>
                      <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="e.g. $75/hr or $200/session" placeholderTextColor={colors.mutedForeground} value={mentorRate} onChangeText={setMentorRate} />
                    </>
                  )}
                </>
              )}
              {mentorStep === 3 && (
                <>
                  <Text style={[s.modalSub, { color: colors.mutedForeground }]}>Step 3 of 3 — Connect with mentees</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={[s.fieldLabel, { color: colors.foreground }]}>City</Text>
                      <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="Atlanta" placeholderTextColor={colors.mutedForeground} value={mentorCity} onChangeText={setMentorCity} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.fieldLabel, { color: colors.foreground }]}>State</Text>
                      <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="GA" placeholderTextColor={colors.mutedForeground} value={mentorState} onChangeText={setMentorState} maxLength={2} autoCapitalize="characters" />
                    </View>
                  </View>
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Calendly or booking link</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="https://calendly.com/yourname" placeholderTextColor={colors.mutedForeground}
                    value={mentorCalendly} onChangeText={setMentorCalendly} keyboardType="url" autoCapitalize="none" />
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>LinkedIn profile</Text>
                  <TextInput style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="https://linkedin.com/in/yourname" placeholderTextColor={colors.mutedForeground}
                    value={mentorLinkedin} onChangeText={setMentorLinkedin} keyboardType="url" autoCapitalize="none" />
                </>
              )}
            </ScrollView>
            <View style={[s.modalFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
              {mentorStep > 1 && (
                <TouchableOpacity style={[s.footerSecBtn, { borderColor: colors.border }]} onPress={() => setMentorStep((v) => v - 1)} activeOpacity={0.8}>
                  <Text style={[{ fontSize: 15, fontWeight: "600", color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.footerPriBtn, { backgroundColor: "#CA922B", opacity: mentorSubmitting ? 0.6 : 1 }]}
                onPress={mentorStep < 3 ? () => setMentorStep((v) => v + 1) : submitMentorProfile}
                disabled={mentorSubmitting}
                activeOpacity={0.85}
              >
                {mentorSubmitting ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{mentorStep < 3 ? "Next" : "Go Live"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  postBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabBar: { borderBottomWidth: 1 },
  tabBarInner: { paddingHorizontal: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 13 },
  locationBar: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 14, borderWidth: 1 },
  locationBarLabel: { flex: 1, fontSize: 13 },
  cityInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, height: 38 },
  cityInput: { flex: 1, paddingHorizontal: 8, fontSize: 13, height: 38 },
  nearMeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  nearMeTxt: { fontSize: 12, fontWeight: "700" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipLg: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipTxt: { fontSize: 12, fontWeight: "600" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  postLink: { fontSize: 13, fontWeight: "700" },
  resourceCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  resourceIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  resourceTitle: { fontSize: 14, fontWeight: "700" },
  resourceSub: { fontSize: 12, marginTop: 2 },
  jobCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  jobBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontWeight: "600" },
  jobTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
  jobPoster: { fontSize: 12, marginTop: 2 },
  jobMeta: { fontSize: 12 },
  jobAge: { fontSize: 11, marginTop: 4 },
  saveBtn: { padding: 4 },
  mentorAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  mentorInitials: { fontSize: 18, fontWeight: "700", color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  ctaBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 22 },
  ctaTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1 },
  modalClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  stepIndicator: { flexDirection: "row", gap: 6, width: 60, justifyContent: "flex-end" },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  modalScroll: { padding: 20, gap: 4, paddingBottom: 40 },
  modalSub: { fontSize: 13, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  inputMulti: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, minHeight: 100, textAlignVertical: "top" },
  payTypeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 14 },
  toggleTrack: { width: 42, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleThumb: { position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", top: 2 },
  modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  footerSecBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  footerPriBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
