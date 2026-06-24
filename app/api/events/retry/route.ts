import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushEventToCalendar } from "@/lib/google-calendar";
import { logger } from "@/lib/logger";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { id } = z.object({ id: z.string().cuid() }).parse(body);

  const event = await db.event.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const owner = await db.user.findUnique({ where: { id: session.user.id } });
  if (!owner) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const googleEventId = await pushEventToCalendar(event, owner, owner.slug);
    await db.event.update({
      where: { id: event.id },
      data: { googleEventId, calendarSynced: true },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Calendar retry failed", { eventId: event.id, error: String(err) });
    return NextResponse.json({ error: "Calendar sync failed." }, { status: 500 });
  }
}
