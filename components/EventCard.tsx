"use client";

import { useState } from "react";
import type { Event } from "@prisma/client";
import { InlineConfirmation } from "./InlineConfirmation";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function eventLabel(event: Event): string {
  if (event.eventType === "BIRTHDAY") return `${event.submitterName}'s Birthday`;
  if (event.eventType === "ANNIVERSARY") return `${event.submitterName}'s Anniversary`;
  if (event.eventType === "CEREMONY") return event.title ?? `${event.submitterName}'s Ceremony`;
  return event.title ?? `${event.submitterName}'s Event`;
}

interface Props {
  event: Event;
  onDelete: (id: string) => void;
  relativeTime?: string;
}

export function EventCard({ event, onDelete, relativeTime }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id }),
      });
      if (res.ok) onDelete(event.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  async function handleRetry() {
    await fetch("/api/events/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id }),
    });
    window.location.reload();
  }

  const monthStr = MONTH_SHORT[(event.month ?? 1) - 1] ?? "";
  const dateStr = event.year
    ? `${monthStr} ${event.day}, ${event.year}`
    : `${monthStr} ${event.day}`;

  return (
    <div className="space-y-0">
      <div className="bg-surface rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2 h-2 rounded-full bg-coral shrink-0" />
          <div className="min-w-0">
            <p className="text-ink font-medium truncate">{eventLabel(event)}</p>
            <p className="text-mist text-sm">
              {dateStr}
              {event.isRecurring && " · yearly"}
              {relativeTime && (
                <span className="ml-1 text-coral-deep font-medium">· {relativeTime}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {event.calendarSynced ? (
            <span className="text-success text-sm font-medium">Synced</span>
          ) : (
            <button
              type="button"
              onClick={handleRetry}
              className="text-warning text-sm font-medium min-h-11 px-2"
            >
              Retry sync
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming((v) => !v)}
            className="text-mist text-sm font-medium min-h-11 px-2"
            aria-label="Delete event"
          >
            Delete
          </button>
        </div>
      </div>

      {confirming && (
        <InlineConfirmation
          title={`Delete ${eventLabel(event)}?`}
          description="This will remove it from your calendar too."
          confirmLabel="Yes, delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
          loading={deleting}
        />
      )}
    </div>
  );
}
