import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SubmitForm } from "@/components/SubmitForm";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const owner = await db.user.findUnique({
    where: { slug },
    select: { name: true, image: true },
  });
  if (!owner) notFound();

  return (
    <SubmitForm slug={slug} ownerName={owner.name} ownerImage={owner.image} />
  );
}
