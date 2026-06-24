import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { WallLoader } from "@/components/WallLoader";
import { WallSkeleton } from "@/components/WallSkeleton";

export default async function WallPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, slug: true },
  });
  if (!user) redirect("/");

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Dottd</h1>
          <Link
            href="/dashboard/settings"
            className="text-mist text-sm font-medium min-h-11 flex items-center"
          >
            Settings
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-hairline">
          <Link href="/dashboard" className="pb-3 text-sm font-medium text-mist">
            List
          </Link>
          <span className="pb-3 text-sm font-semibold text-ink relative">
            Wall
            <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-coral" />
          </span>
        </div>

        <Suspense fallback={<WallSkeleton />}>
          <WallLoader userId={user.id} slug={user.slug} />
        </Suspense>
      </div>
    </main>
  );
}
