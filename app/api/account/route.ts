import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const RESERVED_SLUGS = new Set([
  "api", "app", "admin", "settings", "dashboard", "login", "logout",
  "signin", "signup", "auth", "u", "wall", "feed", "success", "event",
  "help", "support", "about", "terms", "privacy", "dottd",
]);

const slugSchema = z
  .string()
  .min(3, "Only lowercase letters, numbers, and hyphens.")
  .max(40, "Only lowercase letters, numbers, and hyphens.")
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens.")
  .refine((s) => !s.startsWith("-") && !s.endsWith("-"), "Only lowercase letters, numbers, and hyphens.")
  .refine((s) => !RESERVED_SLUGS.has(s), "That word's reserved — try another.");

const patchSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(60)
    .trim()
    .refine((s) => /[a-zA-Z]/.test(s), "Name needs at least one letter.")
    .optional(),
  slug: slugSchema.optional(),
  image: z.string().url().optional(),
  onboardingSeen: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.flatten();
    // Return the first field error message so callers can show it inline
    const firstError =
      Object.values(issues.fieldErrors).flat()[0] ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const { name, slug, image, onboardingSeen } = parsed.data;

  // If slug is being changed, check uniqueness
  if (slug !== undefined) {
    const conflict = await db.user.findFirst({
      where: { slug, id: { not: session.user.id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Already taken" }, { status: 409 });
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(onboardingSeen !== undefined ? { onboardingSeen } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
