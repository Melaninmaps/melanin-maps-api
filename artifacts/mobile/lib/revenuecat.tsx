/**
 * RevenueCat — STUBBED for v1.0 free release.
 * All purchase flows are disabled. Re-enable in v1.1 when IAP is ready.
 */
import React, { createContext, useContext } from "react";

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "premium";

// No-op — do not initialize StoreKit in v1.0
export function initializeRevenueCat() {
  // Disabled for v1.0 — no IAP in this submission
}

type SubscriptionContextValue = {
  customerInfo: null;
  offerings: null;
  isSubscribed: false;
  activeEntitlement: undefined;
  isLoading: false;
  purchase: () => Promise<never>;
  restore: () => Promise<never>;
  isPurchasing: false;
  isRestoring: false;
};

const STUB_VALUE: SubscriptionContextValue = {
  customerInfo: null,
  offerings: null,
  isSubscribed: false,
  activeEntitlement: undefined,
  isLoading: false,
  purchase: () => Promise.reject(new Error("IAP disabled in v1.0")),
  restore: () => Promise.reject(new Error("IAP disabled in v1.0")),
  isPurchasing: false,
  isRestoring: false,
};

const Context = createContext<SubscriptionContextValue>(STUB_VALUE);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  return <Context.Provider value={STUB_VALUE}>{children}</Context.Provider>;
}

export function useSubscription() {
  return useContext(Context);
}
