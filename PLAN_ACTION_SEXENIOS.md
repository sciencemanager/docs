# PLAN_ACTION_SEXENIOS – Research & Transfer "Sexenios" management

**Date:** 2026-11-07 · **Status:** PROPOSAL (no code or migrations written yet)
**Scope:** `core/` (Symfony 7.1 · API Platform 3 · PostgreSQL 16) and `group/` (React 18 · TS · Tailwind)

---

## 0. Decisions already taken (from the product owner)

| # | Decision |
|---|----------|
| D1 | Plan and code in **English** (AGENTS.md rule 1). UI strings via i18n ES/EN. |
| D2 | **Research** progress = `(today − end of last research sexenio) / 6 years`, capped at 100 %. |
| D3 | **Transfer** has a different behaviour: **no percentage**. It can simply be *activated* and the user enters the years that apply. |
| D4 | Fixtures **must not create users**. They attach sexenios to users that already exist and skip (with a warning) the ones that do not. The dataset in §6 is the canonical record of what to load. |
| D5 | Any user may create sexenios **only if** they hold (or held) a postdoctoral research contract, a permanent professorship, or a higher category (see §2.3). |
| D6 | No modals. Management lives on a dedicated route inside the academic profile. |

## 1. What already exists (discovery findings)

Verified in the repo, not assumed:

* **Roles** (`core/src/Entity/User.php`): `ROLE_USER`, `ROLE_CONTRIBUTOR`, `ROLE_REVIEWER`, `ROLE_MANAGER`, `ROLE_ADMIN`; hierarchy ADMIN → MANAGER → REVIEWER. There is no role literally named `user`/`manager` in lowercase; the brief maps to `ROLE_USER+` (owner) and `ROLE_MANAGER+` (any member).
* **Ownership + group-scoped voter pattern**: `core/src/Security/Voter/EmploymentRecordVoter.php` (VIEW/EDIT/DELETE/CREATE, group-scoped). We reuse its shape for `SexenioVoter`.
* **Eligibility source**: `EmploymentRecord` → `EmploymentCategory` with `AcademicLevel` (`PREDOCTORAL, POSTDOCTORAL, SENIOR_FACULTY, TECHNICIAN, OTHER`) and `EmploymentCategoryEnum` (`POSTDOCTORAL_RESEARCHER, FULL_PROFESSOR, ASSOCIATE_PROFESSOR, …`). Eligible = `POSTDOCTORAL` or `SENIOR_FACULTY`.
* **ORCID / Researcher ID** live on `Profile` (`orcid`, `researcherId`), edited in `group/src/components/teams/AcademicProfileFields.tsx`.
* **Academic profile route already exists**: `teams/:slug/academic-profile` (tab built in `group/src/views/teams/teamMemberTabs.ts`, rendered by `TeamMemberDetailView`) plus the user's own `profile/academic`. We **reuse these** instead of inventing `/user/{id}/academic-profile`.
* **Progress widget pattern**: `group/src/components/dashboards/group/ProjectsProgressCard.tsx` + `components/shared/TimeProgressBar.tsx` (+ `lib/timeProgress.ts`).
* **CV**: `MemberCv` entity and `TeamMemberCvView` already exist; sexenios will be added as a section of that CV, not a new CV.
* **Fixtures**: `core/src/DataFixtures/` has `UserFixtures` with only 3 named accounts (admin/manager/Antonio, `AntonioM.Rodriguez@uclm.es`) plus Faker users. **The other five researchers are not in the fixtures**, which is why D4 matters.
* **File-size constraint**: `TeamMemberDetailView.tsx` is 494 lines (cap 500). **Nothing may be added to it**; all new UI goes in new files.

## 2. Backend architecture (`core/`)

### 2.1 Data model

New enum `App\Enum\SexenioType` (string-backed): `RESEARCH`, `TRANSFER`.

New entity `App\Entity\Sexenio` → table `sexenios`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | same generator as other entities |
| `user_id` | FK `users`, NOT NULL, `ON DELETE CASCADE` | owner |
| `type` | enum `SexenioType` | |
| `start_year` | smallint NOT NULL | year, not a date |
| `end_year` | smallint NOT NULL | year, `>= start_year` |
| `call` | varchar(120) NULL | e.g. "2018 call" / pilot call; column named `call_label` in SQL to avoid reserved-word friction |
| `created_at`, `updated_at` | timestamptz | lifecycle callbacks like `EmploymentRecord` |

Indexes: `idx_sexenio_user_type (user_id, type)`.
Years are stored as integers on purpose: sexenios are evaluated per calendar year, and a date would invent false precision.

> Naming: the brief used `tipo/fecha_inicio/fecha_fin/convocatoria`. Per D1 these become `type/startYear/endYear/callLabel` in code. UI labels remain "Investigación/Transferencia" through i18n.

### 2.2 API surface (API Platform)

| Operation | Path | Security |
|-----------|------|----------|
| GetCollection | `/sexenios?user={id}&type=` | `ROLE_USER`; result filtered by voter/group scope |
| Get | `/sexenios/{id}` | `SexenioVoter::VIEW` |
| Post | `/sexenios` | `securityPostDenormalize: SexenioVoter::CREATE` |
| Patch | `/sexenios/{id}` | `SexenioVoter::EDIT` |
| Delete | `/sexenios/{id}` | `SexenioVoter::DELETE` |
| Get (computed) | `/users/{id}/sexenio-summary` | `SexenioVoter::VIEW` on the target user |

* Serialization groups `sexenio:read`, `sexenio:write`. `user` is **not writable on PATCH** and, for a non-manager, is forced server-side to the authenticated user on POST (a client-supplied `user` of someone else is rejected by the voter, not silently overwritten).
* `SexenioSummary` is a read-only DTO produced by a State Provider so the percentage is computed **once, server-side**, with an injected `ClockInterface` (testable, no frontend/backend drift):

```
SexenioSummary {
  userId, eligible: bool,
  research: { blocks: [{id,startYear,endYear,callLabel}], count,
              lastEndYear, nextStartYear, nextEndYear, progressPercent|null },
  transfer: { enabled: bool, blocks: [...], count }
}
```

* Research progress: `elapsed = now − 1 Jan (lastEndYear+1)` in fractional years; `progressPercent = min(100, round(elapsed / 6 × 100))`. With no research sexenio → `progressPercent = null` and the card shows an empty state (there is no agreed baseline; see §9-Q1).
* Transfer: `enabled = count > 0`; no percentage (D3).
* Audit: create/update/delete write to the existing `AuditLog`.

### 2.3 Permissions (`App\Security\Voter\SexenioVoter`)

| Actor | VIEW | CREATE / EDIT / DELETE |
|-------|------|------------------------|
| Owner (`ROLE_USER`+) | own | own, **only if eligible** |
| `ROLE_MANAGER` | members of own group | members of own group, any |
| `ROLE_ADMIN` | any | any |
| Others | group-scoped read as in `EmploymentRecordVoter` | no |

Eligibility rule (D5), implemented once in `SexenioEligibilityChecker` (service, repository query, not in the voter):

> the target user has at least one `EmploymentRecord` whose `EmploymentCategory.academicLevel ∈ {POSTDOCTORAL, SENIOR_FACULTY}` (any date: sexenios are historical, so someone who is now a professor was necessarily eligible earlier).

Managers bypass eligibility on write (they administer the record); the checker result is still exposed as `eligible` so the UI can explain why the owner's form is disabled.

### 2.4 Migration

One Doctrine migration `Version2026…_CreateSexenios`: table, FK, index **and** the DB-level overlap guard from §4 (raw SQL, because Doctrine cannot model exclusion constraints). `down()` drops both. No data migration.

## 3. Frontend architecture (`group/`)

### 3.1 Routes (no modals)

* `teams/:slug/academic-profile` – existing tab; gets the new top card (§3.2).
* **New** `teams/:slug/academic-profile/sexenios` – dedicated management/timeline page, reached by clicking the card. Own profile equivalent under `profile/academic/sexenios`.
* ⚠ Existing route `teams/:slug/academic-profile/:idAcademicStudy` would match `sexenios` as a study id. The new static route **must be declared before it** in `Router.tsx` (same defensive-ordering convention as the existing `edit` comment).
* Add/edit/delete happen **inline** on that page (inline row editor / side-by-side form region), never in a dialog.

### 3.2 Top card (shares row with ORCID and Researcher ID)

`SexenioSummaryCard` — styled like `ProjectsProgressCard` (`Progress` + `TimeProgressBar` look), showing:

* big count of research sexenios and, under it, "next sexenio: **NN %**" with the bar for the profile's owner and the target range (e.g. "2026–2031");
* a small transfer chip: "Transfer: N" or "Transfer: not activated";
* the whole card is a link to `…/sexenios`; keyboard-focusable.
* Empty/ineligible states: neutral text, no bar.

### 3.3 Timeline page

**Reference correction (reviewed 2026-11-07):** `https://webs.um.es/aitor.garces/sexeniosapp.html` is *not* a timeline. It is a 3-step self-evaluation form for the 2025 call ("1 Datos y CV", "2 Aportaciones", "3 Campo, evaluación y PDF"). Only its **Contributions step** is adopted (see §10). The timeline below is our own design, validated through the mock-up at <https://claude.ai/artifact/WUW3nK9tU6ntooNiNAah7H> (4 artboards: profile card, timeline, contributions, field/evaluation; Science Manager tokens: primary `#1e8688`, info `#8754ec`, border `#dfe5ef`, radius 10 px, DM Sans, `DashboardWidget`-style header). Working design:

* Two clearly separated lanes: **Research** and **Transfer**, each its own panel.
* Horizontal year axis; each evaluated sexenio is a compact block with its range ("1997–2002"); the *pending next* research block is drawn dashed with the live percentage fill.
* Transfer lane: a toggle "Activate transfer sexenios"; once active the user adds blocks by year (single-year cut-off such as "2018 call" is a block with `startYear = endYear`).
* Responsive: lanes stack on mobile; blocks wrap, no horizontal page scroll.
* i18n keys under `sexenios.*` in `locales/es.json` and `en.json`.

### 3.4 New files (all well under 500 lines)

```
group/src/types/api/sexenio.types.ts
group/src/api/sexenios.ts                      (react-query hooks)
group/src/lib/sexenioProgress.ts               (display helpers only; % comes from API)
group/src/components/sexenios/SexenioSummaryCard.tsx
group/src/components/sexenios/SexenioTimeline.tsx
group/src/components/sexenios/SexenioLane.tsx
group/src/components/sexenios/SexenioBlock.tsx
group/src/components/sexenios/SexenioInlineForm.tsx
group/src/views/sexenios/SexeniosView.tsx
```

Touched (small edits only): `routes/Router.tsx`, `components/academic/ProfileAcademicSection.tsx` (235 lines, mounts the card), locale files, and the CV view for the sexenios section.

## 4. Validation strategy – no overlapping year ranges

Rule: for the **same user and same `type`**, closed year intervals `[startYear, endYear]` must not intersect. Touching is not allowed to share a year (1997–2002 followed by 2003–2008 is valid; 2002–2007 would not be). Research and Transfer never conflict with each other. Layered defence:

1. **Field-level constraints** (`Assert` on the entity): `NotNull`, `Range(1900–currentYear+1)`, and `Expression`/`Callback` `endYear >= startYear` (violation path `endYear`).
2. **Class-level custom constraint** `#[NoOverlappingSexenio]` + `NoOverlappingSexenioValidator` (service, receives `SexenioRepository`):
   * query `findOverlapping(user, type, start, end, excludeId)` with `s.startYear <= :end AND s.endYear >= :start AND s.id != :self`;
   * excluding the entity itself makes PATCH work;
   * on conflict add the violation to `startYear` with the conflicting range in the message (`sexenio.overlap` translation key, params `{range}`), which API Platform returns as a 422 with `violations[]`.
3. **Database backstop** (migration, PostgreSQL 16):
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ALTER TABLE sexenios ADD CONSTRAINT sexenios_no_overlap
     EXCLUDE USING gist (user_id WITH =, type WITH =,
                         int4range(start_year, end_year, '[]') WITH &&);
   ```
   This closes the race between two simultaneous requests that both pass step 2. The write path catches the resulting `ExclusionViolation` and maps it to the same 422 response so the user never sees a 500.
   *Check needed:* `doctrine:schema:validate`/diff must ignore this constraint (it is not mapped); confirm in the migration test.
4. **Eligibility validation** (D5) as a separate constraint group `sexenio:create` so fixtures/manager imports can opt out without disabling overlap checks.
5. **Fixtures** are persisted through the EntityManager (Validator not invoked) but each batch is checked by the same repository method in a test, so the seed data itself is proven overlap-free.
6. **Frontend** mirrors rule 2 for instant feedback (pure function over the already-loaded blocks) but the API remains authoritative; server `violations` are mapped onto form fields.

## 5. Tests

* **Unit:** `SexenioSummary` calculator with a fixed `Clock` (no sexenios, 1 sexenio, last end in the future, cap at 100 %); overlap validator (adjacent OK, 1-year overlap rejected, containment, self-exclusion on update, other type/other user OK).
* **Integration (PHPUnit + API):** CRUD matrix per role (owner eligible / owner ineligible / manager same group / manager other group / admin); POST for another user as `ROLE_USER` → 403; overlap → 422; concurrent-style insert hitting the DB constraint → 422 not 500.
* **Fixtures test:** loading `SexeniosFixtures` twice is idempotent; absent users are skipped without error.
* **Frontend:** component tests for card states (percent, empty, ineligible), lane rendering and inline-form error mapping; route-order test that `/academic-profile/sexenios` does not resolve to the study view.
* **Manual/E2E (Playwright in `docs/`):** screenshots for the docs.

## 6. Fixtures – `core/src/DataFixtures/SexeniosFixtures.php`

Rules: `DependentFixtureInterface` on `UserFixtures` (and `EmploymentRecordFixtures`); **look users up, never create them** (D4). The repository has no emails for these people, so the lookup is by normalised `firstName + lastName(+secondLastName)`, with a single `USER_MATCH` map at the top of the file that can be edited once real emails are known. Missing user → `echo`/log a warning and continue. Idempotent: skip a block if `(user,type,startYear,endYear)` already exists.

Canonical dataset (`RES` = Research, `TRA` = Transfer; `callLabel` only where given):

| Researcher | Type | Blocks (startYear–endYear) |
|-----------|------|----------------------------|
| Ester Vázquez Fernández-Pacheco | RES (4) | 1997–2002, 2003–2008, 2009–2014, 2015–2020 |
| | TRA (1) | 2018–2018, call "2018 call" (evaluated up to 2018) |
| M.ª Antonia Herrero Chamorro ("Marian") | RES (4) | 2002–2007, 2008–2013, 2014–2019, 2020–2025 |
| | TRA (1) | 2018–2018, call "2018 call" (evaluated up to 2018) |
| Sonia Merino Guijarro | RES (5) | 1993–1998, 1999–2004, 2005–2010, 2011–2016, 2017–2022 |
| Cristina Martín Jiménez ("Cris") | RES (1) | 2013–2018 |
| Daniel Iglesias Asperilla | RES (2) | 2013–2018, 2019–2024 |
| Antonio Manuel Rodríguez García | RES (2) | 2010–2015, 2016–2021 |

Totals: 18 research + 2 transfer = **20 rows**. All sets were checked to be non-overlapping per researcher and type.

Open data caveat: for the two transfer rows, "evaluated up to 2018" is stored as the single year 2018 (`startYear = endYear = 2018`); that is a modelling choice, flagged in §9-Q2.

## 7. Execution sequence

| Step | Work | Gate before moving on |
|------|------|-----------------------|
| **0** | Discovery already done; query `codebase-memory-mcp` for overlaps once the repo is indexed (it is currently **not** indexed for this directory); read Serena memories (no active Serena project found for this path — activate before step 8). | Plan approved |
| **B1** | `SexenioType` enum, `Sexenio` entity, repository, migration incl. exclusion constraint. | migration up/down OK on clean PG16; `schema:validate` clean |
| **B2** | Validators (field, overlap, eligibility group) + translations. | validator unit tests green |
| **B3** | `SexenioVoter`, `SexenioEligibilityChecker`, API resource, DB-violation mapping. | role-matrix API tests green |
| **B4** | `SexenioSummary` provider + `/users/{id}/sexenio-summary`. | calculator tests with fixed clock |
| **B5** | `SexeniosFixtures`. | idempotent load; overlap check on dataset |
| **F0** | UM page reviewed (see §3.3 correction); mock-up built. Freeze layouts with the product owner. | mock-up approved |
| **F1** | Types, api hooks, `SexenioSummaryCard` mounted in academic profile. | type-check + lint |
| **F2** | Route (ordered before `:idAcademicStudy`), timeline page, lanes, inline form, transfer toggle. | component tests; manual check ES/EN, mobile width |
| **F3** | CV section via existing `MemberCv` flow. | CV renders sexenios |
| **B6** | `SexenioContribution` entity, migration, validators, voter reuse, API (§10). Depends on B3. | contribution API tests green |
| **F4** | Contributions page: publication picker, 5 main + 2 substitute forms, character counters (§10). Depends on F2 and B6. | component tests; ES/EN; mobile width |
| **B7** | `CneaiField` + `SexenioCall` catalogues, field on `Sexenio`, report/PDF endpoint (§11). Depends on B6. | catalogue + field-validation tests green |
| **F5** | Field, evaluation and PDF page (§11). Depends on F4 and B7. | component tests; ES/EN; mobile width |
| **V** | Full targeted validation: PHPUnit subset, `vitest`, `tsc`, ESLint, Docker build of `core` and `group`. | all green |
| **D** | Documentation, same commit as the code (see §8). | docs build passes |
| **G** | Update `codebase-memory-mcp` graph (new nodes: `Sexenio`, `SexenioVoter`, `SexenioSummaryCard`, routes; edges: API calls) and Serena memory entry. | graph reflects code |

Each step is a small, reversible commit; B* and F* can be developed in parallel after B3 freezes the contract.

## 8. Documentation deliverables (blocking, AGENTS.md step 6)

* `docs/docs/` (Docusaurus, EN + `i18n/es`): user guide "Sexenios" (who can create them, the timeline, how the % is computed, transfer activation) and technical page (data model, endpoints, validation layers, permissions). Ship in the **same commit** as the code.
* `core/docs/`: schema + API + security change summary (the exclusion constraint and the voter matrix).
* `core/README.md`: endpoint usage notes; OpenAPI impact (new `/sexenios`, `/users/{id}/sexenio-summary`) noted via runtime export.
* `memories/`: ADR "Sexenios year-range model and overlap guard"; Serena memory using the project template.

## 9. Assumptions I made that you may want to change

* **Q1 – No baseline when a user has no research sexenio:** the card shows an empty state instead of inventing a start year. Alternative: use the first eligible contract's start year. *Default chosen: empty state.*
* **Q2 – Transfer 2018 stored as one year (2018–2018).** Alternative: a 2013–2018 span. I did not infer that span because the brief gives no start year.
* **Q3 – "Activate transfer" is derived** from having at least one transfer block (no extra flag on `Profile`). Activating with no rows is therefore a UI-only state until the first year is saved. If you want it persisted independently, add a boolean on `Profile` (one more column + migration).
* **Q4 – Eligibility = has *ever* held an eligible contract** (not only a current one).
* **Q5 – Fixture user matching is by name**, since none of the five new researchers has a known email in the repo.
* **Q6 – Route reuse:** `teams/:slug/academic-profile/sexenios` instead of `/user/{id}/academic-profile`, to stay inside the tab, breadcrumb and header that already exist.
* **Q7 – The percentage uses fractional years** (so it moves during the year) rather than whole-year steps.

## 10. Contributions that justify a sexenio (5 main + 2 substitutes)

Source: the "Aportaciones" step of the UM tool, adapted. The member selects up to **5 main** and **2 substitute** contributions per sexenio, picked from the Science Manager `Publication` list instead of retyping them. Mock-up artboard 3.

### 10.1 Field mapping (screenshot field → Science Manager)

| Field on the screen | Source | Editable here? |
|---------------------|--------|----------------|
| Title | `Publication.title` | no (synced) |
| Authors | `Publication.publicationAuthors` (ordered by `position`) | no (synced) |
| Publication/registration year | `Publication.year` | no (synced) |
| Type of contribution | no equivalent field; default "Journal article" | yes, free text per contribution |
| Declared classification | `Publication.journal` + `rankingCategory` / `rankingPosition` / `rankingTotalPositions` / `impactFactorValue` | selectable, prefilled |
| Bibliographic or identification data | `journal` + `volume` + `issue` + `pageNumbers` | no (synced) |
| DOI or persistent identifier | `Publication.linkDoiOptional` | no (synced) |
| Repository URL | `Publication.openAccessUrl` (fallback `url`) | no (synced) |
| Personal contribution / authorship (CRediT) | **new**, per contribution | yes |
| Other documented evidence | **new**, per contribution | yes |
| Brief summary (max 4000) | **new**, per contribution | yes |
| Relevance and impact evidence (max 4000) | **new**, per contribution | yes |

Synced fields are **read from the publication at display time**, not copied, so a correction to the publication is reflected everywhere. Only the four narrative fields and the two overrides (type, classification) are stored on the contribution. (If a snapshot per submission is later required, add it then; not needed now.)

### 10.2 Data model

New entity `App\Entity\SexenioContribution` → `sexenio_contributions`:

| Column | Notes |
|--------|-------|
| `id` UUID | |
| `sexenio_id` | FK `sexenios`, `ON DELETE CASCADE` |
| `publication_id` | FK `publications`, NOT NULL, `ON DELETE RESTRICT` (a cited publication cannot be silently deleted) |
| `role` | enum `ContributionRole`: `MAIN`, `SUBSTITUTE` |
| `position` | smallint: 1–5 for MAIN, 1–2 for SUBSTITUTE |
| `type_label`, `declared_classification` | varchar, nullable |
| `personal_contribution`, `other_evidence`, `summary`, `relevance_evidence` | text, nullable |
| `created_at`, `updated_at` | |

Unique: `(sexenio_id, publication_id)` and `(sexenio_id, role, position)`. v1 links **publications only**; `BookChapter` and `Patent` exist in the system and could be added later by making the link polymorphic (Q8).

### 10.3 Validation

* `summary` and `relevance_evidence` ≤ 4000 characters, counted as `String.length` UTF-16 units on the client and `mb_strlen` on the server; known to differ for emoji, so the server limit is the authority and the UI counter is advisory.
* **Substitutes:** at most 2; `personal_contribution + other_evidence + summary + relevance_evidence` of both substitutes together ≤ 1000 characters (rule shown by the UM tool; the exact fields it counts, "reference and indicios", is to be confirmed against the FAQ in step B6).
* Main contributions: 3 to 5 allowed (selector); a sexenio is "complete" only at the chosen count. Drafts with fewer are allowed.
* The publication must have the sexenio's owner as an author (`Author.user`). Managers bypass this.
* A publication can appear once per sexenio. Publication year outside the sexenio's years is a **warning**, not an error.
* Permissions: reuse `SexenioVoter` through the parent sexenio (owner if eligible, manager of the group, admin).

### 10.4 API and UI

* `GET/POST /sexenios/{id}/contributions`, `PATCH/DELETE /sexenio-contributions/{id}`; groups `sexenio-contribution:read|write`.
* Route `teams/:slug/academic-profile/sexenios/:sexenioId/contributions` (declared before the generic ones, same ordering rule as §3.1). No modals: the publication picker is an inline side panel.
* Files (new, each < 500 lines): `ContributionsView.tsx`, `PublicationPicker.tsx`, `ContributionStepper.tsx`, `ContributionForm.tsx`, `SubstitutesPanel.tsx`, `useSexenioContributions.ts`.

## 11. Field, evaluation and PDF (last page)

Source: step 3 of the UM tool, adapted. Mock-up artboard 4.

### 11.1 What the page contains

* **Field selector** (CNEAI field/subfield) plus the rules of the selected field and call.
* **Data to be included**: call, declared period (the sexenio's six years, taken automatically), field, number of main contributions and how many are complete, processing mode, and which identifying data is withheld.
* **CV extract** chosen from the CV already stored in Science Manager (`MemberCv`), up to 12,000 characters; none by default.
* **Consent warning + checkbox**, then **Evaluate** and **Download PDF report**.
* **Rules and sources** (call rule version and links) and a collapsible **reducing circumstances** list.

### 11.2 Data model additions

* `CneaiField` catalogue (`id`, `code`, `name`, `isActive`), manager-editable like `ProfessionalCategory`; seeded per call. I will not type the official list into the plan: it is imported from the BOE source in B7 and reviewed by the product owner.
* `SexenioCall` catalogue (`id`, `year`, `ruleVersion`, `rules` JSON per field: point weights and maxima, `sources` JSON list of title+URL, `reducingCircumstances` JSON). Rules live in data so the next call does not need a deploy.
* `Sexenio` gains `cneai_field_id` (nullable FK, `ON DELETE SET NULL`) and `call_id` (nullable FK to `SexenioCall`). `callLabel` from §2.1 stays as free text for historical cases such as the 2018 pilot.
* The field is set by the member; the system never infers or changes it. Voter rules are those of §2.3.

### 11.3 Decision needed before B7: "Evaluate"

The UM tool sends the six years, field, bibliographic data, narratives and CV extract to an **external service** and returns a score estimate. For Science Manager this is a different class of feature (third-party processing of personal and unpublished research data, cost, provider, retention). I have **not** assumed it. Proposed split:

1. **In scope now:** field selection, rules display, data summary, reducing-circumstances list, sources, and **Download PDF report** (local or server-side, no third party).
2. **Out of scope until you decide (Q9):** the **Evaluate** button and the consent flow. The mock-up draws it disabled with `[provider to be decided]` so the layout is agreed, but the plan does not wire it. If approved later it needs its own ADR (provider, data minimisation, consent audit via `AuditLog`, no PII, retention, rate limits).

PDF generation: reuse the existing report/snapshot infrastructure (`GroupReportSnapshot`) if it fits; otherwise render client-side. To be confirmed in B7 by reading that module.

### 11.4 Files and tests

* Frontend (new): `SexenioFieldView.tsx`, `FieldSelector.tsx`, `EvaluationDataSummary.tsx`, `CvExtractPicker.tsx`, `CallRulesPanel.tsx`, `ReducingCircumstances.tsx`, `useSexenioCall.ts`; route `…/sexenios/:sexenioId/field`.
* Tests: field can be set/cleared only by owner or manager; rules payload for the selected field; PDF contains title, period, field and all contributions; consent checkbox gates Evaluate (when wired); page renders at mobile width.

### 11.5 Extra assumptions

* **Q8 – Contributions link to publications only** in v1 (no book chapters or patents).
* **Q9 – Evaluate via external service is deferred** pending your decision (§11.3); PDF export is included.
* **Q10 – The tool's point weights** (knowledge 1, scientific impact 6, social impact 1, open science 1, preferred type 1) are taken as shown on the UM page for the 2025 call; they must be verified against the BOE/ANECA sources listed there before being stored as data.
