"use client";

import { useState } from "react";
import { ThumbsUp, Heart, Laugh, ThumbsDown, Star, Angry } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reaction } from "@prisma/client";

const REACTIONS = [
  { type: "LIKE", icon: ThumbsUp, color: "#00d4ff", label: "Like" },
  { type: "LOVE", icon: Heart, color: "#ec4899", label: "Love" },
  { type: "HELPFUL", icon: Star, color: "#10b981", label: "Helpful" },
  { type: "LAUGH", icon: Laugh, color: "#f59e0b", label: "Haha" },
  { type: "DISLIKE", icon: ThumbsDown, color: "#ef4444", label: "Dislike" },
] as const;

interface Props {
  postId: string;
  reactions: Reaction[];
  currentUserId?: string;
}

export default function ReactionBar({ postId, reactions: initialReactions, currentUserId }: Props) {
  const [reactions, setReactions] = useState(initialReactions);

  const counts = REACTIONS.reduce(
    (acc, r) => {
      acc[r.type] = reactions.filter((x) => x.type === r.type).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const userReactions = new Set(
    reactions.filter((r) => r.userId === currentUserId).map((r) => r.type)
  );

  async function toggle(type: string) {
    if (!currentUserId) return;

    const res = await fetch(`/api/posts/${postId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    if (res.ok) {
      const data = await res.json();
      setReactions(data.reactions);
    }
  }

  const hasAny = Object.values(counts).some((c) => c > 0);

  return (
    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
      {REACTIONS.map(({ type, icon: Icon, color, label }) => {
        const count = counts[type] ?? 0;
        const active = userReactions.has(type as any);
        if (count === 0 && !currentUserId) return null;

        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            disabled={!currentUserId}
            title={label}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
              currentUserId ? "cursor-pointer hover:scale-105" : "cursor-default",
              active
                ? `bg-[${color}]/20 border border-[${color}]/40`
                : "bg-[#141428] border border-[#1e1e3a] hover:border-[#2d2d5a]"
            )}
            style={active ? { backgroundColor: `${color}20`, borderColor: `${color}50` } : {}}
          >
            <Icon
              className="w-3.5 h-3.5"
              style={{ color: active ? color : "#475569" }}
            />
            {count > 0 && <span style={{ color: active ? color : "#475569" }}>{count}</span>}
          </button>
        );
      })}

      {!hasAny && currentUserId && (
        <span className="text-xs text-[#2d2d5a] italic">React to this post</span>
      )}
    </div>
  );
}
