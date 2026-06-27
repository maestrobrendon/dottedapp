"use client";
import { useEffect, useRef, useState } from "react";
import type { Event } from "@prisma/client";
import { CalendarDays, ChevronRight, MoreVertical } from "lucide-react";
import { InlineConfirmation } from "./InlineConfirmation";
import type { Section } from "@/lib/dates";

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
  section?: Section;
}

export function EventCard({ event, onDelete, relativeTime, section }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLater = section === "Later";

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

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
    <div id={event.id} className="space-y-0 transition-all duration-300">
      <div className="bg-surface rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex items-center gap-3">
        {/* Status dot — near-term unsynced only */}
        {!isLater && (
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              event.calendarSynced ? "bg-transparent" : "bg-coral"
            }`}
          />
        )}

        {/* Calendar icon in soft tinted square */}
        <div
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
            isLater ? "bg-[#F0F0EE]" : "bg-[#FFF4F0]"
          }`}
        >
          <CalendarDays
            className={`w-4 h-4 ${isLater ? "text-mist" : "text-coral"}`}
          />
        </div>

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <p className="text-ink font-medium truncate">{eventLabel(event)}</p>
          <p className="text-mist text-sm">
            {dateStr}
            {event.isRecurring && " · yearly"}
            {relativeTime && (
              <span className="ml-1 text-coral-deep font-medium">· {relativeTime}</span>
            )}
          </p>
        </div>

        {/* Right actions */}
        {isLater ? (
          <ChevronRight className="w-4 h-4 text-mist shrink-0" />
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {/* Retry sync — only when genuinely not synced */}
            {!event.calendarSynced && (
              <button
                type="button"
                onClick={handleRetry}
                className="text-coral text-sm font-medium min-h-11 px-1.5"
              >
                Retry sync
              </button>
            )}

            {/* Three-dot menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => { setMenuOpen((v) => !v); setConfirming(false); }}
                className="text-mist min-h-11 min-w-11 flex items-center justify-center"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-surface rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-hairline overflow-hidden z-20 min-w-30">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirming(true); }}
                    className="w-full text-left px-4 py-3 text-coral-deep text-sm font-medium hover:bg-canvas transition-colors min-h-11"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
