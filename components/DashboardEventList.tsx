"use client";

import { useState } from "react";
import type { Event } from "@prisma/client";
import { EventCard } from "./EventCard";
import { ShareMenu } from "./ShareMenu";
import {
  nextOccurrenceDate,
  daysUntil,
  relativeLabel,
  sectionFor,
  type Section,
} from "@/lib/dates";

const SECTIONS: Section[] = ["This week", "This month", "Later"];

interface EnrichedEvent {
  event: Event;
  nextDate: Date;
  days: number;
}

function enrich(events: Event[], today: Date): EnrichedEvent[] {
  const result: EnrichedEvent[] = [];
  for (const event of events) {
    const nextDate = nextOccurrenceDate(
      event.month,
      event.day,
      event.year,
      event.isRecurring,
      today,
    );
    if (!nextDate) continue;
    result.push({ event, nextDate, days: daysUntil(nextDate, today) });
  }
  return result.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
}

interface Props {
  initialEvents: Event[];
  shareUrl?: string;
}

export function DashboardEventList({ initialEvents, shareUrl }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enriched = enrich(events, today);

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (events.length === 0) {
    return (
      <div className="py-10 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-ink font-medium">No dates saved yet.</p>
          <p className="text-mist text-sm">Share your link to start collecting.</p>
        </div>
        {shareUrl && <ShareMenu url={shareUrl} label="Your share link" />}
      </div>
    );
  }

  const bySection = new Map<Section, EnrichedEvent[]>();
  for (const item of enriched) {
    const sec = sectionFor(item.days);
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec)!.push(item);
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const items = bySection.get(section);
        if (!items?.length) return null;
        return (
          <div key={section} className="space-y-3">
            <p className="text-mist text-xs font-medium uppercase tracking-wide">
              {section}
            </p>
            {items.map(({ event, days }) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={removeEvent}
                relativeTime={relativeLabel(days)}
                section={section}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
