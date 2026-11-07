# PLAN_ACTION_MEMBER_PROFILE_REDESIGN – OpenAlex-style member profile

**Date:** 2026-11-07 · **Status:** PROPOSAL (no code or migrations written yet)
**Scope:** `core/` (Symfony 7.1 · API Platform 3 · PostgreSQL 16) and `group/` (React 18 · TS · Tailwind)
**Reference mockup:** [`docs/mockups/member-profile-openalex.html`](mockups/member-profile-openalex.html) (fictitious data; open it side by side with this plan)
**Related plans:** `PLAN_ACTION_SEXENIOS.md`, `core/docs/PLAN_OPENALEX_CITATIONS_20261013.md`, `core/docs/PLAN_MEMBER_CV_GENERATOR_20261012.md`

---

## 0. Decisions taken and open questions

| # | Decision (taken in the mockup review) |
|---|----------|
| D1 | Profile page `/teams/:slug` keeps the app shell, breadcrumb, `DetailTabNav` and `CardBox` look (no OpenAlex branding). Only the **structure** is borrowed. |
| D2 | Two independent columns. **Left:** Personal data → Most relevant publications → Sexenios. **Right:** Summary (metrics + publications per year) → Research lines → Frequent collaborators. |
| D3 | **Publications** leave the top tab bar; they become the "Most relevant publications" section (sorted by citations, shows quartile + JIF). The full list stays reachable at `teams/:slug/publications` ("View all" link). |
| D4 | **CV** leaves the tab bar and moves to the sidebar, group **MI CUENTA**, right after "Perfil de Usuario". |
| D5 | Sexenios widget is a regular compact card, not a coloured banner; research and transfer counters on one line. |
| D6 | Research lines show **only the article count**, no bar. |

| # | Open question (needs the product owner before the phase that depends on it) |
|---|----------|
| Q1 | **CV link target.** Sidebar entry opens the *logged-in user's* CV (`/teams/{mySlug}/cv`). How does someone open **another** member's CV? Proposal: "View CV" entry in that member's kebab menu, gated by the existing `useMemberCvPermissions`. |
| Q2 | **Bibliometric source of truth.** Proposal (§2): h-index, i10 and citation totals are **computed from the member's publications in Science Manager**, not copied from the OpenAlex author profile. Reason: consistent with the list shown below them. Accept? |
| Q3 | **Research lines** = OpenAlex *topics* aggregated from the member's own works (§3). They are not editable. Should a member be able to hide/rename a line? (Not planned.) |
| Q4 | Sexenios widget depends on `PLAN_ACTION_SEXENIOS.md` (entity not implemented yet). Ship the profile first with the interim counters from `Profile` (§2, row "Sexenios")? |

---

## 1. Target layout (what each box is)

```
┌ header: avatar · name · breadcrumb · kebab ───────────────────────────┐
┌ DetailTabNav: Details · Academic profile · Projects · Events · Stays · Patents · Book chapters · Links ┐
┌ LEFT (1.5fr) ────────────────────────┐ ┌ RIGHT (1fr) ───────────────┐
│ Personal data                        │ │ Summary: 6 metrics +       │
│ Most relevant publications           │ │          publications/year │
│ Sexenios                             │ │ Research lines             │
│                                      │ │ Frequent collaborators     │
└──────────────────────────────────────┘ └────────────────────────────┘
```
Both columns end at the same height (last card of each column grows). Under 1100 px they stack.

---

## 2. Data map: what we already have vs what comes from OpenAlex

Legend: **SM** = already in Science Manager · **OA** = needs OpenAlex · **Derived** = computed from SM data · **New** = needs new code/data.

Verified in the repo (not assumed): `Publication`, `PublicationCitationMetrics`, `JournalCitationYearly`, `Profile`, `Author`/`PublicationAuthor`, `OpenAlexApiClient`, `SyncOpenAlexBatchHandler`, `OpenAlexSyncController`, `GroupConfigService::getOpenAlexApiKey`.

| Box / field in the mockup | Source | Where it lives today | Gap |
|---|---|---|---|
| Name, email, category | **SM** | `User`, `EmploymentRecord` → `EmploymentCategory` | none |
| ORCID, ResearcherID | **SM** | `Profile.orcid`, `Profile.researcherId` | none |
| DNI, birth date | **SM** (reviewer-only) | `User` PII, already withheld by API | stays **out** of the new card |
| "View in OpenAlex" link | **OA id** | — | **New**: `Profile.openalexAuthorId` (nullable) |
| Publications count | **Derived** | `PublicationAuthor` → `Author.user` | new aggregate query |
| Citations (total) | **Derived** from **OA** | `PublicationCitationMetrics.citationsCount` (filled per DOI by the existing sync) | aggregate only |
| h-index, i10-index | **Derived** | citations per publication (same field) | pure function, no import |
| Publications per year | **Derived** | `Publication.year` | aggregate |
| Projects count / as PI | **SM** | `ResearchProjectTeamMember` (+ `MemberProjectsPanel`) | aggregate |
| Event contributions | **SM** | `DisseminationContribution` | aggregate |
| Publication quartile + JIF | **SM** | `JournalCitationYearly.jifQuartile / jif` (by year), `Publication.impactFactorValue` | resolve via `JournalCitationResolver` |
| Publication citations (per item) | **OA** | `PublicationCitationMetrics` | none |
| Open Access badge | **SM** (+ OA optional) | `Publication.openAccessUrl` | OA `open_access.is_oa` is a later refinement |
| **Research lines** (+ article counts) | **OA** | **not imported today** | **New**: add `topics`/`primary_topic` to the works `select`, store, aggregate (§3) |
| Frequent collaborators | **Derived** (SM) | `PublicationAuthor` co-authors, linked via `Author.user` when internal | new aggregate; external co-authors shown as plain names |
| Sexenios (counts) | **SM** | `Profile.researchPeriods / transferPeriods` (counters today) | none for interim |
| Sexenios (next period, %, last evaluated) | **New** | `Sexenio` entity **not implemented** (`PLAN_ACTION_SEXENIOS.md`) | depends on Q4 |

**Net result:** only **one** new OpenAlex field set is needed (topics per work) plus an optional author id. Everything else is either already stored or computable.

---

## 3. OpenAlex integration

### 3.1 What exists (reuse, do not rebuild)
* `OpenAlexApiClient::fetchWorksByDois()` – `GET /works?filter=doi:a|b|…`, ≤100 DOIs, `select=id,doi,cited_by_count,cited_by_percentile_year,counts_by_year`, group API key, 30 s timeout, 429/5xx retry mapping, key never logged.
* `SyncOpenAlexBatchHandler` – Messenger batch, 1 req/s throttle, upserts `PublicationCitationMetrics` via `applyOpenAlexWork()`; misses never wipe previous data.
* `OpenAlexSyncController` – `POST /api/admin/openalex/sync/{slug}`, `GET /status/{slug}`; `OpenAlexSyncPlanner` decides what is syncable.

### 3.2 What we add (Phase 1)
1. **Extend the works `select`** with `primary_topic,topics` (same request, no extra calls). Add the fields to `PublicationCitationMetrics`: `topics` (jsonb: `[{id, name, score}]`, top 3 by score) and keep `applyOpenAlexWork()` tolerant when absent.
2. **Research lines aggregate:** per member, group their publications' topics by topic id, count distinct publications, order desc, return top N (default 8). Computed in SQL/DQL, no new table.
3. **Optional author link** (Phase 3, nice-to-have): `GET /authors/orcid:{orcid}` once per member with an ORCID → store `Profile.openalexAuthorId`. Used only for the "View in OpenAlex" link and disambiguation. We do **not** copy OpenAlex's `works_count/h_index` (Q2).
4. **Verify with a spike before coding Phase 1:** call the live API for one member's DOIs and confirm the field names above (`topics[].display_name`, `score`) and the real hit rate. Publications without a DOI or not indexed simply have no lines.

### 3.3 Operational rules
* Reuse the group-level API key and throttle; no new credentials, no new per-request key leaks (same masking rules as the existing client).
* A sync run must be re-runnable and idempotent; failures go to the existing failure transport.
* **Coverage disclaimer in UI:** metrics are "from the publications registered in Science Manager" (tooltip), because OpenAlex's global profile will differ (the reference profile shows 54 works / h-index 18).

---

## 4. Backend plan (`core/`)

| # | Task | Files (proposed) |
|---|------|------------------|
| B1 | Migration: `publication_citation_metrics.topics` jsonb NULL; `profiles.openalex_author_id` varchar(32) NULL | `migrations/Version…php` |
| B2 | Entity changes + `applyOpenAlexWork()` stores topics | `PublicationCitationMetrics.php`, `Profile.php` |
| B3 | Extend `SELECT` in the client; unit test with a fixture payload | `OpenAlexApiClient.php` |
| B4 | **Service** `MemberResearchSummaryService`: counts, citations, h-index, i10, per-year series, research lines, collaborators. h-index/i10 as small pure static functions (easy to test) | `Service/MemberResearchSummary/…` |
| B5 | **Endpoint** `GET /api/members/{userId}/research-summary` → `{publications, citations, hIndex, i10, projects, projectsAsPi, events, byYear[], lines[], collaborators[]}`. Group-scoped voter (same rule as team detail); no PII. Short cache, invalidated at the end of an OpenAlex batch | `Controller/` or API Platform state provider, `Security/Voter/` |
| B6 | **Endpoint** top publications: reuse `/publications` with `?authors.user=` , `order[citations]=desc`, `itemsPerPage=3`. Needs a sortable **citations** and **JIF** order filter on `Publication` (join `PublicationCitationMetrics`/journal year). Check what `PublicationRepository` already exposes first | `Publication.php` filters, `PublicationRepository.php` |
| B7 | Sexenios: nothing here; follows `PLAN_ACTION_SEXENIOS.md`. Interim = counters from `Profile` | — |
| B8 | OpenAPI export updated; `core/docs/` change summary | `core/docs/` |

**Performance:** one aggregate query per block, indexed by `author.user_id` / `publication.year`. Expected ≤ a few hundred publications per member; no pagination needed on the summary. Add an index only if the query plan shows it.

---

## 5. Frontend plan (`group/`)

**File-size constraint:** `views/teams/TeamMemberDetailView.tsx` is 494 / 500 lines. **Add nothing to it.** First extract, then compose (rule 7).

| # | Task | Files (proposed) |
|---|------|------------------|
| F1 | **Extract** the "details" block (the `section === 'details'` JSX) and the CV/section switch out of `TeamMemberDetailView` into `MemberOverview.tsx`; the view becomes a thin router of sections. Net line count must go **down** | `views/teams/MemberOverview.tsx` |
| F2 | `useMemberResearchSummary(userId)` hook + types | `features/teams/hooks/`, `features/teams/types.ts` |
| F3 | Cards (each < 150 lines, `CardBox`, DM Sans, tokens from `app.css`): `PersonalDataCard` (move existing `InfoRow` grid), `ResearchSummaryCard` (metrics + `PublicationsByYearChart`), `ResearchLinesCard`, `CollaboratorsCard`, `TopPublicationsCard` (reuses publication row/`PublicationsBrowser` pieces; "View all" → `teams/:slug/publications`), `SexeniosCard` | `features/teams/components/` |
| F4 | Tab bar: remove Publications and CV (`teamMemberTabs.ts`, 90 lines). Routes `teams/:slug/publications` and `teams/:slug/cv` **stay** (deep links, bookmarks, "View all") | `teamMemberTabs.ts`, `Router.tsx` unchanged |
| F5 | Sidebar: add **CV** to heading `sidebar.account` right after the profile entry → `/teams/{mySlug}/cv`. Needs the own slug in `authStore` (check; if missing, resolve via the existing `UserProfileRedirect` pattern) | `layouts/full/vertical/sidebar/sidebaritems.ts`, `locales/{es,en}.json` |
| F6 | Kebab on another member's page: "View CV" gated by `useMemberCvPermissions` (Q1) | `TeamMemberDetailView` kebab items (move list to a helper to stay under 500 lines) |
| F7 | Chart: tiny inline-SVG/CSS bars (no new dependency); tooltip `year: n` | `PublicationsByYearChart.tsx` |
| F8 | i18n ES/EN for every new string; dark mode via existing tokens; responsive stacking < 1100 px | `locales/` |
| F9 | Empty states: member without publications / without DOI / without OpenAlex data → card shows a short hint, never zeros that look like data | each card |

---

## 6. Execution sequence

| Phase | Content | Ships alone? |
|-------|---------|--------------|
| **0 – Spike (½ day)** | Live OpenAlex call for 1–2 members: confirm `topics` shape, DOI coverage %, h-index sanity vs the reference profile | no code merged |
| **1 – Profile without OpenAlex changes** | B4, B5, B6, F1–F5, F7–F9. Everything derivable today: summary, h/i10, per-year, top publications, collaborators, projects/events, CV in sidebar. Research lines card hidden behind "no data" until Phase 2 | **yes** |
| **2 – Research lines** | B1–B3 + lines in B4/B5, F3 `ResearchLinesCard` enabled, re-run the OpenAlex sync for each group | yes |
| **3 – Sexenios card** | Depends on `PLAN_ACTION_SEXENIOS.md`; until then the card shows the `Profile` counters only (no progress bar) | yes |
| **4 – Optional** | `openalexAuthorId` + "View in OpenAlex" link; OA `is_oa` badge; "propose missing works from OpenAlex" (import candidates by ORCID through the existing DOI import) | later |

---

## 7. Tests

* **Unit (PHP):** h-index and i10 (empty, ties, all-zero, unsorted input); topic aggregation; `applyOpenAlexWork()` with and without `topics`; client `select` includes new fields.
* **Functional (API):** `research-summary` — group scoping (member of another group → 403/404), no PII in payload, empty member returns zeros and empty arrays (not errors).
* **Frontend (Vitest/RTL):** each card for loading / empty / populated; tab bar no longer lists Publications and CV; sidebar shows CV under MI CUENTA; kebab "View CV" visibility by permission.
* **E2E (Playwright, per `PLAN_DOCUMENTATION_PLAYWRIGHT.md`):** open `/teams/:slug`, columns end aligned at ≥1100 px, stacked below; dark mode screenshot; "View all" lands on the full list.
* Run per AGENTS.md step 4 (targeted tests, lint, type-check, Docker).

---

## 8. Documentation and housekeeping (blocking, AGENTS.md steps 5–6)

* `docs/docs/02-core-features/10-member-profile.md` – new layout, metric definitions (how h-index / i10 / lines are computed and what "from Science Manager publications" means), CV location. `06-team.md` and `11-member-cv.md` – CV entry point moved. `02-publications.md` – citation/topic sync note.
* `core/docs/OPENALEX_CITATIONS.md` – topics added to the sync; `core/docs/` change summary; `core/README.md` usage note; OpenAPI impact (new endpoint).
* Serena memory (decision: derived bibliometrics + OpenAlex topics only) and `codebase-memory-mcp` graph update when each phase closes.
* Docs ship in the **same commit/release** as the code of each phase.

---

## 9. Risks and assumptions

| Risk / assumption | Mitigation |
|---|---|
| Many publications lack a DOI or are not indexed in OpenAlex → low citations / few topics | Phase 0 measures coverage; UI labels the source; empty states (F9) |
| Our h-index ≠ OpenAlex/Scopus/WoS h-index; users will compare | Tooltip "computed from publications registered in Science Manager"; optional author-level figures only in Phase 4 |
| JIF/quartile are missing for recent years or journals | Fall back to latest available year via `JournalCitationResolver`; hide the tag if none (never show a fake value) |
| Topic labels are English and sometimes too generic ("Crystal structures of chemical compounds") | Show as-is in v1; translation/curation is a separate decision (Q3) |
| `TeamMemberDetailView` at 494 lines | F1 extraction is the **first** frontend task; a PR that raises its line count is rejected |
| Mockup data (4 research + 1 transfer sexenios, JIFs, collaborators) is fictitious | Not requirements; real values come from the sources in §2 |
| Sexenios timeline/percentage needs a defined "last evaluated period" | Owned by `PLAN_ACTION_SEXENIOS.md` (D2 there) |
| OpenAlex rate limits / key quota | Existing 1 req/s throttle and per-group key; topics ride on the same request (no extra calls) |
