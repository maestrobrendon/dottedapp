import { google } from "googleapis";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import type { Event, User } from "@prisma/client";

const CALENDAR_ID = "primary";
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before actual expiry

function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
}

// Returns an OAuth2 client with a valid (refreshed if necessary) access token.
// Side-effect: writes refreshed tokens back to the DB.
async function getAuthedClient(user: User) {
  if (!user.googleRefreshToken) {
    throw new Error(`No refresh token stored for user ${user.id}`);
  }

  const oauth2 = makeOAuthClient();
  const refreshToken = decrypt(user.googleRefreshToken);
  const accessToken = user.googleAccessToken ? decrypt(user.googleAccessToken) : null;
  const expiry = user.googleTokenExpiry;

  const needsRefresh =
    !accessToken ||
    !expiry ||
    expiry.getTime() - Date.now() < TOKEN_EXPIRY_BUFFER_MS;

  if (needsRefresh) {
    oauth2.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2.refreshAccessToken();

    // Persist refreshed tokens
    await db.user.update({
      where: { id: user.id },
      data: {
        googleAccessToken: credentials.access_token
          ? encrypt(credentials.access_token)
          : undefined,
        googleRefreshToken: credentials.refresh_token
          ? encrypt(credentials.refresh_token)
          : undefined,
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined,
      },
    });

    oauth2.setCredentials(credentials);
  } else {
    oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  }

  return oauth2;
}

// Build the all-day date string for the event. For recurring events the year
// is cosmetic (RRULE repeats yearly), so we use current year when none is set.
function allDayDate(month: number, day: number, year?: number | null): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// The day after, because Google Calendar end dates are exclusive for all-day events.
function nextDay(month: number, day: number, year?: number | null): string {
  const y = year ?? new Date().getFullYear();
  const d = new Date(y, month - 1, day + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildSummary(event: Event): string {
  if (event.eventType === "BIRTHDAY") return `${event.submitterName}'s Birthday`;
  if (event.eventType === "ANNIVERSARY") return `${event.submitterName}'s Anniversary`;
  if (event.eventType === "CEREMONY") return event.title ?? `${event.submitterName}'s Ceremony`;
  return event.title ?? `${event.submitterName}'s Event`;
}

function buildDescription(event: Event, ownerSlug: string): string {
  const parts: string[] = [];
  if (event.note) parts.push(event.note);
  if (event.imageUrl) {
    parts.push(
      `\nSee photo: ${process.env.NEXTAUTH_URL}/u/${ownerSlug}/event/${event.id}`,
    );
  }
  return parts.join("\n");
}

// Push a new event to the owner's primary Google Calendar.
// Returns the Google Calendar event ID on success.
export async function pushEventToCalendar(
  event: Event,
  user: User,
  ownerSlug: string,
): Promise<string> {
  const auth = await getAuthedClient(user);
  const calendar = google.calendar({ version: "v3", auth });

  const recurrence = event.isRecurring ? ["RRULE:FREQ=YEARLY"] : undefined;

  const { data } = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: buildSummary(event),
      description: buildDescription(event, ownerSlug) || undefined,
      start: { date: allDayDate(event.month, event.day, event.year) },
      end:   { date: nextDay(event.month, event.day, event.year) },
      recurrence,
    },
  });

  if (!data.id) throw new Error("Google Calendar returned no event ID");
  return data.id;
}

// Remove an event from the owner's primary Google Calendar.
export async function deleteEventFromCalendar(
  googleEventId: string,
  user: User,
): Promise<void> {
  const auth = await getAuthedClient(user);
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
  });
}
