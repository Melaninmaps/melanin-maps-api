import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  openWebPaymentHandoff,
  type WebPaymentHandoffResult,
} from "@/lib/webPaymentHandoff";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export interface StripePrice {
  id: string;
  unitAmount: number;
  currency: string;
  recurring: { interval: "month" | "year" } | null;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  metadata: Record<string, string>;
  prices: StripePrice[];
}

export interface ActiveSubscription {
  id: string;
  status: string;
  productName: string | null;
}

/**
 * Membership reads remain in the app. Payment starts and payment management are
 * handed to their corresponding website screens; the mobile app never asks the
 * API to create a Stripe Checkout or Customer Portal URL.
 */
export function useMembership() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const apiBase = getApiBase();
    if (!apiBase) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${apiBase}/api/stripe/products`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as { products: StripeProduct[] };
        setProducts(data.products ?? []);
      }
    } catch {
      clearTimeout(timeout);
    } finally {
      setProductsLoaded(true);
    }
  }, []);

  const loadSubscription = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/stripe/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { subscription: { id: string; status: string; items?: { data?: { price?: { product?: string } }[] } } | null };
        if (data.subscription && ["active", "trialing"].includes(data.subscription.status)) {
          const productId = data.subscription.items?.data?.[0]?.price?.product ?? null;
          const product = productId ? products.find((p) => p.id === productId) : null;
          setSubscription({
            id: data.subscription.id,
            status: data.subscription.status,
            productName: product?.name ?? null,
          });
        } else {
          setSubscription(null);
        }
      }
    } catch {}
  }, [products]);

  useEffect(() => { void Promise.resolve().then(loadProducts); }, [loadProducts]);
  useEffect(() => {
    if (productsLoaded) void Promise.resolve().then(loadSubscription);
  }, [productsLoaded, loadSubscription]);

  const initiateCheckout = useCallback(async (
    _priceId: string | null,
    planKey?: string | null,
  ): Promise<WebPaymentHandoffResult> => {
    setCheckoutLoading(true);
    setCheckoutPlanId(planKey ?? null);
    try {
      // The price identifier stays in the signature to avoid breaking callers.
      // Website checkout resolves the current plan, price, account, and Stripe
      // session only after the member deliberately arrives there.
      return await openWebPaymentHandoff("membership");
    } finally {
      setCheckoutLoading(false);
      setCheckoutPlanId(null);
    }
  }, []);

  const openPortal = useCallback(async (): Promise<WebPaymentHandoffResult> => {
    // The website validates the existing session and creates the private Stripe
    // Customer Portal URL after the member arrives at the billing screen.
    return openWebPaymentHandoff("billing");
  }, []);

  return {
    products,
    productsLoaded,
    subscription,
    checkoutLoading,
    checkoutPlanId,
    initiateCheckout,
    openPortal,
    refresh: loadProducts,
  };
}
