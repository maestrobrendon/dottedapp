import { createEvents, type EventAttributes } from "ics";
import type { Event } from "@prisma/client";

function buildIcsEvent(event: Event, ownerSlug: string): EventAttributes {
  const year = event.year ?? new Date().getFullYear();
  const start: [number, number, number] = [year, event.month, event.day];
  const summary =
    event.eventType === "BIRTHDAY"
      ? `${event.submitterName}'s Birthday`
      : event.eventType === "ANNIVERSARY"
        ? `${event.submitterName}'s Anniversary`
        : event.eventType === "CEREMONY"
          ? (event.title ?? `${event.submitterName}'s Ceremony`)
          : (event.title ?? `${event.submitterName}'s Event`);

  const descriptionParts: string[] = [];
  if (event.note) descriptionParts.push(event.note);
  if (event.imageUrl) {
    const base = process.env.NEXTAUTH_URL ?? "";
    descriptionParts.push(`See photo: ${base}/u/${ownerSlug}/event/${event.id}`);
  }

  return {
    start,
    startInputType: "local",
    duration: { days: 1 },
    title: summary,
    description: descriptionParts.join("\n") || undefined,
    uid: `${event.id}@dottd`,
    ...(event.isRecurring
      ? { recurrenceRule: "FREQ=YEARLY" }
      : {}),
  };
}

export function generateIcsFeed(
  events: Event[],
  ownerSlug: string,
): string {
  const icsEvents = events.map((e) => buildIcsEvent(e, ownerSlug));

  const { error, value } = createEvents(icsEvents);
  if (error || !value) {
    throw new Error(`ICS generation failed: ${error?.message}`);
  }
  return value;
}
