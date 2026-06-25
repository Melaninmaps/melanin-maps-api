import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const TOTAL_STEPS = 4;

const BUSINESS_TYPES = [
  { id: "restaurant", label: "Restaurant & Food" },
  { id: "retail", label: "Retail & Shopping" },
  { id: "salon", label: "Salon & Beauty" },
  { id: "health", label: "Health & Wellness" },
  { id: "professional_services", label: "Professional Services" },
  { id: "entertainment", label: "Entertainment" },
  { id: "tech", label: "Technology" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "other", label: "Other" },
];

const DOC_TYPES = [
  {
    id: "articles_of_incorporation",
    label: "Business Registration",
    desc: "LLC, corporation, partnership, or sole proprietorship registration",
    icon: "file-text" as const,
  },
  {
    id: "business_license",
    label: "Business License or Permit",
    desc: "A valid business license or permit where required",
    icon: "award" as const,
  },
  {
    id: "ein_confirmation",
    label: "EIN / Tax ID Letter",
    desc: "Federal Employer Identification Number confirmation",
    icon: "hash" as const,
  },
  {
    id: "ownership_agreement",
    label: "Ownership Documentation",
    desc: "Documents confirming ownership or authorization to represent the business",
    icon: "users" as const,
  },
  {
    id: "government_issued_id",
    label: "Government-Issued ID",
    desc: "Issued by a recognized organization, chamber of commerce, or certifying body",
    icon: "credit-card" as const,
  },
  {
    id: "other",
    label: "Other Documentation",
    desc: "Any additional documents relevant to your verification",
    icon: "paperclip" as const,
  },
];

const VERIFICATION_POLICY = [
  "Proof of legal business registration (such as an LLC, corporation, partnership, sole proprietorship registration, or other applicable business entity).",
  "A valid business license or permit, where required.",
  "A federal Employer Identification Number (EIN), if applicable.",
  "Documentation confirming ownership or authorization to represent the business.",
  "Registration or certification from a recognized business organization, chamber of commerce, professional association, or certifying organization.",
  "Any additional documentation reasonably necessary to verify the legitimacy of the business.",
];

interface UploadedDoc {
  key: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
}

export default function BusinessVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [einNumber, setEinNumber] = useState("");
  const [message, setMessage] = useState("");

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const animateTo = (s: number) => {
    Animated.spring(progressAnim, { toValue: s / TOTAL_STEPS, useNativeDriver: false }).start();
  };

  const goBack = () => {
    if (step > 1) {
      const prev = step - 1;
      setStep(prev);
      animateTo(prev);
    } else {
      router.canGoBack() ? router.back() : router.replace("/(tabs)");
    }
  };

  const pickDocument = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const maxSize = 15 * 1024 * 1024;
      if (asset.size && asset.size > maxSize) {
        Alert.alert("File too large", "Please upload a file under 15 MB.");
        return;
      }

      setUploadingType(docType);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "application/octet-stream",
      } as any);
      formData.append("docType", docType);

      const resp = await fetch(`${base}/api/verification/upload-document`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }

      const data: UploadedDoc = await resp.json();
      setUploadedDocs((prev) => [...prev.filter((d) => d.type !== docType), data]);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message ?? "Please try again.");
    } finally {
      setUploadingType(null);
    }
  };

  const removeDoc = (key: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.key !== key));
  };

  const handleSubmit = async () => {
    if (!businessName.trim()) { Alert.alert("Required", "Please enter your business name."); return; }
    if (!ownerName.trim()) { Alert.alert("Required", "Please enter the owner's name."); return; }
    if (!businessType) { Alert.alert("Required", "Please select a business type."); return; }
    if (!uploadedDocs.length) { Alert.alert("Required", "Please upload at least one document."); return; }

    setSubmitting(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();

      const body = {
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        businessType,
        einNumber: einNumber.trim() || undefined,
        message: message.trim() || undefined,
        documentsProvided: uploadedDocs.map((d) => d.type),
        documentUrls: uploadedDocs,
      };

      const resp = await fetch(`${base}/api/verification/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }

      const next = 4;
      setStep(next);
      animateTo(next);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Submission Failed", err.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed =
    step === 1 ? policyAccepted :
    step === 2 ? !!(businessName.trim() && ownerName.trim() && businessType) :
    step === 3 ? uploadedDocs.length > 0 :
    false;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Feather name={step === 4 ? "x" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Verification</Text>
          {step < 4 && (
            <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of {TOTAL_STEPS - 1}</Text>
          )}
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>

        {/* ── Step 1: Policy ── */}
        {step === 1 && (
          <View style={styles.section}>
            <View style={[styles.policyHeader, { backgroundColor: colors.primary + "12" }]}>
              <Feather name="shield" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Verification Policy</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Please read before submitting
                </Text>
              </View>
            </View>

            <Text style={[styles.policyIntro, { color: colors.foreground }]}>
              At Mapping with Melanin™, we verify businesses to help build a trusted community for both customers and business owners.{"\n\n"}
              To become a <Text style={{ fontFamily: "Inter_700Bold" }}>Verified Business</Text>, owners may be asked to provide one or more of the following:
            </Text>

            <View style={[styles.policyList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {VERIFICATION_POLICY.map((item, i) => (
                <View key={i} style={[styles.policyItem, i < VERIFICATION_POLICY.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={[styles.policyBullet, { backgroundColor: colors.primary }]}>
                    <Text style={styles.policyBulletText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.policyItemText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.policyDisclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={15} color={colors.mutedForeground} style={{ marginTop: 1 }} />
              <Text style={[styles.policyDisclaimerText, { color: colors.mutedForeground }]}>
                Verification confirms that we have reviewed the information provided by the business. It does{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>not</Text> constitute an endorsement of the business, its products, services, or future performance.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.checkRow, { borderColor: policyAccepted ? colors.primary : colors.border }]}
              onPress={() => {
                setPolicyAccepted(!policyAccepted);
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, { backgroundColor: policyAccepted ? colors.primary : "transparent", borderColor: policyAccepted ? colors.primary : colors.border }]}>
                {policyAccepted && <Feather name="check" size={13} color="#FFF" />}
              </View>
              <Text style={[styles.checkLabel, { color: colors.foreground }]}>
                I have read and understand the verification policy
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Business Info ── */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Business Information</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Tell us about your business so our team can locate your listing.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Business Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Soul Kitchen ATL"
                placeholderTextColor={colors.mutedForeground}
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Owner / Authorized Representative Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                value={ownerName}
                onChangeText={setOwnerName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Business Type *</Text>
              <View style={styles.typeGrid}>
                {BUSINESS_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: businessType === t.id ? colors.primary + "18" : colors.card,
                        borderColor: businessType === t.id ? colors.primary : colors.border,
                        borderWidth: businessType === t.id ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      setBusinessType(t.id);
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeChipText, { color: businessType === t.id ? colors.primary : colors.foreground }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>EIN / Federal Tax ID <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="XX-XXXXXXX"
                placeholderTextColor={colors.mutedForeground}
                value={einNumber}
                onChangeText={setEinNumber}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Additional Notes <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Anything that may help our review team…"
                placeholderTextColor={colors.mutedForeground}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* ── Step 3: Document Upload ── */}
        {step === 3 && (
          <View style={styles.section}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Upload Documents</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Upload at least one document from the list below. PDFs, JPGs, and PNGs are accepted — max 15 MB each.
            </Text>

            {uploadedDocs.length > 0 && (
              <View style={[styles.uploadedList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.uploadedHeader, { color: colors.mutedForeground }]}>Uploaded ({uploadedDocs.length})</Text>
                {uploadedDocs.map((doc) => {
                  const docMeta = DOC_TYPES.find((d) => d.id === doc.type);
                  return (
                    <View key={doc.key} style={[styles.uploadedRow, { borderTopColor: colors.border }]}>
                      <View style={[styles.uploadedIcon, { backgroundColor: colors.primary + "18" }]}>
                        <Feather name={docMeta?.icon ?? "file"} size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.uploadedName, { color: colors.foreground }]} numberOfLines={1}>{doc.name}</Text>
                        <Text style={[styles.uploadedMeta, { color: colors.mutedForeground }]}>
                          {docMeta?.label ?? doc.type} · {formatBytes(doc.size)}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeDoc(doc.key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="x" size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.docTypeList}>
              {DOC_TYPES.map((dt) => {
                const alreadyUploaded = uploadedDocs.some((d) => d.type === dt.id);
                const isUploading = uploadingType === dt.id;
                return (
                  <TouchableOpacity
                    key={dt.id}
                    style={[
                      styles.docTypeCard,
                      {
                        backgroundColor: alreadyUploaded ? colors.primary + "08" : colors.card,
                        borderColor: alreadyUploaded ? colors.primary + "50" : colors.border,
                        opacity: isUploading ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => pickDocument(dt.id)}
                    activeOpacity={0.8}
                    disabled={isUploading || !!uploadingType}
                  >
                    <View style={[styles.docTypeIcon, { backgroundColor: alreadyUploaded ? colors.primary + "20" : colors.secondary }]}>
                      {isUploading
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : alreadyUploaded
                          ? <Feather name="check-circle" size={18} color={colors.primary} />
                          : <Feather name={dt.icon} size={18} color={colors.mutedForeground} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docTypeLabel, { color: alreadyUploaded ? colors.primary : colors.foreground }]}>
                        {dt.label}
                      </Text>
                      <Text style={[styles.docTypeDesc, { color: colors.mutedForeground }]}>{dt.desc}</Text>
                    </View>
                    <Feather
                      name={alreadyUploaded ? "refresh-cw" : "upload"}
                      size={15}
                      color={alreadyUploaded ? colors.primary : colors.mutedForeground}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <View style={styles.successSection}>
            <View style={[styles.successIcon, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="check-circle" size={50} color="#2D7A4F" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Verification Submitted!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Our team will review your submission within{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>2–3 business days</Text>.
              {"\n\n"}You'll be notified once your business status has been updated.
            </Text>

            <View style={[styles.stepsPreview, { backgroundColor: colors.secondary }]}>
              {[
                { label: "Submitted", done: true, icon: "upload-cloud" as const },
                { label: "Under Review", done: false, icon: "eye" as const },
                { label: "Verified", done: false, icon: "shield" as const },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  <View style={styles.statusStep}>
                    <View style={[styles.statusDot, { backgroundColor: s.done ? "#2D7A4F" : colors.border }]}>
                      {s.done
                        ? <Feather name="check" size={10} color="#FFF" />
                        : <Feather name={s.icon} size={10} color={colors.mutedForeground} />
                      }
                    </View>
                    <Text style={[styles.statusLabel, { color: s.done ? colors.foreground : colors.mutedForeground }]}>
                      {s.label}
                    </Text>
                  </View>
                  {i < 2 && <View style={[styles.statusLine, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryHeader, { color: colors.mutedForeground }]}>Documents Submitted</Text>
              {uploadedDocs.map((doc) => (
                <View key={doc.key} style={styles.summaryRow}>
                  <Feather name="file" size={13} color={colors.primary} />
                  <Text style={[styles.summaryText, { color: colors.foreground }]} numberOfLines={1}>{doc.name}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneTxt, { color: colors.primaryForeground }]}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step < 4 && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: canProceed ? colors.primary : colors.muted }]}
            onPress={step === 3 ? handleSubmit : () => {
              const next = step + 1;
              setStep(next);
              animateTo(next);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            disabled={!canProceed || submitting || !!uploadingType}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color={colors.primaryForeground} />
              : <>
                  <Text style={[styles.nextTxt, { color: canProceed ? colors.primaryForeground : colors.mutedForeground }]}>
                    {step === 3 ? "Submit for Review" : "Continue"}
                  </Text>
                  <Feather name="arrow-right" size={16} color={canProceed ? colors.primaryForeground : colors.mutedForeground} />
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  progressTrack: { height: 4, marginHorizontal: 20, borderRadius: 2, marginBottom: 20 },
  progressFill: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 20 },
  section: { gap: 20 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },

  policyHeader: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14 },
  policyIntro: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  policyList: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  policyItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  policyBullet: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
  },
  policyBulletText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFF" },
  policyItemText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  policyDisclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  policyDisclaimerText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkLabel: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1, lineHeight: 20 },

  formGroup: { gap: 8 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },

  uploadedList: { borderWidth: 1, borderRadius: 14, overflow: "hidden", padding: 12, gap: 0 },
  uploadedHeader: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  uploadedRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
  uploadedIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  uploadedName: { fontFamily: "Inter_500Medium", fontSize: 13 },
  uploadedMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },

  docTypeList: { gap: 10 },
  docTypeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  docTypeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  docTypeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  docTypeDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },

  successSection: { alignItems: "center", gap: 20, paddingTop: 20 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  stepsPreview: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 20, borderRadius: 16, gap: 8, alignSelf: "stretch",
  },
  statusStep: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statusLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  statusLine: { width: 24, height: 2, borderRadius: 1 },
  summaryBox: { borderWidth: 1, borderRadius: 14, padding: 14, alignSelf: "stretch", gap: 8 },
  summaryHeader: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  doneBtn: { alignSelf: "stretch", alignItems: "center", paddingVertical: 17, borderRadius: 14 },
  doneTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 14,
  },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
