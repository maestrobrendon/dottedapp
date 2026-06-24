import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { RegenerateFeedButton } from "@/components/RegenerateFeedButton";
import { NameEditorClient } from "@/components/NameEditorClient";
import { SlugEditor } from "@/components/SlugEditor";
import { ShareLink } from "@/components/ShareLink";
import { MyImportantDates } from "@/components/MyImportantDates";
import { AvatarUpload } from "@/components/AvatarUpload";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [user, selfAddedEvents] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, feedToken: true, slug: true, image: true },
    }),
    db.event.findMany({
      where: { userId: session.user.id, source: "OWNER" },
      orderBy: [{ month: "asc" }, { day: "asc" }],
    }),
  ]);
  if (!user) redirect("/");

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  const feedUrl = `webcal://${baseUrl.replace(/^https?:\/\//, "")}/api/feed/${user.feedToken}/calendar.ics`;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-mist text-sm font-medium min-h-11 flex items-center"
          >
            ← Back
          </Link>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Settings</h1>
        </div>

        {/* Account */}
        <div className="bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-1">
          <h2 className="text-ink text-sm font-semibold mb-3">Account</h2>

          <AvatarUpload currentImage={user.image ?? null} userName={user.name ?? null} />

          <NameEditorClient initialName={user.name ?? ""} />

          <div className="border-t border-hairline my-1" />

          <div className="py-1">
            <p className="text-mist text-xs font-medium uppercase tracking-wide">Email</p>
            <p className="text-ink font-medium mt-0.5">{user.email}</p>
          </div>

          <div className="border-t border-hairline my-1" />

          <SlugEditor currentSlug={user.slug} baseUrl={baseUrl} />
        </div>

        {/* My Important Dates */}
        <MyImportantDates initialEvents={selfAddedEvents} />

        {/* ICS Feed */}
        <div className="bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-3">
          <h2 className="text-ink text-sm font-semibold">Calendar feed (ICS)</h2>
          <p className="text-mist text-xs leading-relaxed">
            Subscribe to this URL in Apple Calendar, Outlook, or any calendar app that
            supports ICS subscriptions. Events sync automatically.
          </p>
          <ShareLink url={feedUrl} label="Feed URL" />
          <RegenerateFeedButton userId={user.id} />
        </div>

        {/* Sign out */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-white text-ink font-medium rounded-full px-6 py-4 border border-hairline active:scale-[0.97] transition-transform"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
