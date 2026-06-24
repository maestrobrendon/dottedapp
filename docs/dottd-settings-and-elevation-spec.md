# Dottd — Settings, My Important Dates & Elevation Spec
**Companion to dottd-spec.md and dottd-design-system.md — read both first, this assumes their conventions.**
**This replaces a v2 spec that was lost in a deleted chat. Rebuilt from scratch, same intent, more thorough.**

---

## 0. Scope

Two layers, build in this order:

1. **P0 — things that are currently broken or missing entirely:** editable name, editable slug, self-added dates ("My Important Dates"), owner avatar.
2. **Elevation layer — what makes this feel like a finished product instead of a working prototype:** Up Next widget, relative-time/sectioned list, share menu, copy feedback, inline confirmation, skeleton states, empty-state CTA, onboarding coachmark.

Every component referenced below (`Copy-feedback button`, `Inline-editable field`, `Inline confirmation expansion`, `Skeleton loader`, `Up Next` widget, `Animated segmented tabs`, `Toast`) is fully specified with exact Tailwind markup in `dottd-design-system.md` Sections 5–7.5. Don't improvise variations on these — use them exactly as written there.

---

## 1. Schema Change Required — STOP, read this before running anything

This feature set needs one migration. **Do not run it without explicit go-ahead — show the proposed schema diff first and wait for confirmation, same as any other migration.**

```prisma
model User {
  // ...existing fields unchanged...
  onboardingSeen Boolean @default(false)   // NEW — gates the one-time post-signup prompt
}

model Event {
  // ...existing fields unchanged...
  source EventSource @default(GUEST)        // NEW — distinguishes self-added from submitted
}

enum EventSource {                            // NEW
  GUEST
  OWNER
}
```

Rationale for naming: `source` rather than a boolean `addedBySelf`, because a boolean only ever answers one yes/no question, and this is a place a third value (e.g. an imported source, down the line) is plausible. Matches the existing `EventType` enum convention already in the schema rather than introducing a different pattern.

For `Event` rows where `source = OWNER`: set `submitterName` to the **owner's own name** automatically when the row is created. This keeps every downstream consumer (event list rendering, ICS feed generation, Google Calendar push) working unchanged — they all already render `submitterName`, none of them need new conditional logic to handle a self-added row differently.

---

## 2. Editable Name (Settings §1)

Replace the static name display in Settings with the **Inline-editable field** component from the design system, exact markup as specified there.

**Validation:**
- 1–60 characters
- Must contain at least one letter (rejects pure emoji/whitespace/numbers-only)
- Trim leading/trailing whitespace before validating and before saving

**Behavior:**
- Tapping the value (not a separate icon) enters edit mode
- Save fires on blur or Enter
- Escape cancels, reverts to last saved value, no confirmation dialog (nothing destructive)
- On successful save: checkmark appears per the design system spec, fades after 1.2s
- On validation failure: inline error text below the field in `--coral-deep`, field stays in edit mode, nothing saved
- This is a PATCH to a new or existing `/api/account` route, authenticated, scoped to `session.user.id` — same access-control convention as everything else in `dottd-spec.md` Section 5.3

---

## 3. Editable Public Link / Slug (Settings §1)

This is the one with real complexity — work through it carefully.

**UI:** the slug segment of the full URL (`/u/[slug]`) becomes editable inline, using the same Inline-editable field pattern, but with these additions on top of the base component:

- As the person types, debounce **400ms** then check availability against the database
- Status indicator next to the field while editing:
  - Checking: small spinner or pulsing dot, `text-mist`, label "Checking..."
  - Available: `text-success`, label "Available"
  - Taken: `text-coral-deep`, label "Already taken"
  - Invalid: `text-coral-deep`, label naming the specific rule broken (see constraints below)
- An explicit **Save** button appears only once the value has changed from the original AND passed validation AND availability check — never show Save on a value that would fail
- Before the change actually commits, use the **Inline confirmation expansion** component (not browser `confirm()`) — the consequence to name explicitly in that confirmation: *"Your current share link will stop working immediately. Anyone you've already sent the old link to won't be able to use it."*

**Constraints:**
- 3–40 characters
- Lowercase letters, numbers, hyphens only (`/^[a-z0-9-]+$/`) — auto-lowercase whatever they type rather than rejecting uppercase outright, since that's friendlier than an error
- Can't start or end with a hyphen
- Reserved word list, case-insensitive, rejected outright: `api`, `app`, `admin`, `settings`, `dashboard`, `login`, `logout`, `signin`, `signup`, `auth`, `u`, `wall`, `feed`, `success`, `event`, `help`, `support`, `about`, `terms`, `privacy`, `dottd`

**Availability check route:** `GET /api/account/check-slug?value=...` — public is fine here (it's just existence-checking, not exposing anything sensitive), but still rate-limited (reuse the rate-limiting pattern from `dottd-spec.md` Section 5.4 — this endpoint gets hit on every keystroke after debounce, so cap it generously but not unlimited, e.g. 30 requests/min per IP).

---

## 4. My Important Dates (the big one)

This is the owner adding dates **about themselves**, not collected from others. Both self-added and submitted dates flow into the same `Event` table, the same dashboard list, the same Wall view, and **the same single ICS feed — do not build a second feed.** The only difference is the `source` field from Section 1, and that self-added rows skip the public submission flow entirely.

### 4.1 Settings UI — add/list/delete

New section in Settings, below Account, above Calendar Feed:

```
MY IMPORTANT DATES
A birthday, anniversary, or anything else worth remembering about yourself.

[+ Add a date]

— list of existing self-added dates, each row: —
🎂 My birthday · Jul 14          [Delete]
💍 Wedding anniversary · Sep 2    [Delete]
```

- "+ Add a date" expands an inline form (reuse the same EventTypePicker segmented control and MonthDayPicker components already built for the public submission form — don't build a second version of these)
- Delete uses the **Inline confirmation expansion** component, consequence named explicitly: *"This will remove it from your calendar too."*
- These rows render in the existing flat-white card style already used for the dashboard list (Section 5 of the design system), just inside a Settings card instead

### 4.2 New authenticated route

`POST /api/events/self` — authenticated, creates an `Event` row with `source: OWNER` and `userId` from the session, `submitterName` auto-set to the owner's current name. Everything downstream (Google Calendar push, ICS feed inclusion) reuses the exact same logic already written for guest-submitted events in `dottd-spec.md` Section 6 — no parallel code path, just a different entry point into the same pipeline.

`DELETE /api/events/[id]` — already exists per the build spec's route list for dashboard management; confirm it works for both `source` values, scoped by `userId` same as always.

### 4.3 One-time post-signup prompt

Shown exactly once, immediately after a person's first successful sign-in, gated by the new `onboardingSeen` field from Section 1.

**Screen:** `/onboarding`, full-screen, Glass mode per the design system (this is a moment, not management).

```
[Glass widget card, empty state version — no date filled in yet]

"Want to add your own birthday?"
"We'll save it to your calendar and include it if you ever share your 
link with people who collect dates the same way."

[Single month/day picker]

[Add to my calendar]  (primary, gradient-sunrise)
[Skip for now]          (secondary, text-only)
```

- Either button sets `onboardingSeen: true` and redirects to `/dashboard`
- "Add to my calendar" with a value filled in submits via the same `/api/events/self` route from 4.2 before redirecting
- "Skip for now" just redirects — this screen never appears again regardless of what they choose, intentionally, since a repeating prompt is exactly the kind of nagging this product's restraint shouldn't have room for

---

## 5. Owner Avatar (Settings §1, small addition)

`User.image` already exists in the schema (NextAuth populates it from the Google account photo by default) — **no migration needed for this one.** Add the ability to override it:

- Settings Account card gets a small circular avatar tile, tappable, opens the same Cloudinary signed-upload flow already built for guest photo submissions (`dottd-spec.md` Section 5.6) — reuse the upload component, don't build a second one
- On successful upload, PATCH `/api/account` updates `User.image` to the new Cloudinary URL, same route as the name edit in Section 2
- This photo is what shows on the person's own public submission page (`/u/[slug]`) — worth a one-line mention in that page's copy update: *"[Name] wants to remember your birthday 🎂"* can now show their actual photo next to that line instead of nothing

---

## 6. Elevation Layer

### 6.1 Up Next widget
Exact component and placement rule in `dottd-design-system.md` Section 7.5. Pulls the single soonest-upcoming `Event` across both sources (`GUEST` and `OWNER`), computed server-side (don't ship all events to the client and sort client-side — compute "next" in the query). Recurring yearly events need their *next occurrence* computed relative to today, not just the stored month/day compared naively.

### 6.2 Relative time + sectioned list
Every event row in the dashboard list shows relative time alongside the date: `"in 12 days"`, `"tomorrow"`, `"today!"`, `"in 3 months"`. The list itself sections into three groups with simple headers — **This week / This month / Later** — rather than one flat chronological list. Same flat-white card component as already exists, just grouped under section headers (`text-mist text-xs font-medium uppercase tracking-wide`, matching the Settings section label style for consistency).

### 6.3 Share menu
The single "Copy" button next to the share link becomes a small menu (a simple dropdown/popover is fine, doesn't need to be fancy): **Copy Link / Share via WhatsApp / Share via SMS**. WhatsApp opens `https://wa.me/?text=` with the link pre-filled into a short pre-written message (see microcopy below). SMS uses the `sms:?body=` URI scheme. This is the highest-leverage addition in the whole elevation layer given the actual distribution pattern for this product — links going out to dozens or hundreds of people, almost entirely over WhatsApp.

### 6.4 Copy feedback, everywhere
Apply the **Copy-feedback button** component exactly as specified in the design system to: the share link copy button, the ICS feed URL copy button (both the dashboard one and the Settings one), and the new slug-availability "copy your new link" moment if one ends up existing. No exceptions, no slightly-different variants.

### 6.5 Inline confirmation, everywhere destructive
Replace every remaining browser `confirm()` call in the codebase — slug change (Section 3), feed token regeneration (already in Settings), event deletion, self-added date deletion (Section 4.1) — with the **Inline confirmation expansion** component. Search the codebase for `confirm(` before considering this done; don't rely on memory of where they all are.

### 6.6 Skeleton loading states
Dashboard list and Wall view both show the **Skeleton loader** component (3 stacked) while their initial fetch is in flight, never a blank screen or a bare spinner.

### 6.7 Empty state, upgraded
Current copy is "No dates saved yet. Share your link to start collecting." — keep that line, but add an actual button beneath it, not just prose: a primary button reading "Copy your link" that performs the same action as the Copy-feedback button above, plus the Share menu from 6.3 available right there too. The empty state should let someone act immediately, not just describe what to do elsewhere on the page.

### 6.8 First-time coachmark
When the dashboard has zero events (regardless of `onboardingSeen`), show a small pointer/callout near the share link reading the exact copy from Section 7 below. No dismiss button needed — it disappears naturally the moment the first event exists, since its only condition is `events.length === 0`. No new field required for this one.

---

## 7. Exact Microcopy — use verbatim, don't paraphrase

| Context | Copy |
|---|---|
| Name field validation error | "Name needs at least one letter." |
| Slug — checking | "Checking..." |
| Slug — available | "Available" |
| Slug — taken | "Already taken" |
| Slug — invalid character | "Only lowercase letters, numbers, and hyphens." |
| Slug — reserved word | "That word's reserved — try another." |
| Slug change confirmation | "Your current share link will stop working immediately. Anyone you've already sent the old link to won't be able to use it." |
| Feed token regen confirmation | "Your current Apple Calendar/Outlook subscription will stop working until you re-subscribe with the new link." |
| Self-added date delete confirmation | "This will remove it from your calendar too." |
| My Important Dates section header | "MY IMPORTANT DATES" |
| My Important Dates description | "A birthday, anniversary, or anything else worth remembering about yourself." |
| Onboarding prompt headline | "Want to add your own birthday?" |
| Onboarding prompt subtext | "We'll save it to your calendar and include it if you ever share your link with people who collect dates the same way." |
| Onboarding primary button | "Add to my calendar" |
| Onboarding skip button | "Skip for now" |
| Empty state (unchanged) | "No dates saved yet. Share your link to start collecting." |
| Empty state button | "Copy your link" |
| First-time coachmark | "This is your link — copy it and send it to anyone." |
| WhatsApp share pre-filled text | "Hey! Save your birthday here so I never forget it 🎂" |
| Up Next label | "Up next" |
| Copy button (resting) | "Copy" |
| Copy button (confirmed) | "Copied" |

---

## 8. Build Order

1. **Show the schema diff from Section 1, wait for go-ahead, then run the migration.** Nothing else in this spec depends on the migration except 4 and 5's `onboardingSeen` gate — Sections 2, 3, and most of 6 can be built and shown before the migration is approved if you want to parallelize.
2. Editable Name (Section 2) — smallest, fully self-contained, good first proof that the inline-edit pattern works end to end.
3. Editable Slug (Section 3) — builds directly on the pattern from step 2, adds the debounce/availability layer on top.
4. My Important Dates UI + route (Section 4.1, 4.2) — depends on the migration.
5. Post-signup prompt (Section 4.3) — depends on 4.2 existing first.
6. Owner avatar (Section 5) — independent of everything above, can slot in anytime after step 2.
7. Up Next widget, relative time/sectioning, share menu, copy feedback, inline confirmation sweep, skeleton states, empty-state upgrade, coachmark (Section 6, all sub-items) — last, since these are polish on top of data flows that need to already exist and be stable.

Show each numbered piece as you finish it rather than building the whole list before I see any of it — same review rhythm as the rest of this build.

---

*Hand this file to Claude Code alongside dottd-spec.md and dottd-design-system.md. The migration in Section 1 is the only thing in here that needs explicit approval before running — everything else can proceed through the build order above.*
