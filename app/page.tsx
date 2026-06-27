import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DemoWidget } from "@/components/DemoWidget";
import {
  CalendarDays,
  Link as LinkIcon,
  Users,
  Mail,
  ChevronRight,
  Lock,
  ShieldCheck,
} from "lucide-react";

const FEATURE_CHIPS = [
  { icon: LinkIcon, label: "One link", sub: "Share in seconds" },
  { icon: Users, label: "Anyone", sub: "Can save it" },
  { icon: CalendarDays, label: "Works everywhere", sub: "All major calendars" },
] as const;

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-bloom">
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-center lg:min-h-screen max-w-6xl mx-auto w-full px-6 py-10 lg:px-16 lg:py-0 gap-10 lg:gap-8">

        {/* ── Left column: logo lockup · headline · feature chips ── */}
        <div className="flex flex-col">
          {/* Logo lockup — small, understated */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-sunrise flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="text-ink text-sm font-semibold tracking-tight">Dottd</span>
          </div>

          {/* Headline + subhead */}
          <div className="space-y-3">
            <h1 className="text-ink text-[42px] lg:text-[52px] font-bold tracking-tight leading-[1.05]">
              Dottd
            </h1>
            <p className="text-mist text-base lg:text-lg leading-relaxed max-w-[280px]">
              Share a link. Anyone can save a date — it lands on your calendar automatically.
            </p>
          </div>

          {/* Feature chips — desktop only */}
          <div className="hidden lg:flex flex-col gap-5 mt-10">
            {FEATURE_CHIPS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-bloom-peach/60 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <p className="text-ink text-sm font-semibold">{label}</p>
                  <p className="text-mist text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column: widget · auth buttons · trust strip ── */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-sm">

            {/* Cycling demo widget — badge + dots live inside */}
            <DemoWidget />

            {/* Auth buttons */}
            <div className="space-y-3">
              {/* Sign in with Google */}
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className="w-full bg-gradient-sunrise text-white font-semibold rounded-full py-4 flex items-center px-5 gap-2 active:scale-[0.97] transition-transform shadow-[0_8px_30px_rgba(255,122,89,0.25)]"
                >
                  <span className="bg-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/google-g.svg" className="w-3 h-3" alt="" />
                  </span>
                  <span className="flex-1 text-center">Sign in with Google</span>
                  <ChevronRight className="w-5 h-5 shrink-0 opacity-70" />
                </button>
              </form>

              {/* Continue with email — static only, no auth flow wired yet */}
              <button
                type="button"
                className="w-full bg-white/70 text-ink font-medium rounded-full py-4 flex items-center px-5 gap-2 border border-white/60 backdrop-blur-sm active:scale-[0.97] transition-transform"
              >
                <span className="bg-[#F0F0EE] rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  <Mail className="w-3 h-3 text-mist" />
                </span>
                <span className="flex-1 text-center">Continue with email</span>
                <ChevronRight className="w-5 h-5 shrink-0 text-mist opacity-60" />
              </button>
            </div>

            {/* Trust strip */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-mist" />
                </div>
                <p className="text-mist text-xs leading-relaxed">
                  Works with Google Calendar, Apple Calendar, Outlook — any app that supports ICS.
                </p>
              </div>
              <div className="border-t border-white/40 pt-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-mist" />
                </div>
                <p className="text-mist text-xs">No sign-up required for your guests.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
