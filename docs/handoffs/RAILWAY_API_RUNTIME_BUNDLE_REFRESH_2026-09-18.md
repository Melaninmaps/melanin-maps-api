# Railway API Runtime Bundle Refresh

**Status:** Release package prepared from GitHub `main` commit `d58d4146fb6ec09af07c22fa7981b2bbc0f4fad6`. This handoff does not claim that the refreshed artifact is publicly deployed.

## Finding

The production Railway `api-server` service is configured to start the full API process and is connected to its production PostgreSQL database. Its service-level API runtime is, however, built from the committed `artifacts/api-server/dist` directory. The deployed bundle still contained the September 4 build identity `26ec96d…`, even after Railway displayed a newer source deployment label.

This distinction matters because the old compiled bundle did not contain the current normal OpenAI configuration resolver. The current source accepts the existing `OPENAI_API_KEY` and uses OpenAI's standard API base URL when no custom base URL is set. The old bundle instead behaved as if only legacy integration variables were available.

## Release package

This release refreshes only derived API runtime artifacts from the current merged source. It regenerates the API bundle, source map, Pino runtime workers, Kinfolk readiness voice fixture, and build identity. The source commit embedded in the bundle is `d58d4146fb6ec09af07c22fa7981b2bbc0f4fad6`, which includes the full Railway API cutover and the Kinfolk feedback release.

The refreshed compiled bundle includes the standard-key resolver:

```text
OPENAI_API_KEY → https://api.openai.com/v1
```

It also preserves optional legacy integration configuration when both `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` are intentionally supplied.

## Safety boundary

No environment secret, key value, user, authentication record, session, password, tester account, waitlist record, business record, or directory candidate is changed by this release. `OPENAI_API_KEY` remains only in Railway's masked service variable. No native iOS or Android build is required to deploy this server artifact.

## Verification after deployment

After Railway deploys the merged runtime-bundle commit, verify the public endpoint:

```text
GET https://api.melaninmaps.com/api/version
```

The `built_from_sha` field must report `d58d4146…` or the exact descendant source SHA that was compiled into the release bundle. Then verify:

```text
GET https://api.melaninmaps.com/api/readyz
GET https://api.melaninmaps.com/api/kinfolk/health
```

The database readiness endpoint must remain HTTP 200. Kinfolk is healthy only when its endpoint returns HTTP 200 and `{"ok":true}`. If it returns a safe category such as `unauthorized`, `quota_exceeded`, `model_not_found`, or `connection_failure`, inspect only the protected service logs and variable presence. Never print, copy, rotate, or expose a secret in the browser, app client, GitHub, documentation, or diagnostic output.

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api/pull/69 "Full Railway API cutover"
[2]: https://github.com/Melaninmaps/melanin-maps-api/pull/70 "Private Kinfolk answer feedback"
