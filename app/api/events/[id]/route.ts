import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { EventTypeEnum } from "@/lib/validations";

const patchSchema = z.object({
  eventType: EventTypeEnum.optional(),
  title: z.string().max(120).trim().optional().nullable(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await db.event.findFirst({
    where: { id, userId: session.user.id, source: "OWNER" },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 422 });
  }

  const { eventType, title, month, day, year } = parsed.data;

  const newType = eventType ?? event.eventType;
  const isRecurring = newType === "BIRTHDAY" || newType === "ANNIVERSARY";

  const updated = await db.event.update({
    where: { id },
    data: {
      ...(eventType !== undefined && { eventType }),
      ...(title !== undefined && { title: title ?? null }),
      ...(month !== undefined && { month }),
      ...(day !== undefined && { day }),
      ...(year !== undefined && { year }),
      isRecurring,
    },
  });

  return NextResponse.json({ event: updated });
}
