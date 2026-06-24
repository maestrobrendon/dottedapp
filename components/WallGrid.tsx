"use client";

import Image from "next/image";
import Link from "next/link";
import type { Event } from "@prisma/client";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PASTEL_BG = ["bg-bloom-peach", "bg-bloom-pink", "bg-[#F0F0EE]"];

function WallCard({ event, slug }: { event: Event; slug: string }) {
  const monthStr = MONTH_SHORT[(event.month ?? 1) - 1] ?? "";
  const initials = event.submitterName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const bgIndex = event.submitterName.charCodeAt(0) % PASTEL_BG.length;

  return (
    <Link
      href={`/u/${slug}/event/${event.id}`}
      className="block relative rounded-[20px] overflow-hidden aspect-[3/4] group"
    >
      {event.imageUrl ? (
        <Image
          src={event.imageUrl}
          alt={event.submitterName}
          fill
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center ${PASTEL_BG[bgIndex]}`}
        >
          <span className="text-4xl font-bold text-ink/40">{initials}</span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-semibold text-sm">{event.submitterName}</p>
        <p
          className="text-white/80 text-lg font-bold leading-tight"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {monthStr} {event.day}
        </p>
      </div>
    </Link>
  );
}

interface Props {
  events: Event[];
  slug: string;
}

export function WallGrid({ events, slug }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-mist">
        <p className="text-lg font-medium">No events yet.</p>
        <p className="text-sm mt-1">Share your link to start collecting dates.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {events.map((event) => (
        <WallCard key={event.id} event={event} slug={slug} />
      ))}
    </div>
  );
}
