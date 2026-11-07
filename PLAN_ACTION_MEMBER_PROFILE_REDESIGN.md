# PLAN_ACTION_MEMBER_PROFILE_REDESIGN – Provider-backed member profile (OpenAlex first)

**Date:** 2026-11-07 · **Version:** 6 · **Status:** Phase 0 DONE (§9.1), Phase 1 DONE (config), Phase 2 DONE in code (publication enrichment); backfill still to be run per environment. Phases 3–4 pending.
**Scope:** `core/` (Symfony 7.1 · API Platform 3 · PostgreSQL 16) and `group/` (React 18 · TS · Tailwind). `infra/` is not touched.
**Branches:** `feature/profile-improvement` in `core`, `group` and `docs` (already created).
**Reference mockup:** [`mockups/member-profile-openalex.html`](mockups/member-profile-openalex.html) (fictitious data)
**Related:** `PLAN_ACTION_SEXENIOS.md`, `core/docs/PLAN_OPENALEX_CITATIONS_20261013.md`, `core/docs/OPENALEX_CITATIONS.md`

**Two workstreams, one release train**

* **WS-A – Publication enrichment.** Extend the OpenAlex publication sync and the DOI import with type, abstract, institutions, topics and keywords; one-off backfill command; show it in the publication detail.
* **WS-B – Author metrics.** Provider-agnostic, append-only history of author-level metrics (OpenAlex first), shown in the member profile.
* **Shared: group configuration** (connection test, display provider).

---

## 0. Decisions

| # | Decision |
|---|----------|
| D1 | Page `/teams/:slug` keeps the app shell and `CardBox` look (no OpenAlex branding). Only the structure is borrowed. |
| D2 | Two columns. **Left:** Personal data → Most relevant publications → Sexenios. **Right:** Summary (provider metrics + per-year chart) → Research lines (topics) → Collaborating institutions. **No work-type card for now.** |
| D3 | Author-level figures (works, citations, h-index, i10) are **downloaded and stored**, not computed. |
| D4 | Citations are labelled by source and scope: *"Citations 1,128 · from 54 works registered in OpenAlex"*. If that count differs from the publications in Science Manager, both are shown. |
| D5 | **`publications.type` is a structural, required field** (no provider prefix), with our own vocabulary (§4.3). It is filled first from **Crossref** (already called at DOI import, no extra request) and may be refined by OpenAlex when enrichment runs; manual values are never overwritten. Every publication created from now on must have it; existing ones are filled by the backfill. Not shown in any profile card for now. |
| D6 | Topics, keywords and primary topic come only from OpenAlex (Crossref has none). |
| D7 | **Provider-agnostic storage** for author metrics: OpenAlex is the first provider; Scopus/WoS can fill the same table later. |
| D8 | Tab bar already removed in `group/` (commit `4222178`): sections live in the kebab, breadcrumb in the global `Header`. |
| D9 | Projects, events, quartile/JIF, personal data and sexenios stay Science Manager data. |
| D10 | **ORCID is the only matching key.** A member without ORCID is not synced and nothing is stored for them. No manual OpenAlex ID entry, no name search. |
| D11 | **Only group managers launch syncs** (role manager within the group). Members cannot sync themselves. **Any group member can view** the results. |
| D12 | **History is kept.** Every sync appends a snapshot. The profile shows the **latest valid (`ok`) snapshot**. |
| D13 | **Display provider is a group setting**, used both for the member profile and for publication citations. One provider shown per group. |
| D14 | Group configuration (§3): API key → connection test. Sync buttons (publications, author metrics) are only usable after a successful test; no per-feature toggles. |
| D15 | "Most relevant publications" = Science Manager publications ordered by citations (top 3, with quartile/JIF). "View all" → `/{group-slug}/teams/{member}/publications`, rendered like the summary card. |
| D17 | **Institutions are a provider-agnostic master table** with external IDs per provider. Authors link to institutions as *current* and *collaborated*; publications link to institutions through a relational table. No institution data is stored as provider JSON. |
| D18 | Publication fields stay decoupled from OpenAlex: `type`, `abstract`, `publication_institutions` are plain structural data. Only topics/keywords/primary topic stay provider-specific, in `publication_citation_metrics` (already has a `source` column). |
| D19 | **Citation-evolution chart** (from the snapshot history) opens on click from the summary card; it is not shown by default. |
| D16 | Sexenios card keeps today's visual design but shows only the counters already on `Profile` (research, transfer). No "View chronology" link; the progress-bar area shows **"Próximamente"**. |

---

## 1. Target layout

```
┌ header: avatar · name · kebab (sections menu) ─────────────────────────┐
┌ LEFT (1.5fr) ─────────────────────────┐ ┌ RIGHT (1fr) ────────────────┐
│ Personal data (+ provider link)       │ │ Summary (source: provider): │
│ Most relevant publications            │ │  citations · works · h · i10│
│ Sexenios (counters + "Próximamente")  │ │  + SM projects / events     │
│                                       │ │  per-year chart             │
│                                       │ │ Research lines (topics)     │
│                                       │ │ Collaborating institutions  │
└───────────────────────────────────────┘ └─────────────────────────────┘
```
Columns end at equal height; under 1100 px they stack.

---

## 2. Data map

| Box / field | Source | How | Stored in |
|---|---|---|---|
| Provider author ID | OA | `GET /authors/orcid:{orcid}` → `id` | `author_metrics_snapshots.external_author_id` |
| Works, citations, h-index, i10 | OA | author `works_count`, `cited_by_count`, `summary_stats` | snapshot core columns |
| Per-year works + citations | OA | author `counts_by_year` (recent years only, ~2012+) | snapshot `counts_by_year` |
| Current institution (affiliation now) | OA / WoS | author `affiliations` / `last_known_institutions` (OpenAlex "Institution") | `institutions` + snapshot link `relation = current` |
| Collaborated institutions | OA / WoS | works `group_by=authorships.institutions.id` (OpenAlex "Observed institutions") | `institutions` + snapshot link `relation = collaborated`, with works count |
| Institution metadata | OA / WoS | name, alternative names, provider ID, ROR, country, type, homepage | `institutions` + `institution_external_ids` |
| Research lines (author topics) | OA | author `topics[]` | snapshot `payload` (provider format) |
| Publication type | Crossref (baseline), OA (refine) or manual | Crossref `type` mapped to our vocabulary; OpenAlex works `type` | `publications.type` (+ `type_source`) |
| Publication abstract | Crossref (when deposited), OA fallback, or manual | Crossref `abstract` (JATS, tags stripped); else OpenAlex `abstract_inverted_index` rebuilt | `publications.abstract` |
| Publication institutions | OA | works `authorships[].institutions[]`, deduplicated | `publication_institutions` (relational) |
| Publication topics / primary topic / keywords + scores | OA | works `topics`, `primary_topic`, `keywords` | `publication_citation_metrics` |
| Per-publication citations, percentile, by year | OA | existing | `publication_citation_metrics` (exists) |
| Name, email, category, ORCID | SM | `User`, `EmploymentRecord`, `Profile.orcid` | none |
| Publications count in SM, projects, events | SM | existing aggregates | none |
| Quartile + JIF | SM | `JournalCitationResolver` | none |
| Sexenios (counters) | SM | `Profile` | none |

Crossref check (verified in the repo): `CrossRefApiClient` / `CrossRefEnrichmentService` / `DoiImportService` map volume, issue, pages, year, publisher, ISSN/eISSN and container title; **they do not read `type` or `abstract` today** although the same response carries them (to confirm in the Phase 0 spike, especially how often `abstract` is deposited). Crossref has no topics. `Publication` has no type, abstract or keyword fields today.

OpenAlex documentation (help.openalex.org/data/work-types): the 25-value `type` vocabulary "derives from Crossref's work types, extended with OpenAlex additions", then OpenAlex applies its own deterministic rules (e.g. `preprint` = article whose primary location is a preprint repository; titles like "Index" → `paratext`). No Crossref→OpenAlex mapping table is published. Consequence: Crossref's `journal-article` is coarser than OpenAlex's `article`/`review`/`letter`/`editorial`, so a Crossref baseline can label a review as `article`; that is why OpenAlex may refine it (Q-N).

---

## 3. Group configuration (shared)

Stored in `group_configs` via `GroupConfigService`, same rules as today (secrets never in messages or logs, cross-group guard through `GroupAccessResolver`).

| Key | Meaning |
|---|---|
| `openalex_api_key` | **exists** |
| `openalex_connection_verified_at` | **new**; set by a successful **connection test**, cleared when the key changes. **Existing groups that already have a key are backfilled as verified by the migration**, so nothing changes for them |
| `metrics_display_provider` | **new**; which provider the profile and the publication citations display. Only `openalex` exists today, so a one-option selector |

**Decision (2026-11-07): no per-feature toggles.** The connection test is the only gate: the publication-citations button and the author-metrics button are available only while the connection is verified. Flow in *Third-party connections*: key → connection test → buttons. Groups that already sync today lose nothing: their key counts as verified. `metrics_display_provider` is a separate card (outside the OpenAlex card).

New endpoints: `POST /api/admin/openalex/test/{slug}`. Settings allowlist updated in `GroupSettingsController`.

---

## 4. Data model (`core/`)

### 4.1 WS-B – `author_metrics_snapshots` (append-only history)
One row per sync attempt of one (`Profile`, `provider`). Nothing is overwritten.

| Column | Type | Note |
|---|---|---|
| `id` | uuid | |
| `profile_id` | uuid FK | |
| `provider` | varchar(24) | PHP backed enum value (`openalex` now; `scopus`, `wos` later); no DB enum, no migration per provider |
| `external_author_id` | varchar(64) NULL | provider's own ID (OpenAlex `A…`, Scopus Author ID, WoS ResearcherID) |
| `works_count`, `citations_count`, `h_index` | int NULL | common core |
| `i10_index` | int NULL | NULL for providers without it; UI hides it |
| `counts_by_year` | jsonb NULL | normalised `[{year, works, citations}]` |
| `payload` | jsonb NULL | provider-specific rest (OpenAlex author topics). Interpreted only by that provider's adapter |
| `payload_version` | smallint | |
| `synced_at` | timestamptz | |
| `sync_status` | varchar(16) | `ok` / `not_found` / `failed` |
| `sync_error` | varchar(64) NULL | short code, never a URL or key |

* Index `(profile_id, provider, sync_status, synced_at DESC)`. **Display rule:** latest row with `sync_status = ok` for the group's `metrics_display_provider`. Failed attempts are kept (audit) but never shown.
* Institutions are **not** in the snapshot row: they live in `author_metrics_snapshot_institutions` (§4.4), so each snapshot keeps its own current/collaborated list.
* Members without ORCID produce **no row**; the group-wide run reports them as `skipped_no_orcid`.
* The history is what allows a citations-over-time view. The evolution chart (D19) reads the `ok` snapshots of the display provider.

### 4.2 WS-B – provider abstraction
```php
interface AuthorMetricsProvider
{
    public function key(): string;                                    // 'openalex'
    public function isEnabled(Group $group): bool;                    // key + verified
    public function fetch(Profile $profile, Group $group): AuthorMetricsResult;
}
```
Tagged services + a small registry. One implementation today on purpose (Scopus/WoS requirement); `OpenAlexAuthorMetricsProvider` wraps the extended `OpenAlexApiClient`. Shared code touches only the interface and the table.

### 4.3 WS-A – publication enrichment
* `publications.type` varchar(32) and `publications.type_source` (`manual` \| `crossref` \| `openalex`). Backed enum `PublicationType` = our vocabulary, **the 25 OpenAlex values** (`article, book, book-chapter, book-review, conference-abstract, conference-paper, data-paper, dataset, dissertation, editorial, erratum, letter, other, paratext, peer-review, preprint, reference-entry, report, retraction, review, software, software-paper, standard, study-registration, supplementary-materials`; some are still rolling out in OpenAlex). Unknown values map to `other`.
  * **Crossref mapping** (small constant table, unit-tested; finalised in the spike): `journal-article→article`, `book-chapter→book-chapter`, `proceedings-article→conference-paper`, `posted-content→preprint`, `dataset→dataset`, `dissertation→dissertation`, `report→report`, `book`/`monograph`/`edited-book→book`, `peer-review→peer-review`, anything else → `other`.
  * **Precedence** (Q-N default): Crossref sets the baseline at DOI import and in the backfill; OpenAlex enrichment may replace a value whose `type_source` is `crossref` (or NULL) but never a `manual` one.
  * Column stays NULL-able until the backfill reports zero gaps; validation rejects create/update without it; a later migration makes it NOT NULL.
* `publications.abstract` text NULL. Filled from Crossref when deposited (JATS tags stripped), else from OpenAlex; never overwrites a manual value (same fill-if-empty rule).
* `publication_institutions` (publication_id, institution_id), unique pair. These are the **institutions associated with the work**: OpenAlex has no separate work-level institutions field, so they are the deduplicated union of `authorships[].institutions[]` of that work (to be confirmed in the spike, together with `corresponding_institution_ids`). They are stored as publication institutions, not as author data, and the per-author link is not kept.
* `publication_citation_metrics` (has `source`, default `OpenAlex`): add `primary_topic` jsonb, `topics` jsonb (`[{id, name, score, subfield, field, domain}]`), `keywords` jsonb (`[{id, name, score}]`). Filled by the same request as citations, percentile and `counts_by_year`. This is the single home for topics (agreed).
* Works `select` becomes: `id,doi,cited_by_count,cited_by_percentile_year,counts_by_year,type,abstract_inverted_index,authorships,primary_topic,topics,keywords`. Same request, DOI batches of up to 100 (agreed).
* `applyOpenAlexWork()` tolerates absent fields; a miss never wipes earlier values (existing rule). Abstract rebuilt from the inverted index by a small pure function.
* **If the connection is unverified**, `type` and `abstract` still come from Crossref when available; institutions, topics and keywords are not filled (OpenAlex only) and `type` falls back to a mandatory manual selector when Crossref gives nothing usable.

### 4.4 Institutions (provider-agnostic master)

| Table | Columns |
|---|---|
| `institutions` | `id` uuid, `name`, `alternative_names` jsonb (list), `country_code`, `type` (education, company, …), `homepage_url`, `ror` varchar NULL (unique when set), `created_at`, `updated_at` |
| `institution_external_ids` | `institution_id` FK, `provider` (`openalex`, `wos`, …), `external_id`; unique `(provider, external_id)` |
| `author_metrics_snapshot_institutions` | `snapshot_id` FK, `institution_id` FK, `relation` (`current` \| `collaborated`), `works_count` int NULL; unique `(snapshot_id, institution_id, relation)` |
| `publication_institutions` | see §4.3 |

* **Upsert rule (agreed, never duplicates):** 1) match by `(provider, external_id)` → associate, do not create; 2) else match by `ror` (may come from another provider) → associate and add the new external ID; 3) else create. Names are never used to merge. `ror` is unique in the table. Metadata is refreshed from the provider on each upsert without erasing values another provider supplied.
* Shared code only knows these tables; provider adapters translate their payloads.
* Existing free-text institution fields in other entities (research stays, academic studies, …) are untouched; linking them to this master is future work.

---

## 5. Backend plan (`core/`)

| # | Task | Files (proposed) |
|---|------|------------------|
| B1 | Migrations: `author_metrics_snapshots`; `institutions`, `institution_external_ids`, `author_metrics_snapshot_institutions`, `publication_institutions`; `publications` (+`type`, +`abstract`); `publication_citation_metrics` (+3 cols); backfill `openalex_connection_verified_at` for groups that already have a key. Apply to the dev DB too | `migrations/Version…php` |
| B2 | Config: keys in §3, `GroupConfigService` getters, `GroupSettingsController` allowlist, **connection test** endpoint (extends `OpenAlexApiClient` with a minimal `ping()`), clearing `verified_at` when the key changes | `Service/GroupConfigService.php`, `Controller/` |
| B3a | Crossref: read `type` and `abstract` in `CrossRefApiClient`, map in `CrossRefEnrichmentService`/`DoiImportService`; extend the **existing** `EnrichPublicationsCrossRefCommand` (or a flag on it) to backfill `type` and `abstract` for current publications | `Service/CrossRef*.php`, `Command/EnrichPublicationsCrossRefCommand.php` |
| B3 | Extend client `SELECT` and mapping (§4.3); `fetchAuthorByOrcid()`, `fetchAuthor()`, `fetchWorksGroupBy(authorId, field)` | `Service/OpenAlex/OpenAlexApiClient.php` |
| B4 | `applyOpenAlexWork()` stores type (mapped to `PublicationType`), abstract (rebuilt), publication institutions (via the institution upsert service), primary topic, topics, keywords | `PublicationCitationMetrics.php`, `Publication.php`, `SyncOpenAlexBatchHandler.php` |
| B4b | `InstitutionUpsertService` (rules in §4.4), used by B4 and B7 | `Service/Institution/` |
| B5 | **One-off command** `app:openalex:backfill-publications [--group=slug] [--dry-run]`: for every existing publication with a DOI, fetch and store the OpenAlex-only fields (institutions, topics, keywords) and refine `type`/fill `abstract` per the precedence rule. Run **after** the Crossref backfill (B3a). Idempotent, resumable, honours the 1 req/s throttle, group key. Uses DOI batches of 100. Publications without a match keep `type` NULL and are listed in the report for manual completion | `Command/` |
| B6 | **New publications:** after the Crossref step in `DoiImportService`, if the group's `openalex_publication_sync_enabled` is on and the connection is verified, dispatch an async Messenger job to enrich that DOI. A failure or timeout never blocks saving the publication | `Service/DoiImportService.php`, `Message/` |
| B7 | Author sync: `AuthorMetricsProvider` + registry + `OpenAlexAuthorMetricsProvider`; message `SyncAuthorMetricsMessage(profileId, provider)` (no key inside); handler appends a snapshot. OpenAlex path: ORCID → author (+ current institutions) → `group_by` collaborated institutions (2 requests per member). No ORCID → skipped | `Service/AuthorMetrics/`, `Message/`, `MessageHandler/` |
| B8 | Manager-only triggers: `POST /api/admin/author-metrics/{slug}/{provider}/sync` (group) and `…/members/{userId}/sync`; `GET …/status`. 400 `provider_not_enabled`, 409 while pending. Role: manager of that group (`GroupAccessResolver`) | `Controller/` |
| B9 | `GET /api/members/{userId}/research-profile` → `{provider, metrics:{worksCount, citationsCount, hIndex, i10Index, byYear, institutions, topics, syncedAt}, system:{publications, projects, projectsAsPi, events}}`; latest `ok` snapshot of the display provider; any group member, group-scoped voter, no PII; `status` when nothing synced | provider + voter |
| B10 | Publications: order by citations (and JIF) for the top-3 query; expose `type`, `abstract`, institutions on the publication resource; **`type` required on create/update validation**, accepted values = `PublicationType` |  `Publication.php`, `PublicationRepository.php` |
| B10b | `GET /api/members/{userId}/research-profile/history?provider=` → `[{syncedAt, citationsCount, worksCount, hIndex}]` from `ok` snapshots, any group member | `Controller/` |
| B11 | OpenAPI export; `core/docs/` change summary; update `OPENALEX_CITATIONS.md`; `core/README.md` note | `core/docs/` |

---

## 6. Frontend plan (`group/`)

**File-size rule:** `views/teams/TeamMemberDetailView.tsx` is near 500 lines. F3 comes first and must lower its line count.

| # | Task | Files (proposed) |
|---|------|------------------|
| F1 | Third-party connections: connection test button + status; display-provider selector in its own card; sync buttons per feature (managers only) | `views/admin/third-party/` |
| F2 | Publication detail: type, abstract, institutions, primary topic, topics and keywords with scores (empty hidden). **Type selector (required) in the manual and DOI-import/edit forms**, since without OpenAlex it must be entered by hand | `views/publications/PublicationDetailView.tsx` + components |
| F3 | Extract `section === 'details'` into `MemberOverview.tsx` (thin switch) | `views/teams/MemberOverview.tsx` |
| F4 | `useMemberResearchProfile(userId)` hook + types; group sync mutation + per-member sync (managers) | `features/teams/` |
| F5 | Cards (< 150 lines each): `PersonalDataCard`, `ResearchSummaryCard` + `PublicationsByYearChart`, `ResearchLinesCard`, `InstitutionsCard` (current institution first, then collaborated with works count), `TopPublicationsCard` (top 3 by citations; "Ver todas las publicaciones →" navigates to `/{group-slug}/teams/{member}/publications`, same row rendering), `SexeniosCard` (D16) | `features/teams/components/` |
| F6 | Citations wording (D4) with mismatch label; **"Evolution" button opens a citations-over-time chart (click only, D19)** from the history endpoint; "View in <provider>" link; "Source: <provider> · synced <date>" | summary card |
| F7 | Empty states: no ORCID, not synced yet, `not_found`, `failed`, provider disabled. Never zeros that look like data | each card |
| F8 | Sidebar: CV entry under "Mi cuenta" (`sidebaritems.ts`); "View CV" for other members in the kebab (`useMemberCvPermissions`) | sidebar, kebab |
| F9 | i18n ES/EN, dark mode via `app.css` tokens, responsive stacking, inline-SVG chart (no new dependency) | `locales/` |

---

## 7. Execution sequence

| Phase | Content | Ships alone? |
|-------|---------|--------------|
| **0 – Spike (½ day)** | Live OpenAlex calls for 2–3 members and a few DOIs: confirm shapes of author `affiliations`/`last_known_institutions`, institution fields (alt names, ROR, homepage, type), work `type` values, `summary_stats`, `counts_by_year`, `topics`, `keywords`, `primary_topic`, `abstract_inverted_index`, `authorships`, institutions `group_by`; ORCID coverage; compare with the public profile | no |
| **1 – Config** | B1 (config part), B2, F1 | yes |
| **2 – Publication enrichment (WS-A)** | B1 (publication part), B3, B4, B6, B10, F2; then run **B5 backfill once** per group | yes |
| **3 – Author sync (WS-B)** | B1 (snapshots), B7, B8 + tests; run first manual sync per group | yes (no UI) |
| **4 – Profile UI** | B9, F3–F9 | yes |
| **5 – Sexenios** | Replaced later by `PLAN_ACTION_SEXENIOS.md`; this release ships counters + "Próximamente" | included in 4 |

**Deploy order:** `core` (migration, then **restart the messenger worker**, it is long-lived), then `group`. Run the backfill after the deploy of Phase 2. Each phase ships its `docs/docs/` update in the same commit.

---

## 8. Tests

* **PHP unit:** abstract rebuild from inverted index (empty, repeated words, gaps); `applyOpenAlexWork()` with/without new fields and never wiping; author payload mapping (missing `summary_stats`, no institutions); display rule picks the latest `ok` snapshot and ignores newer `failed` ones; ORCID-less member → skipped, no row; client never leaks the key.
* **PHP functional:** config endpoints (cross-group denied, sync refused while unverified); sync endpoints manager-only (member → 403), 400/409 paths; research-profile readable by any group member, other group → 403/404, no PII; backfill `--dry-run` writes nothing and a second run is a no-op.
* **Frontend (Vitest/RTL):** sync buttons appear only after the connection is verified; each card loading/empty/populated; mismatch label; sync buttons visible to managers only; sexenios shows counters + "Próximamente".
* **E2E (Playwright):** alignment ≥ 1100 px, stacking below, dark mode, "View all" navigation, publication detail with new fields.
* Backend through `docker compose -f core/compose.yml exec api`; AGENTS.md step 4.

---

## 9. Open questions and Phase 0 checks

**No product questions remain.** Last answers folded in: OpenAlex may refine a Crossref-derived `type` (manual values never overwritten); abstract = Crossref first, OpenAlex fallback, else empty/manual; several `current` institution rows allowed, UI shows the first and lists the rest in a tooltip.

Facts to verify in the Phase 0 spike (they can adjust field names or the mapping, not the design):

| # | Check |
|---|-------|
| S1 | Crossref responses for our DOIs carry `type`; how often `abstract` is present. Finalise the Crossref→`PublicationType` mapping table. |
| S2 | OpenAlex author payload: `summary_stats`, `counts_by_year`, `topics`, `affiliations` / `last_known_institutions`; institution fields (alternative names, ROR, homepage, type). |
| S3 | Work-level institutions: confirm the deduplicated union of `authorships[].institutions[]` (and whether `corresponding_institution_ids` matters). |
| S4 | `group_by=authorships.institutions.id` output shape and page size for collaborated institutions. |
| S5 | ORCID coverage among current members; compare figures with the public OpenAlex profile. |

### 9.1 Phase 0 results (2026-11-07, live public APIs, no key)

| # | Result | Impact |
|---|--------|--------|
| S1 | Crossref `type` always present (`journal-article`, `proceedings-article`, `posted-content` seen). `abstract` present in **12/26 (~46%)** sampled DOIs; Elsevier/Nature DOIs had none. | Mapping table in §4.3 holds. OpenAlex abstract fallback is genuinely needed. |
| S2 | Author: `summary_stats{h_index,i10_index,2yr_mean_citedness}`, `works_count`, `cited_by_count`, `affiliations[{institution{id,ror,display_name,country_code,type,lineage},years}]`, `last_known_institutions[]`. `counts_by_year` items are `{year, works_count, oa_works_count, cited_by_count}`. Author `topics[]` carry **`count`** (works), not `score`; with `subfield/field/domain`. Institution objects inside author/work payloads have **no** `homepage_url` or alternative names; the full record (`GET /institutions/{id}`) has `display_name_alternatives`, `display_name_acronyms`, `homepage_url`, `ror`, `country_code`, `type`. | Snapshot `payload` topics use `count`. Institution upsert stores minimal data from embedded objects (name, ROR, country, type); homepage/alt names only via an optional detail fetch for **newly created** institutions. |
| S3 | Work `authorships[].institutions[]` has `id, display_name, ror, country_code, type, lineage`; the same institution repeats across authors (4 dupes in one work) → dedupe by `id` confirmed. `corresponding_institution_ids` is **absent** on works → ignore. Work `type` observed: `review`, `conference-paper` (Crossref says `journal-article` for the Nature DOI → OpenAlex refinement is useful, confirms Q-N). | §4.3 unchanged. |
| S4 | `group_by=authorships.institutions.id` returns **all groups in one page** (default `per_page` 200; 36 groups for the sample author), each `{key, key_display_name, count}` only (**no ROR/country/type**). It includes the author's own affiliations. | Collaborated list needs ROR/country: batch-fetch unknown institutions (`/institutions?filter=openalex:I1|I2…`, up to 100) after the group_by. Cap kept list (e.g. top 50 by works). Exclude `current` institutions from `collaborated` in the UI. |
| S5 | **Not verifiable in dev**: dev DB ORCIDs (10/11 profiles) and DOIs (`10.xxxx/demo.*`) are synthetic. Real ORCID coverage must be measured with a read-only query/dry-run on production. | Run as a `--dry-run` of the sync command in Phase 3 against prod. |

**New facts that affect the plan**
* Unauthenticated OpenAlex calls share a **$0.10/day per-IP budget**; keys get **$1/day** and calls are cost-based (`meta.cost_usd`, ~$0.0001 for a group_by). The B5 backfill and the 2–3 request/member sync must log `cost_usd` and stay under the group's daily budget (resumable, already planned).
* `api_key` in query string stays as today (client already hardens against leaking it).

---

## 10. Documentation (blocking, AGENTS.md steps 5–6)

* `docs/docs/02-core-features/10-member-profile.md` (layout, source of every figure, citations wording, why counts differ, sync is manager-only and ORCID-based), `06-team.md`, `11-member-cv.md`, `02-publications.md` (type, abstract, institutions, topics, keywords), and the third-party connections admin page under `04-administration/`.
* `core/docs/OPENALEX_CITATIONS.md`, change summary, `core/README.md`, OpenAPI impact.
* Serena memory (decisions D3, D7, D10–D14) and `codebase-memory-mcp` graph update at each phase close.
* Docs ship in the same commit/release as the code of each phase.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Wrong OpenAlex author for an ORCID, or ORCID missing | ORCID-only by design (D10); members without it are explicitly listed as skipped; "View in OpenAlex" link lets managers verify |
| Existing groups lose their publication sync when gating is introduced | Migration backfills `openalex_connection_verified_at` for groups with a key; covered by a test |
| `type` required but OpenAlex is off or has no match | Mandatory selector in forms; backfill report lists gaps; NOT NULL only after zero gaps |
| Institution duplicates | Merge only by provider ID or ROR, never by name |
| Backfill load and quota | Batches, 1 req/s throttle, resumable, `--dry-run`; run once per group off-hours |
| `authorships` makes the works payload large | Only deduplicated institutions are stored, never the raw payload |
| Abstracts missing or partially licensed | Show only when present, label the source; never block saving |
| OpenAlex numbers differ from Scopus/WoS and from our counts | Source label and both counts (D4) |
| `counts_by_year` only covers recent years | Axis starts at first returned year; footnote |
| API key leakage | Re-read per run; never in messages, logs, exception text or the test endpoint response |
| `TeamMemberDetailView` size | F3 first; a PR that raises its line count is rejected |
