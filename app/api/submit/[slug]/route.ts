import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { submitEventSchema } from "@/lib/validations";
import { pushEventToCalendar } from "@/lib/google-calendar";
import { submitLimiter, getIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createHash } from "crypto";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + "dottd-salt").digest("hex").slice(0, 16);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip = getIp(request);

  // Rate limit
  const { success } = await submitLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  // Find the user who owns this slug
  const owner = await db.user.findUnique({ where: { slug } });
  if (!owner) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = submitEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Idempotency: check if we've already processed this key
  // We store idempotency keys as a composite: userId + idempotencyKey stored in submitterIp
  // Simple approach: the idempotencyKey is included in a note prefix, we check via a separate mechanism.
  // Actual approach: just check if an event with this idempotencyKey exists by doing a lookup.
  // We encode idempotencyKey into submitterIp slot for checking purposes.
  const idempotencyHash = createHash("sha256")
    .update(data.idempotencyKey + owner.id)
    .digest("hex")
    .slice(0, 32);

  const existing = await db.event.findFirst({
    where: {
      userId: owner.id,
      submitterIp: `idem:${idempotencyHash}`,
    },
  });

  if (existing) {
    return NextResponse.json({ eventId: existing.id, duplicate: true }, { status: 200 });
  }

  // Create the event
  let event = await db.event.create({
    data: {
      userId: owner.id,
      submitterName: data.submitterName,
      eventType: data.eventType,
      title: data.title ?? null,
      note: data.note ?? null,
      month: data.month,
      day: data.day,
      year: data.year ?? null,
      isRecurring: data.isRecurring,
      imageUrl: data.imageUrl ?? null,
      imagePublicId: data.imagePublicId ?? null,
      calendarSynced: false,
      submitterIp: `idem:${idempotencyHash}`,
    },
  });

  // Push to Google Calendar (non-blocking failure — degrades gracefully)
  try {
    const googleEventId = await pushEventToCalendar(event, owner, slug);
    event = await db.event.update({
      where: { id: event.id },
      data: { googleEventId, calendarSynced: true },
    });
  } catch (err) {
    logger.error("Google Calendar push failed", {
      eventId: event.id,
      error: String(err),
    });
    // Event is saved, sync will be retried from dashboard
  }

  return NextResponse.json({ eventId: event.id }, { status: 201 });
}
