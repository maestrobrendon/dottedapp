import { WidgetCard } from "@/components/WidgetCard";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const today = new Date();

  return (
    <main className="min-h-screen bg-gradient-bloom flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[320px] space-y-8 text-center">
        {/* Animated widget */}
        <div
          className="animate-[widget-in_150ms_ease-out]"
          style={{
            animation: "widget-in 150ms ease-out both",
          }}
        >
          <style>{`
            @keyframes widget-in {
              from { transform: scale(0.96); filter: blur(4px); opacity: 0; }
              to   { transform: scale(1);    filter: blur(0);   opacity: 1; }
            }
          `}</style>
          <WidgetCard
            name="Date saved!"
            month={today.getMonth() + 1}
            day={today.getDate()}
            tagline="It's on the calendar now."
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-[22px] font-bold text-ink">You're in!</h1>
          <p className="text-mist text-sm leading-relaxed">
            This date has been saved and will show up on the calendar
            automatically. No app to download, no account needed.
          </p>
        </div>
      </div>
    </main>
  );
}
