import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  flightStatusChanged,
  getFlightMonitorReadiness,
  parseFlightWatchInput,
  unknownFlightStatus,
} from "../flight-watch";

describe("Journey flight watch policy", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a minimal member-confirmed operational flight reference", () => {
    expect(
      parseFlightWatchInput({
        operatingCarrier: "dl",
        flightNumber: "1234",
        scheduledDepartureDate: "2026-11-03",
        originIata: "atl",
        destinationIata: "lax",
        notificationChannel: "in_app",
        memberConsent: true,
      }),
    ).toMatchObject({
      operatingCarrier: "DL",
      flightNumber: "1234",
      originIata: "ATL",
      destinationIata: "LAX",
      memberConsent: true,
    });
  });

  it("does not create a watch without explicit consent or valid flight identifiers", () => {
    expect(() =>
      parseFlightWatchInput({
        operatingCarrier: "DL",
        flightNumber: "1234",
        scheduledDepartureDate: "2026-11-03",
        originIata: "ATL",
        destinationIata: "LAX",
        notificationChannel: "in_app",
        memberConsent: false,
      }),
    ).toThrow(/explicit member consent/i);
    expect(() =>
      parseFlightWatchInput({
        operatingCarrier: "DELTA",
        flightNumber: "1234",
        scheduledDepartureDate: "2026-11-03",
        originIata: "ATL",
        destinationIata: "LAX",
        notificationChannel: "in_app",
        memberConsent: true,
      }),
    ).toThrow(/operating carrier/i);
  });

  it("defaults to disabled without a contracted provider and never invents status", () => {
    expect(getFlightMonitorReadiness()).toMatchObject({
      status: "disabled",
      provider: null,
    });
    expect(unknownFlightStatus()).toMatchObject({ state: "unknown" });
  });

  it("compares normalized advisory snapshots without provider payloads", () => {
    const unknown = unknownFlightStatus();
    expect(flightStatusChanged(unknown, unknown)).toBe(false);
    expect(
      flightStatusChanged(unknown, {
        ...unknown,
        state: "delayed",
        summary: "Provider reports a material delay.",
      }),
    ).toBe(true);
  });
});
