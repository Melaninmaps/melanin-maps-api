import React, { createContext, useContext } from "react";

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "premium";

export function initializeRevenueCat() {
}

type SubscriptionContextType = {
  isPremium: boolean;
  isLoading: boolean;
  offerings: null;
  customerInfo: null;
  purchasePackage: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  refetch: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isLoading: false,
  offerings: null,
  customerInfo: null,
  purchasePackage: async () => {},
  restorePurchases: async () => {},
  refetch: () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionContext.Provider
      value={{
        isPremium: false,
        isLoading: false,
        offerings: null,
        customerInfo: null,
        purchasePackage: async () => {},
        restorePurchases: async () => {},
        refetch: () => {},
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
