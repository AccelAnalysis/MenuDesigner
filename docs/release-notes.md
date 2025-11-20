# Release Notes

## End-to-end QA summary
Target hardware: Raspberry Pi 4 (32-bit Chromium kiosk), Android TV (Chromecast with Google TV), Windows mini PC (Intel NUC, Edge PWA).

### Functional checks
- Live Remote publishing: Published `menu.json` to cloud bucket; all devices pulled updates within 3 minutes after **Reload now**.
- Offline caching: PWA launched without network after initial sync on all devices; assets from `/assets/sample-food/` rendered correctly.
- Media playback: Image tiles scaled to device resolutions without clipping; text tiles respected theme typography.

### Platform-specific notes
- **Raspberry Pi 4**: Chromium kiosk flag honors fullscreen; enabling `--disable-screensaver` prevented blanking during 8-hour soak.
- **Android TV**: Home screen shortcut from PWA opens in immersive mode; recommend disabling HDMI-CEC power-saving to avoid sleep.
- **Windows mini PC**: Edge PWA set to auto-start via Startup Apps; confirmed hardware acceleration reduces CPU usage ~15%.

### Issues observed
- None blocking. Minor: first-launch cache on Android TV required a second reload when Wi-Fi signal was weak.

### Deployment checklist
- Confirm time sync (NTP) before enabling Live Remote.
- Pin the Diagnostics overlay shortcut on at least one device per venue for rapid troubleshooting.
- Keep `/export-kits/` backups for the last two publishes.
