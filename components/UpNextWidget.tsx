import type { Event } from "@prisma/client";
import { CalendarDays } from "lucide-react";
import { relativeLabel } from "@/lib/dates";
import { UpNextCountdown } from "./UpNextCountdown";
import { ScrollToButton } from "./ScrollToButton";

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
  nextDate: Date;
  daysAway: number;
}

export function UpNextWidget({ event, nextDate, daysAway }: Props) {
  const monthStr = MONTH_SHORT[nextDate.getMonth()] ?? "";
  const dayNum = nextDate.getDate();

  return (
    <div className="relative rounded-[20px] p-4 overflow-hidden bg-gradient-bloom mb-6">
      <div
        className="rounded-[12px] p-4 flex items-center gap-4"
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Calendar icon in white rounded square */}
        <div className="w-12 h-12 rounded-[12px] bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
          <CalendarDays className="w-6 h-6 text-coral" />
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <p className="text-mist text-[10px] font-semibold uppercase tracking-wider">Up Next</p>
          <p className="text-ink font-bold tracking-tight mt-0.5 truncate text-lg lg:text-xl">
            {eventLabel(event)}
          </p>
          <p className="text-coral text-sm font-medium mt-0.5">
            {relativeLabel(daysAway)} · {monthStr} {dayNum}
          </p>
        </div>

        {/* Desktop — live countdown boxes, client-only to avoid hydration mismatch */}
        <UpNextCountdown dateMs={nextDate.getTime()} />

        {/* Mobile — scroll-to-event button */}
        <ScrollToButton targetId={event.id} />
      </div>
    </div>
  );
}
