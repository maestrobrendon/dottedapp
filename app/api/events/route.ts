import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteEventSchema } from "@/lib/validations";
import { deleteEventFromCalendar } from "@/lib/google-calendar";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await db.event.findMany({
    where: { userId: session.user.id },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });

  return NextResponse.json({ events });
}

export async function DELETE(request: NextRequest) {
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

  const parsed = deleteEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event ID." }, { status: 422 });
  }

  const event = await db.event.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  // Remove from Google Calendar
  if (event.googleEventId) {
    try {
      const owner = await db.user.findUnique({ where: { id: session.user.id } });
      if (owner) await deleteEventFromCalendar(event.googleEventId, owner);
    } catch (err) {
      logger.warn("Failed to delete Google Calendar event", {
        eventId: event.id,
        googleEventId: event.googleEventId,
        error: String(err),
      });
    }
  }

  // Remove from Cloudinary
  if (event.imagePublicId) {
    try {
      await deleteCloudinaryAsset(event.imagePublicId);
    } catch (err) {
      logger.warn("Failed to delete Cloudinary asset", {
        eventId: event.id,
        publicId: event.imagePublicId,
        error: String(err),
      });
    }
  }

  await db.event.delete({ where: { id: event.id } });

  return NextResponse.json({ success: true });
}
