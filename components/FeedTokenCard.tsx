"use client";
import { RegenerateFeedButton } from "./RegenerateFeedButton";

interface Props {
  feedToken: string;
  userId: string;
  createdAt: string; // ISO string — serialized from server Date
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function FeedTokenCard({ feedToken, userId, createdAt }: Props) {
  const truncated = `${feedToken.slice(0, 20)}...`;

  return (
    <div className="bg-surface rounded-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-3">
      <div>
        <h2 className="text-ink text-sm font-semibold">Feed Token</h2>
        <p className="text-mist text-xs mt-1 leading-relaxed">
          Regenerate your token to stop old links from working.
        </p>
      </div>

      <div className="bg-[#F0F0EE] rounded-[12px] px-4 py-3">
        <p className="text-ink text-sm font-medium">{truncated}</p>
        <p className="text-mist text-xs mt-0.5">Created on {formatDate(createdAt)}</p>
      </div>

      <RegenerateFeedButton userId={userId} />
    </div>
  );
}
