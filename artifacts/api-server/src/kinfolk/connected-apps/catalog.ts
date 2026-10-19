export type ConnectedAppCategory = "travel" | "health" | "finance" | "everyday";
export type ConnectedAppAuthorizationMode =
  | "oauth"
  | "native_permission"
  | "selected_import"
  | "provider_contract"
  | "unsupported";
export type ConnectedAppAvailability =
  | "not_configured"
  | "native_permission_required"
  | "member_selected_import"
  | "provider_contract_required"
  | "unsupported";

export type ConnectedAppDefinition = Readonly<{
  key: string;
  category: ConnectedAppCategory;
  label: string;
  authorizationMode: ConnectedAppAuthorizationMode;
  availability: ConnectedAppAvailability;
  dataTypes: readonly string[];
  description: string;
  boundary: string;
  sensitive?: boolean;
}>;

const app = (definition: ConnectedAppDefinition) => definition;

/** Connected Apps remain inert until a founder-approved environment enables them. */
export function connectedAppsFeatureEnabled(): boolean {
  return process.env.KINFOLK_CONNECTED_APPS_ENABLED === "true";
}

/**
 * Product catalog only. A catalog entry is not proof of a live integration.
 * The settings/API surface must show the availability state verbatim.
 */
export const CONNECTED_APP_CATALOG: readonly ConnectedAppDefinition[] = [
  app({
    key: "google_calendar",
    category: "travel",
    label: "Google Calendar",
    authorizationMode: "oauth",
    availability: "not_configured",
    dataTypes: ["free_busy", "calendar_selection"],
    description:
      "Optional calendar planning access with member-selected scope and calendar selection.",
    boundary:
      "Calendar OAuth never requests individual-event access. It can request free/busy data or a calendar list only so the member can select one calendar; selected events remain a native or calendar-file flow.",
  }),
  app({
    key: "gmail",
    category: "travel",
    label: "Gmail confirmations",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_confirmation"],
    description:
      "Review a confirmation the member deliberately exports or shares.",
    boundary:
      "No mailbox-wide scan, forwarding address, ongoing sync, or restricted Gmail scope is enabled.",
  }),
  app({
    key: "microsoft_calendar",
    category: "travel",
    label: "Microsoft Calendar",
    authorizationMode: "oauth",
    availability: "not_configured",
    dataTypes: ["free_busy", "calendar_selection"],
    description:
      "Optional calendar planning access through a member-approved Microsoft calendar-selection flow.",
    boundary:
      "Requires provider app registration and an explicit calendar-list scope disclosure before activation; individual-event access is not requested.",
  }),
  app({
    key: "outlook_mail",
    category: "travel",
    label: "Outlook confirmations",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_confirmation"],
    description: "Review an Outlook confirmation the member explicitly shares.",
    boundary:
      "No mailbox-wide Graph permission, subscription, or sync is enabled.",
  }),
  app({
    key: "device_calendar",
    category: "travel",
    label: "Device calendar",
    authorizationMode: "native_permission",
    availability: "native_permission_required",
    dataTypes: ["member_selected_events"],
    description:
      "Select specific device-calendar events for a private Journey.",
    boundary:
      "The operating system controls permission. Kinfolk imports only the events the member selects and writes nothing automatically.",
  }),
  app({
    key: "airline_confirmation",
    category: "travel",
    label: "Airline reservations",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_confirmation", "flight_details"],
    description:
      "Use a member-selected confirmation, update email, PDF, or calendar file.",
    boundary:
      "No airline login, PNR lookup, loyalty access, scraping, booking change, or automatic rebooking.",
  }),
  app({
    key: "hotel_confirmation",
    category: "travel",
    label: "Hotel confirmations",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_confirmation", "lodging_details"],
    description: "Review a member-selected hotel or lodging confirmation.",
    boundary:
      "No reservation-management account connection or booking action is enabled.",
  }),
  app({
    key: "ticketmaster",
    category: "travel",
    label: "Ticketmaster tickets",
    authorizationMode: "provider_contract",
    availability: "provider_contract_required",
    dataTypes: ["selected_event_details"],
    description:
      "A future partner integration can supply permitted event details.",
    boundary:
      "Ticket credentials, SafeTix, QR/barcodes, account access and Wallet passes are never imported or retained.",
  }),
  app({
    key: "eventbrite",
    category: "travel",
    label: "Eventbrite events",
    authorizationMode: "provider_contract",
    availability: "provider_contract_required",
    dataTypes: ["selected_event_details"],
    description:
      "A future approved connection can add member-authorized event details.",
    boundary:
      "Do not claim account, order, ticket, or attendance access before a supported provider contract exists.",
  }),
  app({
    key: "ride_confirmation",
    category: "travel",
    label: "Ride confirmations",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_confirmation", "transport_details"],
    description:
      "Review a ride or ground-transport confirmation a member selects.",
    boundary: "No Uber, Lyft, or other ride account connection is enabled.",
  }),
  app({
    key: "apple_wallet",
    category: "travel",
    label: "Apple Wallet",
    authorizationMode: "unsupported",
    availability: "unsupported",
    dataTypes: [],
    description: "Use the original confirmation rather than a Wallet pass.",
    boundary:
      "Kinfolk cannot read, clone, re-sign, enumerate, or retain third-party Wallet passes or entry credentials.",
  }),
  app({
    key: "google_wallet",
    category: "travel",
    label: "Google Wallet",
    authorizationMode: "unsupported",
    availability: "unsupported",
    dataTypes: [],
    description: "Use the original confirmation rather than a Wallet pass.",
    boundary:
      "Google Wallet APIs are not a consumer pass-library read connection for Kinfolk.",
  }),
  app({
    key: "mychart_epic",
    category: "health",
    label: "MyChart / Epic",
    authorizationMode: "provider_contract",
    availability: "provider_contract_required",
    dataTypes: ["member_authorized_health_records", "appointments"],
    description:
      "Potential SMART on FHIR patient-authorized access in a separate health release.",
    boundary:
      "Health data requires separate purpose-specific consent, app registration, security review, privacy review, and provider approval.",
    sensitive: true,
  }),
  app({
    key: "apple_health",
    category: "health",
    label: "Apple Health",
    authorizationMode: "native_permission",
    availability: "native_permission_required",
    dataTypes: ["member_selected_health_types"],
    description: "Potential HealthKit permission in a separate health release.",
    boundary:
      "Not available until native HealthKit entitlements, health-data consent, App Store review and a health-specific privacy design are approved.",
    sensitive: true,
  }),
  app({
    key: "android_health_connect",
    category: "health",
    label: "Android Health Connect",
    authorizationMode: "native_permission",
    availability: "native_permission_required",
    dataTypes: ["member_selected_health_types"],
    description:
      "Potential Android Health Connect permission in a separate health release.",
    boundary:
      "Not available until granular permissions, Google Play health declaration and health-specific privacy review are approved.",
    sensitive: true,
  }),
  app({
    key: "fitbit",
    category: "health",
    label: "Fitbit",
    authorizationMode: "oauth",
    availability: "not_configured",
    dataTypes: ["member_authorized_fitness_data"],
    description:
      "Potential member-authorized fitness connection in a separate health release.",
    boundary:
      "Requires provider registration and health-specific consent; it is not connected in this build.",
    sensitive: true,
  }),
  app({
    key: "garmin",
    category: "health",
    label: "Garmin",
    authorizationMode: "provider_contract",
    availability: "provider_contract_required",
    dataTypes: ["member_authorized_fitness_data"],
    description:
      "Potential member-authorized fitness connection in a separate health release.",
    boundary:
      "Requires a Garmin-approved integration and health-specific privacy/security review.",
    sensitive: true,
  }),
  app({
    key: "plaid",
    category: "finance",
    label: "Bank & budget connections",
    authorizationMode: "provider_contract",
    availability: "provider_contract_required",
    dataTypes: ["read_only_accounts", "read_only_transactions"],
    description:
      "Potential read-only budgeting connection through an approved provider.",
    boundary:
      "No payments, transfers, trading, account changes, credit decisions, or financial actions. Financial consent is separate and purpose-specific.",
    sensitive: true,
  }),
  app({
    key: "google_drive",
    category: "everyday",
    label: "Google Drive",
    authorizationMode: "oauth",
    availability: "not_configured",
    dataTypes: ["member_selected_files"],
    description: "Potential member-selected-file connection.",
    boundary:
      "No silent Drive scan or broad file sync; a member must select each file or grant a separately reviewed limited integration.",
  }),
  app({
    key: "onedrive",
    category: "everyday",
    label: "OneDrive",
    authorizationMode: "oauth",
    availability: "not_configured",
    dataTypes: ["member_selected_files"],
    description: "Potential member-selected-file connection.",
    boundary:
      "No silent storage scan or broad file sync; provider registration and scope review are required.",
  }),
  app({
    key: "dropbox",
    category: "everyday",
    label: "Dropbox",
    authorizationMode: "oauth",
    availability: "not_configured",
    dataTypes: ["member_selected_files"],
    description: "Potential member-selected-file connection.",
    boundary:
      "No silent storage scan or broad file sync; provider registration and scope review are required.",
  }),
  app({
    key: "spotify",
    category: "everyday",
    label: "Spotify",
    authorizationMode: "provider_contract",
    availability: "provider_contract_required",
    dataTypes: ["member_selected_music_context"],
    description: "Potential member-selected music context for a private plan.",
    boundary:
      "No listening-history scan, playback control, account change, or sharing is enabled before a separate provider and privacy review.",
  }),
  app({
    key: "youtube",
    category: "everyday",
    label: "YouTube",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["member_selected_link"],
    description:
      "Attach a video or channel link the member deliberately selects.",
    boundary:
      "No watch-history, account, subscription, recommendation, or upload access is enabled.",
  }),
  app({
    key: "tiktok",
    category: "everyday",
    label: "TikTok",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["member_selected_link"],
    description: "Attach a public link the member deliberately selects.",
    boundary:
      "No account, feed, private message, draft, or posting access is enabled.",
  }),
  app({
    key: "pinterest",
    category: "everyday",
    label: "Pinterest",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["member_selected_link"],
    description:
      "Attach a selected board or Pin link for private planning context.",
    boundary:
      "No board enumeration, account access, collection sync, or publication is enabled.",
  }),
  app({
    key: "goodreads",
    category: "everyday",
    label: "Goodreads",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["member_selected_link"],
    description: "Attach a selected reading-list or book link.",
    boundary:
      "No reading-history, account, review, shelf, or publication access is enabled.",
  }),
  app({
    key: "canva",
    category: "everyday",
    label: "Canva",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["member_selected_file"],
    description:
      "Import a design file the member explicitly exports for private review.",
    boundary:
      "No design-library scan, editing, sharing, publishing, or workspace access is enabled.",
  }),
  app({
    key: "adobe",
    category: "everyday",
    label: "Adobe",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["member_selected_file"],
    description:
      "Import an exported file the member explicitly selects for private review.",
    boundary:
      "No Creative Cloud scan, editing, sharing, publishing, or workspace access is enabled.",
  }),
  app({
    key: "course_calendar",
    category: "everyday",
    label: "Courses & learning calendars",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_calendar_events", "calendar_file"],
    description:
      "Select a course, campus, or learning-calendar event for a private plan.",
    boundary:
      "No school portal, student record, grade, attendance, or classroom access is enabled.",
  }),
  app({
    key: "family_school_calendar",
    category: "everyday",
    label: "School & family calendars",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: ["selected_calendar_events", "calendar_file"],
    description: "Select an event or calendar file for a private plan.",
    boundary:
      "Family/school data stays private, is never inferred, and requires each account holder’s permission where applicable.",
  }),
  app({
    key: "selected_files",
    category: "everyday",
    label: "Selected files & documents",
    authorizationMode: "selected_import",
    availability: "member_selected_import",
    dataTypes: [
      "selected_files",
      "screenshots",
      "photos",
      "pdf",
      "email",
      "calendar_file",
    ],
    description:
      "Choose one file, photo, screenshot, PDF, .eml or .ics file for private review.",
    boundary:
      "No standing storage, inbox or photo-library access; confirmation is required before sensitive or ambiguous facts are saved.",
  }),
];

export function connectedAppByKey(key: string): ConnectedAppDefinition | null {
  return CONNECTED_APP_CATALOG.find((app) => app.key === key) ?? null;
}

export function contextualConnectedApps(
  message: string,
): ConnectedAppDefinition[] {
  const text = message.toLowerCase();
  const keys = new Set<string>();
  if (
    /\b(flight|trip|hotel|reservation|ticket|concert|travel|airport|airline)\b/.test(
      text,
    )
  ) {
    [
      "airline_confirmation",
      "google_calendar",
      "gmail",
      "device_calendar",
      "selected_files",
    ].forEach((key) => keys.add(key));
  }
  if (
    /\b(dr\.?|doctor|appointment|medication|lab|bp|blood pressure|health|fitness|workout|mychart)\b/.test(
      text,
    )
  ) {
    ["mychart_epic", "apple_health", "android_health_connect"].forEach((key) =>
      keys.add(key),
    );
  }
  if (/\b(budget|bill|bank|spending|finance|money)\b/.test(text))
    keys.add("plaid");
  if (/\b(school|family|move|relocat|document|file|calendar)\b/.test(text)) {
    [
      "family_school_calendar",
      "selected_files",
      "google_drive",
      "onedrive",
      "dropbox",
    ].forEach((key) => keys.add(key));
  }
  if (
    /\b(music|playlist|spotify|youtube|video|tiktok|pinterest)\b/.test(text)
  ) {
    ["spotify", "youtube", "tiktok", "pinterest"].forEach((key) =>
      keys.add(key),
    );
  }
  if (
    /\b(book|reading|goodreads|design|canva|adobe|course|class|learning)\b/.test(
      text,
    )
  ) {
    ["goodreads", "canva", "adobe", "course_calendar"].forEach((key) =>
      keys.add(key),
    );
  }
  return [...keys].flatMap((key) => {
    const definition = connectedAppByKey(key);
    return definition ? [definition] : [];
  });
}

export type ContextualConnectedAppsPrompt = Readonly<{
  title: string;
  description: string;
  appKeys: readonly string[];
}>;

/**
 * A Kinfolk response may invite a member to review their optional Connected
 * Apps choices. This deliberately never starts OAuth, asks for device
 * permissions, opens an external provider, or asserts that an app is live.
 */
export function buildContextualConnectedAppsPrompt(
  message: string,
): ContextualConnectedAppsPrompt | null {
  const matches = contextualConnectedApps(message);
  if (matches.length === 0) return null;

  const immediatelyUseful = matches.filter(
    (definition) =>
      definition.availability === "member_selected_import" ||
      definition.availability === "native_permission_required",
  );
  const priorityKeys = /\b(course|class|learning)\b/i.test(message)
    ? ["course_calendar", "goodreads"]
    : [];
  const priorityMatches = priorityKeys.flatMap((key) => {
    const definition = connectedAppByKey(key);
    return definition ? [definition] : [];
  });
  const selected = [
    ...priorityMatches,
    ...(immediatelyUseful.length > 0 ? immediatelyUseful : matches),
  ]
    .filter((definition) => !definition.sensitive)
    .filter(
      (definition, index, all) =>
        all.findIndex((candidate) => candidate.key === definition.key) ===
        index,
    )
    .slice(0, 3);

  if (selected.length === 0) {
    return {
      title: "Want to review optional Connected Apps?",
      description:
        "Health and other sensitive connections require a separate, purpose-specific review. Kinfolk will not access them automatically.",
      appKeys: matches.slice(0, 3).map((definition) => definition.key),
    };
  }

  return {
    title: "Optional Connected Apps",
    description:
      "Review a member-selected confirmation, file, or connection choice. Nothing connects or imports until you choose and confirm it.",
    appKeys: selected.map((definition) => definition.key),
  };
}
