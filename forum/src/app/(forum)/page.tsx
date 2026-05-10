import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import {
  Tv, Puzzle, List, Calendar, BookOpen, MessageSquare,
  Hash, Users, TrendingUp, Zap, Star, ArrowRight, MessageCircle
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  Tv, Puzzle, List, Calendar, BookOpen, MessageSquare, Hash,
};

async function getHomeData() {
  const [categories, recentThreads, stats, topUsers] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { threads: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.thread.findMany({
      where: { isDeleted: false },
      include: {
        author: { include: { profile: { select: { avatarUrl: true } } } },
        category: { select: { name: true, slug: true, color: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { lastPostAt: "desc" },
      take: 10,
    }),
    Promise.all([
      prisma.user.count(),
      prisma.thread.count({ where: { isDeleted: false } }),
      prisma.post.count({ where: { isDeleted: false } }),
    ]),
    prisma.profile.findMany({
      orderBy: { reputation: "desc" },
      take: 5,
      include: { user: { select: { username: true, name: true } } },
    }),
  ]);

  return { categories, recentThreads, stats, topUsers };
}

export default async function HomePage() {
  const { categories, recentThreads, stats, topUsers } = await getHomeData();
  const [userCount, threadCount, postCount] = stats;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden border border-[#1e1e3a] bg-[#0f0f1a]">
        <div className="absolute inset-0 cyber-grid-dense opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/5 via-transparent to-[#a855f7]/5" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#00d4ff] uppercase tracking-wider">Welcome to</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="gradient-text-blue-purple">StreamZone</span>
          </h1>
          <p className="text-[#94a3b8] text-base max-w-xl mb-5">
            The ultimate IPTV community. Share playlists, review providers, discover add-ons, and connect with thousands of IPTV enthusiasts.
          </p>

          <div className="flex flex-wrap gap-4 mb-5">
            <StatChip icon={Users} value={formatNumber(userCount)} label="Members" color="#00d4ff" />
            <StatChip icon={MessageSquare} value={formatNumber(threadCount)} label="Threads" color="#a855f7" />
            <StatChip icon={MessageCircle} value={formatNumber(postCount)} label="Posts" color="#06b6d4" />
          </div>

          <div className="flex gap-3">
            <Link href="/register" className="btn-neon-blue px-5 py-2 rounded-lg text-sm font-semibold">
              Join the Community
            </Link>
            <Link href="/categories/iptv-providers" className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d2d5a] transition-colors">
              Browse Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <section>
        <h2 className="text-lg font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00d4ff]" />
          Forum Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon ?? "Hash"] ?? Hash;
            return (
              <Link key={cat.id} href={`/categories/${cat.slug}`} className="cyber-card p-4 flex items-start gap-4 group">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
                >
                  <Icon className="w-5 h-5" color={cat.color ?? "#00d4ff"} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#e2e8f0] group-hover:text-[#00d4ff] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-[#475569] line-clamp-2 mt-0.5">{cat.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-[#475569]">
                      <span style={{ color: cat.color ?? "#00d4ff" }}>{cat._count.threads}</span> threads
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#1e1e3a] group-hover:text-[#475569] transition-colors flex-shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Threads */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#a855f7]" />
            Recent Threads
          </h2>
          <div className="flex flex-col gap-2">
            {recentThreads.map((thread) => (
              <div key={thread.id} className="cyber-card p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {(thread.author.name ?? thread.author.username)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/threads/${thread.id}`}
                    className="text-sm font-medium text-[#e2e8f0] hover:text-[#00d4ff] transition-colors line-clamp-1"
                  >
                    {thread.isPinned && <span className="text-[#f59e0b] mr-1">📌</span>}
                    {thread.isSolved && <span className="text-[#10b981] mr-1">✓</span>}
                    {thread.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${thread.category.color}20`,
                        color: thread.category.color ?? "#00d4ff",
                      }}
                    >
                      {thread.category.name}
                    </span>
                    <span className="text-xs text-[#475569]">
                      by {thread.author.username} · {formatRelativeTime(thread.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[#475569] flex items-center gap-1 flex-shrink-0">
                  <MessageCircle className="w-3 h-3" />
                  {thread._count.posts}
                </div>
              </div>
            ))}
            {recentThreads.length === 0 && (
              <div className="cyber-card p-8 text-center text-[#475569]">
                No threads yet. Be the first to post!
              </div>
            )}
          </div>
        </div>

        {/* Top Contributors */}
        <div>
          <h2 className="text-lg font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#f59e0b]" />
            Top Contributors
          </h2>
          <div className="cyber-card">
            {topUsers.map((profile, i) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.user.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#141428] transition-colors border-b border-[#1e1e3a] last:border-b-0"
              >
                <span
                  className="text-sm font-bold w-5 text-center"
                  style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#a87232" : "#475569" }}
                >
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white">
                  {(profile.user.name ?? profile.user.username)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#e2e8f0] truncate">{profile.user.username}</div>
                  <div className="text-xs text-[#475569]">{formatNumber(profile.reputation)} rep</div>
                </div>
              </Link>
            ))}
            {topUsers.length === 0 && (
              <div className="p-6 text-center text-[#475569] text-sm">No contributors yet</div>
            )}
            <div className="px-4 py-2 border-t border-[#1e1e3a]">
              <Link href="/leaderboard" className="text-xs text-[#00d4ff] hover:underline">
                View full leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon, value, label, color,
}: {
  icon: React.ComponentType<{ className?: string; color?: string }>;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141428] border border-[#1e1e3a]">
      <Icon className="w-4 h-4" color={color} />
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
      <span className="text-xs text-[#475569]">{label}</span>
    </div>
  );
}
