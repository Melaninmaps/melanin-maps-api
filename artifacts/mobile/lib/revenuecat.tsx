/**
 * RevenueCat is intentionally disabled for Build 106 and all current profiles.
 * Keep every lifecycle and purchase operation behind this no-op boundary.
 */
import React, { createContext, useContext } from "react";

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "premium";
export const REVENUECAT_ENABLED = false as const;

export function initializeRevenueCat(): void {}
export async function identifyRevenueCatUser(_userId: string): Promise<void> {}
export async function resetRevenueCatUser(): Promise<void> {}

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

const disabled = () => Promise.reject(new Error("IAP disabled for Build 106"));
const STUB_VALUE: SubscriptionContextValue = {
  customerInfo: null,
  offerings: null,
  isSubscribed: false,
  activeEntitlement: undefined,
  isLoading: false,
  purchase: disabled,
  restore: disabled,
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
