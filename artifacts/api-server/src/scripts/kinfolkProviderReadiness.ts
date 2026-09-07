import { probeKinfolkProviderReadiness } from "../kinfolk/provider-readiness";

if (process.env.NODE_ENV === "production") {
  console.error("provider_readiness FAIL production_refused");
  process.exitCode = 1;
} else {
  const rows = await probeKinfolkProviderReadiness();
  for (const row of rows) console.log(`${row.capability} ${row.status} ${row.category}`);
  if (rows.some((row) => row.status === "FAIL")) process.exitCode = 1;
}