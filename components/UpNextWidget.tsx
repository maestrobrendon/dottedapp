import type { Event } from "@prisma/client";
import { relativeLabel } from "@/lib/dates";

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
        className="backdrop-blur-xl rounded-[12px] p-4"
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        <p className="text-mist text-xs font-medium uppercase tracking-wide">Up next</p>
        <p className="text-ink text-2xl font-bold tracking-tight mt-1">{eventLabel(event)}</p>
        <p className="text-coral text-sm font-medium mt-1">
          {relativeLabel(daysAway)} · {monthStr} {dayNum}
        </p>
      </div>
    </div>
  );
}
