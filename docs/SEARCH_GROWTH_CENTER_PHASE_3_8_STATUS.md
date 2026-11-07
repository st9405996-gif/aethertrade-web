# Search Growth Center — Phases 3–8

Status: implementation branch prepared from the merged P2 baseline. This document separates shipped code from work that still requires external authorization, credentials, or a staging environment.

## Phase 3 — Technical SEO

**Implemented in this branch**

- Central SEO configuration validation for absolute site origin, duplicate paths, unsafe indexable routes, canonical origin and overlong descriptions.
- Sitemap and llms.txt generation now share tested helpers.
- XML escaping prevents malformed sitemap output from special characters.
- Read-only SEO check command verifies configured indexable URLs against sitemap, robots.txt and llms.txt.

**Not claimed**

- No Search Console indexing or ranking improvements are claimed.
- No dynamic CMS article sitemap is published yet; current build-time sitemap contains configured static routes only.

## Phase 4 — GEO and AEO

**Implemented in this branch**

- Published insight reader extracts optional `geoSummary` and `aeoQuestions` from existing `fields` JSON without requiring the unapplied Phase 1 migration.
- Article pages display a clearly labelled key-takeaways section when an editor supplied a GEO summary.
- Article metadata includes Twitter title and description.
- FAQPage JSON-LD is emitted only when valid, authored question/answer pairs exist. Question and answer lengths and counts are bounded.
- Existing Article JSON-LD remains. Structured data is not generated from guesses or invented facts.

**Important**

- Structured data does not guarantee AI citations or rich results. Editors must provide accurate, sourced content.

## Phase 5 — Blog editor, approval and revisions

**Blocked from live enablement**

- The existing admin experience includes disconnected/demo behavior and client-side role presentation. A production editor must not trust browser role state.
- The proposed migration adds approval metadata, but has not been applied.
- Before enabling writes, verify real Supabase Auth users, server-side permission checks, RLS for every write, revision snapshots and immutable audit events in a separate staging project.
- Draft save, approval, publish and restore actions must be server functions that derive the actor from the verified session, never from request-supplied user IDs.

## Phase 6 — Trusted scheduled publisher

**Not enabled**

- No cron trigger, scheduled publisher, or automatic publication has been added.
- A safe publisher needs a server-only scheduler identity, atomic due-item claim, row-level permission recheck, idempotency, revision/audit event, retry/dead-letter behavior and a kill switch.
- Do not set content to Scheduled in production until that workflow is tested in staging. Public readers continue to expose only Published content.

## Phase 7 — Search Console and Bing integrations

**Not connected**

- Google Search Console and Bing Webmaster integrations require account authorization and secure token storage.
- OAuth client secrets and refresh tokens must remain server-side; never place them in VITE_ variables or browser storage.
- The next implementation step is an owner-authorized OAuth setup, encrypted token persistence, least-privilege scopes, disconnect/revoke support and a manual sync before any scheduled sync.
- No credentials were created, requested, or changed in this branch.

## Phase 8 — Security, tests and release QA

**Implemented in this branch**

- Added focused tests for SEO config validation, XML escaping and indexable route filtering.
- Added a read-only `npm run seo:check` command.
- No production database, content rows, secrets, DNS, admin-demo flags, inquiry-delivery settings or scheduled publishing settings are changed.

**Release gates still required**

1. Run the full test suite, lint, typecheck and production build on the PR commit.
2. Verify preview pages and server-rendered metadata in a real browser.
3. Verify ConsentManager categories and GA4 network behavior in both consent states.
4. Obtain a restorable Supabase backup and create isolated staging before applying migration 007.
5. Complete staging RLS/auth/revision/scheduler tests before enabling Phases 5–6.
6. Complete owner-authorized Google/Bing OAuth before enabling Phase 7.
7. Review legal/privacy/cookie wording before production compliance claims.

## Release boundary

This branch is a reviewable code change, not a production release. Do not merge or deploy automatically. The P5–P7 items remain explicitly gated rather than represented as live features.
