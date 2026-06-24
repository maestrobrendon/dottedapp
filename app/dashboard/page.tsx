import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ShareMenu } from "@/components/ShareMenu";
import { AvatarStack } from "@/components/AvatarStack";
import { DashboardEventsLoader } from "@/components/DashboardEventsLoader";
import { EventListSkeleton } from "@/components/EventListSkeleton";
import { ShareLink } from "@/components/ShareLink";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      feedToken: true,
      onboardingSeen: true,
      _count: { select: { events: true } },
    },
  });
  if (!user) redirect("/");

  if (!user.onboardingSeen) redirect("/onboarding");

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  const shareUrl = `${baseUrl}/u/${user.slug}`;
  const feedUrl = `webcal://${baseUrl.replace(/^https?:\/\//, "")}/api/feed/${user.feedToken}/calendar.ics`;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-ink tracking-tight">Dottd</h1>
            {user.name && <p className="text-mist text-sm">{user.name}</p>}
          </div>
          <div className="flex items-center gap-3">
            <AvatarStack names={[]} />
            <Link
              href="/dashboard/settings"
              className="text-mist text-sm font-medium min-h-11 flex items-center"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Share link with full share menu */}
        <ShareMenu url={shareUrl} label="Your share link" />

        {/* Events content: Up Next + tabs + list, with skeleton while loading */}
        <Suspense fallback={<EventListSkeleton />}>
          <DashboardEventsLoader userId={user.id} shareUrl={shareUrl} />
        </Suspense>

        {/* ICS feed */}
        <div className="bg-surface rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-2">
          <p className="text-ink text-sm font-medium">Apple Calendar / Outlook</p>
          <p className="text-mist text-xs">
            Subscribe once and all dates stay in sync automatically.
          </p>
          <ShareLink url={feedUrl} label="ICS feed URL" />
        </div>
      </div>
    </main>
  );
}
