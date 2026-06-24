import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function eventLabel(
  eventType: string,
  name: string,
  title: string | null,
): string {
  if (eventType === "BIRTHDAY") return `${name}'s Birthday`;
  if (eventType === "ANNIVERSARY") return `${name}'s Anniversary`;
  if (eventType === "CEREMONY") return title ?? `${name}'s Ceremony`;
  return title ?? `${name}'s Event`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const user = await db.user.findUnique({ where: { slug } });
  if (!user) notFound();

  const event = await db.event.findFirst({
    where: { id, userId: user.id },
  });
  if (!event) notFound();

  const label = eventLabel(event.eventType, event.submitterName, event.title);
  const month = MONTH_NAMES[event.month - 1] ?? "";
  const dateStr = event.year
    ? `${month} ${event.day}, ${event.year}`
    : `${month} ${event.day}`;

  return (
    <main className="min-h-screen bg-canvas">
      {/* Photo header */}
      {event.imageUrl && (
        <div className="relative w-full aspect-video">
          <Image
            src={event.imageUrl}
            alt={`Photo from ${event.submitterName}`}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        <div className="space-y-1">
          <p className="text-mist text-sm font-medium">{label}</p>
          <p
            className="text-ink text-[40px] font-bold leading-none tracking-tight"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {dateStr}
          </p>
          {event.isRecurring && (
            <p className="text-coral text-sm font-medium">Recurring yearly</p>
          )}
        </div>

        {event.note && (
          <div className="bg-surface rounded-[20px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <p className="text-mist text-xs font-medium uppercase tracking-wide mb-2">Note</p>
            <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{event.note}</p>
          </div>
        )}
      </div>
    </main>
  );
}
