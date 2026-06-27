"use client";

import { useEffect, useRef, useState } from "react";
import type { Event } from "@prisma/client";
import type { EventType } from "@/lib/validations";
import { CalendarDays, MoreVertical, Pencil, Trash2 } from "lucide-react";
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

type FormMode = { type: "add" } | { type: "edit"; event: Event };

function RowMenu({
  event,
  onEdit,
  onDeleteConfirm,
}: {
  event: Event;
  onEdit: () => void;
  onDeleteConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-mist min-h-11 min-w-11 flex items-center justify-center"
        aria-label={`Options for ${selfEventLabel(event)}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-hairline overflow-hidden z-20 min-w-30">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-ink text-sm font-medium hover:bg-canvas transition-colors min-h-11"
          >
            <Pencil className="w-3.5 h-3.5 text-mist shrink-0" />
            Edit
          </button>
          <div className="border-t border-hairline" />
          <button
            type="button"
            onClick={() => { setOpen(false); onDeleteConfirm(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-coral-deep text-sm font-medium hover:bg-canvas transition-colors min-h-11"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  initialEvents: Event[];
}

export function MyImportantDates({ initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Shared form state for add and edit
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

  function openAdd() {
    resetForm();
    setFormMode({ type: "add" });
  }

  function openEdit(event: Event) {
    setEventType(event.eventType as EventType);
    setTitle(event.title ?? "");
    setMonth(event.month);
    setDay(event.day);
    setYear(event.year ?? null);
    setFormError(null);
    setFormMode({ type: "edit", event });
  }

  function closeForm() {
    setFormMode(null);
    resetForm();
  }

  async function handleSubmit() {
    if (eventType === "CUSTOM" && !title.trim()) {
      setFormError("Please add a title for this event.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      if (formMode?.type === "edit") {
        const res = await fetch(`/api/events/${formMode.event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            title: title.trim() || null,
            month,
            day,
            year: year || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError((data as { error?: string }).error ?? "Something went wrong.");
          return;
        }
        const { event: updated } = (await res.json()) as { event: Event };
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
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
      }
      closeForm();
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-ink text-sm font-semibold">My Important Dates</h2>
          <p className="text-mist text-xs mt-1 leading-relaxed">
            Private dates only you can see.
          </p>
        </div>
        {!formMode && (
          <button
            type="button"
            onClick={openAdd}
            className="bg-gradient-sunrise text-white text-sm font-semibold rounded-full px-4 min-h-9 py-2 active:scale-[0.97] transition-transform shrink-0"
          >
            + Add date
          </button>
        )}
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
              <li key={event.id}>
                <div className="flex items-center py-2.5 gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#FFF4F0] flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-coral" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ink text-sm font-medium truncate">
                      {selfEventLabel(event)}
                    </p>
                    <p className="text-mist text-xs">{dateStr}</p>
                  </div>
                  <RowMenu
                    event={event}
                    onEdit={() => openEdit(event)}
                    onDeleteConfirm={() => setConfirmingId(event.id)}
                  />
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

      {/* Inline add / edit form */}
      {formMode && (
        <div className="space-y-3 pt-1 border-t border-hairline">
          <p className="text-ink text-sm font-semibold">
            {formMode.type === "edit" ? "Edit date" : "Add a date"}
          </p>

          <EventTypePicker value={eventType} onChange={setEventType} />

          {showTitle && (
            <input
              type="text"
              placeholder={
                eventType === "ANNIVERSARY" ? "e.g. Wedding anniversary" : "Event title"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F0F0EE] rounded-[12px] px-4 py-3 text-ink placeholder:text-mist focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors min-h-11"
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

          {formError && <p className="text-coral-deep text-sm">{formError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gradient-sunrise text-white font-semibold rounded-full px-4 py-3 text-sm active:scale-[0.97] transition-transform disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : formMode.type === "edit"
                  ? "Save changes"
                  : "Add to my calendar"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="text-mist text-sm font-medium min-h-11 px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Secondary add trigger below list when form is closed */}
      {events.length > 0 && !formMode && (
        <button
          type="button"
          onClick={openAdd}
          className="text-coral text-sm font-semibold min-h-11 flex items-center gap-1"
        >
          + Add a date
        </button>
      )}
    </div>
  );
}
