# Dottd — Full Build Specification
**Owner:** Maestro Brendon / The Matrix HQ
**Purpose:** Implementation-ready spec for Claude Code in VS Code
**Version:** 3.0 — adds photo uploads, visual gallery view, mobile-first rules, error-minimization strategy

---

## 1. What This Is

A tool where you create one account, get a shareable link, and send it to anyone — friends, family, clients, collaborators. They fill a tiny mobile-first form: name, event type, date, optional note, **optional photo** — and it lands in YOUR calendar automatically. You also get a visual wall where you can browse everyone who's saved a date with you, photo-forward, not just a plain list.

Works for birthdays (recurring, no year needed), anniversaries (recurring), one-off events like a ceremony (specific date, doesn't repeat), and fully custom events. No login required for submitters. You're the only account holder.

---

## 2. The Calendar Reality (unchanged — read before building)

| Calendar | How sync works | Setup needed |
|---|---|---|
| Google Calendar | Direct push via Calendar API (OAuth) | None — automatic the moment you sign in |
| Apple Calendar | No public write API exists. Solved via a personal **ICS subscription feed** (`webcal://...`) | One-time: add the feed URL in Settings once |
| Outlook / Microsoft 365 | Same ICS feed approach | One-time, same as above |
| Anything else | Same ICS feed — universal standard | One-time |

Photos do not travel into the calendar event itself — most calendar apps render descriptions as plain text and don't reliably display embedded images. Instead, the Google Calendar event description includes a link back to that event's page on Dottd, where the photo and note are shown properly. This is the honest, reliable way to do it rather than something that looks broken half the time.

---

## 3. Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript, strict mode on — use whatever current stable `create-next-app` installs rather than forcing an older major version. Follow current App Router conventions (async `params`/`searchParams`, current caching defaults) instead of working around them to mimic older behavior.
- **DB:** Neon (Postgres, via Vercel Marketplace integration) + Prisma — **pinned to v5.x**, not v7. One command (`vercel install neon`) provisions it and auto-injects `DATABASE_URL` into your project — no separate dashboard, no manually hunting for a pooler URL.
- **Storage:** Cloudinary (photo uploads) — manual signup, not auto-injected like the Vercel Marketplace pieces, but you already know this service from Talking Hands and Inaara Woman, so the setup friction is familiar rather than new
- **Auth:** NextAuth v5, Google OAuth provider, Phase 1
- **Calendar:** Google Calendar API v3 (push), `ics` npm package (feed generation)
- **Image handling:** Cloudinary upload presets handle resize/compression/format conversion server-side — no local image library (`sharp` or otherwise) needed, one less dependency to version-pin. Next.js `<Image>` still used for optimized delivery of the resulting URL.
- **Styling:** Tailwind CSS v4 (CSS-based `@theme` config, not `tailwind.config.ts`), mobile-first breakpoints (see Section 9)
- **Hosting:** Vercel
- **Rate limiting:** Upstash Redis
- **Validation:** Zod on every API route, client and server side, no exceptions
- **Secrets:** Vercel encrypted env vars, never committed

---

## 4. Database Schema (Prisma)

```prisma
model User {
  id                 String   @id @default(cuid())
  email              String   @unique
  name               String?
  image              String?
  slug               String   @unique          // public link: /u/[slug]
  feedToken          String   @unique @default(uuid()) // secret token for ICS feed URL
  googleAccessToken  String?  @db.Text           // encrypted at rest
  googleRefreshToken String?  @db.Text           // encrypted at rest
  googleTokenExpiry  DateTime?
  createdAt          DateTime @default(now())
  events             Event[]
}

model Event {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  submitterName   String                        // who this event is FOR (e.g. "Tunde")
  eventType       EventType   @default(BIRTHDAY)
  title           String?                       // for custom events: "Baby Naming Ceremony"
  note            String?     @db.Text
  month           Int                           // 1-12, always required
  day             Int                            // 1-31, always required
  year            Int?                           // only for one-off events with a real year
  isRecurring     Boolean     @default(true)
  imageUrl        String?                        // public URL after upload + resize
  imagePublicId   String?                        // Cloudinary public_id, used to delete via cloudinary.uploader.destroy()
  googleEventId   String?
  calendarSynced  Boolean     @default(false)
  submitterIp     String?                        // hashed, abuse tracing only — never shown in UI
  createdAt       DateTime    @default(now())
}

enum EventType {
  BIRTHDAY
  ANNIVERSARY
  CEREMONY
  CUSTOM
}
```

Notes:
- `imagePublicId` is separate from `imageUrl` so a delete from the dashboard can call Cloudinary's destroy API cleanly, not just hide the row while the file sits orphaned in your Cloudinary account.
- `submitterIp` is stored hashed (one-way) — enough to rate-limit and trace abuse, not enough to identify someone from the database alone.

---

## 5. Security Infrastructure

1. **Auth:** NextAuth, Google OAuth only. JWT session, httpOnly cookies, secure flag in production.
2. **Token encryption:** `googleRefreshToken`/`googleAccessToken` encrypted with AES-256 before writing to DB. This is the single most sensitive secret in the system.
3. **Access control — application-level, not database-level.** Without Supabase, there's no built-in Row Level Security, so every query that reads or writes a user's data must explicitly filter by the signed-in user's ID from the NextAuth session (`where: { userId: session.user.id }`) — no exceptions, no relying on the database to catch a missing filter. This is simpler to set up than RLS but less foolproof: a forgotten `where` clause is a real bug, not something the database blocks for you. Worth a deliberate code review pass over every dashboard/API route specifically checking this before launch. The public submission route is the one place that's allowed to write without a session — it's scoped by the `slug` in the URL instead, never by anything the client claims about itself.
4. **Rate limiting (Upstash):**
   - Public submit endpoint: 10 requests / 10 min per IP
   - Image upload: 5 requests / 10 min per IP (tighter — uploads cost more and carry more abuse risk than text)
   - ICS feed: 30 requests / hour per token
5. **Input validation (Zod):** Every field validated server-side. Name max 80 chars, note max 300 chars, month/day cross-validated (no Feb 30), year range sane if present.
6. **Photo upload security — this is a public, unauthenticated upload point, so it gets its own layer:**
   - Use **signed uploads**: your server generates a one-time signature using the Cloudinary API secret (never exposed client-side), the browser uploads directly to Cloudinary with that signature — your server never has to proxy the raw file through itself
   - Restrict the **upload preset** to allowed formats only (JPEG, PNG, WebP) — reject everything else including SVG at the preset level, before it ever reaches your code
   - Max file size enforced both in the upload preset and re-checked server-side: 5MB before transformation
   - Cloudinary strips EXIF/metadata by default on most transformation pipelines — confirm this is on, since that's what removes embedded GPS location from a submitter's photo (a real privacy leak otherwise)
   - Cloudinary offers add-on moderation (WebPurify, Amazon Rekognition) that can auto-flag inappropriate uploads before they ever reach your dashboard — worth turning on given uploads are public and unauthenticated, even if it's a Phase 2 add rather than a 12-hour-window must-have
   - You (the owner) can remove any photo from the dashboard at any time — submissions don't get a second chance to re-upload, they'd just resubmit
7. **CSRF:** Default Next.js + NextAuth protection on all state-changing routes.
8. **Feed token security:** Long random UUID, not the public slug. Regeneratable from settings.
9. **Headers:** CSP, X-Frame-Options, X-Content-Type-Options in `next.config.mjs`.
10. **Env validation:** Startup check (`lib/env.ts`) that throws immediately if required secrets are missing.

---

## 6. Calendar Integration Logic

### Google push (on submission)
```
1. Look up event owner's encrypted refresh token, decrypt, refresh if expired
2. Build calendar event:
   - Birthday/Anniversary: RRULE:FREQ=YEARLY, no end date
   - One-off: single event on month/day/year
   - Description includes a link to /u/[slug]/event/[id] if a photo was attached
3. POST to Google Calendar API
4. Store returned googleEventId, set calendarSynced = true
5. If it fails: still save to DB, calendarSynced = false, retry on next dashboard load
```

### Universal ICS feed
```
Route: /api/feed/[feedToken]/calendar.ics
- Generates valid .ics with VEVENT blocks, RRULE for recurring entries
- Same description-link pattern for photos as above
- Served as text/calendar, subscribed once via webcal://
```

---

## 7. The Wall — Visual Gallery View

This is the "cool way to see everyone who's saved a date" feature. It's a private, owner-only view (not shown to guests submitting — a guest's photo and birthdate are visible only to you, never to other guests, by default).

- Route: `/dashboard/wall`
- Layout: responsive grid of mini glass-widget cards (same component from the design system — frosted card, big tabular date, now with the photo as the card's background image if one was provided, or the initials-avatar fallback if not)
- Sort: upcoming first by default, with a toggle to sort alphabetically or by date-added
- Tapping a card opens the full event detail (photo, note, exact date, sync status)
- This view and the plain list view (`/dashboard`) are two tabs of the same data — the list is for management (delete, check sync status), the wall is for browsing and the feeling of "look at everyone who remembered to share with me"

---

## 8. Routes

**Pages**
- `/` — landing page
- `/dashboard` — list view, sync status, share link, feed link
- `/dashboard/wall` — visual gallery view
- `/dashboard/settings` — regenerate feed token, disconnect Google
- `/u/[slug]` — public submission form
- `/u/[slug]/success` — confirmation screen
- `/u/[slug]/event/[id]` — public-facing single event view, linked from calendar descriptions (read-only, no edit ability, just enough to show the photo/note the calendar app can't)

**API**
- `/api/auth/[...nextauth]`
- `/api/submit/[slug]` — POST, handles form submission + image upload + Google push
- `/api/events` — GET/DELETE for dashboard
- `/api/feed/[feedToken]/calendar.ics` — GET, public ICS feed

---

## 9. Mobile-First Rules

This is the primary surface — most submitters tap the link from a text message on a phone, and you'll check the dashboard from your phone too most of the time.

- Build every screen at 375px width first, then scale up — never the reverse
- Breakpoints: base (mobile) → `md:` 768px (tablet/dashboard secondary layout) → `lg:` 1024px (desktop wall grid goes from 2 columns to 4)
- Minimum touch target: 44x44px on every tappable element, no exceptions — buttons, dropdown pills, the photo upload tile
- Photo upload control on the form: a single large tappable tile that opens the native camera/photo picker (`<input type="file" accept="image/*" capture="environment">` won't force camera-only — let the OS picker offer both camera and library)
- Show a compressed local preview immediately on selection, before the network upload finishes — never leave the submitter staring at a blank tile wondering if it worked
- Sticky submit button at the bottom of the viewport on mobile once the form is mid-scroll, so it's always reachable without scrolling back up
- Wall view: single column on mobile, scrollable, cards full-width; grid only kicks in at `md:` and above
- Test on actual mobile Safari, not just Chrome devtools mobile emulation — Safari's handling of `backdrop-filter` and file inputs differs in ways that matter for this build

---

## 10. Error-Minimization Strategy

You asked for this directly, so it's its own section rather than scattered notes.

1. **TypeScript strict mode, no `any`.** Every API response, every Prisma model, every form value is typed end-to-end. Most runtime bugs in this kind of build are type mismatches between what the form sends and what the API expects — strict mode catches them at compile time instead of in production.
2. **Zod schemas shared between client and server.** Define the validation once per form, import it in both the React component and the API route. Two separate hand-written validations drift apart over time and that drift is where bugs hide.
3. **Pin every version that's bitten this kind of project before.** Prisma 5.x (not 7), Node 20 LTS, exact versions in `package.json` (no `^` on Prisma or NextAuth specifically — both have had breaking minor-version changes before).
4. **Idempotent submission handling.** If a phone's network drops mid-submit and the form retries, the same submission shouldn't create a duplicate event. Generate a client-side idempotency key per form session and check it server-side before inserting.
5. **Image upload never blocks the core submission.** If the photo upload fails (slow connection, file too large, whatever), the name/date/note still save and sync to the calendar. The photo is enhancement, not a dependency — treat it as a separate, non-blocking step in the submit flow even though it's one form.
6. **Calendar push failures degrade gracefully, never silently.** Already covered in Section 6 — `calendarSynced: false` plus a visible retry path on the dashboard, not a swallowed error.
7. **Error boundaries around every async-heavy component** (the form, the wall grid, the dashboard list) so one bad event entry can't blank the whole page.
8. **Structured logging, not console.log scattered everywhere.** One logging utility (`lib/logger.ts`) used consistently, so when something breaks at 11pm before a deadline, the logs actually tell you where.
9. **Staging before production.** Deploy to a Vercel preview URL first, run the full pre-launch checklist there, then promote to production. Don't debug live on the domain you're about to share with a hundred people.
10. **One feature branch per build phase**, not one giant commit. If something breaks late, you can isolate which phase introduced it instead of bisecting the whole history.

---

## 11. Folder Structure

```
/app
  page.tsx
  /dashboard
    page.tsx
    /wall/page.tsx
    /settings/page.tsx
  /u/[slug]
    page.tsx
    /success/page.tsx
    /event/[id]/page.tsx
/app/api
  /auth/[...nextauth]/route.ts
  /submit/[slug]/route.ts
  /events/route.ts
  /feed/[feedToken]/calendar.ics/route.ts
/lib
  google-calendar.ts
  db.ts                  // Prisma client singleton
  cloudinary.ts            // upload signature generation, delete helper
  auth.ts
  crypto.ts
  ics-feed.ts
  validations.ts        // shared Zod schemas
  env.ts
  rate-limit.ts
  logger.ts
/components
  EventCard.tsx
  WallGrid.tsx
  WidgetCard.tsx          // the signature glass component from the design system
  PhotoUploadTile.tsx
  MonthDayPicker.tsx
  EventTypePicker.tsx      // segmented control
  AvatarStack.tsx
  ShareLink.tsx
/prisma
  schema.prisma
```

---

## 12. Environment Variables

```
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TOKEN_ENCRYPTION_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`DATABASE_URL` and `DIRECT_URL` aren't listed here on purpose — `vercel install neon` writes them automatically, both locally and in production. The three Cloudinary variables above are manual, same as everything else in this list — grab them from your Cloudinary dashboard's API Keys page and set them in both `.env.local` and Vercel's Environment Variables settings.

---

## 13. Build Order for Claude Code (sequence matters — this order surfaces config problems before they're buried under feature code)

1. **Scaffold:** `npx create-next-app@latest` (TypeScript, Tailwind, App Router, strict mode). Use whatever current stable versions it installs (Next.js 16, Tailwind v4 as of this build) — don't force older majors to match outdated assumptions. Git init immediately.
2. **Pin Prisma to v5** before writing the schema.
3. **Provision the database:** `vercel install neon` from your project root — this creates the Neon project, links it, and writes `DATABASE_URL`/`DIRECT_URL` straight into `.env.local`. No manual pooler-URL hunting, no separate dashboard to configure.
4. **Write `schema.prisma`**, push it.
5. **Write the query-scoping convention before any route is built**, not after — decide now that every authenticated query filters by `userId` from the session, and hold to it as each route gets written in steps 11–14. This replaces the database-level RLS step from the Supabase version of this plan; the discipline has to live in the code instead.
6. **Set up Cloudinary:** create the account (or reuse your existing one), grab `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` from the dashboard, set them in `.env.local`. Create an upload preset restricted to JPEG/PNG/WebP with a 5MB cap. Do this now so the schema's `imageUrl`/`imagePublicId` fields have somewhere real to point to once you start testing.
7. **`lib/env.ts`** — fail loudly on missing vars before anything else is built on top of a half-configured environment.
8. **`lib/crypto.ts`** — test in isolation before wiring into auth.
9. **NextAuth + Google OAuth** — sign-in working end to end before touching calendar logic.
10. **`lib/google-calendar.ts`** — tested against your own account first.
11. **Public submission form, text fields only** (no photo yet) — wire the full happy path: form → DB → Google push. Get this rock solid before adding upload complexity on top.
12. **Add photo upload** to the form and `/api/submit/[slug]` — this is layered on top of a working text-only flow specifically so a photo-upload bug can't take down the core submission path.
13. **Dashboard list view** — read events, sync status.
14. **Wall/gallery view** — built once the data and images are flowing reliably, since it's the most visually complex screen and benefits from real data to design against.
15. **ICS feed route** — test by actually subscribing it in Apple Calendar.
16. **Security pass:** rate limiting, CSP headers, photo validation/EXIF stripping, as one dedicated pass.
17. **Design pass:** apply the visual system once functionality is fully solid.
18. **Mobile QA pass:** real device testing, not just devtools emulation.
19. **Deploy to Vercel preview**, run the full checklist, then promote to production.

---

## 14. Phase 2 / Later

- Multiple event "campaigns" per user (a dedicated link for one ceremony, with its own deadline)
- Direct Outlook/Microsoft Graph push
- Embeddable widget for your own site
- Email/SMS confirmation to the submitter
- Custom slugs, on-demand single-event `.ics` export
- Basic automated image moderation (flag/blur before it ever reaches your dashboard) — worth prioritizing sooner rather than later given uploads are public and unauthenticated, even if it doesn't make the 12-hour cut
- Reverse sharing (others maintain their own birthday lists)

---

## 15. Pre-Launch Checklist

- [ ] Submit a real birthday end-to-end with a photo, confirm it appears in Google Calendar with yearly recurrence and the description link works
- [ ] Submit a one-off ceremony event, confirm it's a single occurrence, not yearly
- [ ] Submit with no photo at all — confirm the core flow doesn't depend on it
- [ ] Subscribe the ICS feed in Apple Calendar, confirm events appear within a few hours
- [ ] Delete an event from the dashboard, confirm it's removed from Google Calendar and from Cloudinary
- [ ] Try submitting Feb 30 — confirm validation blocks it
- [ ] Try uploading a 20MB file, a `.svg`, and a `.exe` renamed to `.jpg` — confirm all three are rejected cleanly
- [ ] Hit the submit endpoint 11 times in a row from one IP — confirm rate limiting kicks in
- [ ] Hit the upload endpoint 6 times in a row — confirm it's limited tighter than text submissions
- [ ] Confirm refresh token is encrypted in the raw DB column
- [ ] Test the full flow on real mobile Safari: form fill, photo picker, sticky submit button, wall view scrolling
- [ ] Confirm a guest's submission never exposes another guest's photo or birthdate anywhere in the public-facing pages
- [ ] Sign in as a second test Google account, confirm it sees zero events from the first account's dashboard — this is the one check that replaces what RLS used to guarantee automatically

---

*Spec ready for handoff to Claude Code. Build in the order in Section 13 — text-first, photo-second is the key sequencing decision that keeps a media-handling bug from threatening the core feature.*
