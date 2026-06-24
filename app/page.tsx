import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WidgetCard } from "@/components/WidgetCard";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-bloom flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-10">
        <div className="text-center space-y-3">
          <h1 className="text-[32px] font-bold tracking-tight text-ink leading-tight">
            Dottd
          </h1>
          <p className="text-mist text-lg leading-relaxed max-w-xs mx-auto">
            Share a link. Anyone can save a date — it lands on your calendar automatically.
          </p>
        </div>

        {/* Demo widget */}
        <div className="w-full max-w-[280px]">
          <WidgetCard
            name="Tunde's birthday"
            month={6}
            day={24}
            tagline="Saved to your calendar"
          />
        </div>

        {/* Sign in */}
        <div className="w-full max-w-[280px] space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full bg-gradient-sunrise text-white font-semibold rounded-full px-6 py-4 text-base active:scale-[0.97] transition-transform shadow-[0_8px_30px_rgba(255,122,89,0.25)]"
            >
              Sign in with Google
            </button>
          </form>
          <p className="text-center text-mist text-xs">
            Works with Google Calendar, Apple Calendar, Outlook — any app that supports ICS.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-8">
        <p className="text-mist text-xs">No sign-up required for your guests.</p>
      </footer>
    </main>
  );
}
