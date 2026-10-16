export const VALIDATED_PRESENCE_BATCH_SIZE = 50;

export type ValidatedPresenceCsvRow = {
  originalRowNumber: number;
  businessName: string;
  city: string;
  state: string;
  phone: string | null;
  authorizedOwnershipStatus: "Black / African American-Owned" | "Latino / Hispanic-Owned" | "Black / African American-Owned; Latino / Hispanic-Owned";
  authorizedOwnershipBasis: string;
  authorizedOwnershipSourceName: string;
  authorizedOwnershipSourceEvidence: string | null;
  qualifyingPresenceType: string;
  qualifyingUrls: string;
  validationRoute: string;
  validationTier: string;
  businessNameEvidence: string;
  locationEvidence: string;
  sourceUrl: string;
  auditCaveat: string;
};

export type ValidatedPresenceCsvParseResult = {
  rows: ValidatedPresenceCsvRow[];
  heldMinorityOwnedCount: number;
  ignoredRowCount: number;
};

const EXPLICIT_OWNERSHIP = new Set<ValidatedPresenceCsvRow["authorizedOwnershipStatus"]>([
  "Black / African American-Owned",
  "Latino / Hispanic-Owned",
  "Black / African American-Owned; Latino / Hispanic-Owned",
]);

function canonicalHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("The selected CSV has an unclosed quoted field.");
  if (cell || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value.trim()));
}

function readRequired(record: Record<string, string>, key: string): string {
  const value = record[key]?.trim();
  if (!value) throw new Error(`Row ${record.original_row_number || "?"} is missing ${key}.`);
  return value;
}

function readOptional(record: Record<string, string>, key: string): string | null {
  return record[key]?.trim() || null;
}

/**
 * This parser runs only in the administrator's browser. It selects the three
 * user-approved explicit ownership labels, leaves Minority-Owned rows held, and
 * intentionally omits any unrequested CSV columns such as address or category.
 */
export function parseValidatedPresenceCsv(text: string): ValidatedPresenceCsvParseResult {
  const parsed = parseCsv(text);
  if (parsed.length < 2) throw new Error("The selected file must contain a header and at least one business row.");
  const headers = parsed[0].map(canonicalHeader);
  const required = [
    "original_row_number", "business_name", "city", "state", "authorized_ownership_status",
    "authorized_ownership_basis", "authorized_ownership_source_name", "qualifying_presence_type",
    "qualifying_urls", "validation_route", "validation_tier", "business_name_evidence",
    "location_evidence", "source_url", "audit_caveat",
  ];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length > 0) throw new Error(`The selected CSV is missing required columns: ${missing.join(", ")}.`);

  const rows: ValidatedPresenceCsvRow[] = [];
  let heldMinorityOwnedCount = 0;
  let ignoredRowCount = 0;
  for (const values of parsed.slice(1)) {
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const ownership = readRequired(record, "authorized_ownership_status");
    if (ownership === "Minority-Owned") {
      heldMinorityOwnedCount += 1;
      continue;
    }
    if (!EXPLICIT_OWNERSHIP.has(ownership as ValidatedPresenceCsvRow["authorizedOwnershipStatus"])) {
      ignoredRowCount += 1;
      continue;
    }
    const originalRowNumber = Number.parseInt(readRequired(record, "original_row_number"), 10);
    if (!Number.isSafeInteger(originalRowNumber) || originalRowNumber < 1) throw new Error("Each selected record needs a valid original_row_number.");
    rows.push({
      originalRowNumber,
      businessName: readRequired(record, "business_name"),
      city: readRequired(record, "city"),
      state: readRequired(record, "state").toUpperCase(),
      phone: readOptional(record, "phone"),
      authorizedOwnershipStatus: ownership as ValidatedPresenceCsvRow["authorizedOwnershipStatus"],
      authorizedOwnershipBasis: readRequired(record, "authorized_ownership_basis"),
      authorizedOwnershipSourceName: readRequired(record, "authorized_ownership_source_name"),
      authorizedOwnershipSourceEvidence: readOptional(record, "authorized_ownership_source_evidence"),
      qualifyingPresenceType: readRequired(record, "qualifying_presence_type"),
      qualifyingUrls: readRequired(record, "qualifying_urls"),
      validationRoute: readRequired(record, "validation_route"),
      validationTier: readRequired(record, "validation_tier"),
      businessNameEvidence: readRequired(record, "business_name_evidence"),
      locationEvidence: readRequired(record, "location_evidence"),
      sourceUrl: readRequired(record, "source_url"),
      auditCaveat: readRequired(record, "audit_caveat"),
    });
  }
  if (rows.length === 0) throw new Error("No explicitly Black / African American-Owned or Latino / Hispanic-Owned rows were found in this CSV.");
  return { rows, heldMinorityOwnedCount, ignoredRowCount };
}
