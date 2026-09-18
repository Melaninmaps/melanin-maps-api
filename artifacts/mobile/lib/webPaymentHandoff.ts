import { Linking, Platform } from "react-native";

/**
 * Every route ends at the Mapping with Melanin website. This client deliberately
 * never creates a Stripe Checkout, Customer Portal, Connect, or payment URL.
 * The website retains the authenticated, server-side Stripe calls.
 *
 * iOS and Android external-payment availability is build-configured because the
 * applicable store programs and regional approvals must be in place before a
 * distributed binary exposes an external digital-payment call to action.
 */
export type WebPaymentDestination =
  | "membership"
  | "billing"
  | "familyPlan"
  | "businessMembership"
  | "businessPromotions";

const WEBSITE_ORIGIN = (
  process.env.EXPO_PUBLIC_WEBSITE_ORIGIN ?? "https://www.mappingwithmelanin.com"
).replace(/\/$/, "");

const PAYMENT_PATHS: Record<WebPaymentDestination, string> = {
  membership: "/membership",
  billing: "/billing",
  familyPlan: "/family-plan",
  businessMembership: "/for-business-owners",
  businessPromotions: "/business-growth-center",
};

function releaseFlag(name: string): boolean {
  return process.env[name] === "true";
}

/**
 * The browser handoff is enabled for a native storefront only after its owner
 * has completed the relevant Store review/program configuration. The native
 * client receives no account, price, checkout-session, or payment parameter.
 */
export function webPaymentHandoffEnabled(): boolean {
  if (Platform.OS === "web") return true;
  if (Platform.OS === "ios") {
    return releaseFlag("EXPO_PUBLIC_IOS_EXTERNAL_WEB_PAYMENT_APPROVED");
  }
  if (Platform.OS === "android") {
    return releaseFlag("EXPO_PUBLIC_ANDROID_EXTERNAL_WEB_PAYMENT_APPROVED");
  }
  return false;
}

/** Returns a fixed, HTTPS, same-origin website path for a payment-related task. */
export function webPaymentUrl(destination: WebPaymentDestination): string {
  return `${WEBSITE_ORIGIN}${PAYMENT_PATHS[destination]}`;
}

export type WebPaymentHandoffResult = "opened" | "not_enabled" | "unavailable";

/** Opens the applicable website screen without passing a bearer token or user data. */
export async function openWebPaymentHandoff(
  destination: WebPaymentDestination,
): Promise<WebPaymentHandoffResult> {
  if (!webPaymentHandoffEnabled()) return "not_enabled";
  const url = webPaymentUrl(destination);
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return "unavailable";
    await Linking.openURL(url);
    return "opened";
  } catch {
    return "unavailable";
  }
}

/** Opens a public business detail page where the website renders its Shop and checkout. */
export async function openBusinessListingWebsite(
  businessId: string,
  listingId: string,
): Promise<WebPaymentHandoffResult> {
  if (!webPaymentHandoffEnabled()) return "not_enabled";
  const safeBusinessId = encodeURIComponent(businessId.trim());
  const safeListingId = encodeURIComponent(listingId.trim());
  if (!safeBusinessId || !safeListingId) return "unavailable";
  const url = `${WEBSITE_ORIGIN}/businesses/${safeBusinessId}?shop=${safeListingId}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return "unavailable";
    await Linking.openURL(url);
    return "opened";
  } catch {
    return "unavailable";
  }
}

export const WEB_PAYMENT_HANDOFF_MESSAGE =
  "Payment is completed securely on Mapping with Melanin’s website. Your existing account and app access stay the same.";
