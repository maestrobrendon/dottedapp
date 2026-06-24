import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingClient } from "@/components/OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboardingSeen: true },
  });
  if (!user) redirect("/");

  if (user.onboardingSeen) redirect("/dashboard");

  return <OnboardingClient userName={user.name ?? ""} />;
}
