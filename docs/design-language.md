# AIC Njoro Town Website Design Language

## 1. Brand Positioning

The AIC Njoro Town website should feel:

- Premium
- Calm
- Modern
- Church-appropriate
- Trustworthy
- Warm
- Institutional
- Purposeful

The design direction is:

> Modern church institution: sacred, minimal, warm, trustworthy, and elegant.

## 2. Core Design Principles

### Restraint

Use fewer visual elements, but make each one intentional. Avoid multiple competing focal points on the same screen.

### Warmth

Use warm cream and off-white backgrounds instead of cold gray backgrounds.

### Trust

Use black, soft black, and strong typography to create authority.

### Red As Accent

Red is a brand color, but should be used sparingly. It should guide attention, not dominate the page.

Use red for:

- Primary CTA buttons
- Active states
- Small labels
- Icons
- Borders/accent lines
- Progress indicators

Avoid:

- Large red text blocks
- Red-heavy sections
- Red backgrounds across large page areas

## 3. Brand Color System

### Brand Colors

| Role | Color |
|---|---|
| Red | `#991b1b` |
| Deep Red | `#7f1d1d` |
| Button Red | Tailwind `red-800` |
| Button Hover Red | Tailwind `red-700` |
| Black | `#080808` |
| Soft Black | `#111111` |

## 4. Light Theme

| Role | Color |
|---|---|
| Main background | `#f8f5ef` |
| Secondary warm background | `#fffaf0` |
| Soft section background | `#ece7de` |
| Card background | `#ffffff` |
| Primary text | Tailwind `zinc-950` |
| Muted text | Tailwind `zinc-600`, `zinc-700` |
| Borders | `border-black/10` |

Light mode should feel warm, open, and calm.

## 5. Dark Theme

| Role | Color |
|---|---|
| Main background | `#080808` |
| Card surface | Tailwind `zinc-950` |
| Secondary dark surface | `#171717` |
| Deep red accent surface | `#260b0b` |
| Primary text | Tailwind `stone-100` |
| Muted text | Tailwind `stone-300`, `stone-400` |
| Borders | `border-white/10` |

Dark mode should feel premium, not simply inverted.

## 6. Typography

### Primary Font

Use the system sans-serif stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

### Heading Rules

Use:

- `font-extrabold` for primary landing headings
- `font-black` only when the page needs a stronger app/tool heading
- `leading-tight` or carefully controlled line-height
- No negative letter spacing

Avoid:

- Too many all-caps headings
- Multiple giant titles in one view
- Oversized decorative text

### Scripture / Devotional Text

Use serif styling:

```tsx
font-serif
```

Example:

```text
Oh Come Let Us Worship — Psalm 95:6
```

## 7. Spacing System

Use an 8px rhythm.

| Token | Size |
|---|---|
| XS | `8px` |
| SM | `16px` |
| MD | `24px` |
| LG | `32px` |
| XL | `48px` |
| 2XL | `64px` |
| 3XL | `96px` |

General guidance:

- Use generous whitespace.
- Avoid cramped hero sections.
- Give cards enough internal padding.
- Let sections breathe vertically.

## 8. Layout Principles

### Mobile First

Requirements:

- No horizontal overflow
- Comfortable tap targets
- Readable typography
- Stacked layouts
- Buttons full-width when appropriate
- Cards with sufficient padding

### Desktop

Use constrained max-widths:

```tsx
max-w-4xl
max-w-5xl
max-w-6xl
```

Avoid stretching content too wide.

### Responsive Width Contract

The page shell owns the width boundary.

Every page should establish a responsive container that never exceeds the available viewport or parent width. Child sections and components must render within that boundary rather than calculating their own widths from the viewport.

The sizing hierarchy should be:

```text
Viewport
  ↓
Page shell
  ↓
Shared content container
  ↓
Section
  ↓
Component
  ↓
Child/card
```

The page shell and major sections should generally respect:

```tsx
w-full
max-w-full
min-w-0
box-border
```

A typical shared page container may use:

```tsx
mx-auto
w-full
max-w-[1440px]
min-w-0
px-4
sm:px-6
lg:px-8
xl:px-12
```

Use project-specific max-widths where appropriate, but never allow ordinary page content to grow wider than its parent.

#### Component Width Rules

Components should respond to the width available from their parent.

Prefer:

```tsx
w-full
max-w-full
min-w-0
```

Avoid viewport-derived child sizing such as:

```tsx
w-screen
```

or CSS equivalents such as:

```css
width: 100vw;
width: calc(50vw - ...);
```

unless there is a deliberate full-bleed design reason.

Nested flex and grid children that contain text or dynamic content should usually include:

```tsx
min-w-0
```

This is especially important for:

* Long headings
* Category names
* Series names
* Buttons
* Metadata
* Taxonomy controls
* Cards inside flex/grid layouts

Use wrapping utilities where needed:

```tsx
break-words
```

or, for unusually long unbroken content:

```tsx
[overflow-wrap:anywhere]
```

#### Responsive Decision Ownership

The viewport determines the outer page width.

Individual components then decide how best to render inside the space they receive.

For example:

```text
Resource masonry:
narrow container → 2 columns
medium container → 2 larger columns
wide container → 3 columns

Taxonomy header:
narrow container → stacked title and action
wide container → title and action in one row

Hero:
narrow container → stacked
wide container → split composition
```

Prefer Tailwind responsive utilities and container queries where they improve component independence.

Example:

```tsx
<section className="@container w-full max-w-full min-w-0">
```

Then the component may respond to its own width rather than assuming a specific device:

```tsx
<div className="flex flex-col @lg:flex-row">
```

#### Overflow Rules

Do not use:

```tsx
overflow-x-hidden
overflow-x-clip
```

as the primary solution to oversized descendants.

Overflow clipping may be used as a final defensive boundary, but the actual oversized child must first be corrected.

When horizontal overflow appears, inspect for:

* `w-screen`
* fixed `min-w-*`
* `w-fit` on long-content elements
* `whitespace-nowrap`
* negative horizontal margins
* arbitrary fixed widths
* viewport-based `calc(...)`
* flex/grid children missing `min-w-0`
* `width: 100%` combined with incompatible padding or positioning
* intrinsic media widths that exceed the parent

The goal is not to hide overflow.

The goal is for every component to naturally fit within the width provided by its parent.

#### Masonry and Card Layouts

For masonry layouts, let the masonry container establish the column width.

Cards should consume the width of the column naturally.

Prefer:

```tsx
<div className="w-full min-w-0 columns-2 gap-3 md:gap-4 xl:columns-3">
```

with cards such as:

```tsx
<article className="mb-3 w-full max-w-full break-inside-avoid md:mb-4">
```

Avoid manually calculating individual card widths from the viewport.

#### Core Rule

> Constrain at the page level, adapt at the component level.

A component should know how much space it has, not how wide the user's device is.


## 9. Logo Usage

### Primary Church Mark

Use:

```ts
aic_circle.png
```

Use when the text "AIC Njoro Town" appears as a brand identity moment.

Recommended sizes:

| Context | Size |
|---|---|
| Header | `48px` |
| Hero small logo | `56px-64px` |
| Large hero logo, if needed | `80px-120px` |

### Full Church Logo

Use:

```ts
ANT_logo.png
ANT_logo_black.png
```

Use sparingly. Avoid placing the full logo next to another giant text title.

### PDF Letterhead

Use:

```ts
ANT_letter_head.png
```

### Media Crew Logo

Use:

```ts
media_crew_black.png
```

Footer link:

```text
https://media-crew.aicnjoro.org
```

## 10. Header Pattern

Recommended structure:

```text
[AIC circle logo] AIC Njoro Town
                  Oh Come Let Us Worship — Psalm 95:6

[Theme toggle]
```

Rules:

- Logo links back to `/`.
- Header remains compact.
- Use the circle logo.
- Tagline remains consistent: `Oh Come Let Us Worship — Psalm 95:6`
- Theme toggle is icon-only and accessible.

## 11. Footer Pattern

Recommended structure:

```text
© 2020 - {currentYear} AIC Njoro Town Media Crew. All rights reserved.
Full Website coming soon.

[Media Crew logo]
```

Rules:

- Current year auto-updates.
- Media crew logo links to `https://media-crew.aicnjoro.org`.
- Footer should stay quiet and refined.

## 12. Button System

### Primary Button

Use for main CTAs.

```tsx
bg-red-800
hover:bg-red-700
text-white
rounded-full
shadow-lg shadow-red-950/20
transition
hover:-translate-y-0.5
```

Usage:

- Open Project 52
- Today / Current Week
- Primary form actions

### Secondary Button

Light mode:

```tsx
border-black/10
bg-white
text-zinc-950 or text-zinc-700
hover:bg-zinc-50 or hover:bg-[#fffaf0]
```

Dark mode:

```tsx
border-white/15
bg-white/10 or bg-zinc-950
text-white or text-stone-100
hover:bg-white/15 or hover:bg-[#171717]
```

## 13. Cards

Light mode:

```tsx
bg-white
border-black/10
shadow-zinc-900/5 or shadow-zinc-900/10
```

Dark mode:

```tsx
bg-zinc-950
border-white/10
shadow-black/25 or shadow-black/40
```

Border radius:

- `rounded-2xl`
- `rounded-3xl`

Padding:

- Mobile: `p-5` or `p-6`
- Desktop: `p-6` or `p-8`

Hover:

```tsx
transition hover:-translate-y-0.5
```

## 14. Hero Sections

Recommended structure:

```text
[Small logo or badge]

Main heading

Supporting scripture / tagline

Short status line or CTA

Primary action
```

Rules:

- One clear focal point.
- Avoid multiple giant brand treatments.
- Use generous vertical spacing.
- Red should remain minimal.
- Use warm backgrounds.

Example:

```text
AIC Njoro Town
Oh Come Let Us Worship — Psalm 95:6
Full website launching soon
```

## 15. Project 52 Page Pattern

Hero:

```text
[Rotating catchphrase badge]
Project 52
Read through the Bible week by week with our church community across 52 intentional weeks.
[Today / Current Week] [Download Plan]
```

Progress card:

```text
Active Bible Tool
52-Week Reading Plan
Week X of 52
Progress bar
Reading notes
```

Reading plan:

- Search by book
- Tabs: Both, Old Testament, New Testament
- Scrollable plan container
- Current week highlighted
- Current day highlighted

## 16. Rotating Catchphrase Badge

Behavior:

- Rotates every few seconds
- Supports optional scripture reference
- Scripture reference must be visible on mobile
- Badge height should remain stable to avoid layout shift

Recommended styling:

```tsx
rounded-full
border
text-xs
font-bold
tracking-wide
```

Animation:

- Subtle fade/slide
- Respect `prefers-reduced-motion`

## 17. Reading Plan UX Rules

Current week behavior:

- Week 1 starts on the first Monday of the year.
- Current week is automatically detected.
- Current week opens automatically.
- Monday-Friday highlight the respective day.
- Saturday/Sunday highlight Friday of the previous reading week.

Search behavior:

- Search by book name.
- If query matches only OT, switch tab to Old Testament.
- If query matches only NT, switch tab to New Testament.
- If query matches both, keep Both.
- Clearing search resets to Both.

Tabs:

- Both
- Old Testament
- New Testament

## 18. PDF Design Rules

Header:

```ts
ANT_letter_head.png
```

Footer:

- Red divider line
- Project 52 and page number text
- `ANT_logo_black.png`
- `media_crew_black.png`
- Current rotating catchphrase centered between logos

PDF color values:

| Role | Approx Color |
|---|---|
| Red accent | `#9e1c1c` |
| Black text | `#0d0d0d` |
| Body text | `#1a1a1a` |
| Light table row | `#faf5eb` |
| Table border | `#dbd4c7` |

## 19. Motion and Interaction

Allowed:

- Smooth fade-in
- Slight upward hover lift
- Smooth theme transitions
- Smooth scroll to current week
- Soft active state transitions

Avoid:

- Bouncy effects
- Flashing
- Fast rotations
- Heavy parallax
- Loud animations

Respect:

```css
prefers-reduced-motion
```

## 20. Accessibility Guidelines

All interactive elements should have:

- Clear focus states
- Sufficient contrast
- Semantic HTML
- Accessible labels where needed
- Keyboard-friendly behavior

Images:

- Decorative images should use `alt=""`.
- Brand images should have meaningful alt text when they replace text.

Hidden headings may be used when visible branding is image-based:

```tsx
<h1 className="sr-only">AIC Njoro Town</h1>
```

## 21. Technical Project Conventions

Current structure:

```text
src/
  components/
    SiteHeader.tsx
    SiteFooter.tsx
    project52/
  constants/
    assets.ts
  data/
  hooks/
  pages/
  types/
  utils/
```

Guidelines:

- Route-level pages go in `pages/`.
- Shared UI goes in `components/`.
- Feature-specific UI goes in `components/{feature}/`.
- Long static data goes in `data/`.
- Reusable logic goes in `utils/`.
- Shared types go in `types/`.
- Asset paths stay centralized in `constants/assets.ts`.

Avoid:

- Large route files with data, utility logic, and UI mixed together.
- Hardcoded asset paths scattered throughout components.
- Duplicated theme logic.

## 22. Asset Path Convention

Use centralized paths:

```ts
export const assetPaths = {
  circleLogo: '/aic_circle.png',
  logo: '/ANT_logo.png',
  logoBlack: '/ANT_logo_black.png',
  letterHead: '/ANT_letter_head.png',
  mediaCrewLogoBlack: '/media_crew_black.png',
};
```

## 23. Tone of Copy

Copy should be:

- Clear
- Warm
- Reverent
- Simple
- Church-appropriate

Avoid:

- Corporate jargon
- Overly trendy phrases
- Hype-heavy language
- Long explanatory blocks in the UI

Good examples:

```text
Growing together in faith, fellowship, and the Word.
Oh Come Let Us Worship — Psalm 95:6
A guided 52-week journey through Scripture for our church family.
```

## 24. Future Features Should Follow This Pattern

Any future page should answer:

1. What is the one main focus of this page?
2. What is the primary action?
3. Is red being used as an accent, not decoration?
4. Is the spacing generous?
5. Does it work beautifully on mobile?
6. Does dark mode feel designed, not inverted?
7. Does it feel like AIC Njoro Town?

If the answer is no, simplify before adding more.
