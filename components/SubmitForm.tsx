"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { EventTypePicker } from "@/components/EventTypePicker";
import { MonthDayPicker } from "@/components/MonthDayPicker";
import { PhotoUploadTile } from "@/components/PhotoUploadTile";
import { submitEventSchema, type SubmitEventInput, type EventType } from "@/lib/validations";

const SESSION_KEY = "dottd-idem";

function getIdempotencyKey(): string {
  if (typeof window === "undefined") return uuidv4();
  let key = sessionStorage.getItem(SESSION_KEY);
  if (!key) {
    key = uuidv4();
    sessionStorage.setItem(SESSION_KEY, key);
  }
  return key;
}

interface Props {
  slug: string;
  ownerName: string | null;
  ownerImage: string | null;
}

export function SubmitForm({ slug, ownerName, ownerImage }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("BIRTHDAY");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [year, setYear] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isRecurring = eventType === "BIRTHDAY" || eventType === "ANNIVERSARY";
  const needsYear = !isRecurring;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const payload: SubmitEventInput = {
      submitterName: name.trim(),
      eventType,
      title: eventType === "CUSTOM" ? title.trim() : undefined,
      note: note.trim() || undefined,
      month,
      day,
      year: needsYear ? year : null,
      isRecurring,
      idempotencyKey: getIdempotencyKey(),
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
    };

    const validation = submitEventSchema.safeParse(payload);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/submit/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setGlobalError("Too many submissions. Please try again in a few minutes.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGlobalError(
          (data as { error?: string }).error ?? "Something went wrong. Please try again.",
        );
        return;
      }

      sessionStorage.removeItem(SESSION_KEY);
      router.push(`/u/${slug}/success`);
    } catch {
      setGlobalError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "bg-[#F0F0EE] rounded-[12px] px-4 py-3 text-ink placeholder:text-mist focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors w-full min-h-[44px]";

  const fieldError = (key: string) =>
    errors[key]?.[0] ? (
      <p className="text-red-500 text-sm mt-1">{errors[key][0]}</p>
    ) : null;

  return (
    <main className="min-h-screen bg-canvas pb-32">
      <div className="max-w-md mx-auto px-4 py-10 space-y-8">
        {/* Owner header */}
        <div className="flex items-center gap-3">
          {ownerImage ? (
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src={ownerImage}
                alt={ownerName ?? ""}
                fill
                className="object-cover rounded-full"
              />
            </div>
          ) : null}
          <div>
            <h1 className="text-[22px] font-bold text-ink tracking-tight">
              {ownerName ? `${ownerName} wants to remember your birthday 🎂` : "Save a date"}
            </h1>
            <p className="text-mist text-sm mt-0.5">
              Fill in the details — it goes straight onto the calendar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Name */}
          <div className="space-y-1">
            <label className="text-ink text-sm font-medium">Your name</label>
            <input
              type="text"
              placeholder="e.g. Tunde"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className={inputClass}
              autoComplete="given-name"
            />
            {fieldError("submitterName")}
          </div>

          {/* Event type */}
          <div className="space-y-2">
            <label className="text-ink text-sm font-medium">What kind of date?</label>
            <EventTypePicker value={eventType} onChange={setEventType} />
          </div>

          {/* Custom title */}
          {eventType === "CUSTOM" && (
            <div className="space-y-1">
              <label className="text-ink text-sm font-medium">Event name</label>
              <input
                type="text"
                placeholder="e.g. Baby Naming Ceremony"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                className={inputClass}
              />
              {fieldError("title")}
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <label className="text-ink text-sm font-medium">
              {isRecurring ? "Date (no year needed)" : "Date"}
            </label>
            <MonthDayPicker
              month={month}
              day={day}
              year={year}
              showYear={needsYear}
              onMonthChange={setMonth}
              onDayChange={setDay}
              onYearChange={setYear}
            />
            {fieldError("day")}
            {fieldError("month")}
            {needsYear && fieldError("year")}
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-ink text-sm font-medium">
              A note <span className="text-mist font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Anything you'd like them to know…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <p className="text-mist text-xs text-right">{note.length}/300</p>
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <label className="text-ink text-sm font-medium">
              Photo <span className="text-mist font-normal">(optional)</span>
            </label>
            <PhotoUploadTile
              onUpload={(result) => {
                setImageUrl(result?.imageUrl ?? null);
                setImagePublicId(result?.imagePublicId ?? null);
              }}
            />
          </div>

          {globalError && (
            <p className="text-red-500 text-sm bg-red-50 rounded-[12px] px-4 py-3">
              {globalError}
            </p>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-canvas border-t border-hairline px-4 py-4">
            <div className="max-w-md mx-auto">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-sunrise text-white font-semibold rounded-full px-6 py-4 text-base active:scale-[0.97] transition-transform shadow-[0_8px_30px_rgba(255,122,89,0.25)] disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Save the date"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
