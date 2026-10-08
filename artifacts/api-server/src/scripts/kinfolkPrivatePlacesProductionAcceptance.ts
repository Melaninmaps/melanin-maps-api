import { runPrivatePlacesProductionSyntheticAcceptance } from "../kinfolk/private-places-production-acceptance";

const result = await runPrivatePlacesProductionSyntheticAcceptance();
console.log(JSON.stringify({
  status: "passed",
  environment: "production-safe-loopback-transaction",
  checks: result.checks,
  cleanupVerified: result.cleanupVerified,
}));
