# Conflict Resolution Guide

Collaborative editing safeguards your menus when two people publish at the same time. Follow this flow to keep changes intact.

## How conflicts are detected
- Each `menu.json` save stores the editor ID, timestamp, and content hash.
- When you publish, the server compares your hash against the latest remote version.
- If hashes differ, the Editor blocks the overwrite and opens the **Conflict Detected** modal.

## Resolve quickly in the Editor
1. Note who saved last and when (displayed in the modal header).
2. Click **View diffs** to open a side-by-side summary of slides, prices, and assets that changed.
3. Choose one of three actions:
   - **Reload remote**: pull the latest version, discard your local edits, and continue editing from the teammate’s copy.
   - **Save a copy**: duplicate your local state to `/export-kits/conflict-<timestamp>.json` for manual merge later.
   - **Force save**: overwrite the remote file with your version. Use only after confirming with the teammate.

## Best practices to avoid conflicts
- Publish small batches: save after each menu section instead of once at the end.
- Lock focus rooms: dedicate one screen per editor (e.g., brunch vs. dinner) to reduce overlap.
- Communicate: announce deployments in chat with the menu name and timestamp.

## Manual merge workflow
1. Export both versions from `/export-kits/`.
2. Use a JSON-aware diff tool to merge groups and slides. Preserve unique IDs to avoid tile drift on Players.
3. Re-import the merged file into the Editor and publish once.

## Troubleshooting appendix
- **Force save disabled**: You may not have publish permissions. Ask an admin to grant write access.
- **Modal loops after reload**: Clear local storage and reopen the Editor; stale hashes may persist between sessions.
- **Players show mixed slides**: Perform a hard refresh on the Player (Diagnostics → Reload now) to fetch the resolved version.
- **Repeated conflicts**: Confirm your system clock matches NTP; skewed timestamps can trigger false positives.
