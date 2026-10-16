export const CAPACITY_TEST_USER_COUNT = 200;
export const CAPACITY_TEST_EMAIL_DOMAIN = "capacity.mwm.internal";
export const CAPACITY_TEST_EMAIL_PREFIX = "mwm-capacity-";
export const CAPACITY_TEST_PROVISION_GUARD = "PROVISION_200_ISOLATED_TEST_USERS";
export const CAPACITY_TEST_CLEANUP_GUARD = "REMOVE_200_ISOLATED_TEST_USERS";

const CAPACITY_CITIES = [
  "Philadelphia",
  "Atlanta",
  "Houston",
  "Washington",
  "Los Angeles",
  "New York",
  "Chicago",
  "New Orleans",
  "Detroit",
  "Baltimore",
  "Memphis",
  "Dallas",
  "Miami",
  "Charlotte",
  "Columbia",
  "Birmingham",
  "Oakland",
  "Newark",
  "Richmond",
  "Nashville",
] as const;

export type CapacityTestAccount = Readonly<{
  number: number;
  email: string;
  username: string;
  homeCity: string;
}>;

export type CapacityIdentityEnvironment = Readonly<{
  CAPACITY_TEST_IDENTITY_WRITE_APPROVED?: string;
  CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED?: string;
  CAPACITY_TEST_PASSWORD_HASH?: string;
}>;

export function capacityTestEmail(number: number): string {
  return `${CAPACITY_TEST_EMAIL_PREFIX}${String(number).padStart(3, "0")}@${CAPACITY_TEST_EMAIL_DOMAIN}`;
}

export function isCapacityTestEmail(value: string): boolean {
  return new RegExp(`^${CAPACITY_TEST_EMAIL_PREFIX}\\d{3}@${CAPACITY_TEST_EMAIL_DOMAIN.replace(".", "\\.")}$`, "i")
    .test(value.trim());
}

export function buildCapacityTestAccounts(
  count = CAPACITY_TEST_USER_COUNT,
): readonly CapacityTestAccount[] {
  if (!Number.isInteger(count) || count !== CAPACITY_TEST_USER_COUNT) {
    throw new Error(`Capacity test identity count must be exactly ${CAPACITY_TEST_USER_COUNT}.`);
  }
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const homeCity = CAPACITY_CITIES[index % CAPACITY_CITIES.length];
    return {
      number,
      email: capacityTestEmail(number),
      username: `mwmcapacity${String(number).padStart(3, "0")}`,
      homeCity,
    };
  });
}

export function isBcryptPasswordHash(value: string | undefined): value is string {
  return typeof value === "string" && /^\$2[aby]\$1[0-9]\$[./A-Za-z0-9]{53}$/.test(value);
}

export function isCapacityTestProvisionEnabled(
  environment: CapacityIdentityEnvironment,
): boolean {
  return environment.CAPACITY_TEST_IDENTITY_WRITE_APPROVED === CAPACITY_TEST_PROVISION_GUARD
    && isBcryptPasswordHash(environment.CAPACITY_TEST_PASSWORD_HASH)
    && environment.CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED !== CAPACITY_TEST_CLEANUP_GUARD;
}

export function isCapacityTestCleanupEnabled(
  environment: CapacityIdentityEnvironment,
): boolean {
  return environment.CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED === CAPACITY_TEST_CLEANUP_GUARD
    && environment.CAPACITY_TEST_IDENTITY_WRITE_APPROVED !== CAPACITY_TEST_PROVISION_GUARD;
}
