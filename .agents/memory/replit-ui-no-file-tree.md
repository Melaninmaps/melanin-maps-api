---
name: Replit UI — no file tree sidebar
description: This user does not have and has never had the file tree sidebar in their Replit workspace. Do NOT instruct them to use it.
---

This user's Replit workspace does not show the left-sidebar file tree. Telling them to "navigate the file tree" or "right-click a file" is useless and causes frustration.

**Why:** Known Replit UI variation — not all workspaces show the file tree panel.

**How to apply:** Never suggest the file tree as a delivery method for files. Use one of these instead:
- Object storage presigned URL (DEFAULT_OBJECT_STORAGE_BUCKET_ID secret is set)
- GitHub push + raw download URL
- `presentAsset` for supported formats (images, PDFs, docs, spreadsheets, audio, video — NOT ZIP)
- API server download endpoint accessible via the Replit preview pane URL

The user has expressed significant frustration over this — do not repeat the suggestion.
