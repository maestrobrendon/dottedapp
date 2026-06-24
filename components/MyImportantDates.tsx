"use client";

import { useState } from "react";
import type { Event } from "@prisma/client";
import type { EventType } from "@/lib/validations";
import { EventTypePicker } from "./EventTypePicker";
import { MonthDayPicker } from "./MonthDayPicker";
import { InlineConfirmation } from "./InlineConfirmation";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function selfEventLabel(event: Event): string {
  if (event.eventType === "BIRTHDAY") return "My birthday";
  if (event.eventType === "ANNIVERSARY") return event.title ?? "My anniversary";
  return event.title ?? "My event";
}

function todayMonth() { return new Date().getMonth() + 1; }
function todayDay() { return new Date().getDate(); }

interface Props {
  initialEvents: Event[];
}

export function MyImportantDates({ initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [adding, setAdding] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form
  const [eventType, setEventType] = useState<EventType>("BIRTHDAY");
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(todayMonth);
  const [day, setDay] = useState(todayDay);
  const [year, setYear] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setEventType("BIRTHDAY");
    setTitle("");
    setMonth(todayMonth());
    setDay(todayDay());
    setYear(null);
    setFormError(null);
  }

  async function handleAdd() {
    if (eventType === "CUSTOM" && !title.trim()) {
      setFormError("Please add a title for this event.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/events/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          title: title.trim() || undefined,
          month,
          day,
          year: year || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError((data as { error?: string }).error ?? "Something went wrong.");
        return;
      }
      const { event: newEvent } = (await res.json()) as { eventId: string; event: Event };
      setEvents((prev) => [...prev, newEvent]);
      setAdding(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setConfirmingId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const showTitle = eventType !== "BIRTHDAY";
  const showYear = eventType === "CEREMONY" || eventType === "CUSTOM";

  return (
    <div className="bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-4">
      <div>
        <h2 className="text-xs font-semibold text-mist uppercase tracking-wide">
          My Important Dates
        </h2>
        <p className="text-mist text-sm mt-1 leading-relaxed">
          A birthday, anniversary, or anything else worth remembering about yourself.
        </p>
      </div>

      {events.length > 0 && (
        <ul className="divide-y divide-hairline">
          {events.map((event) => {
            const monthStr = MONTH_SHORT[(event.month ?? 1) - 1] ?? "";
            const dateStr = event.year
              ? `${monthStr} ${event.day}, ${event.year}`
              : `${monthStr} ${event.day}`;
            const isConfirming = confirmingId === event.id;

            return (
              <li key={event.id} className="space-y-0">
                <div className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span aria-hidden className="text-base">📅</span>
                    <span className="text-ink text-sm font-medium truncate">
                      {selfEventLabel(event)}
                    </span>
                    <span className="text-mist text-sm shrink-0">· {dateStr}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(isConfirming ? null : event.id)}
                    className="text-mist text-sm font-medium min-h-11 px-2 shrink-0"
                  >
                    Delete
                  </button>
                </div>

                {isConfirming && (
                  <InlineConfirmation
                    title={`Delete ${selfEventLabel(event)}?`}
                    description="This will remove it from your calendar too."
                    confirmLabel="Yes, delete"
                    onConfirm={() => handleDelete(event.id)}
                    onCancel={() => setConfirmingId(null)}
                    loading={deletingId === event.id}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="space-y-3 pt-1 border-t border-hairline">
          <EventTypePicker value={eventType} onChange={setEventType} />

          {showTitle && (
            <input
              type="text"
              placeholder={
                eventType === "ANNIVERSARY"
                  ? "e.g. Wedding anniversary"
                  : "Event title"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F0F0EE] rounded-[12px] px-4 py-3 text-ink placeholder:text-mist focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors min-h-[44px]"
            />
          )}

          <MonthDayPicker
            month={month}
            day={day}
            year={year}
            showYear={showYear}
            onMonthChange={setMonth}
            onDayChange={setDay}
            onYearChange={setYear}
          />

          {formError && (
            <p className="text-[#FF5C3A] text-sm">{formError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className="flex-1 bg-gradient-sunrise text-white font-semibold rounded-full px-4 py-3 text-sm active:scale-[0.97] transition-transform disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Add to my calendar"}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); resetForm(); }}
              disabled={submitting}
              className="text-mist text-sm font-medium min-h-11 px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-coral text-sm font-semibold min-h-11 flex items-center gap-1"
        >
          + Add a date
        </button>
      )}
    </div>
  );
}
