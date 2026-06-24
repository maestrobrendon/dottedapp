import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushEventToCalendar } from "@/lib/google-calendar";
import { logger } from "@/lib/logger";
import { z } from "zod";

const MONTH_DAYS: Record<number, number> = {
  1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

const selfEventSchema = z
  .object({
    eventType: z.enum(["BIRTHDAY", "ANNIVERSARY", "CEREMONY", "CUSTOM"]),
    title: z.string().max(120).trim().optional(),
    note: z.string().max(300).trim().optional(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
  })
  .refine((d) => d.day <= (MONTH_DAYS[d.month] ?? 31), {
    message: "Invalid day for the selected month",
    path: ["day"],
  })
  .refine(
    (d) => d.eventType !== "CUSTOM" || (d.title && d.title.length > 0),
    { message: "Custom events require a title", path: ["title"] },
  );

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = selfEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const owner = await db.user.findUnique({ where: { id: session.user.id } });
  if (!owner) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isRecurring = data.eventType === "BIRTHDAY" || data.eventType === "ANNIVERSARY";

  let event = await db.event.create({
    data: {
      userId: owner.id,
      submitterName: owner.name ?? owner.email.split("@")[0],
      eventType: data.eventType,
      title: data.title ?? null,
      note: data.note ?? null,
      month: data.month,
      day: data.day,
      year: data.year ?? null,
      isRecurring,
      source: "OWNER",
      calendarSynced: false,
    },
  });

  try {
    const googleEventId = await pushEventToCalendar(event, owner, owner.slug);
    event = await db.event.update({
      where: { id: event.id },
      data: { googleEventId, calendarSynced: true },
    });
  } catch (err) {
    logger.error("Google Calendar push failed for self event", {
      eventId: event.id,
      error: String(err),
    });
  }

  return NextResponse.json({ eventId: event.id, event }, { status: 201 });
}
