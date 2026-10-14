import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Calendar from "expo-calendar";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import {
  kinfolkJourneysApi,
  uploadPrivateJourneyAttachment,
  type KinfolkJourney,
  type KinfolkJourneyConnection,
  type KinfolkJourneyDetail,
  type KinfolkJourneyItem,
} from "@/lib/kinfolkJourneys";

const BROWN = "#3B1F0E";
const CREAM = "#FAF1E4";
const GOLD = "#C9A84C";

type ViewState = "list" | "create" | "detail" | "connections";
type CalendarCandidate = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
function formatDate(value: string | null) {
  if (!value) return "Dates to be decided";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function KinfolkJourneysScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<ViewState>("list");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [journeys, setJourneys] = useState<KinfolkJourney[]>([]);
  const [detail, setDetail] = useState<KinfolkJourneyDetail | null>(null);
  const [connections, setConnections] = useState<KinfolkJourneyConnection[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemKind, setItemKind] = useState<
    | "flight"
    | "lodging"
    | "transport"
    | "reservation"
    | "event"
    | "place"
    | "note"
    | "reminder"
  >("note");
  const [importText, setImportText] = useState("");
  const [reminderDueAt, setReminderDueAt] = useState("");
  const [operatingCarrier, setOperatingCarrier] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [flightOrigin, setFlightOrigin] = useState("");
  const [flightDestination, setFlightDestination] = useState("");
  const [calendarCandidates, setCalendarCandidates] = useState<
    CalendarCandidate[]
  >([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  const loadList = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const capability = await kinfolkJourneysApi.capabilities();
      setEnabled(capability.enabled);
      if (capability.enabled)
        setJourneys((await kinfolkJourneysApi.list()).journeys);
      else
        setError(
          capability.message ??
            "Kinfolk Journeys is not enabled in this environment yet.",
        );
    } catch (cause) {
      setError(errorMessage(cause, "Kinfolk Journeys could not load."));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadDetail = useCallback(async (journeyId: string) => {
    setWorking(true);
    setError(null);
    try {
      setDetail(await kinfolkJourneysApi.detail(journeyId));
      setScreen("detail");
    } catch (cause) {
      setError(errorMessage(cause, "This private Journey could not load."));
    } finally {
      setWorking(false);
    }
  }, []);
  const refreshDetail = useCallback(async () => {
    if (!detail) return;
    try {
      setDetail(await kinfolkJourneysApi.detail(detail.journey.id));
    } catch (cause) {
      setError(errorMessage(cause, "Journey details could not refresh."));
    }
  }, [detail]);
  useEffect(() => {
    void loadList();
  }, [loadList]);

  const createJourney = async () => {
    if (!title.trim()) {
      Alert.alert(
        "Name your Journey",
        "Give this private plan a title before saving.",
      );
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const result = await kinfolkJourneysApi.create({
        title: title.trim(),
        destinationLabel: destination.trim() || null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        retentionPolicy: "keep_until_deleted",
      });
      setTitle("");
      setDestination("");
      await loadDetail(result.journey.id);
      void loadList();
    } catch (cause) {
      setError(errorMessage(cause, "Your Journey was not saved."));
    } finally {
      setWorking(false);
    }
  };

  const addItem = async () => {
    if (!detail || !itemTitle.trim()) return;
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.addItem(detail.journey.id, {
        kind: itemKind,
        title: itemTitle.trim(),
        status: "tentative",
      });
      setItemTitle("");
      await refreshDetail();
    } catch (cause) {
      setError(errorMessage(cause, "That item could not be added."));
    } finally {
      setWorking(false);
    }
  };

  const importConfirmation = async () => {
    if (!detail || importText.trim().length < 4) return;
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.importText(detail.journey.id, importText);
      setImportText("");
      await refreshDetail();
      Alert.alert(
        "Ready for review",
        "Extracted suggestions were added for your review. Nothing was confirmed or booked.",
      );
    } catch (cause) {
      setError(errorMessage(cause, "This confirmation could not be imported."));
    } finally {
      setWorking(false);
    }
  };

  const confirmImportedFacts = async (importId: string) => {
    if (!detail) return;
    const imported = detail.imports.find((entry) => entry.id === importId);
    if (!imported || !imported.parsedFacts.length) return;
    const title =
      imported.parsedFacts.find((fact) => fact.field === "title")?.value ??
      imported.parsedFacts.find((fact) => fact.field === "flight_number")
        ?.value ??
      "Imported Journey detail";
    const startDate = imported.parsedFacts.find(
      (fact) => fact.field === "start_date",
    )?.value;
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.confirmImport(detail.journey.id, imported.id, [
        {
          kind: imported.sourceKind === "confirmation_text" ? "flight" : "note",
          title,
          status: "tentative",
          startsAt: startDate ? `${startDate}T12:00:00.000Z` : null,
          sourceImportId: imported.id,
        },
      ]);
      await refreshDetail();
      Alert.alert(
        "Saved to your Journey",
        "Your selected imported detail was saved as tentative. Nothing was booked or confirmed.",
      );
    } catch (cause) {
      setError(
        errorMessage(cause, "Those reviewed details could not be saved."),
      );
    } finally {
      setWorking(false);
    }
  };

  const extractPrivateDocument = async (importId: string) => {
    if (!detail) return;
    const imported = detail.imports.find((entry) => entry.id === importId);
    if (!imported || imported.sourceKind !== "document") return;
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.extractPrivateDocument(
        detail.journey.id,
        importId,
      );
      await refreshDetail();
      Alert.alert(
        "Ready for review",
        "Private document details are suggestions only. Review them before saving anything to your Journey.",
      );
    } catch (cause) {
      setError(
        errorMessage(cause, "That private document could not be reviewed."),
      );
    } finally {
      setWorking(false);
    }
  };

  const saveReminder = async () => {
    if (!detail || !reminderDueAt.trim()) return;
    const dueAt = new Date(reminderDueAt.trim());
    if (Number.isNaN(dueAt.getTime())) {
      setError("Enter a reminder date and time, for example 2026-10-20T09:30.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.addReminder(detail.journey.id, {
        dueAt: dueAt.toISOString(),
      });
      setReminderDueAt("");
      await refreshDetail();
      Alert.alert(
        "Private reminder saved",
        "This reminder is saved to your Journey. Delivery needs a future notification permission before anything can be sent.",
      );
    } catch (cause) {
      setError(
        errorMessage(cause, "That private reminder could not be saved."),
      );
    } finally {
      setWorking(false);
    }
  };

  const updateReminder = async (
    reminderId: string,
    state: "enabled" | "paused",
  ) => {
    if (!detail) return;
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.updateReminder(
        detail.journey.id,
        reminderId,
        state,
      );
      await refreshDetail();
    } catch (cause) {
      setError(
        errorMessage(cause, "That private reminder could not be updated."),
      );
    } finally {
      setWorking(false);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!detail) return;
    Alert.alert(
      "Remove private reminder?",
      "This removes the Journey reminder. It does not change your plan.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setWorking(true);
              setError(null);
              try {
                await kinfolkJourneysApi.deleteReminder(
                  detail.journey.id,
                  reminderId,
                );
                await refreshDetail();
              } catch (cause) {
                setError(
                  errorMessage(
                    cause,
                    "That private reminder could not be removed.",
                  ),
                );
              } finally {
                setWorking(false);
              }
            })();
          },
        },
      ],
    );
  };

  const saveFlightWatch = async () => {
    if (!detail) return;
    if (
      !operatingCarrier.trim() ||
      !flightNumber.trim() ||
      !flightDate.trim() ||
      !flightOrigin.trim() ||
      !flightDestination.trim()
    ) {
      setError(
        "Enter the operating carrier, flight number, date, origin, and destination before saving a flight watch.",
      );
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.addFlightWatch(detail.journey.id, {
        operatingCarrier,
        flightNumber,
        scheduledDepartureDate: flightDate,
        originIata: flightOrigin,
        destinationIata: flightDestination,
      });
      setOperatingCarrier("");
      setFlightNumber("");
      setFlightDate("");
      setFlightOrigin("");
      setFlightDestination("");
      await refreshDetail();
      Alert.alert(
        "Private flight watch saved",
        "This is an advisory-only pending watch. Kinfolk has not queried a provider or sent a notification. Confirm any change with the airline or booking channel.",
      );
    } catch (cause) {
      setError(
        errorMessage(cause, "That private flight watch could not be saved."),
      );
    } finally {
      setWorking(false);
    }
  };

  const updateFlightWatch = async (
    watchId: string,
    action: "pause" | "resume" | "revoke",
  ) => {
    if (!detail) return;
    setWorking(true);
    setError(null);
    try {
      await kinfolkJourneysApi.updateFlightWatch(
        detail.journey.id,
        watchId,
        action,
      );
      await refreshDetail();
    } catch (cause) {
      setError(
        errorMessage(cause, "That private flight watch could not be updated."),
      );
    } finally {
      setWorking(false);
    }
  };

  const deleteFlightWatch = async (watchId: string) => {
    if (!detail) return;
    Alert.alert(
      "Remove private flight watch?",
      "This removes the advisory flight watch. It does not change any airline reservation or booking.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setWorking(true);
              setError(null);
              try {
                await kinfolkJourneysApi.deleteFlightWatch(
                  detail.journey.id,
                  watchId,
                );
                await refreshDetail();
              } catch (cause) {
                setError(
                  errorMessage(
                    cause,
                    "That private flight watch could not be removed.",
                  ),
                );
              } finally {
                setWorking(false);
              }
            })();
          },
        },
      ],
    );
  };

  const uploadAttachment = async (kind: "document" | "image") => {
    if (!detail) return;
    setWorking(true);
    setError(null);
    try {
      let file: { uri: string; name: string; type: string } | null = null;
      if (kind === "document") {
        const picked = await DocumentPicker.getDocumentAsync({
          type: [
            "application/pdf",
            "message/rfc822",
            "text/calendar",
            "application/ics",
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (picked.canceled || !picked.assets[0]) return;
        const asset = picked.assets[0];
        file = {
          uri: asset.uri,
          name: asset.name || "journey-import",
          type:
            asset.mimeType ||
            (asset.name?.toLowerCase().endsWith(".eml")
              ? "message/rfc822"
              : asset.name?.toLowerCase().endsWith(".ics")
                ? "text/calendar"
                : "application/pdf"),
        };
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Photo permission needed",
            "Allow photo access to add a private confirmation image.",
          );
          return;
        }
        const picked = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
        if (picked.canceled || !picked.assets[0]) return;
        const asset = picked.assets[0];
        file = {
          uri: asset.uri,
          name: asset.fileName || "confirmation.jpg",
          type: asset.mimeType || "image/jpeg",
        };
      }
      if (!file) return;
      const uploaded = await uploadPrivateJourneyAttachment(file);
      await kinfolkJourneysApi.registerAttachment(
        detail.journey.id,
        uploaded.assetId,
        uploaded.type,
      );
      await refreshDetail();
      Alert.alert(
        "Private attachment added",
        "This file is tied only to this Journey. It is not published or sent to ordinary Kinfolk chat.",
      );
    } catch (cause) {
      setError(
        errorMessage(cause, "The private attachment could not be added."),
      );
    } finally {
      setWorking(false);
    }
  };

  const reviewDeviceCalendar = async () => {
    if (!detail) return;
    setWorking(true);
    setError(null);
    try {
      const permissions = await Calendar.requestCalendarPermissionsAsync();
      if (permissions.status !== "granted") {
        Alert.alert(
          "Calendar permission needed",
          "Choose calendar permission to select specific events for this private Journey.",
        );
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const ids = calendars
        .filter(
          (calendar) => calendar.allowsModifications || calendar.isPrimary,
        )
        .map((calendar) => calendar.id);
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 90);
      const events = await Calendar.getEventsAsync(ids, start, end);
      setCalendarCandidates(
        events
          .filter((event) => event.startDate)
          .slice(0, 50)
          .map((event) => ({
            id: event.id,
            title: event.title || "Calendar event",
            startsAt: new Date(event.startDate).toISOString(),
            location: event.location ?? null,
          })),
      );
      setSelectedCalendarIds([]);
    } catch (cause) {
      setError(errorMessage(cause, "Device calendar events could not load."));
    } finally {
      setWorking(false);
    }
  };

  const addSelectedCalendarEvents = async () => {
    if (!detail || !selectedCalendarIds.length) return;
    setWorking(true);
    setError(null);
    try {
      const selected = calendarCandidates.filter((candidate) =>
        selectedCalendarIds.includes(candidate.id),
      );
      for (const candidate of selected)
        await kinfolkJourneysApi.addItem(detail.journey.id, {
          kind: "event",
          title: candidate.title,
          startsAt: candidate.startsAt,
          locationLabel: candidate.location,
          status: "tentative",
        });
      setCalendarCandidates([]);
      setSelectedCalendarIds([]);
      await refreshDetail();
      Alert.alert(
        "Selected calendar events added",
        "They remain tentative until you confirm them in your Journey.",
      );
    } catch (cause) {
      setError(
        errorMessage(cause, "Selected calendar events could not be added."),
      );
    } finally {
      setWorking(false);
    }
  };

  const loadConnections = async () => {
    setWorking(true);
    setError(null);
    try {
      setConnections((await kinfolkJourneysApi.connections()).connections);
      setScreen("connections");
    } catch (cause) {
      setError(errorMessage(cause, "Connections could not load."));
    } finally {
      setWorking(false);
    }
  };
  const connectProvider = async (connection: KinfolkJourneyConnection) => {
    if (connection.provider === "device_calendar") {
      setScreen("detail");
      void reviewDeviceCalendar();
      return;
    }
    if (connection.availability !== "ready") return;
    setWorking(true);
    setError(null);
    try {
      const accessMode = connection.accessModes.includes("free_busy")
        ? "free_busy"
        : (connection.accessModes[0] ?? "manual");
      const { authorizationUrl } = await kinfolkJourneysApi.startConnection(
        connection.provider,
        accessMode,
      );
      await WebBrowser.openAuthSessionAsync(authorizationUrl);
      await loadConnections();
    } catch (cause) {
      setError(errorMessage(cause, "This connection could not start."));
    } finally {
      setWorking(false);
    }
  };

  const header = (label: string, back: () => void) => (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 12,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <TouchableOpacity
        onPress={back}
        style={styles.backButton}
        accessibilityLabel="Back"
      >
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.backButton} />
    </View>
  );
  const notice = (
    <View style={styles.privateNotice}>
      <Feather name="lock" size={16} color={BROWN} />
      <Text style={styles.privateNoticeText}>
        Private to your account. Journeys never appear in Community, the
        directory, or your public profile.
      </Text>
    </View>
  );
  const errorView = error ? (
    <View accessibilityRole="alert" style={styles.error}>
      <Feather name="alert-circle" size={15} color="#B42318" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        onPress={() => {
          setError(null);
          void loadList();
        }}
      >
        <Text style={styles.retry}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  if (!isAuthenticated)
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Sign in to use Journeys
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/login" as never)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  if (loading)
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={GOLD} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Opening your private Journey space…
        </Text>
      </View>
    );

  if (screen === "create")
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 44 }}
      >
        {header("New Journey", () => setScreen("list"))}
        <View style={styles.page}>
          {notice}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Plan your way
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Create a private travel or life plan. Nothing is booked, shared, or
            confirmed for you.
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Journey name"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Destination or focus (optional)"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />
          {errorView}
          <TouchableOpacity
            disabled={working}
            onPress={() => void createJourney()}
            style={[styles.primaryButton, working && styles.dim]}
          >
            <Text style={styles.primaryText}>
              {working ? "Saving…" : "Create private Journey"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );

  if (screen === "connections")
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 44 }}
      >
        {header("Journey Connections", () =>
          setScreen(detail ? "detail" : "list"),
        )}
        <View style={styles.page}>
          {notice}
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Connections are optional. You choose the level of access, can
            disconnect later, and no connection publishes anything.
          </Text>
          {errorView}
          {connections.map((connection) => (
            <View
              key={connection.provider}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {titleCase(connection.provider)}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {connection.status === "connected"
                  ? "Connected"
                  : connection.availability === "ready"
                    ? "Available when you choose Connect."
                    : (connection.blockers[0] ?? "Not configured.")}
              </Text>
              <TouchableOpacity
                disabled={working || connection.availability !== "ready"}
                onPress={() => void connectProvider(connection)}
                style={[
                  connection.availability === "ready"
                    ? styles.primaryButton
                    : styles.secondaryButton,
                  working && styles.dim,
                ]}
              >
                <Text
                  style={
                    connection.availability === "ready"
                      ? styles.primaryText
                      : styles.secondaryText
                  }
                >
                  {connection.provider === "device_calendar"
                    ? "Choose events from device"
                    : connection.availability === "ready"
                      ? "Connect"
                      : "Not configured"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    );

  if (screen === "detail" && detail)
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 44 }}
      >
        {header(detail.journey.title, () => {
          setScreen("list");
          void loadList();
        })}
        <View style={styles.page}>
          {notice}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {detail.journey.destinationLabel ?? "Private plan"}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {formatDate(detail.journey.startDate)}
              {detail.journey.endDate
                ? ` – ${formatDate(detail.journey.endDate)}`
                : ""}
            </Text>
            <TouchableOpacity
              onPress={() => void loadConnections()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Connections & calendar</Text>
            </TouchableOpacity>
          </View>
          {errorView}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Your plan
          </Text>
          {detail.items.map((item: KinfolkJourneyItem) => (
            <View
              key={item.id}
              style={[
                styles.item,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.mutedForeground }]}
                >
                  {titleCase(item.kind)} · {titleCase(item.status)}
                  {item.startsAt ? ` · ${formatDate(item.startsAt)}` : ""}
                </Text>
              </View>
              {item.status === "confirmed" ? (
                <Feather name="check-circle" size={18} color="#287A50" />
              ) : null}
            </View>
          ))}
          {detail.items.length === 0 ? (
            <Text
              style={[styles.emptyItems, { color: colors.mutedForeground }]}
            >
              Add a plan item, paste a confirmation, or choose individual
              device-calendar events.
            </Text>
          ) : null}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Add a private item
            </Text>
            <TextInput
              value={itemTitle}
              onChangeText={setItemTitle}
              placeholder="For example, hotel check-in"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <View style={styles.chips}>
              {(
                [
                  "flight",
                  "lodging",
                  "transport",
                  "reservation",
                  "event",
                  "place",
                  "note",
                  "reminder",
                ] as const
              ).map((kind) => (
                <Pressable
                  key={kind}
                  onPress={() => setItemKind(kind)}
                  style={[
                    styles.chip,
                    {
                      borderColor: itemKind === kind ? GOLD : colors.border,
                      backgroundColor:
                        itemKind === kind ? GOLD + "22" : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: itemKind === kind ? BROWN : colors.mutedForeground,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {titleCase(kind)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TouchableOpacity
              disabled={working || !itemTitle.trim()}
              onPress={() => void addItem()}
              style={[styles.primaryButton, working && styles.dim]}
            >
              <Text style={styles.primaryText}>Add item</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Import for review
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Kinfolk only suggests fields from pasted text. Nothing becomes a
              confirmed booking unless you confirm it.
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder="Paste a confirmation here…"
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textarea,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <TouchableOpacity
              disabled={working || importText.trim().length < 4}
              onPress={() => void importConfirmation()}
              style={[styles.primaryButton, working && styles.dim]}
            >
              <Text style={styles.primaryText}>Review pasted confirmation</Text>
            </TouchableOpacity>
            <View style={styles.attachmentRow}>
              <TouchableOpacity
                disabled={working}
                onPress={() => void uploadAttachment("document")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Add PDF, EML, or ICS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={working}
                onPress={() => void uploadAttachment("image")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Add image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={working}
                onPress={() => void reviewDeviceCalendar()}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Choose calendar events</Text>
              </TouchableOpacity>
            </View>
          </View>
          {calendarCandidates.length ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Choose calendar events
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Only selected events are copied as tentative items. Calendar
                events are never shared automatically.
              </Text>
              {calendarCandidates.map((candidate) => {
                const selected = selectedCalendarIds.includes(candidate.id);
                return (
                  <TouchableOpacity
                    key={candidate.id}
                    onPress={() =>
                      setSelectedCalendarIds((current) =>
                        selected
                          ? current.filter((id) => id !== candidate.id)
                          : [...current, candidate.id],
                      )
                    }
                    style={[
                      styles.eventRow,
                      {
                        borderColor: selected ? GOLD : colors.border,
                        backgroundColor: selected
                          ? GOLD + "18"
                          : colors.background,
                      },
                    ]}
                  >
                    <Feather
                      name={selected ? "check-square" : "square"}
                      size={16}
                      color={selected ? GOLD : colors.mutedForeground}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.itemTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {candidate.title}
                      </Text>
                      <Text
                        style={[
                          styles.itemSub,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatDate(candidate.startsAt)}
                        {candidate.location ? ` · ${candidate.location}` : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                disabled={working || !selectedCalendarIds.length}
                onPress={() => void addSelectedCalendarEvents()}
                style={[styles.primaryButton, working && styles.dim]}
              >
                <Text style={styles.primaryText}>Add selected events</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {detail.imports.filter(
            (entry) =>
              entry.status === "parsed" || entry.status === "review_needed",
          ).length ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Review imported details
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Nothing changes your Journey until you choose Save reviewed
                detail.
              </Text>
              {detail.imports
                .filter(
                  (entry) =>
                    entry.status === "parsed" ||
                    entry.status === "review_needed",
                )
                .map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.eventRow,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.itemTitle, { color: colors.foreground }]}
                      >
                        {titleCase(entry.sourceKind)}
                      </Text>
                      {entry.parsedFacts.map((fact) => (
                        <Text
                          key={`${fact.field}-${fact.value}`}
                          style={[
                            styles.itemSub,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {titleCase(fact.field)}: {fact.value} (
                          {fact.confidence})
                        </Text>
                      ))}
                      {!entry.parsedFacts.length ? (
                        <Text
                          style={[
                            styles.itemSub,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Private attachment saved for manual review; no facts
                          were inferred.
                        </Text>
                      ) : null}
                      {entry.sourceKind === "document" &&
                      !entry.parsedFacts.length ? (
                        <TouchableOpacity
                          disabled={working}
                          onPress={() => void extractPrivateDocument(entry.id)}
                          style={[
                            styles.secondaryButton,
                            working && styles.dim,
                          ]}
                        >
                          <Text style={styles.secondaryText}>
                            Review private document
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      {entry.parsedFacts.length ? (
                        <TouchableOpacity
                          disabled={working}
                          onPress={() => void confirmImportedFacts(entry.id)}
                          style={[styles.primaryButton, working && styles.dim]}
                        >
                          <Text style={styles.primaryText}>
                            Save reviewed detail
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))}
            </View>
          ) : null}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Private reminders
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Save a reminder for this Journey. Delivery is off until a future
              release has your separate notification permission.
            </Text>
            <TextInput
              value={reminderDueAt}
              onChangeText={setReminderDueAt}
              placeholder="2026-10-20T09:30"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <TouchableOpacity
              disabled={working || !reminderDueAt.trim()}
              onPress={() => void saveReminder()}
              style={[styles.primaryButton, working && styles.dim]}
            >
              <Text style={styles.primaryText}>Save private reminder</Text>
            </TouchableOpacity>
            {detail.reminders.map((reminder) => (
              <View
                key={reminder.id}
                style={[
                  styles.eventRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.itemTitle, { color: colors.foreground }]}
                  >
                    {formatDate(reminder.dueAt)}
                  </Text>
                  <Text
                    style={[styles.itemSub, { color: colors.mutedForeground }]}
                  >
                    {titleCase(reminder.state)} · delivery not scheduled
                  </Text>
                </View>
                <TouchableOpacity
                  disabled={working}
                  onPress={() =>
                    void updateReminder(
                      reminder.id,
                      reminder.state === "enabled" ? "paused" : "enabled",
                    )
                  }
                >
                  <Text style={styles.inlineAction}>
                    {reminder.state === "enabled" ? "Pause" : "Resume"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={working}
                  onPress={() => void deleteReminder(reminder.id)}
                >
                  <Text style={styles.removeAction}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Flight watch
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Save one operating flight for a future advisory status watch.
              Kinfolk never accesses airline accounts, bookings, PNRs, loyalty
              accounts, tickets, or payment methods.
            </Text>
            <TextInput
              value={operatingCarrier}
              onChangeText={setOperatingCarrier}
              placeholder="Operating carrier, e.g. DL"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              maxLength={3}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <TextInput
              value={flightNumber}
              onChangeText={setFlightNumber}
              placeholder="Flight number, e.g. 1234"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={4}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <TextInput
              value={flightDate}
              onChangeText={setFlightDate}
              placeholder="Scheduled date, YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <View style={styles.formRow}>
              <TextInput
                value={flightOrigin}
                onChangeText={setFlightOrigin}
                placeholder="Origin, e.g. ATL"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={3}
                style={[
                  styles.input,
                  styles.halfInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              />
              <TextInput
                value={flightDestination}
                onChangeText={setFlightDestination}
                placeholder="Destination, e.g. LAX"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={3}
                style={[
                  styles.input,
                  styles.halfInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              disabled={working}
              onPress={() => void saveFlightWatch()}
              style={[styles.primaryButton, working && styles.dim]}
            >
              <Text style={styles.primaryText}>Save private flight watch</Text>
            </TouchableOpacity>
            {detail.flightWatches.map((watch) => (
              <View
                key={watch.id}
                style={[
                  styles.eventRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.itemTitle, { color: colors.foreground }]}
                  >
                    {watch.operatingCarrier} {watch.flightNumber} ·{" "}
                    {watch.originIata}–{watch.destinationIata}
                  </Text>
                  <Text
                    style={[styles.itemSub, { color: colors.mutedForeground }]}
                  >
                    {formatDate(watch.scheduledDepartureDate)} ·{" "}
                    {titleCase(watch.state)} · {titleCase(watch.status.state)}
                  </Text>
                  <Text
                    style={[styles.itemSub, { color: colors.mutedForeground }]}
                  >
                    {watch.status.summary ??
                      "No live status has been retrieved. Confirm with the airline or booking channel."}
                  </Text>
                </View>
                {watch.state === "paused" ? (
                  <TouchableOpacity
                    disabled={working}
                    onPress={() => void updateFlightWatch(watch.id, "resume")}
                  >
                    <Text style={styles.inlineAction}>Resume</Text>
                  </TouchableOpacity>
                ) : watch.state !== "revoked" ? (
                  <TouchableOpacity
                    disabled={working}
                    onPress={() => void updateFlightWatch(watch.id, "pause")}
                  >
                    <Text style={styles.inlineAction}>Pause</Text>
                  </TouchableOpacity>
                ) : null}
                {watch.state !== "revoked" ? (
                  <TouchableOpacity
                    disabled={working}
                    onPress={() => void updateFlightWatch(watch.id, "revoke")}
                  >
                    <Text style={styles.removeAction}>Revoke</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  disabled={working}
                  onPress={() => void deleteFlightWatch(watch.id)}
                >
                  <Text style={styles.removeAction}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.boundary}>
            <Text style={styles.boundaryTitle}>Kinfolk boundary</Text>
            <Text style={styles.boundaryText}>
              Kinfolk may help you consider this Journey after you choose to
              save information here. It cannot book, change, or confirm flights,
              hotels, reservations, or events.
            </Text>
          </View>
        </View>
      </ScrollView>
    );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 44 }}
    >
      {header("Kinfolk Journeys", () => router.back())}
      <View style={styles.page}>
        {notice}
        {enabled !== true ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Journeys is being prepared
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {error ?? "This feature is not enabled in this environment yet."}
            </Text>
            <TouchableOpacity
              onPress={() => void loadList()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Check again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.listHeading}>
              <View>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Your Journeys
                </Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                  {journeys.length} private plan
                  {journeys.length === 1 ? "" : "s"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setScreen("create")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>New</Text>
              </TouchableOpacity>
            </View>
            {errorView}
            {journeys.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather name="map" size={28} color={GOLD} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Start with what matters to you
                </Text>
                <Text
                  style={[
                    styles.sub,
                    { color: colors.mutedForeground, textAlign: "center" },
                  ]}
                >
                  Build a private plan, then choose confirmations or calendar
                  events one at a time.
                </Text>
                <TouchableOpacity
                  onPress={() => setScreen("create")}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryText}>Create a Journey</Text>
                </TouchableOpacity>
              </View>
            ) : (
              journeys.map((journey) => (
                <TouchableOpacity
                  key={journey.id}
                  onPress={() => void loadDetail(journey.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {journey.title}
                  </Text>
                  <Text
                    style={[styles.cardSub, { color: colors.mutedForeground }]}
                  >
                    {journey.destinationLabel ?? "Private plan"} ·{" "}
                    {formatDate(journey.startDate)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: { fontSize: 13 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  page: { padding: 16, gap: 14 },
  privateNotice: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: "#FFF8E8",
    borderColor: GOLD + "66",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  privateNoticeText: {
    flex: 1,
    color: BROWN,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  sectionTitle: { fontSize: 23, fontWeight: "700", marginTop: 2 },
  sub: { fontSize: 13, lineHeight: 19 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  formRow: { flexDirection: "row", gap: 8 },
  halfInput: { flex: 1 },
  textarea: {
    borderWidth: 1,
    borderRadius: 11,
    padding: 12,
    minHeight: 92,
    fontSize: 13,
  },
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: BROWN,
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginTop: 3,
  },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: BROWN + "30",
    backgroundColor: CREAM,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 2,
  },
  secondaryText: { color: BROWN, fontSize: 12, fontWeight: "700" },
  dim: { opacity: 0.55 },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 11,
  },
  errorText: { flex: 1, color: "#B42318", fontSize: 12, lineHeight: 17 },
  retry: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  empty: {
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    padding: 24,
    gap: 11,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  item: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    gap: 10,
  },
  itemTitle: { fontSize: 13, fontWeight: "700" },
  itemSub: { fontSize: 11, marginTop: 3 },
  emptyItems: {
    fontSize: 13,
    lineHeight: 19,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BROWN + "25",
    borderRadius: 13,
    padding: 14,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  attachmentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderRadius: 11,
    padding: 10,
  },
  inlineAction: { color: "#8A5D18", fontSize: 11, fontWeight: "700" },
  removeAction: { color: "#B42318", fontSize: 11, fontWeight: "700" },
  boundary: { backgroundColor: CREAM, borderRadius: 14, padding: 13 },
  boundaryTitle: { color: BROWN, fontSize: 12, fontWeight: "700" },
  boundaryText: {
    color: BROWN + "CC",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
