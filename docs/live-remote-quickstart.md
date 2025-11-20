# Live Remote Publishing Guide

Keep screens current by publishing menus directly from cloud storage. This guide covers the full setup, verification, and recovery workflow.

## Prerequisites
- Access to your storage bucket (S3, Azure Blob, or GCS) and permission to generate pre-signed PUT URLs.
- A valid `menu.json` exported from the Editor.
- Player devices running v1.4.0 or later with connectivity to the bucket region.

## Generate a pre-signed upload URL
1. From your storage console or CLI, create a **pre-signed PUT URL** for `menu.json` that expires in at least 24 hours.
2. Copy the full URL and token. If your platform separates the signature, copy both values.
3. Optional: place assets referenced by the menu (images, fonts, videos) in the same bucket for faster retrieval.

## Configure the Editor
1. Open **Editor → Live Remote**.
2. Paste the pre-signed URL and token into the fields provided.
3. Choose a refresh cadence (default: every 3 minutes) to keep the Player in sync.
4. Click **Save connection**. The Editor validates the URL and stores it locally.

## Publish and verify
1. Click **Save & Publish** to push the current `menu.json` to the bucket.
2. Watch the status banner for a green **Uploaded** confirmation with the timestamp and file size.
3. On a Player device, open the Diagnostics overlay (Ctrl/Cmd+Shift+D) and confirm the **Remote source** matches your bucket URL.
4. Wait for the next refresh cycle or tap **Reload now** in Diagnostics to force a pull.

## Monitoring and rollback
- Enable bucket versioning so you can roll back to a known-good `menu.json`.
- Keep a local copy of the last published menu in `/export-kits/<date>/` for offline recovery.
- If a publish fails, the Player continues running the last successful menu until a fresh copy downloads.

## Automation tips
- CI/CD: run `npm run export:menu` to generate `menu.json` and upload it via your cloud CLI.
- Webhooks: send a Slack or Teams notification when uploads succeed to alert on stale screens.
- Staging: use a separate bucket for test devices and switch URLs in the Diagnostics overlay when validating changes.

## Troubleshooting appendix
- **403 Forbidden**: The pre-signed URL expired or the token was pasted incorrectly. Regenerate with a longer TTL.
- **413 Payload Too Large**: Compress background images; target <1.5 MB per asset.
- **Players not updating**: Verify device time is accurate and that refresh cadence is not paused. Check Diagnostics → Logs for `sync failed` messages.
- **Mixed content warnings**: Ensure the bucket is served over HTTPS and assets reference `https://` paths.
