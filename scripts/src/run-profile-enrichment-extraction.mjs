#!/usr/bin/env node
/** Compact Manus-runtime entrypoint for the source-quoted extraction runner. */
import { main } from "./extract-kinfolk-current-profile-proposals.mjs";

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
