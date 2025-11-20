# PWA Installation Guide

Install the Digital Menu Player as a Progressive Web App (PWA) for kiosk-like reliability across platforms.

## Prepare the player
1. Host or open `/player/` from this repository on an HTTPS endpoint.
2. Confirm the manifest and service worker load without errors (DevTools → Application → Manifest/Service Workers).
3. On tablets or touch devices, enable **Screen always on** to prevent sleep.

## Install per platform
### ChromeOS and desktop browsers
1. Open the Player URL in Chrome or Edge.
2. Click the install icon in the omnibox or **⋮ → Install App**.
3. Accept the prompt. A standalone window launches without browser chrome.

### Android tablets / Android TV
1. Launch Chrome on the device and open the Player URL.
2. When prompted, tap **Add to Home screen** → **Install**.
3. On Android TV, open from the home row; on tablets, drag the shortcut to the dock for kiosk mode.

### Windows mini PC
1. Open the Player URL in Edge (Chromium).
2. Select **… → Apps → Install this site as an app**.
3. Pin the installed app to the taskbar and set **Auto-start on boot** in Windows Startup Apps.

## Verify offline readiness
- After installation, toggle the device offline and relaunch the PWA. The player should open with cached assets.
- If assets fail to load, clear site data and reload once while online to refresh the cache.

## Update and cache behavior
- The service worker checks for updates on each launch. Users see the new menu after the next reload cycle.
- For time-critical pushes, open DevTools → Application → Service Worker → **Skip waiting** to immediately swap versions.

## Troubleshooting appendix
- **Install button missing**: Ensure the site is served over HTTPS and includes a valid web manifest with icons.
- **Offline launch fails**: The initial load must complete while online. Clear storage and reload once with connectivity.
- **Wrong orientation**: Lock the device to landscape and enable **Fullscreen** in the Player settings.
- **Autoplay blocked**: Allow media autoplay in browser settings or add a muted poster video instead of auto-playing audio.
