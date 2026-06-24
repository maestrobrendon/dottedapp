# Dottd — Design System
**For direct implementation in Claude Code. Tailwind CSS v4 (`@theme` config) + CSS custom properties.**

---

## 0. Direction (read first, this governs every decision below)

Reference pattern across all three moodboards: **frosted glass calendar widgets** (the "April 21," "August 23" cards) appear more than any other single motif. That's the core visual language — translucent glass cards with soft blur, sitting over soft pastel gradients, with big confident widget-style typography. Paired with clean white card UI (Notion-style dashboards) for anything functional/data-heavy.

Two modes, used for two different surfaces:
- **Glass mode** — hero, landing, success screen, the "your saved date" preview. This is where the product gets to feel premium and alive.
- **Flat white mode** — dashboard, settings, anything list-based or functional. Calm, scannable, Notion/Apple-Reminders energy.

Never mix the two on the same screen. Glass is for moments, flat white is for management.

### Hard "do not" list (anti-AI-slop guardrails)
- No purple-to-blue gradients — anywhere. That's the single most overused AI-generated-app signal.
- No glowing orbs/blobs floating with no purpose. If something blurs, it's because it's frosted glass *over* a real gradient mesh, not decoration.
- No sparkle/magic-wand icons, no generic "✨" anywhere in copy or UI.
- No 3-column generic feature-grid sections ("Fast. Secure. Simple.").
- No stock illustration people or generic 3D blob mascots.
- No gradient text on headlines. Gradients live on backgrounds and buttons only, never on type.
- No default shadcn purple/violet button color. Every accent here is warm.
- No emoji used as functional UI icons (decorative use in copy, like the one birthday cake on the form, is fine — that's a specific deliberate choice, not a pattern to repeat elsewhere).

---

## 1. Color Tokens

```css
:root {
  /* Base */
  --canvas: #FAF9F7;        /* page background, flat-white mode */
  --surface: #FFFFFF;        /* cards on flat-white mode */
  --ink: #1A1A1A;            /* primary text, warm near-black */
  --mist: #8E8E93;           /* secondary text, placeholders */
  --hairline: #ECEAE7;       /* dividers, subtle borders */

  /* Gradient mesh (glass mode backgrounds) */
  --bloom-peach: #FFD9C2;
  --bloom-pink: #FFC2D6;
  --bloom-white: #FFFDFB;

  /* Accent (solid, for buttons/links/active states) */
  --coral: #FF7A59;
  --coral-deep: #FF5C3A;     /* gradient end-stop, hover state */

  /* Functional */
  --success: #34A853;        /* synced status, used as text/dot only, never a fill */
  --warning: #E8A33D;        /* not-synced status */

  /* Glass surface */
  --glass-fill: rgba(255, 255, 255, 0.55);
  --glass-border: rgba(255, 255, 255, 0.6);
}
```

**Gradient definitions:**
```css
--gradient-bloom: linear-gradient(135deg, var(--bloom-peach) 0%, var(--bloom-pink) 55%, var(--bloom-white) 100%);
--gradient-sunrise: linear-gradient(135deg, #FFB199 0%, var(--coral) 100%); /* primary buttons only */
```

Tailwind v4 config (`@theme` block, in your global CSS file — not `tailwind.config.ts`):
```css
@import "tailwindcss";

@theme {
  --color-canvas: #FAF9F7;
  --color-surface: #FFFFFF;
  --color-ink: #1A1A1A;
  --color-mist: #8E8E93;
  --color-hairline: #ECEAE7;
  --color-coral: #FF7A59;
  --color-coral-deep: #FF5C3A;
  --color-bloom-peach: #FFD9C2;
  --color-bloom-pink: #FFC2D6;
  --color-bloom-white: #FFFDFB;

  --radius-xl2: 20px;
  --radius-xl3: 28px;
}

/* Gradients aren't a first-class @theme key in v4 — defined as utilities instead */
@utility bg-gradient-bloom {
  background-image: linear-gradient(135deg, var(--color-bloom-peach) 0%, var(--color-bloom-pink) 55%, var(--color-bloom-white) 100%);
}

@utility bg-gradient-sunrise {
  background-image: linear-gradient(135deg, #FFB199 0%, var(--color-coral) 100%);
}
```

Every class name used in the component snippets below (`bg-coral`, `rounded-xl3`, `bg-gradient-bloom`, etc.) stays identical — this is purely where the tokens live, not a change to what they're called or how they're used.

---

## 2. Typography

- **Stack:** `font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;`
- Renders as true SF Pro on Apple devices, Inter everywhere else — no licensing issue, visually near-identical weight and spacing.
- Headlines are **bold (700)**, tight tracking (`-0.02em`), tight line-height (1.05–1.1) — confident, not delicate. Reference: "Your Projects (4)" and "12 New Books" headlines — heavy weight, large size, no decorative treatment needed because the weight itself carries it.
- Body copy: regular (400) or medium (500), relaxed line-height (1.5).
- Numerals (dates, counts): use `font-feature-settings: "tnum"` (tabular numbers) so dates in cards/widgets align cleanly — this matters specifically for the calendar widget component below.

| Role | Size / Line-height | Weight |
|---|---|---|
| Display (widget date, hero) | 56px / 1.0 | 700 |
| H1 | 32px / 1.1 | 700 |
| H2 | 22px / 1.2 | 600 |
| Body | 16px / 1.5 | 400–500 |
| Caption | 13px / 1.4 | 500 |

---

## 3. Spacing, Radius, Elevation

```css
--space-1: 8px;
--space-2: 12px;
--space-3: 16px;
--space-4: 24px;
--space-5: 32px;
--space-6: 48px;

--radius-sm: 12px;   /* inputs, small chips */
--radius-md: 20px;   /* standard cards */
--radius-lg: 28px;   /* hero widget, glass cards */
--radius-pill: 999px; /* buttons, segmented controls */

--shadow-soft: 0 8px 30px rgba(0,0,0,0.05);   /* flat-white mode cards */
--shadow-glass: 0 8px 32px rgba(255,122,89,0.12); /* glass mode, warm-tinted not gray */
```

No hard borders anywhere except `--hairline` for flat-mode dividers, and `--glass-border` for glass-mode edges.

---

## 4. Signature Component: The Date Widget

This is the one bold element, used on the landing hero and the success screen — it's a literal frosted-glass calendar widget, directly pulled from the strongest pattern in the references.

```html
<div class="relative rounded-xl3 p-6 overflow-hidden bg-gradient-bloom">
  <div class="backdrop-blur-2xl bg-white/55 border border-white/60 rounded-xl2 p-5 shadow-[0_8px_32px_rgba(255,122,89,0.12)]">
    <p class="text-mist text-sm font-medium">Tunde's birthday</p>
    <p class="text-ink text-[56px] font-bold leading-none tracking-tight tabular-nums">Jun 24</p>
    <p class="text-coral text-sm font-medium mt-2">Saved to your calendar</p>
  </div>
</div>
```

Build it exactly this way: gradient mesh background, glass card floating on top with backdrop-blur, big tabular date, coral confirmation line underneath. This component appears in exactly two places — hero and success — nowhere else. Restraint is what makes it land.

---

## 5. Component Specs

**Primary button**
```html
<button class="bg-gradient-sunrise text-white font-semibold rounded-pill px-6 py-3.5 active:scale-[0.97] transition-transform shadow-[0_8px_30px_rgba(255,122,89,0.25)]">
  Save my birthday
</button>
```

**Secondary button**
```html
<button class="bg-white text-ink font-medium rounded-pill px-6 py-3.5 border border-hairline active:scale-[0.97] transition-transform">
  Cancel
</button>
```

**Input field**
```html
<input class="bg-[#F0F0EE] rounded-sm px-4 py-3 text-ink placeholder:text-mist focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors" />
```

**Segmented control** (for event type: Birthday / Anniversary / Custom — replaces a dropdown, pulled directly from the "System" toggle pattern in the references)
```html
<div class="inline-flex bg-[#F0F0EE] rounded-pill p-1">
  <button class="rounded-pill px-4 py-2 text-sm font-medium bg-white shadow-sm text-ink">Birthday</button>
  <button class="rounded-pill px-4 py-2 text-sm font-medium text-mist">Anniversary</button>
  <button class="rounded-pill px-4 py-2 text-sm font-medium text-mist">Custom</button>
</div>
```

**Flat-white card** (dashboard list item)
```html
<div class="bg-surface rounded-md p-4 shadow-soft flex items-center justify-between">
  <div class="flex items-center gap-3">
    <span class="w-2 h-2 rounded-full bg-coral"></span>
    <div>
      <p class="text-ink font-medium">Tunde</p>
      <p class="text-mist text-sm">Birthday · Jun 24</p>
    </div>
  </div>
  <span class="text-success text-sm font-medium">Synced</span>
</div>
```

**Avatar stack** (signature secondary element — shows who's "in" your circle, visible on dashboard header and landing social proof if you want it)
```html
<div class="flex -space-x-3">
  <div class="w-9 h-9 rounded-full bg-bloom-pink border-2 border-white flex items-center justify-center text-ink text-sm font-semibold">T</div>
  <div class="w-9 h-9 rounded-full bg-bloom-peach border-2 border-white flex items-center justify-center text-ink text-sm font-semibold">A</div>
  <div class="w-9 h-9 rounded-full bg-[#F0F0EE] border-2 border-white flex items-center justify-center text-mist text-sm font-semibold">+12</div>
</div>
```
No real photos needed (guests don't upload one) — initials on soft pastel fills, same bloom palette. This solves the "people connecting" motif from the references without needing stock photography, which would read as AI slop immediately.

**Inline-editable field** (Settings — Name, Slug)
```html
<!-- Resting state -->
<div class="group flex items-center justify-between py-1">
  <div>
    <p class="text-mist text-xs font-medium uppercase tracking-wide">Name</p>
    <p class="text-ink font-medium">The Matrix House</p>
  </div>
  <button class="text-mist text-sm opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
</div>

<!-- Editing state -->
<div class="py-1">
  <p class="text-mist text-xs font-medium uppercase tracking-wide mb-1">Name</p>
  <div class="flex items-center gap-2">
    <input
      class="flex-1 bg-[#F0F0EE] rounded-sm px-3 py-2 text-ink focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors"
      autofocus
    />
    <span class="text-success text-lg">✓</span> <!-- shown only on confirmed save, fades out after 1.2s -->
  </div>
  <p class="text-mist text-xs mt-1">Press Enter to save, Esc to cancel</p>
</div>
```
Tap/click the value itself (not just a separate edit icon) to enter editing mode — the whole row is the target, not a small pencil icon, since that matters on mobile touch targets. Save fires on blur or Enter. Escape reverts to the last saved value with no confirmation needed (nothing destructive happened). The checkmark is the only "success" signal — no toast, no banner, for a save this small.

**Copy-feedback button** (used for share link, ICS feed URL — anywhere something gets copied)
```html
<!-- Resting -->
<button class="text-coral text-sm font-medium px-3 py-1.5 active:scale-[0.97] transition-transform">
  Copy
</button>

<!-- Copied (for 2 seconds, then reverts automatically) -->
<button class="text-success text-sm font-medium px-3 py-1.5 flex items-center gap-1">
  <span>✓</span> Copied
</button>
```
Always reverts on its own after 2 seconds — never requires the person to do anything to dismiss it. This exact pattern is used everywhere something gets copied, no exceptions and no variations.

**Animated segmented tabs** (List / Wall — upgrades the static underline already in the dashboard)
```html
<div class="relative flex gap-6 border-b border-hairline">
  <button class="pb-3 text-sm font-semibold text-ink relative">
    List
    <span class="absolute -bottom-px left-0 right-0 h-[2px] bg-coral transition-all duration-200"></span>
  </button>
  <button class="pb-3 text-sm font-medium text-mist">Wall</button>
</div>
```
The underline slides between tabs on click (animate the `left`/`width` of the active indicator, 200ms ease-out) rather than snapping — this one detail is what separates "functional tabs" from "tabs that feel native."

**Skeleton loader** (dashboard list/wall while data is loading — replaces a blank flash)
```html
<div class="bg-surface rounded-md p-4 shadow-soft flex items-center gap-3 animate-pulse">
  <div class="w-2 h-2 rounded-full bg-hairline"></div>
  <div class="flex-1 space-y-2">
    <div class="h-4 bg-hairline rounded w-1/3"></div>
    <div class="h-3 bg-hairline rounded w-1/2"></div>
  </div>
</div>
```
Show 3 of these stacked while fetching, never a spinner alone and never a blank white screen.

**Inline confirmation expansion** (replaces every browser `confirm()` — slug change, token regen, delete event)
```html
<!-- Resting -->
<button class="text-coral text-sm font-medium">Regenerate feed token</button>

<!-- Expanded, in place, pushes content below it down rather than overlaying -->
<div class="bg-[#FFF4F0] rounded-sm p-3 mt-2">
  <p class="text-ink text-sm font-medium">Regenerate your feed token?</p>
  <p class="text-mist text-xs mt-1">Your current Apple Calendar/Outlook subscription will stop working until you re-subscribe with the new link.</p>
  <div class="flex gap-2 mt-3">
    <button class="bg-coral text-white text-sm font-semibold rounded-pill px-4 py-2 active:scale-[0.97] transition-transform">Yes, regenerate</button>
    <button class="text-mist text-sm font-medium px-4 py-2">Cancel</button>
  </div>
</div>
```
This expands in place directly below the triggering control, pushing the rest of the page down with a brief height transition — never a modal overlay, never the browser's native dialog. The destructive action's actual consequence is named explicitly in the copy (what breaks, not just "are you sure?").

**Toast** (used only for actions that happen somewhere the person isn't looking — e.g. a background calendar sync retry succeeding)
```html
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm font-medium px-4 py-3 rounded-pill shadow-lg flex items-center gap-2">
  <span class="text-success">✓</span> Synced to your calendar
</div>
```
Auto-dismisses after 3 seconds, slides up on entry. Used sparingly — most actions in this app should confirm inline (checkmark, button state change) rather than via toast. Reserve toast specifically for things that happened slightly out of view.

---

## 6. Motion

One moment only: on successful submission, the glass widget card scales from 0.96→1 with a slight blur-to-sharp settle (150ms ease-out), and the coral confirmation line fades up 80ms after. Everything else — list items, button presses — uses the `active:scale-[0.97]` micro-press already defined above and nothing more. No scroll-triggered reveals, no staggered list animations, no hover glows.

---

## 7. Where each mode applies

| Screen | Mode | Notes |
|---|---|---|
| Landing hero | Glass | The date widget component, front and center |
| Public submission form | Flat white, on a `--canvas` background | Functional, needs to be fast to fill on mobile |
| Success screen | Glass | Same widget component, now showing their actual submitted date |
| Dashboard | Flat white | List cards, avatar stack in header |
| Settings | Flat white | Plain, utilitarian |

---

## 7.5 The One Deliberate Exception: "Up Next"

Section 0 says glass is for moments, flat-white is for management, never mixed. The dashboard breaks this once, on purpose: a small "Up Next" card sits at the very top, above the List/Wall tabs, using the glass widget treatment at a reduced scale even though everything below it is flat-white.

```html
<div class="relative rounded-xl2 p-4 overflow-hidden bg-gradient-bloom mb-6">
  <div class="backdrop-blur-xl bg-white/55 border border-white/60 rounded-sm p-4">
    <p class="text-mist text-xs font-medium uppercase tracking-wide">Up next</p>
    <p class="text-ink text-2xl font-bold tracking-tight mt-1">Tunde's birthday</p>
    <p class="text-coral text-sm font-medium mt-1">in 12 days · Jun 24</p>
  </div>
</div>
```

Why this is worth breaking the rule for, specifically: the management screen is otherwise pure utility, which is correct for a list of 50+ entries — but it means the product can go cold and forgettable, just a dashboard you check. This one card is what makes opening Dottd feel like checking on something alive rather than auditing a spreadsheet. It's allowed precisely because it's singular and small — one instance, reduced scale, never repeated elsewhere on the same screen. If this starts feeling like it needs a second glass moment on the same page, that's a sign to cut something instead of adding more glass.

Shown only when at least one upcoming date exists. When the list is empty, this space is replaced by the empty-state CTA instead (Section 9 of the feature spec covers the exact copy).

---

*Hand this file to Claude Code alongside the build spec. Every class above is real Tailwind — it can be copy-pasted directly into components, not just used as reference.*
