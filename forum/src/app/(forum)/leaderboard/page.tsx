import { prisma } from "@/lib/db";
import Link from "next/link";
import { Trophy, Crown, Star, Shield, Users } from "lucide-react";
import { formatNumber, getReputationLevel } from "@/lib/utils";

export const metadata = { title: "Leaderboard | StreamZone" };

export default async function LeaderboardPage() {
  const topUsers = await prisma.profile.findMany({
    orderBy: { reputation: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          username: true,
          name: true,
          createdAt: true,
          badges: { include: { badge: true }, take: 3 },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#f59e0b]" />
          Leaderboard
        </h1>
        <p className="text-sm text-[#475569] mt-1">Top contributors to the StreamZone community</p>
      </div>

      {/* Top 3 podium */}
      {topUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[topUsers[1], topUsers[0], topUsers[2]].map((profile, podiumIdx) => {
            const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const colors = ["#94a3b8", "#f59e0b", "#a87232"];
            const icons = [Star, Crown, Shield];
            const Icon = icons[rank - 1] ?? Star;
            const sizes = ["text-base", "text-xl", "text-sm"];

            return (
              <Link
                key={profile.id}
                href={`/profile/${profile.user.username}`}
                className={`cyber-card p-4 flex flex-col items-center gap-2 group ${rank === 1 ? "border-[#f59e0b]/30" : ""}`}
              >
                <Icon className={`w-5 h-5`} style={{ color: colors[rank - 1] }} />
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${colors[rank - 1]}80, ${colors[rank - 1]}40)`, border: `2px solid ${colors[rank - 1]}60` }}
                >
                  {profile.user.username[0].toUpperCase()}
                </div>
                <div className={`font-semibold ${sizes[rank - 1]} text-center`} style={{ color: colors[rank - 1] }}>
                  #{rank}
                </div>
                <div className="text-sm font-medium text-[#e2e8f0] group-hover:text-[#00d4ff] text-center truncate w-full">
                  {profile.user.username}
                </div>
                <div className="text-xs text-[#475569]">{formatNumber(profile.reputation)} rep</div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="cyber-card overflow-hidden">
        <div className="px-4 py-2 border-b border-[#1e1e3a] grid grid-cols-12 text-xs font-semibold uppercase tracking-wider text-[#475569]">
          <div className="col-span-1">#</div>
          <div className="col-span-5">User</div>
          <div className="col-span-2 text-right">Posts</div>
          <div className="col-span-2 text-right">Threads</div>
          <div className="col-span-2 text-right">Rep</div>
        </div>
        {topUsers.map((profile, i) => {
          const { color, title } = getReputationLevel(profile.reputation);
          return (
            <Link
              key={profile.id}
              href={`/profile/${profile.user.username}`}
              className="px-4 py-3 grid grid-cols-12 items-center gap-2 border-b border-[#1e1e3a] last:border-b-0 hover:bg-[#141428] transition-colors"
            >
              <div className="col-span-1 text-sm font-bold" style={{ color: i < 3 ? ["#f59e0b","#f59e0b","#a87232"][i] : "#475569" }}>
                {i + 1}
              </div>
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {profile.user.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#e2e8f0] truncate">{profile.user.username}</div>
                  <div className="text-xs" style={{ color }}>{title}</div>
                </div>
              </div>
              <div className="col-span-2 text-right text-sm text-[#94a3b8]">{formatNumber(profile.postCount)}</div>
              <div className="col-span-2 text-right text-sm text-[#94a3b8]">{formatNumber(profile.threadCount)}</div>
              <div className="col-span-2 text-right text-sm font-semibold" style={{ color }}>{formatNumber(profile.reputation)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
