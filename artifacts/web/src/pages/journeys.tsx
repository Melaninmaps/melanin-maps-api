import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  CalendarDays,
  ChevronLeft,
  CircleAlert,
  FileUp,
  LockKeyhole,
  MapPin,
  Plane,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  JourneyRequestError,
  journeysApi,
  uploadJourneyAttachment,
  type Journey,
  type JourneyConnection,
  type JourneyDetail,
  type JourneyItem,
  type JourneyItemDraft,
} from "@/features/journeys/api";

const FIELD =
  "mt-1 w-full rounded-xl border border-[#3B1F0E]/15 bg-white px-3 py-2 text-sm text-[#3B1F0E] outline-none placeholder:text-[#3B1F0E]/35 focus:border-[#C9A84C]";
const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B1F0E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#57311B] disabled:cursor-not-allowed disabled:opacity-55";
const SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#3B1F0E]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#3B1F0E] transition hover:bg-[#FAF1E4] disabled:cursor-not-allowed disabled:opacity-55";

function requestMessage(error: unknown, fallback: string): string {
  if (error instanceof JourneyRequestError) return error.message;
  return fallback;
}

function dateLabel(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.length === 10 ? `${value}T12:00:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">Journeys could not load</p>
          <p className="mt-1 leading-5">{message}</p>
          {retry ? (
            <button
              type="button"
              onClick={retry}
              className="mt-3 font-bold underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PrivateNotice() {
  return (
    <div className="rounded-2xl border border-[#C9A84C]/35 bg-[#FFF8E8] p-4 text-sm text-[#3B1F0E]">
      <div className="flex gap-3">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#8A5D18]" />
        <div>
          <p className="font-bold">Private to your account</p>
          <p className="mt-1 leading-5 text-[#3B1F0E]/75">
            Journeys do not appear in Community, your public profile, the
            directory, or ordinary Kinfolk chat. You decide what to add,
            confirm, edit, and delete.
          </p>
        </div>
      </div>
    </div>
  );
}

function NewJourneyForm({
  onCreated,
  onCancel,
}: {
  onCreated: (journey: Journey) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [retentionPolicy, setRetentionPolicy] =
    useState<Journey["retentionPolicy"]>("keep_until_deleted");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const browserTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await journeysApi.create({
        title,
        destinationLabel: destination || null,
        destinationCity: city || null,
        destinationRegion: region || null,
        startDate: startDate || null,
        endDate: endDate || null,
        timeZone: browserTimeZone || null,
        retentionPolicy,
      });
      onCreated(result.journey);
    } catch (cause) {
      setError(
        requestMessage(cause, "Your Journey was not saved. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-3xl border border-[#3B1F0E]/10 bg-white p-5 shadow-sm"
      data-testid="journey-create-form"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#3B1F0E]">
            Start a private Journey
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#3B1F0E]/65">
            Save only what you want to plan. Nothing is booked or shared
            automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-bold text-[#8A5D18]"
        >
          Cancel
        </button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold text-[#3B1F0E] sm:col-span-2">
          Journey name
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={180}
            placeholder="For example, Atlanta birthday weekend"
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-[#3B1F0E]">
          Destination
          <label className="sr-only" htmlFor="journey-destination">
            Destination
          </label>
          <input
            id="journey-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            maxLength={255}
            placeholder="City, region, or a trip name"
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-[#3B1F0E]">
          City
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={120}
            placeholder="Optional"
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-[#3B1F0E]">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-[#3B1F0E]">
          End date
          <input
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-[#3B1F0E] sm:col-span-2">
          Keep this Journey
          <select
            value={retentionPolicy}
            onChange={(event) =>
              setRetentionPolicy(
                event.target.value as Journey["retentionPolicy"],
              )
            }
            className={FIELD}
          >
            <option value="keep_until_deleted">Until I delete it</option>
            <option value="keep_until_member_changes_it">
              Until I change it
            </option>
            <option value="delete_after_trip">
              Delete after the trip ends
            </option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className={PRIMARY}
        >
          {saving ? "Saving…" : "Create private Journey"}
        </button>
        <p className="self-center text-xs text-[#3B1F0E]/55">
          Time zone: {browserTimeZone || "set by your device"}
        </p>
      </div>
    </form>
  );
}

function ConnectionsPanel({ onClose }: { onClose: () => void }) {
  const [connections, setConnections] = useState<JourneyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConnections((await journeysApi.connections()).connections);
    } catch (cause) {
      setError(requestMessage(cause, "Connections could not load."));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function connect(connection: JourneyConnection) {
    const accessMode = connection.accessModes.includes("free_busy")
      ? "free_busy"
      : (connection.accessModes[0] ?? "manual");
    if (connection.availability !== "ready" || accessMode === "manual") return;
    setChanging(connection.provider);
    setError(null);
    try {
      const result = await journeysApi.startConnection(
        connection.provider,
        accessMode,
      );
      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(requestMessage(cause, "Connection could not start."));
      setChanging(null);
    }
  }

  async function disconnect(connection: JourneyConnection) {
    if (
      !window.confirm(
        `Disconnect ${connection.provider.replace(/_/g, " ")}? Existing Journey items will stay private and unchanged.`,
      )
    )
      return;
    setChanging(connection.provider);
    setError(null);
    try {
      await journeysApi.disconnect(connection.provider);
      await load();
    } catch (cause) {
      setError(requestMessage(cause, "Connection could not be removed."));
    } finally {
      setChanging(null);
    }
  }

  return (
    <section
      className="rounded-3xl border border-[#3B1F0E]/10 bg-white p-5 shadow-sm"
      data-testid="journey-connections-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#3B1F0E]">
            Connections
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#3B1F0E]/65">
            Optional. Calendar availability, selected confirmation emails, and
            flight updates stay private and require your consent.
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-bold text-[#8A5D18]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-5 text-sm text-[#3B1F0E]/55">
          Loading private connection choices…
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {connections.map((connection) => (
            <article
              key={connection.provider}
              className="rounded-2xl border border-[#3B1F0E]/10 bg-[#FAF1E4]/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold capitalize text-[#3B1F0E]">
                    {connection.provider.replace(/_/g, " ")}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#3B1F0E]/65">
                    {connection.status === "connected"
                      ? `Connected with ${connection.accessMode.replace(/_/g, " ")} access.`
                      : connection.availability === "ready"
                        ? "Available when you choose Connect."
                        : (connection.blockers[0] ??
                          "Not available in this environment.")}
                  </p>
                </div>
                {connection.status === "connected" ? (
                  <button
                    type="button"
                    className={SECONDARY}
                    disabled={changing === connection.provider}
                    onClick={() => void disconnect(connection)}
                  >
                    {changing === connection.provider
                      ? "Removing…"
                      : "Disconnect"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={
                      connection.availability === "ready" ? PRIMARY : SECONDARY
                    }
                    disabled={
                      changing === connection.provider ||
                      connection.availability !== "ready"
                    }
                    onClick={() => void connect(connection)}
                  >
                    {changing === connection.provider
                      ? "Opening…"
                      : connection.availability === "ready"
                        ? "Connect"
                        : "Not configured"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function JourneysPage() {
  const [, navigate] = useLocation();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const capabilities = await journeysApi.capabilities();
      setEnabled(capabilities.enabled);
      if (capabilities.enabled)
        setJourneys((await journeysApi.list()).journeys);
      else
        setMessage(
          capabilities.message ?? "Kinfolk Journeys is not enabled yet.",
        );
    } catch (cause) {
      setEnabled(null);
      setMessage(requestMessage(cause, "Kinfolk Journeys could not load."));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-[#FAF1E4] px-4 py-8 text-[#3B1F0E] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A5D18]">
              Kinfolk
            </p>
            <h1 className="mt-1 font-serif text-4xl font-bold tracking-tight">
              Journeys
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3B1F0E]/70">
              A private travel and life-planning space—made for your plans, not
              a booking engine.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/travel" className={SECONDARY}>
              Ask Kinfolk
            </Link>
            <button
              type="button"
              className={SECONDARY}
              onClick={() => setShowConnections((value) => !value)}
            >
              Connections
            </button>
            <button
              type="button"
              className={PRIMARY}
              onClick={() => setShowCreate((value) => !value)}
              disabled={enabled !== true}
            >
              <Plus className="h-4 w-4" />
              New Journey
            </button>
          </div>
        </header>
        <div className="mt-6">
          <PrivateNotice />
        </div>
        {loading ? (
          <div className="py-14 text-center text-sm text-[#3B1F0E]/55">
            Opening your private Journey space…
          </div>
        ) : enabled !== true ? (
          <section className="mt-6 rounded-3xl border border-[#3B1F0E]/10 bg-white p-6">
            <h2 className="font-serif text-2xl font-bold">
              Journeys is being prepared
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3B1F0E]/65">
              {message ??
                "This private feature has not been enabled in this environment."}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#8A5D18]"
            >
              <RefreshCw className="h-4 w-4" />
              Check again
            </button>
          </section>
        ) : (
          <>
            {message ? (
              <div className="mt-6">
                <ErrorPanel message={message} retry={() => void load()} />
              </div>
            ) : null}
            {showCreate ? (
              <div className="mt-6">
                <NewJourneyForm
                  onCancel={() => setShowCreate(false)}
                  onCreated={(journey) => navigate(`/journeys/${journey.id}`)}
                />
              </div>
            ) : null}
            {showConnections ? (
              <div className="mt-6">
                <ConnectionsPanel onClose={() => setShowConnections(false)} />
              </div>
            ) : null}
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold">Your Journeys</h2>
                <span className="text-xs font-bold text-[#3B1F0E]/50">
                  {journeys.length} private plan
                  {journeys.length === 1 ? "" : "s"}
                </span>
              </div>
              {journeys.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#3B1F0E]/20 bg-white p-8 text-center">
                  <Plane className="mx-auto h-7 w-7 text-[#C9A84C]" />
                  <h3 className="mt-4 font-serif text-xl font-bold">
                    Start with what matters to you
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3B1F0E]/65">
                    Create a plan, add confirmations or trusted details, then
                    let Kinfolk help you shape—not overwrite—it.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className={`mt-5 ${PRIMARY}`}
                  >
                    <Plus className="h-4 w-4" />
                    Create a Journey
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {journeys.map((journey) => (
                    <Link
                      key={journey.id}
                      href={`/journeys/${journey.id}`}
                      className="rounded-3xl border border-[#3B1F0E]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-xl font-bold">
                            {journey.title}
                          </h3>
                          <p className="mt-1 text-sm text-[#3B1F0E]/65">
                            {journey.destinationLabel ??
                              journey.destinationCity ??
                              "Private plan"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#FAF1E4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8A5D18]">
                          {statusLabel(journey.status)}
                        </span>
                      </div>
                      <p className="mt-5 flex items-center gap-2 text-xs text-[#3B1F0E]/55">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {dateLabel(journey.startDate) ?? "Dates to be decided"}
                        {journey.endDate
                          ? ` – ${dateLabel(journey.endDate)}`
                          : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AddItemForm({
  journeyId,
  onAdded,
}: {
  journeyId: string;
  onAdded: () => Promise<void>;
}) {
  const [kind, setKind] = useState<JourneyItemDraft["kind"]>("note");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await journeysApi.addItem(journeyId, {
        kind,
        title,
        status: confirmed ? "confirmed" : "tentative",
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        locationLabel: locationLabel || null,
      });
      setTitle("");
      setStartsAt("");
      setLocationLabel("");
      setConfirmed(false);
      await onAdded();
    } catch (cause) {
      setError(requestMessage(cause, "Could not add that item."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-2xl border border-[#3B1F0E]/10 bg-white p-4"
    >
      <h3 className="font-bold">Add a plan item</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold">
          Type
          <select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as JourneyItemDraft["kind"])
            }
            className={FIELD}
          >
            {[
              "flight",
              "lodging",
              "transport",
              "reservation",
              "event",
              "place",
              "note",
              "reminder",
            ].map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          When (optional)
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="text-xs font-bold sm:col-span-2">
          What is it?
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={255}
            placeholder="For example, dinner reservation"
            className={FIELD}
          />
        </label>
        <label className="text-xs font-bold sm:col-span-2">
          Location (optional)
          <input
            value={locationLabel}
            onChange={(event) => setLocationLabel(event.target.value)}
            maxLength={255}
            placeholder="Name or neighborhood"
            className={FIELD}
          />
        </label>
      </div>
      <label className="mt-3 flex gap-2 text-xs leading-5 text-[#3B1F0E]/70">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        I personally confirm this item. Kinfolk and imports cannot silently mark
        it confirmed.
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!title.trim() || saving}
        className={`mt-4 ${PRIMARY}`}
      >
        {saving ? "Adding…" : "Add private item"}
      </button>
    </form>
  );
}

function ImportPanel({
  journey,
  onChanged,
}: {
  journey: JourneyDetail;
  onChanged: () => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function importText() {
    if (!consent || text.trim().length < 4) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await journeysApi.importText(journey.journey.id, text);
      setNotice(
        result.duplicate
          ? "This confirmation was already saved for review."
          : "Extracted facts are ready for your review below.",
      );
      setText("");
      await onChanged();
    } catch (cause) {
      setError(requestMessage(cause, "Could not import that confirmation."));
    } finally {
      setBusy(false);
    }
  }
  async function upload() {
    if (!consent || !file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const uploaded = await uploadJourneyAttachment(file);
      await journeysApi.registerAttachment(journey.journey.id, {
        assetId: uploaded.assetId,
        sourceKind: uploaded.type,
      });
      setNotice(
        `Private ${uploaded.type} linked to this Journey. It is not shared or used by Kinfolk chat.`,
      );
      setFile(null);
      await onChanged();
    } catch (cause) {
      setError(
        requestMessage(cause, "Could not upload that private attachment."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-[#3B1F0E]/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <FileUp className="mt-0.5 h-4 w-4 text-[#8A5D18]" />
        <div>
          <h3 className="font-bold">Import for review</h3>
          <p className="mt-1 text-xs leading-5 text-[#3B1F0E]/65">
            Paste a confirmation or keep a private PDF, .eml, .ics, or image
            with this plan. Extracted facts are suggestions until you choose
            what to save.
          </p>
        </div>
      </div>
      <textarea
        aria-label="Paste confirmation text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={20_000}
        rows={5}
        placeholder="Paste the booking or confirmation text here…"
        className={`${FIELD} mt-4 resize-y`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="application/pdf,message/rfc822,text/calendar,.eml,.ics,image/jpeg,image/png,image/webp,image/heic"
          aria-label="Upload a confirmation PDF, email, calendar file, or image"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="max-w-full text-xs"
        />
        <span className="text-xs text-[#3B1F0E]/55">
          {file ? file.name : "PDF, EML, ICS, JPG, PNG, WebP, or HEIC"}
        </span>
      </div>
      <label className="mt-3 flex gap-2 text-xs leading-5 text-[#3B1F0E]/70">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        I want to add this to this private Journey for review. I understand it
        will not be published or treated as a confirmed booking.
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-xs text-[#2F6B4F]">
          {notice}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !consent || text.trim().length < 4}
          className={PRIMARY}
          onClick={() => void importText()}
        >
          {busy ? "Importing…" : "Review pasted confirmation"}
        </button>
        <button
          type="button"
          disabled={busy || !consent || !file}
          className={SECONDARY}
          onClick={() => void upload()}
        >
          {busy ? "Uploading…" : "Upload private file"}
        </button>
      </div>
    </section>
  );
}

function ImportedFacts({
  detail,
  onChanged,
}: {
  detail: JourneyDetail;
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function accept(importId: string) {
    const imported = detail.imports.find((entry) => entry.id === importId);
    if (!imported) return;
    const title =
      imported.parsedFacts.find((fact) => fact.field === "title")?.value ??
      imported.parsedFacts.find((fact) => fact.field === "flight_number")
        ?.value ??
      "Imported Journey detail";
    const startDate = imported.parsedFacts.find(
      (fact) => fact.field === "start_date",
    )?.value;
    setBusyId(importId);
    setError(null);
    try {
      await journeysApi.confirmImport(detail.journey.id, importId, [
        {
          kind: imported.sourceKind === "confirmation_text" ? "flight" : "note",
          status: "tentative",
          title,
          startsAt: startDate ? `${startDate}T12:00:00.000Z` : null,
          sourceImportId: importId,
        },
      ]);
      await onChanged();
    } catch (cause) {
      setError(requestMessage(cause, "Could not save the reviewed item."));
    } finally {
      setBusyId(null);
    }
  }
  async function extractDocument(importId: string) {
    setBusyId(importId);
    setError(null);
    try {
      await journeysApi.extractPrivateDocument(detail.journey.id, importId);
      await onChanged();
    } catch (cause) {
      setError(
        requestMessage(cause, "Could not review that private document."),
      );
    } finally {
      setBusyId(null);
    }
  }
  const reviewable = detail.imports.filter(
    (entry) => entry.status === "parsed" || entry.status === "review_needed",
  );
  if (!reviewable.length) return null;
  return (
    <section className="rounded-2xl border border-[#C9A84C]/35 bg-[#FFF8E8] p-4">
      <h3 className="font-bold">Review imported details</h3>
      <p className="mt-1 text-xs leading-5 text-[#3B1F0E]/65">
        Nothing below changes your plan until you confirm it.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        {reviewable.map((entry) => (
          <article
            key={entry.id}
            className="rounded-xl border border-[#3B1F0E]/10 bg-white p-3"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#8A5D18]">
              {statusLabel(entry.sourceKind)}
            </p>
            {entry.parsedFacts.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {entry.parsedFacts.map((fact) => (
                  <li key={`${fact.field}-${fact.value}`}>
                    <span className="font-bold">
                      {statusLabel(fact.field)}:
                    </span>{" "}
                    {fact.value}{" "}
                    <span className="text-xs text-[#3B1F0E]/50">
                      ({fact.confidence})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#3B1F0E]/65">
                This file is private and attached for review. No booking was
                inferred.
              </p>
            )}
            {entry.sourceKind === "document" && !entry.parsedFacts.length ? (
              <button
                type="button"
                className={`mt-3 ${SECONDARY}`}
                disabled={busyId === entry.id}
                onClick={() => void extractDocument(entry.id)}
              >
                {busyId === entry.id ? "Reviewing…" : "Review private document"}
              </button>
            ) : null}
            {entry.parsedFacts.length ? (
              <button
                type="button"
                className={`mt-3 ${PRIMARY}`}
                disabled={busyId === entry.id}
                onClick={() => void accept(entry.id)}
              >
                {busyId === entry.id ? "Saving…" : "Save reviewed suggestion"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ReminderPanel({
  detail,
  onChanged,
}: {
  detail: JourneyDetail;
  onChanged: () => Promise<void>;
}) {
  const [dueAt, setDueAt] = useState("");
  const [itemId, setItemId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addReminder() {
    if (!dueAt) return;
    setBusy("new");
    setError(null);
    try {
      await journeysApi.addReminder(detail.journey.id, {
        dueAt: new Date(dueAt).toISOString(),
        itemId: itemId || null,
        channel: "in_app",
      });
      setDueAt("");
      setItemId("");
      await onChanged();
    } catch (cause) {
      setError(requestMessage(cause, "Could not save that private reminder."));
    } finally {
      setBusy(null);
    }
  }

  async function setReminderState(
    reminderId: string,
    state: "enabled" | "paused",
  ) {
    setBusy(reminderId);
    setError(null);
    try {
      await journeysApi.updateReminder(detail.journey.id, reminderId, state);
      await onChanged();
    } catch (cause) {
      setError(requestMessage(cause, "Could not update that reminder."));
    } finally {
      setBusy(null);
    }
  }

  async function removeReminder(reminderId: string) {
    if (!window.confirm("Remove this private Journey reminder?")) return;
    setBusy(reminderId);
    setError(null);
    try {
      await journeysApi.deleteReminder(detail.journey.id, reminderId);
      await onChanged();
    } catch (cause) {
      setError(requestMessage(cause, "Could not remove that reminder."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3B1F0E]/10 bg-white p-4">
      <h3 className="font-bold">Private reminders</h3>
      <p className="mt-1 text-xs leading-5 text-[#3B1F0E]/65">
        Choose a time to remember. Delivery is not active until a future release
        has your separate notification permission.
      </p>
      <div className="mt-3 grid gap-2">
        <label className="text-xs font-bold">
          When
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="text-xs font-bold">
          Related plan item (optional)
          <select
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            className={FIELD}
          >
            <option value="">No linked item</option>
            {detail.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!dueAt || busy !== null}
          onClick={() => void addReminder()}
          className={PRIMARY}
        >
          {busy === "new" ? "Saving…" : "Save private reminder"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      {detail.reminders.length ? (
        <div className="mt-4 space-y-2">
          {detail.reminders.map((reminder) => (
            <article
              key={reminder.id}
              className="rounded-xl bg-[#FAF1E4] p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {dateLabel(reminder.dueAt) ?? reminder.dueAt}
                  </p>
                  <p className="mt-1 text-[#3B1F0E]/60">
                    {statusLabel(reminder.state)} · in-app delivery requires
                    future permission
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === reminder.id}
                    onClick={() =>
                      void setReminderState(
                        reminder.id,
                        reminder.state === "enabled" ? "paused" : "enabled",
                      )
                    }
                    className="font-bold text-[#8A5D18]"
                  >
                    {reminder.state === "enabled" ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === reminder.id}
                    onClick={() => void removeReminder(reminder.id)}
                    className="font-bold text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FlightWatchPanel({
  detail,
  onChanged,
}: {
  detail: JourneyDetail;
  onChanged: () => Promise<void>;
}) {
  const [itemId, setItemId] = useState("");
  const [operatingCarrier, setOperatingCarrier] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [scheduledDepartureDate, setScheduledDepartureDate] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [destinationIata, setDestinationIata] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string | null>(null);
  const flightItems = detail.items.filter((item) => item.kind === "flight");

  useEffect(() => {
    let active = true;
    void journeysApi
      .capabilities()
      .then((capabilities) => {
        if (active)
          setAvailability(
            capabilities.flightMonitor.blockers[0] ??
              "Live status availability is being checked.",
          );
      })
      .catch(() => {
        if (active)
          setAvailability(
            "Live flight status is unavailable right now. Your saved Journey is unchanged.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setBusy("new");
    setError(null);
    try {
      await journeysApi.addFlightWatch(detail.journey.id, {
        itemId: itemId || null,
        operatingCarrier,
        flightNumber,
        scheduledDepartureDate,
        originIata,
        destinationIata,
        notificationChannel: "in_app",
      });
      setOperatingCarrier("");
      setFlightNumber("");
      setScheduledDepartureDate("");
      setOriginIata("");
      setDestinationIata("");
      await onChanged();
    } catch (cause) {
      setError(
        requestMessage(cause, "Could not save this private flight watch."),
      );
    } finally {
      setBusy(null);
    }
  }

  async function update(
    watchId: string,
    action: "pause" | "resume" | "revoke",
  ) {
    setBusy(watchId);
    setError(null);
    try {
      await journeysApi.updateFlightWatch(detail.journey.id, watchId, action);
      await onChanged();
    } catch (cause) {
      setError(
        requestMessage(cause, "Could not update this private flight watch."),
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove(watchId: string) {
    if (!window.confirm("Remove this private flight watch?")) return;
    setBusy(watchId);
    setError(null);
    try {
      await journeysApi.deleteFlightWatch(detail.journey.id, watchId);
      await onChanged();
    } catch (cause) {
      setError(
        requestMessage(cause, "Could not remove this private flight watch."),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3B1F0E]/10 bg-white p-4">
      <div className="flex items-start gap-2">
        <Plane className="mt-0.5 h-4 w-4 text-[#8A5D18]" />
        <div>
          <h3 className="font-bold">Flight watch</h3>
          <p className="mt-1 text-xs leading-5 text-[#3B1F0E]/65">
            Opt in with one operating flight. Kinfolk never accesses an airline
            account, booking, PNR, ticket, loyalty account, or payment method.
          </p>
        </div>
      </div>
      {availability ? (
        <p className="mt-3 rounded-xl bg-[#FAF1E4] p-3 text-xs leading-5 text-[#3B1F0E]/70">
          {availability}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        <label className="text-xs font-bold">
          Link an existing flight item (optional)
          <select
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            className={FIELD}
          >
            <option value="">Enter a flight below</option>
            {flightItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold">
            Operating carrier
            <input
              value={operatingCarrier}
              onChange={(event) => setOperatingCarrier(event.target.value)}
              placeholder="DL"
              maxLength={3}
              className={FIELD}
            />
          </label>
          <label className="text-xs font-bold">
            Flight number
            <input
              value={flightNumber}
              onChange={(event) => setFlightNumber(event.target.value)}
              placeholder="1234"
              maxLength={4}
              className={FIELD}
            />
          </label>
        </div>
        <label className="text-xs font-bold">
          Scheduled departure date
          <input
            type="date"
            value={scheduledDepartureDate}
            onChange={(event) => setScheduledDepartureDate(event.target.value)}
            className={FIELD}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold">
            Origin
            <input
              value={originIata}
              onChange={(event) => setOriginIata(event.target.value)}
              placeholder="ATL"
              maxLength={3}
              className={FIELD}
            />
          </label>
          <label className="text-xs font-bold">
            Destination
            <input
              value={destinationIata}
              onChange={(event) => setDestinationIata(event.target.value)}
              placeholder="LAX"
              maxLength={3}
              className={FIELD}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={
            busy !== null ||
            !operatingCarrier ||
            !flightNumber ||
            !scheduledDepartureDate ||
            !originIata ||
            !destinationIata
          }
          onClick={() => void save()}
          className={PRIMARY}
        >
          {busy === "new" ? "Saving…" : "Save private flight watch"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      {detail.flightWatches.length ? (
        <div className="mt-4 space-y-2">
          {detail.flightWatches.map((watch) => (
            <article
              key={watch.id}
              className="rounded-xl bg-[#FAF1E4] p-3 text-xs"
            >
              <p className="font-bold">
                {watch.operatingCarrier} {watch.flightNumber} ·{" "}
                {watch.originIata}–{watch.destinationIata}
              </p>
              <p className="mt-1 text-[#3B1F0E]/65">
                {dateLabel(watch.scheduledDepartureDate)} ·{" "}
                {statusLabel(watch.state)} · {statusLabel(watch.status.state)}
              </p>
              <p className="mt-2 leading-5 text-[#3B1F0E]/65">
                {watch.status.summary ??
                  "No live status has been retrieved. Confirm with the airline or booking channel."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {watch.state === "paused" ? (
                  <button
                    type="button"
                    disabled={busy === watch.id}
                    onClick={() => void update(watch.id, "resume")}
                    className="font-bold text-[#8A5D18]"
                  >
                    Resume
                  </button>
                ) : watch.state !== "revoked" ? (
                  <button
                    type="button"
                    disabled={busy === watch.id}
                    onClick={() => void update(watch.id, "pause")}
                    className="font-bold text-[#8A5D18]"
                  >
                    Pause
                  </button>
                ) : null}
                {watch.state !== "revoked" ? (
                  <button
                    type="button"
                    disabled={busy === watch.id}
                    onClick={() => void update(watch.id, "revoke")}
                    className="font-bold text-red-700"
                  >
                    Revoke consent
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy === watch.id}
                  onClick={() => void remove(watch.id)}
                  className="font-bold text-red-700"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function JourneyDetailPage() {
  const [, params] = useRoute("/journeys/:journeyId");
  const [, navigate] = useLocation();
  const journeyId = params?.journeyId ?? "";
  const [detail, setDetail] = useState<JourneyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => {
    if (!journeyId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await journeysApi.get(journeyId));
    } catch (cause) {
      setError(requestMessage(cause, "This private Journey could not load."));
    } finally {
      setLoading(false);
    }
  }, [journeyId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function deleteJourney() {
    if (
      !detail ||
      !window.confirm(
        `Delete “${detail.journey.title}”? This removes its private items and review imports. Existing account connections are not changed.`,
      )
    )
      return;
    setDeleting(true);
    setError(null);
    try {
      await journeysApi.delete(detail.journey.id);
      navigate("/journeys");
    } catch (cause) {
      setError(requestMessage(cause, "Could not delete this Journey."));
    } finally {
      setDeleting(false);
    }
  }
  async function removeItem(item: JourneyItem) {
    if (!detail || !window.confirm(`Remove “${item.title}” from this Journey?`))
      return;
    try {
      await journeysApi.deleteItem(detail.journey.id, item.id);
      await load();
    } catch (cause) {
      setError(requestMessage(cause, "Could not remove that item."));
    }
  }
  if (loading)
    return (
      <main className="min-h-screen bg-[#FAF1E4] px-4 py-16 text-center text-sm text-[#3B1F0E]/55">
        Opening your private Journey…
      </main>
    );
  if (!detail)
    return (
      <main className="min-h-screen bg-[#FAF1E4] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/journeys" className="text-sm font-bold text-[#8A5D18]">
            Back to Journeys
          </Link>
          <div className="mt-6">
            <ErrorPanel
              message={error ?? "Journey not found."}
              retry={() => void load()}
            />
          </div>
        </div>
      </main>
    );
  return (
    <main className="min-h-screen bg-[#FAF1E4] px-4 py-8 text-[#3B1F0E] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/journeys"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#8A5D18]"
        >
          <ChevronLeft className="h-4 w-4" />
          All Journeys
        </Link>
        <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A5D18]">
              Private Journey
            </p>
            <h1 className="mt-1 font-serif text-4xl font-bold">
              {detail.journey.title}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-[#3B1F0E]/65">
              <MapPin className="h-4 w-4" />
              {detail.journey.destinationLabel ??
                detail.journey.destinationCity ??
                "Destination to be decided"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void deleteJourney()}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-55"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete Journey"}
          </button>
        </header>
        <div className="mt-6">
          <PrivateNotice />
        </div>
        {error ? (
          <div className="mt-5">
            <ErrorPanel message={error} retry={() => void load()} />
          </div>
        ) : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <section className="space-y-4">
            <div className="rounded-3xl border border-[#3B1F0E]/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold">Plan</h2>
                <span className="rounded-full bg-[#FAF1E4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8A5D18]">
                  {statusLabel(detail.journey.status)}
                </span>
              </div>
              <p className="mt-3 text-sm text-[#3B1F0E]/65">
                {dateLabel(detail.journey.startDate) ?? "Dates to be decided"}
                {detail.journey.endDate
                  ? ` – ${dateLabel(detail.journey.endDate)}`
                  : ""}{" "}
                {detail.journey.timeZone ? `· ${detail.journey.timeZone}` : ""}
              </p>
              {detail.items.length === 0 ? (
                <p className="mt-5 rounded-2xl bg-[#FAF1E4] p-4 text-sm leading-6 text-[#3B1F0E]/65">
                  No items yet. Add a plan item or import a confirmation for
                  review.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {detail.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#3B1F0E]/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className="mt-1 text-xs text-[#3B1F0E]/60">
                            {statusLabel(item.kind)} ·{" "}
                            {statusLabel(item.status)}
                            {item.startsAt
                              ? ` · ${dateLabel(item.startsAt)}`
                              : ""}
                            {item.locationLabel
                              ? ` · ${item.locationLabel}`
                              : ""}
                          </p>
                          {item.status === "confirmed" ? (
                            <p className="mt-2 text-xs font-bold text-[#2F6B4F]">
                              Confirmed by you
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeItem(item)}
                          className="text-xs font-bold text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <ImportedFacts detail={detail} onChanged={load} />
          </section>
          <aside className="space-y-4">
            <AddItemForm journeyId={detail.journey.id} onAdded={load} />
            <ImportPanel journey={detail} onChanged={load} />
            <ReminderPanel detail={detail} onChanged={load} />
            <FlightWatchPanel detail={detail} onChanged={load} />
            <section className="rounded-2xl border border-[#3B1F0E]/10 bg-white p-4 text-xs leading-5 text-[#3B1F0E]/65">
              <p className="font-bold text-[#3B1F0E]">Kinfolk boundary</p>
              <p className="mt-1">
                Kinfolk can suggest options for this Journey only after you
                choose to save them here. It cannot book, change, or confirm
                flights, hotels, reservations, or events.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default JourneysPage;
