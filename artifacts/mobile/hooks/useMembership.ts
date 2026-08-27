import * as SecureStore from "expo-secure-store";
import { Linking } from "react-native";
import { useCallback, useEffect, useState } from "react";

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

  const initiateCheckout = useCallback(async (priceId: string | null, planKey?: string | null): Promise<"ok" | "no_auth" | "no_price" | "error"> => {
    if (!priceId) return "no_price";

    const token = await getToken();
    if (!token) return "no_auth";

    const apiBase = getApiBase();
    if (!apiBase) return "error";

    setCheckoutLoading(true);
    setCheckoutPlanId(planKey ?? null);
    try {
      const res = await fetch(`${apiBase}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url: string };
        if (data.url) {
          await Linking.openURL(data.url);
          return "ok";
        }
      }
      return "error";
    } catch {
      return "error";
    } finally {
      setCheckoutLoading(false);
      setCheckoutPlanId(null);
    }
  }, []);

  const openPortal = useCallback(async (): Promise<void> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/stripe/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { url: string };
        if (data.url) await Linking.openURL(data.url);
      }
    } catch {}
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
