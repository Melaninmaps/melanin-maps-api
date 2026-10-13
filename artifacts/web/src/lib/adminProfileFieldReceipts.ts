export type AdminProfileFieldReceiptName =
  | "identity"
  | "description"
  | "category"
  | "hours"
  | "price_range"
  | "phone"
  | "address"
  | "website"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "service_tags"
  | "ownership";

export type AdminProfileFieldReceipt = {
  field: AdminProfileFieldReceiptName;
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  confidence: "high" | "medium" | "low";
  note: string | null;
  identityMatch?: boolean;
  identityMatchSignal?: "business_name" | "street_address" | "full_phone" | "official_domain" | "official_social_profile" | null;
};

export const ADMIN_PROFILE_FIELD_RECEIPT_OPTIONS: ReadonlyArray<{
  value: AdminProfileFieldReceiptName;
  label: string;
}> = [
  { value: "identity", label: "Identity / location" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "hours", label: "Hours" },
  { value: "price_range", label: "Price range" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "service_tags", label: "Service tags / vibes" },
  { value: "ownership", label: "Ownership" },
];

export function newAdminProfileFieldReceipt(field: AdminProfileFieldReceiptName): AdminProfileFieldReceipt {
  return {
    field,
    sourceUrl: "",
    sourceLabel: "",
    observedAt: "",
    confidence: "high",
    note: null,
    identityMatch: false,
    identityMatchSignal: null,
  };
}

/**
 * The Admin API permits one receipt per changed public fact in a save. Prevent
 * an avoidable duplicate in the editor before the request reaches that guard.
 */
export function addAdminProfileFieldReceipt(
  receipts: AdminProfileFieldReceipt[],
  field: AdminProfileFieldReceiptName,
): AdminProfileFieldReceipt[] {
  return receipts.some((receipt) => receipt.field === field)
    ? receipts
    : [...receipts, newAdminProfileFieldReceipt(field)];
}
