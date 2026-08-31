# Replit Preview-Service Binding Refresh — No Source Changes

## Confirmed state

The web workflow is healthy and already serves the restored preview locally:

```text
http://127.0.0.1:22333/           → 200
http://127.0.0.1:22333/preview    → 200
```

The artifact manifest is now valid and the artifact router has loaded the web and mobile routes. The external `riker.replit.dev` URL still points at the retired mockup-sandbox binding. This is a **stale Preview-service binding**, not a preview source, SPA fallback, port, workflow, or deployment failure.

## Immutable boundary

Do not edit any source file, `.replit`, artifact manifest, web workflow, mobile workflow, port configuration, preview route, API, or deployment configuration. Do not deploy. Do not create a new preview implementation.

## Replit Preview UI refresh — first attempt

Within the existing Replit workspace, without leaving Replit:

1. Open **Preview** from the tool dock.
2. In its location bar, select the current app domain.
3. Use the port selector to select the existing web workflow port **22333**. Replit documents that Preview can switch the rendered port from the domain selector.[1]
4. In the Preview address field, enter exactly:

   ```text
   /preview
   ```

5. Confirm that the embedded Preview tool renders the already-healthy local page.

This is a temporary Preview-view selection only. It must not alter source or deployment configuration.

## Platform binding refresh — required if the proxy remains stale

If the supplied `riker.replit.dev` proxy still redirects `/` to the mockup sandbox or returns 404 at `/preview`, Replit must perform this **platform-level action**:

> Retire the cached mockup-sandbox Preview binding for project `ac64a230-72f5-4194-b8b4-3ca827a772f9`; invalidate its existing `riker.replit.dev` preview route cache; and reattach the current, already-registered web artifact to the Preview service using the running web workflow on port 22333. Preserve the mobile artifact at `/mobile/`. Do not modify repository files, workflow configuration, port configuration, preview source, or deployment state.

This is not a request to change the app. It is a request to refresh the platform’s stale proxy/session binding after artifact-route recovery.

## Verification

After Replit refreshes the binding, verify only the following.

```bash
curl -i 'https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/'
curl -i 'https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/preview'
```

| Check | Required result |
|---|---|
| Root proxy | No redirect to the mockup sandbox. |
| `/preview` proxy | HTTP 200 and the restored 8/5 preview document. |
| `/mobile/` proxy | Mobile artifact route continues to resolve. |
| Local port 22333 | Continues to serve `/` and `/preview` with HTTP 200. |
| Git diff | Empty; this refresh must not create source changes. |
| Deployment | Not triggered. |

If the proxy cannot be refreshed from the Preview/Networking UI after the artifact router has loaded the valid map, this is a Replit platform-support issue. Provide the exact project ID, the stale proxy URL, the validated artifact manifest commit `e68f2caf`, the running local port `22333`, and the two local 200 responses.

## Reference

[1]: https://docs.replit.com/features/project-setup/ports "Replit — Ports and Preview"
