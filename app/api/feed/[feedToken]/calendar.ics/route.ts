import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateIcsFeed } from "@/lib/ics-feed";
import { feedLimiter } from "@/lib/rate-limit";
import { getIp } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedToken: string }> },
) {
  const { feedToken } = await params;
  const ip = getIp(request);

  const { success } = await feedLimiter.limit(feedToken);
  if (!success) {
    return new NextResponse("Rate limit exceeded.", { status: 429 });
  }

  const user = await db.user.findUnique({
    where: { feedToken },
    include: { events: { orderBy: [{ month: "asc" }, { day: "asc" }] } },
  });

  if (!user) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const ics = generateIcsFeed(user.events, user.slug);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dottd.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
