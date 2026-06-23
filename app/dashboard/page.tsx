import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main className="min-h-screen bg-[#FAF9F7] p-8">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-[#8E8E93]">
          Signed in as <strong>{session.user.email}</strong>
        </p>
        <p className="text-[#8E8E93]">
          Your link: <strong>/u/{session.user.slug}</strong>
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="bg-white border border-[#ECEAE7] text-[#1A1A1A] font-medium rounded-full px-6 py-3 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
