import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">
      <div className="text-center space-y-6 px-6">
        <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">Dottd</h1>
        <p className="text-[#8E8E93] text-lg">Share a link. Get birthdays on your calendar.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="bg-[#FF7A59] text-white font-semibold rounded-full px-8 py-4 text-base"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
