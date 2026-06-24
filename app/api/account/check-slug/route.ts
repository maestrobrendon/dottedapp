import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugCheckLimiter, getIp } from "@/lib/rate-limit";

const RESERVED_SLUGS = new Set([
  "api", "app", "admin", "settings", "dashboard", "login", "logout",
  "signin", "signup", "auth", "u", "wall", "feed", "success", "event",
  "help", "support", "about", "terms", "privacy", "dottd",
]);

function validateSlug(value: string): { ok: false; message: string } | { ok: true } {
  if (value.length < 3 || value.length > 40 || !/^[a-z0-9-]+$/.test(value) || value.startsWith("-") || value.endsWith("-")) {
    return { ok: false, message: "Only lowercase letters, numbers, and hyphens." };
  }
  if (RESERVED_SLUGS.has(value)) {
    return { ok: false, message: "That word's reserved — try another." };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const ip = getIp(request);
  const { success } = await slugCheckLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const value = request.nextUrl.searchParams.get("value") ?? "";

  const validation = validateSlug(value);
  if (!validation.ok) {
    return NextResponse.json({ available: false, reason: "invalid", message: validation.message });
  }

  // Exclude the current user's own slug so typing your existing slug shows "Available"
  const session = await auth();
  const existing = await db.user.findFirst({
    where: {
      slug: value,
      ...(session?.user?.id ? { id: { not: session.user.id } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ available: false, reason: "taken", message: "Already taken" });
  }

  return NextResponse.json({ available: true });
}
