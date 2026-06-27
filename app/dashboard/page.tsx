import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { ShareMenu } from "@/components/ShareMenu";
import { ShareLink } from "@/components/ShareLink";
import { DashboardEventsLoader } from "@/components/DashboardEventsLoader";
import { EventListSkeleton } from "@/components/EventListSkeleton";
import { MyImportantDates } from "@/components/MyImportantDates";
import { FeedTokenCard } from "@/components/FeedTokenCard";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [user, selfAddedEvents] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        image: true,
        feedToken: true,
        createdAt: true,
        onboardingSeen: true,
        _count: { select: { events: true } },
      },
    }),
    db.event.findMany({
      where: { userId: session.user.id, source: "OWNER" },
      orderBy: [{ month: "asc" }, { day: "asc" }],
    }),
  ]);
  if (!user) redirect("/");

  if (!user.onboardingSeen) redirect("/onboarding");

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  const shareUrl = `${baseUrl}/u/${user.slug}`;
  const feedUrl = `webcal://${baseUrl.replace(/^https?:\/\//, "")}/api/feed/${user.feedToken}/calendar.ics`;

  const sidebar = (
    <div className="space-y-4">
      {/* ICS feed */}
      <div className="bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-3">
        <h2 className="text-ink text-sm font-semibold">Apple Calendar / Outlook</h2>
        <p className="text-mist text-xs leading-relaxed">
          Subscribe once and all dates stay in sync automatically.
        </p>
        <ShareLink url={feedUrl} label="ICS feed URL" />
      </div>

      {/* My Important Dates */}
      <MyImportantDates initialEvents={selfAddedEvents} />

      {/* Feed Token */}
      <FeedTokenCard
        feedToken={user.feedToken}
        userId={user.id}
        createdAt={user.createdAt.toISOString()}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader
        name={user.name ?? ""}
        image={user.image ?? null}
        subtitle={user.email ?? ""}
        showSettingsButton
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Desktop: two-column; mobile: single-column */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
          {/* Main column */}
          <div className="space-y-6">
            <ShareMenu url={shareUrl} label="Your share link" />

            <Suspense fallback={<EventListSkeleton />}>
              <DashboardEventsLoader userId={user.id} shareUrl={shareUrl} />
            </Suspense>

            {/* Mobile-only sidebar content — hidden on desktop */}
            <div className="lg:hidden space-y-4 pt-2">{sidebar}</div>
          </div>

          {/* Desktop sidebar — hidden on mobile */}
          <aside className="hidden lg:block">{sidebar}</aside>
        </div>
      </main>
    </div>
  );
}
