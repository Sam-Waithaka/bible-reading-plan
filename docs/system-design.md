# System Design

## Overview

This project is the React single-page application for A.I.C Njoro Town Church. It combines several connected experiences:

- the public church homepage and institutional pages;
- Project 52, the church Bible-reading plan;
- an interactive Scripture reader with search, comparison, sharing, and Bible tools;
- the public Resources library for writings, taxonomy browsing, Scripture relationships, ministries, and series;
- the public Media library and media-watch experience;
- authenticated member and staff portal experiences;
- the Writing Studio editorial workflow.

The frontend owns routing, presentation, responsive composition, client state, Project 52 schedule logic, authentication lifecycle integration, and public/editorial API orchestration. Backend services remain authoritative for published content, media, taxonomy, permissions, and account data.

## Design and Engineering Principles

- Preserve the A.I.C Njoro Town design language documented in `docs/design-language.md`.
- Keep public and authenticated data flows separate.
- Use one shared HTTP client for public JSON GET requests where the contract allows it.
- Prefer modular feature components over large route components.
- Centralize cross-feature layout vocabulary without forcing every feature into the same composition.
- Keep DOM order, keyboard behavior, focus management, reduced motion, and touch targets accessible.
- Preserve backend routes and contracts unless a backend change is explicitly part of the task.
- Treat mobile, tablet, desktop, and large desktop as intentional compositions rather than scaled copies.

## Runtime Architecture

```text
Browser
  |
  | BrowserRouter + RouteTransition
  v
Public routes                           Protected routes
  Landing / Scripture / Project 52       RequireAuth
  Resources / Media / church pages         |
                                            v
                                      PortalToastProvider
                                      Portal / Writing Studio
  |
  v
Application providers
  ThemeProvider
  AuthProvider
  Project52Provider
  ScriptureReaderProvider
  |
  v
Service layer
  apiClient
  authApi / authSession
  scriptureApi
  resourcesApi / publicSearchApi
  audioVisualApi / mediaAssetsApi
  writingApi
  |
  v
Backend APIs and optimized media assets
```

The application is mounted in React `StrictMode`. Development effects may therefore run more than once; services and effects must remain abort-safe and retry-safe.

## Routing

### Public routes

| Route | Responsibility |
| --- | --- |
| `/` | Church homepage and public highlights |
| `/about` | Church information |
| `/contact` | Contact information |
| `/give` | Giving information |
| `/ministries` | Ministry discovery |
| `/project52` | Full Project 52 reading plan |
| `/scripture` | Scripture reader, Project 52 widget, search, comparison, and tools |
| `/media` | Public media discovery and collections |
| `/media/watch/:slug` | Media playback/detail experience |
| `/resources` | Public editorial Resources library |
| `/resources/type/:slug` | Resource-type detail and browse view |
| `/resources/category/:slug` | Category-filtered public writings |
| `/resources/series/:slug` | Series-filtered public writings |
| `/resources/book/:osisId` | Writings connected to a Scripture book |
| `/resources/ministry/:slug` | Writings connected to a ministry |
| `/resources/:slug` | Public writing detail |

### Protected routes

| Route | Responsibility |
| --- | --- |
| `/portal` | Authenticated portal dashboard |
| `/portal/writing` | Writing Studio entry point |
| `/portal/writing/articles` | Writing library/article management |
| `/portal/writing/new` | New writing workflow |
| `/portal/writing/library` | Writing taxonomy and library management |
| `/portal/writing/editorial` | Editorial workflow |
| `/portal/writing/:id` | Writing editor |

Protected routes are wrapped by `RequireAuth` and `PortalToastProvider`. Unknown routes currently fall back to the landing page. Static-host refresh fallback is provided by `public/_redirects`.

## Application Providers and State Ownership

### Theme

`ThemeProvider` owns the light/dark theme. Shared navigation, public pages, portal surfaces, sheets, and floating controls consume the same theme state.

### Authentication

`AuthProvider` and the auth store own the session lifecycle, current user, sign-in/sign-out actions, and token-backed access used by protected services. Public service responses must never cache privileged, draft, or user-specific payloads under public cache keys.

### Project 52

`Project52Provider` owns the current reading target, reading week, generated reading weeks, and rotating catchphrase. Static plan content lives under `src/data/`.

The schedule rules include weekday reading assignment, weekend catch-up, current-week navigation, and clamped Week 1/Week 52 boundaries.

### Scripture Reader

`ScriptureReaderProvider` owns durable reader selection state. The public rendering authority is:

```ts
openScripture(request)
```

Project 52 links, URL parameters, chapter controls, reference pickers, and Scripture tools should converge on that action rather than creating competing render paths.

## Service and HTTP Architecture

### Shared public API client

`src/services/apiClient.ts` provides:

- API base-URL construction;
- JSON parsing;
- consistent timeout and error handling;
- in-flight reuse for requests without a caller-owned `AbortSignal`;
- opt-in application-memory caching;
- targeted cache invalidation.

Memory caching has no TTL. Entries remain until a browser reload/application restart, `clearApiClientCaches()`, or targeted invalidation. Requests carrying an `AbortSignal` are intentionally not deduplicated so one consumer cannot cancel another consumer's request. Successful memory-cache hits remain available to signalled callers.

### Resources public reads

The `/v1/resources/*` public read layer uses `apiGet(..., { cache: 'memory' })`:

```text
/v1/resources/home/
/v1/resources/navigation/
/v1/resources/type/:slug/?page=...&page_size=...
/v1/resources/:slug/?published_at=...
```

The complete URL is the cache key, so filters, pages, slugs, and public publication timestamps remain independent. `invalidateResourcesCache()` clears the `/v1/resources/*` namespace after relevant successful public-facing mutations.

Home, Navigation, resource types, categories, series, Scripture-book relationships, and ministry relationships are carried through the public Resources aggregate contracts. Category-, series-, book-, and ministry-filtered article grids use `/v1/search/writings/`. That generic search endpoint uses the shared client but is not placed under the Resources memory-cache policy because it is also used by general/editorial search and may receive tag-related filters.

Tags remain intentionally outside the public Resources memory-cache migration.

### Writing Studio

`writingApi.ts` owns authenticated writing, workflow, taxonomy, relationship, scheduling, publishing, featuring, and editorial operations. Successful mutations that affect public Resources invalidate the public Resources namespace. Draft-only reads and privileged responses remain outside public caching.

### Scripture

`scriptureApi.ts` and `scriptureNormalizers.ts` own Scripture URL construction, tolerant response normalization, comparison, lookup, search, notes, markers, glossary, and resource requests. The frontend accepts several transitional backend shapes, but stable backend contracts remain the long-term goal.

### Media

`audioVisualApi.ts` owns public audiovisual data, while `mediaAssetsApi.ts` normalizes media assets and responsive variants. The player supports large HLS/DASH dependencies. These currently create large production chunks and are a priority for route/player-level lazy loading rather than eager loading from non-media routes.

## Public Resources Composition

The Resources page separates content discovery from structured navigation:

- editorial hero and latest publication;
- featured and latest writing shelves;
- responsive masonry discovery;
- resource-type, category, and series relationships;
- Browse Scripture and Browse Ministry structured lists;
- public writing detail pages.

Generated editorial covers and photographic cards retain distinct visual species. Their content and aspect ratios must not be forced into one uniform card height.

The homepage Resources highlight uses the same Resources Home response but applies its own selection semantics. It promotes the latest publication as the anchor, may add supporting writings and a featured Series, and displays a loading shell while the initial request is pending.

## Media Composition

The Media page owns collection filtering, featured/latest media, series, music subcategories, and the watch experience. On mobile and tablet, Media and Resources share `FloatingBrowseControl`, including:

- compact floating pill presentation;
- footer avoidance and scroll-direction concealment;
- safe-area positioning;
- 50dvh bottom-sheet limit and internal scrolling;
- focus trapping, Escape handling, and trigger-focus restoration.

Each feature supplies its own taxonomy items and selection behavior to the shared shell.

## Navigation and Application Shell

Shared site chrome lives in `src/components/navigation/`:

```text
FloatingBrowseControl.tsx
SiteFooter.tsx
SiteHeader.tsx
SiteNavigation.tsx
SiteSideNav.tsx
```

`SiteNavigation` is the shared authority for top navigation, the mobile/tablet drawer, account controls, theme controls, Give action, and the Scripture/Project 52 side-navigation presentation.

The full top navigation begins at 1280px. Below 1280px, the header uses the menu/drawer system so eight links, church identity, Give, account, and theme actions are not compressed into an unsuitable width. The dedicated Scripture/Project 52 side rail may begin at 1024px because it occupies a page column rather than competing inside the top header.

`RouteTransition` belongs to `src/components/routing/` because it coordinates route presentation rather than site navigation.

## Responsive Layout System

The site uses one shared set of viewport modes. Desktop expands the composition, tablet reorganizes it, and mobile prioritizes it. Components remain responsible for their own internal layouts; the shared vocabulary prevents scattered numeric media queries.

| Mode | Tailwind variant | Width |
| --- | --- | --- |
| Mobile | base | below 768px |
| Tablet | `md:` | 768–1023px |
| Small desktop | `lg:` | 1024–1279px |
| Desktop | `xl:` | 1280–1439px |
| Large desktop | `wide:` | 1440–1679px |
| Very large desktop | `ultra:` | 1680px and above |

The custom `wide` and `ultra` breakpoints are defined in `src/index.css` through Tailwind's `@theme` configuration.

### Shared boundaries and gutters

`src/components/layout/PageContainer.tsx` is the standard centered page boundary. It provides:

```text
w-full max-w-full min-w-0 box-border
max width: 1440px
mobile gutter: 16px
small-screen gutter: 24px
small-desktop gutter: 32px
desktop gutter: 48px
```

The corresponding reusable class vocabulary lives in `src/constants/responsive.ts`:

- `viewportBoundaryClass`;
- `siteGutterClass`;
- `siteContainerClass`;
- `discoveryMasonryColumnsClass`;
- `discoveryGridColumnsClass`.

`ResourcesContainer` delegates to `PageContainer` for compatibility with existing Resources components.

Intentional reading measures such as `max-w-3xl`, `max-w-5xl`, and `max-w-6xl` should remain local. They constrain readable content rather than defining the viewport boundary.

### Discovery-grid convention

The shared discovery progression is:

```text
Mobile:             2 columns
Tablet:             3 columns
Small desktop:      4 columns
Desktop:            5 columns
Large desktop:      6 columns
Very large desktop: 7 columns
```

Resources consumes this progression for both masonry and grid fallbacks. Other features may reuse it when the same discovery model is appropriate, but should not adopt it merely for visual symmetry.

### Component-level responsiveness

Components should prefer parent-constrained sizing and may use container queries when their inline space matters more than the device width. Repeated structural rules belong in shared primitives; feature-specific card geometry, editorial asymmetry, reading measures, and content hierarchy remain local.

Avoid using `w-screen`, `100vw`, fixed minimum widths, or overflow clipping as primary sizing fixes. Long-content flex/grid children should generally use `min-w-0`, and media should remain bounded by `max-w-full`.

## Component Organization

```text
src/components/
  layout/        shared page/container primitives
  navigation/    header, drawer, side navigation, footer, floating browse shell
  routing/       route-level presentation behavior
  resources/     public Resources cards, shelves, navigation, masonry
  media/         public Media discovery and player components
  scripture/     Scripture reader and Bible tools
  project52/     Project 52 presentation
  portal/        authenticated portal and Writing Studio UI
  auth/          authentication UI and route guards
  landing/       homepage sections and highlights
  ui/            reusable presentation controls
```

Feature components should import shared structural primitives rather than duplicating them, while avoiding a single oversized universal layout component.

## Accessibility

Shared interactive systems should preserve:

- real buttons and anchors;
- visible focus states;
- keyboard navigation;
- Escape-to-close behavior;
- focus trapping and restoration for modal surfaces;
- appropriate ARIA labels and active-state semantics;
- touch-friendly controls;
- reduced-motion preferences;
- sensible DOM and reading order;
- no horizontal page overflow.

## Testing and Validation

- Unit/component tests use Vitest.
- End-to-end tests use Playwright.
- TypeScript is checked through the project build configuration.
- ESLint is used for changed files and focused surfaces; legacy warnings may still exist elsewhere.
- Production builds verify Tailwind class generation and expose bundle-size warnings.

Important responsive states should be checked around 360, 390, 430, 768, 820, 1024, 1280, 1366, 1440, 1600, 1680, and 1920 pixels where the affected feature warrants it.

## Current Limitations and Future Work

- Public API memory caching has no TTL or background revalidation.
- Generic public writing search remains outside Resources namespace caching.
- Route and player code is still eagerly bundled; HLS/DASH and media-player dependencies require lazy-loading work.
- Some API normalizers remain deliberately tolerant while backend contracts stabilize.
- Browser end-to-end runs depend on the configured Vite test server becoming available within its startup timeout.
- Continue refining shared navigation behavior with real content and authenticated states at every viewport.
- Consider persisted reading progress, reminders, additional Bible versions/languages, and analytics as separate future phases.
