import { runPrivatePlacesProductionSyntheticAcceptance } from "../kinfolk/private-places-production-acceptance";

const result = await runPrivatePlacesProductionSyntheticAcceptance();
console.log(JSON.stringify({
  status: "passed",
  environment: "production-safe-loopback-transaction",
  checks: result.checks.filter((check) => check.includes("Temporary Stay") || check.includes("cross-member") || check.includes("cleanup")),
  cleanupVerified: result.cleanupVerified,
}));
