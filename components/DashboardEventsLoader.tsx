import { db } from "@/lib/db";
import Link from "next/link";
import { UpNextWidget } from "./UpNextWidget";
import { DashboardEventList } from "./DashboardEventList";
import { nextOccurrenceDate, daysUntil } from "@/lib/dates";

interface Props {
  userId: string;
  shareUrl: string;
}

export async function DashboardEventsLoader({ userId, shareUrl }: Props) {
  const events = await db.event.findMany({
    where: { userId },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });

  // Compute Up Next server-side
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upNext: { event: (typeof events)[number]; nextDate: Date; daysAway: number } | null = null;
  for (const event of events) {
    const nextDate = nextOccurrenceDate(event.month, event.day, event.year, event.isRecurring, today);
    if (!nextDate) continue;
    const daysAway = daysUntil(nextDate, today);
    if (!upNext || nextDate < upNext.nextDate) {
      upNext = { event, nextDate, daysAway };
    }
  }

  return (
    <>
      {/* Coachmark — only when no events yet (§6.8) */}
      {events.length === 0 && (
        <div className="flex items-start gap-2 bg-[#FFF4F0] rounded-[12px] px-4 py-3 mb-4 text-sm">
          <span className="text-coral shrink-0">↑</span>
          <p className="text-ink font-medium">
            This is your link — copy it and send it to anyone.
          </p>
        </div>
      )}

      {/* Up Next widget (§6.1) */}
      {upNext && (
        <UpNextWidget
          event={upNext.event}
          nextDate={upNext.nextDate}
          daysAway={upNext.daysAway}
        />
      )}

      {/* Animated segmented tabs */}
      <div className="flex gap-6 border-b border-hairline mb-6">
        <Link
          href="/dashboard"
          className="pb-3 text-sm font-semibold text-ink relative"
        >
          List
          <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-coral" />
        </Link>
        <Link
          href="/dashboard/wall"
          className="pb-3 text-sm font-medium text-mist"
        >
          Wall
        </Link>
      </div>

      <DashboardEventList initialEvents={events} shareUrl={shareUrl} />
    </>
  );
}
