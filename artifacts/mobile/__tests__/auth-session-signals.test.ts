import { describe, expect, it } from "vitest";
import {
  notifyUnauthorizedApiResponse,
  registerUnauthorizedApiResponseHandler,
} from "../lib/authSessionSignals";

describe("authenticated API session signals", () => {
  it("notifies the active recovery handler exactly when a configured API observer reports 401", () => {
    let calls = 0;
    const unregister = registerUnauthorizedApiResponseHandler(() => {
      calls += 1;
    });

    notifyUnauthorizedApiResponse();
    notifyUnauthorizedApiResponse();

    expect(calls).toBe(2);
    unregister();
  });

  it("does not retain a handler after its AuthProvider unmounts", () => {
    let calls = 0;
    const unregister = registerUnauthorizedApiResponseHandler(() => {
      calls += 1;
    });

    unregister();
    notifyUnauthorizedApiResponse();

    expect(calls).toBe(0);
  });

  it("does not let an older AuthProvider cleanup clear a newer handler", () => {
    let firstCalls = 0;
    let secondCalls = 0;
    const unregisterFirst = registerUnauthorizedApiResponseHandler(() => {
      firstCalls += 1;
    });
    const unregisterSecond = registerUnauthorizedApiResponseHandler(() => {
      secondCalls += 1;
    });

    unregisterFirst();
    notifyUnauthorizedApiResponse();

    expect(firstCalls).toBe(0);
    expect(secondCalls).toBe(1);
    unregisterSecond();
  });
});
