# Digital Menu Studio – Technical Audit

## Snapshot
- **Architecture:** Static, zero-backend web apps for editor and player, with exportable offline bundles and CDN-friendly hosting. Draws a clear separation between the design studio (`editor/`) and runtime player (`player/`).【F:README.md†L12-L77】
- **Offline/runtime behavior:** Player ships with a service worker that precaches core assets, maintains runtime/config caches, and schedules background refreshes for tracked menu URLs to keep remote configs current even when offline.【F:player/service-worker.js†L1-L191】
- **Data validation:** Shared `validator.js` enforces structural correctness of menu configuration objects (IDs, slide layout enums, tile positions, canvas settings, etc.) before use, reducing risk of corrupted exports.【F:shared/validator.js†L1-L106】

## Strengths
- Minimal dependency surface (vanilla JS, Zustand, idb-keyval) and static hosting model minimize operational risk and vendor lock-in.【F:README.md†L79-L88】
- Explicit schema-aware validation for menu payloads provides guardrails for both editor and player flows.【F:shared/validator.js†L1-L106】
- Player service worker aggressively caches core assets and menu configs, supporting air-gapped deployments and background refresh where supported.【F:player/service-worker.js†L1-L191】

## Risks & Gaps
- **No automated quality gates.** Repository lacks tests, linters, or CI workflows, so regressions or schema drift may go unnoticed until runtime.【F:package.json†L1-L11】【F:README.md†L32-L88】
- **Offline cache growth & invalidation.** Service worker tracks arbitrary config URLs and stores them indefinitely; without eviction/versioning per URL, long-lived devices could accumulate stale configs or cache poison if URLs are reused.【F:player/service-worker.js†L24-L194】
- **Security posture.** Static deployment defaults omit CSP/feature-policy headers and integrity checks; compromised CDN assets or injected third-party content could run with full origin privileges. Service worker fetches remote configs without origin allow-listing or signature verification.【F:player/service-worker.js†L75-L194】
- **Editor/Player coupling.** Schema validation ensures shape but not semantic consistency (e.g., pricing formats, allowed badge values, asset MIME enforcement), leaving room for inconsistent renders between editor previews and player runtime.【F:shared/validator.js†L1-L106】

## Recommendations
1. **Add CI + lint/test scaffolding.** Introduce a minimal automated suite (schema validation tests, JSON schema regression tests, linting) and run it in a GitHub Action to catch structural issues early.
2. **Cache hygiene & limits.** Track fetch timestamps for cached configs and enforce TTL or LRU eviction; periodically purge orphaned entries on activation to avoid unbounded growth.【F:player/service-worker.js†L24-L194】
3. **Security hardening.** Document and enforce allowed config origins (or signed config manifests), add optional checksum verification for exported bundles, and recommend CSP headers in deployment guidance to reduce XSS/service-worker hijack risk.【F:player/service-worker.js†L75-L194】
4. **Stronger schema semantics.** Extend `shared/schema.json` and `validator.js` with stricter numeric/string formats (currency, badge enums, media MIME/size limits) so editor exports align tightly with player expectations.【F:shared/validator.js†L1-L106】
5. **Operational docs.** Add runbooks for cache reset, export verification, and offline device refresh plus guidance for periodic dependency review, since the project depends on browser APIs and long-lived static assets.【F:README.md†L32-L88】【F:player/service-worker.js†L1-L194】
