import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChevronRight, LogOut } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { NameEditorClient } from "@/components/NameEditorClient";
import { SlugEditor } from "@/components/SlugEditor";
import { AvatarUpload } from "@/components/AvatarUpload";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, feedToken: true, slug: true, image: true, createdAt: true },
  });
  if (!user) redirect("/");

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader
        name={user.name ?? ""}
        image={user.image ?? null}
        subtitle={user.email ?? ""}
        showSettingsButton={false}
      />

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Account card */}
        <div className="bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <h2 className="text-ink text-sm font-semibold mb-4">Account</h2>

          <div className="lg:flex lg:gap-6 lg:items-start">
            {/* Avatar — compact, left on desktop */}
            <div className="shrink-0 mb-4 lg:mb-0">
              <AvatarUpload currentImage={user.image ?? null} userName={user.name ?? null} />
            </div>

            {/* Fields — right on desktop */}
            <div className="flex-1 min-w-0 space-y-1">
              <NameEditorClient initialName={user.name ?? ""} />

              <div className="border-t border-hairline my-1" />

              {/* Email — read-only, no edit affordance */}
              <div className="py-1">
                <p className="text-mist text-xs font-medium uppercase tracking-wide">Email</p>
                <p className="text-ink font-medium mt-0.5 truncate">{user.email}</p>
              </div>

              <div className="border-t border-hairline my-1" />

              <SlugEditor currentSlug={user.slug} baseUrl={baseUrl} />
            </div>
          </div>
        </div>

        {/* Sign out row */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF4F0] flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ink font-medium text-sm">Sign out</p>
              <p className="text-mist text-xs mt-0.5">Sign out of your account on this device.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-mist shrink-0" />
          </button>
        </form>
      </main>
    </div>
  );
}
