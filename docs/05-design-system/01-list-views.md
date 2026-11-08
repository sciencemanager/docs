---
id: list-views
title: List Views Guideline
sidebar_label: List Views
---

# List Views Guideline

**Status:** proposed · **Reference view:** Academic Direction (`/:group/academic-direction`) · **Applies to:** every list/register view in `group/` (table + search + filters + "Add new")

This guideline defines how a list view looks and behaves, and how a change made to one view is rolled out to every other view that shares the same styles, classes and fonts. It was derived from the redesign mockup of Academic Direction and from an audit of the current `group/src` tree (section 9).

> Rule of thumb: **change the shared piece once, then migrate the views onto it.** A per-view edit that is not backed by a shared component or token is a regression waiting to happen.

---

## 1. Principles

1. **Colour has one meaning each.** If a colour does not carry a meaning from the table in section 3, the element is neutral.
2. **Focus goes where action is.** The brand accent marks interaction (primary action, active filter, keyboard focus) and the one state that needs the reader (`In progress`). Everything else recedes.
3. **People choose their own colour.** The only decorative colour in a list is the avatar colour/photo/3D avatar each person picked in their profile.
4. **Quiet when done.** Finished, archived and neutral data must not compete with live data.
5. **State lives in the URL.** A filtered, paginated list is a shareable link.
6. **Keyboard and touch first-class.** Every row, chip and menu works without a mouse; touch targets are at least 44px on mobile.

---

## 2. Tokens

Values are the ones the running app already ships (`group/src/css/globals.css`). Do not introduce new literals in components; add a semantic token instead.

| Token | Light | Use |
|---|---|---|
| `--background` / `--card` | `#ffffff` | Page and table surface |
| `--foreground` | `#1c2536` | Primary text |
| `--muted` | `#f5f5f5` | Table header, panel background, row hover |
| `--muted-foreground` | `#5a6a85` (≈75%) | Secondary text, labels, category text |
| `--border` | `#dfe5ef` | Table, input and panel borders |
| `--primary` | `#1e8688` | Primary button, focus ring, active filter |
| `--accent` / `--ring` | `#1e86882a` | Soft accent surface (active chip, "In progress") |
| `--radius` | `10px` | Cards, tables, panels (controls use 8px) |

Font: **DM Sans**, 14px body. Type scale used in list views: 12 (labels, badges, headers), 13 (secondary), 14 (body), 20 (page title).

### New semantic tokens (to add in `globals.css`, light and dark)

| Token | Purpose |
|---|---|
| `--status-active` / `--status-active-fg` | Soft accent surface + readable ink for live states |
| `--status-done` / `--status-done-fg` | Neutral surface + ink for finished states |
| `--status-attention` / `--status-attention-fg` | Amber, reserved (overdue, needs review) |
| `--status-danger` / `--status-danger-fg` | Red, reserved (failed, blocked) |

`--status-active-fg` must reach 4.5:1 on `--status-active` in both themes; verify dark mode independently.

---

## 3. Colour rules

| Colour | Meaning | Where it appears |
|---|---|---|
| Neutrals | Structure | Text, borders, headers, row hover, category/type text |
| Brand teal | Interaction and focus | Primary button, active filter chips, focus ring, links, `In progress` |
| Person colour | Identity | Avatar only |
| Amber / red | Needs attention | Only when a real condition exists; never as decoration |

### 3.1 Status vs category

- **Status** (a state the record moves through): a pill with a dot or icon. Only the state the reader must notice is coloured (`In progress`). Finished states are neutral with a check. `Abandoned` is neutral with strikethrough: it is an outcome, not an error.
- **Category** (degree, stay type, project type, document type): **plain secondary text**, no pill and no colour. It classifies; it does not signal.

A view must not give every category its own hue. If a category needs to be scannable, use an icon or position, not colour.

### 3.2 Avatars

Resolution order, implemented once in the shared avatar component:

1. Uploaded photo (`avatarUrl`)
2. 3D preset (`avatarKey`)
3. Initials on the person's chosen colour (`avatarColor`)
4. Initials on a **neutral** surface when nothing is configured

The deterministic 10-colour hash (`getAvatarColor`) is **not** used in list views. When the background is a user colour, the initials colour is computed from its luminance (light background → dark text); never assume white text.

Stacks (e.g. directors): 28–30px avatars, 6px overlap, 2px ring in the surface colour, `+N` chip after the limit, and a text count ("2 directors") so identity does not depend on a tooltip.

---

## 4. Page anatomy

```
Breadcrumb / title
Toolbar        [search] [quick filter chips] [More filters (n)]      [+ Add]
Filter panel   (collapsible)
Active filters [chip ×] [chip ×]  Clear all
Table          header · rows · row actions
Pagination     "1–25 of 120" · rows per page
```

Order, spacing and visual order must match DOM order (no `order-*` utilities that reorder tab sequence).

### 4.1 Search

- One shared search input (icon at left, clear button when non-empty, 40px high, 44px on mobile).
- Visible accessible name: `aria-label` at minimum; never placeholder-only.
- Debounced (400ms), commits to the URL with `replace`, independent of the filter panel's Apply.
- Placeholder names the field: "Search by title".

### 4.2 Quick filters

- Up to 3 chips for the most-used single-select/multi-select facets (e.g. degree, status).
- Neutral outline by default; active = soft accent background + accent border; expose `aria-pressed`.
- Everything else lives behind **More filters**, a labelled button (text, not icon-only) with a count badge and `aria-expanded` / `aria-controls`.

### 4.3 Primary action ("Add new")

- Exactly **one** primary button per view, right-aligned in the toolbar, with a leading `+` icon and a verb + noun label ("Add study").
- On mobile it moves below the list header at full width. It never shares a row with the search box.
- Shown only when the user has permission; hidden, not disabled.

### 4.4 Filter panel

- Surface `--muted`, 10px radius, 16px padding, 4-column grid at `lg`, 2 at `sm`, 1 below.
- Each field: visible `<label>` associated by `id`, control with placeholder **"All"** (never repeating the label).
- Footer: `Clear filters` ghost button on the left; `Cancel` (outline) and `Apply` (primary) on the right. Apply is the only primary button in the panel.
- Edits a draft; nothing is queried until Apply (title search is the exception, section 4.1).
- Mobile: a bottom sheet with 2–3 essential fields and a live result count ("Show 12 results").

### 4.5 Active filter chips

- One chip per active value, "Facet: Value" with an `×` button (`aria-label="Remove filter Facet: Value"`) and a `Clear all` ghost button.
- Rendered from the same state as the URL, so a shared link shows what is applied.

### 4.6 Table

| Element | Spec |
|---|---|
| Container | 1px `--border`, 10px radius, `overflow-hidden`; inner scroll only for genuinely wide tables |
| Header | `--muted` background, 12px, 600, uppercase, +0.04em tracking, `scope="col"` |
| Row | 12px vertical padding, bottom border, hover `--muted` (neutral, never accent) |
| Title cell | Up to 2 lines (`line-clamp-2`), full text in tooltip only when truncated |
| Navigation | The title is a real link; the whole row may also be clickable, but the link is what keyboard and screen-reader users use |
| Numbers/dates | `tabular-nums`; show the column the sort order is based on |
| Row actions | Kebab menu with `aria-label="Actions for <name>"`; destructive items separated and red |
| Order | Rows render in the order the API returned; no client-side re-sort of one page |

### 4.7 States

| State | Spec |
|---|---|
| Loading | Skeleton that mimics the real columns (not one full-width bar per row) |
| Empty | Icon, one sentence, and the primary action if the user can create |
| Empty after filtering | Different copy plus `Clear filters` |
| Error | Icon, message, `Retry` (translated); keep filters visible |

### 4.8 Pagination

- Shared `TablePagination`. Page size is stored in the URL with the other list state.
- Hidden when `total === 0`.

### 4.9 Mobile (< 768px)

- Tables become **cards** (owner/title/status/directors/date), not an inner horizontal scroll.
- Search full width; one `Filters (n)` button; primary action full width at the bottom.
- 44px touch targets, 8px minimum gap.

---

## 5. Accessibility checklist

- [ ] Rows reachable and operable by keyboard (link in the title, or `tabIndex` + Enter on the row).
- [ ] Every filter control has a visible label bound by `id`/`htmlFor` or `aria-labelledby`.
- [ ] Icon-only buttons have `aria-label`; toggles expose `aria-pressed` / `aria-expanded`.
- [ ] Status is never conveyed by colour alone (dot, check or text accompanies it).
- [ ] Text ≥ 12px; contrast 4.5:1 in light **and** dark, including user-chosen avatar colours.
- [ ] Visible focus ring on every interactive element; sticky UI never hides the focused element.
- [ ] `prefers-reduced-motion` respected; no animation longer than needed for feedback.

---

## 6. Copy

- Labels are nouns ("Degree", "Status"); actions are verbs ("Add study", "Apply filters").
- All strings come from i18n (ES/EN). No `defaultValue` in Spanish inside components.
- Empty and error messages state what happened and what to do next.

---

## 7. i18n and state conventions

- Filter state ⇄ URL through `useUrlFilters` (schema-driven), not hand-written `fromSearchParams` / `toSearchParams`.
- Debounce timers are cleared on unmount.
- Page size, sort and page live in the URL.

---

## 8. Reference implementation

Academic Direction is the reference. Files:

| Concern | File |
|---|---|
| View | `group/src/views/academic-direction/AcademicDirectionListView.tsx` |
| Table | `group/src/views/academic-direction/components/AcademicDirectionTable.tsx` |
| Filter panel | `group/src/views/academic-direction/components/AcademicDirectionFilterPanel.tsx` |
| Status/degree helpers | `group/src/components/academic/academicFormatting.ts` |
| Mockup (private artifact) | https://claude.ai/artifact/SjfHjhTx6gHA5dWWmYyjz3 |

---

## 9. Reuse analysis (audit of `group/src`)

Counts come from the repository at the time of writing; re-run the recipes in 9.4 before each rollout.

### 9.1 What is already shared

| Piece | Where | Notes |
|---|---|---|
| Table primitives | `components/ui/table.tsx` | Imported by **35** files. Base `TableRow` has no hover; each view adds its own |
| Pagination | `components/shared/TablePagination.tsx` | Used by 15 list views |
| Row-actions menu | `components/shared/KebabMenu.tsx` | 22 files |
| Avatar stack | `components/shared/PIAvatarStack.tsx` + `toStackPerson` | 11 / 10 files; falls back to the colour hash and accepts photo / colour props that the table does not pass |
| Person avatar | `components/shared/UserAvatar.tsx` | Already resolves photo → 3D → initials with `avatarColor`; falls back to `bg-primary`, not neutral, and defaults initials from the signed-in email |
| URL ⇄ state | `hooks/useUrlFilters.ts` (+ test) | Generic, schema-driven; Academic Direction does not use it and hand-rolls the conversion |
| Selects | `components/ui/multi-select`, `async-multi-select` | 10 / 15 files |
| Style living doc | `views/admin/ui-docs/UIDocsView.tsx` | 1038 lines; must be split and updated as part of the rollout (limit: 500 lines per file) |

### 9.2 What is duplicated or inconsistent

| Finding | Evidence | Impact |
|---|---|---|
| Hard-coded badge palettes | `bg-*-100 text-*-700` in **21** files; separate helper modules `academicFormatting.ts` and `researchStayFormatting.ts` repeat the same violet/sky/emerald triples | Every view invents colour meaning; the same hue means different things |
| Hand-rolled search box | Identical `pl-9 pr-4 py-2 border …` markup in **6** files (Academic Direction, Projects filter bar, Publications browser, Employment Records, Admin Users, My Dissemination Contributions) | Fixes (a11y label, size) must be repeated six times |
| One filter panel per view | `AcademicDirectionFilterPanel`, `DisseminationFilterPanel`, `GroupReportsFilterPanel`, `ResearchStaysFilterPanel`, `EmploymentRecordFilters`, `ProjectsFilterBar`, `AssetFilterPanel` | Same footer, grid and label markup, copied |
| Clickable rows | At least 10 table files put `onClick` on `TableRow` with their own `cursor-pointer` / hover classes | No keyboard path; hover colour differs per view |
| Avatar colour | The hash palette is referenced from `PIAvatarStack`, `ui/avatar.tsx`, `AdminAuthorsTable`, `AdminUsersTable`, `ResearchProjectReportsListView` | The colour a person shows is not the colour they chose |
| "Add new" button | `<Plus>` buttons in **23** files with differing sizes, order and placement | No single primary-action position |
| Tiny type | 87 occurrences of `text-[10px]`–`text-[13px]` | Below the 12px floor in places |
| Per-view loading/empty/error blocks | Each list view writes its own | Inconsistent copy and icons |

### 9.3 Classification of every change

Use this to decide how a change is rolled out. A change is only "done everywhere" when its class is satisfied.

| Class | Meaning | Propagation |
|---|---|---|
| **A. Token / base class** | Edit `globals.css` or a primitive (`ui/table`, `ui/avatar`) | Automatic, but **visually global**: review every consumer before merging |
| **B. Shared component** | New or extended component in `components/shared` or `components/ui` | Only views that adopt it change; migration is explicit |
| **C. Per-view markup** | HTML that lives inside each view | Never propagates; must be migrated by hand or replaced by a class-B component |

| Change from the mockup | Class | How it reaches other views |
|---|---|---|
| New status/attention tokens | A | Add tokens; nothing changes until a badge uses them |
| Row hover neutral, header 12px caps, `tabular-nums` | A (opt-in) | Add a `variant="list"` (or `data-density`) prop on `Table` so existing 35 tables do not change silently; flip views one by one |
| Interactive row (link in title, keyboard) | B | `TableRow interactive` + `RowLink` helper replace the per-view `onClick` markup |
| Status pill, category text | B | `StatusBadge` / `CategoryLabel` replace `*BadgeClasses()` string helpers; the helpers become thin wrappers during migration |
| Avatar neutral fallback, luminance-aware initials | B | Extend `UserAvatar` (do not create a second avatar); `PIAvatarStack` renders `UserAvatar` per person and stops using the hash |
| Avatar data on rows | API | `core` must expose `avatarKey`, `avatarUrl`, `avatarColor`, `userSlug` for the row owner; confirm they are in the director author serialization group |
| Search input | B | `ListSearchInput` (label, clear, debounce, URL commit) replaces the 6 copies |
| Toolbar with quick chips + More filters | B | `ListToolbar` slots: `search`, `quickFilters`, `moreFilters`, `primaryAction` |
| Filter panel shell | B | `FilterPanel` (grid, footer, draft/apply) with per-view field children; each view keeps only its fields |
| Active filter chips | B | `ActiveFilterChips` driven by the `useUrlFilters` schema |
| Mobile cards | B | `ResponsiveTable` (table at `md+`, `renderCard` below) |
| Loading / empty / error blocks | B | `ListStates` (`LoadingRows`, `EmptyState`, `ErrorState`) |
| Page size in URL, debounce cleanup | C → B | Comes for free once the view uses `useUrlFilters` + `ListSearchInput` |

### 9.4 Audit recipes (run from `group/`)

```bash
# Hard-coded badge palettes
grep -rlE "bg-(emerald|sky|violet|amber|rose|blue|green|red|purple)-100" src

# Hand-rolled search inputs
grep -rl "pl-9 pr-4 py-2 border" src

# Colour hash still used for avatars
grep -rl "getAvatarColor" src

# Clickable table rows without a link
grep -rnE "<TableRow[^>]*onClick" src

# Sub-12px type
grep -rnE "text-\[1[0-1]px\]" src
```

### 9.5 Migration order

1. **Foundation (class A, no visible change):** add status tokens; add opt-in `variant="list"` to `Table`.
2. **Identity:** extend `UserAvatar` (neutral fallback, luminance), make `PIAvatarStack` use it; expose avatar fields in `core`. Verify Projects, Publications, the CV and the dashboard.
3. **Badges:** introduce `StatusBadge` / `CategoryLabel`; convert `academicFormatting.ts` and `researchStayFormatting.ts` first, then the remaining 19 files.
4. **List chrome:** `ListSearchInput`, `ListToolbar`, `FilterPanel`, `ActiveFilterChips`, `ListStates`.
5. **Reference view:** rebuild Academic Direction on the shared pieces.
6. **Roll out**, one view per PR, in this order: Research Stays → Employment Records → Projects → Publications → Dissemination → Group Reports → Admin lists.
7. **Mobile:** `ResponsiveTable`, adopted first by Academic Direction, then per view.

Every PR in steps 3–7 follows the checklist in section 10.

---

## 10. Definition of done for a list-view change

- [ ] Uses shared components/tokens; no new colour literal and no new `text-[Npx]` below 12px.
- [ ] Section 5 accessibility checklist passes.
- [ ] Verified at 390, 768 and 1440px, in light and dark.
- [ ] Verified in **every** view that consumes a touched shared piece (use the recipes in 9.4 to list them).
- [ ] i18n keys added for ES and EN.
- [ ] Files stay under 500 lines.
- [ ] Matching update in `docs/docs/` shipped in the same commit and release (AGENTS.md, step 6).
- [ ] Serena memory and `codebase-memory-mcp` graph updated.

---

## 11. Open decisions

| Decision | Options | Recommendation |
|---|---|---|
| Header style in base `Table` | Global change vs opt-in `variant="list"` | Opt-in, then flip the default when 80% of tables are migrated |
| `UserAvatar` initials default | Signed-in email vs required `initials` prop in "other person" mode | Require `initials` whenever any avatar prop is passed |
| Category text vs icon | Text only vs text + icon | Text only; add icons only where a view needs scanning by type |
| Living style guide | Keep `UIDocsView` or move to Docusaurus | Split `UIDocsView` (1038 lines) and keep it as the executable reference, linking here |
