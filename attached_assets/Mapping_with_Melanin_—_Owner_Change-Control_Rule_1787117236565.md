# Mapping with Melanin — Owner Change-Control Rule

## Mandatory scope lock

Make changes **only** that the owner explicitly requested. A request to fix a behavior does not permit redesigning, refactoring, removing, adding, restyling, renaming, relocating, or altering adjacent features.

Before editing, create a written change manifest containing the requested outcome, exact allowed file paths, prohibited file paths, and acceptance checks. If scope is unclear, ask for clarification rather than infer an improvement.

Never alter a previously approved preview, route, animation, layout, copy, navigation, footer, API, schema, or mobile flow unless the owner explicitly names it. A request to restore means restore the exact last owner-approved Git version, not a replacement based on interpretation.

Before every deployment, review `git diff --name-only <baseline>` and stop if any changed path is outside the approved manifest. Do not expose implementation, QA, route, QR, version, deployment, or debug language in public UI.
