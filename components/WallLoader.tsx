import { db } from "@/lib/db";
import { WallGrid } from "./WallGrid";

interface Props {
  userId: string;
  slug: string;
}

export async function WallLoader({ userId, slug }: Props) {
  const events = await db.event.findMany({
    where: { userId },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });

  return <WallGrid events={events} slug={slug} />;
}
