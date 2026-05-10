import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  Tv, Puzzle, List, Calendar, BookOpen, MessageSquare,
  Hash, Users, TrendingUp, ChevronRight
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  Tv, Puzzle, List, Calendar, BookOpen, MessageSquare, Hash, Users, TrendingUp,
};

function CategoryIcon({ name, className, color }: { name?: string | null; className?: string; color?: string }) {
  if (!name) return <Hash className={className} color={color} />;
  const Icon = ICON_MAP[name] ?? Hash;
  return <Icon className={className} color={color} />;
}

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { _count: { select: { threads: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

async function getStats() {
  const [users, threads, posts] = await Promise.all([
    prisma.user.count(),
    prisma.thread.count({ where: { isDeleted: false } }),
    prisma.post.count({ where: { isDeleted: false } }),
  ]);
  return { users, threads, posts };
}

export default async function Sidebar() {
  const [categories, stats] = await Promise.all([getCategories(), getStats()]);

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-4">
      {/* Categories */}
      <div className="cyber-card">
        <div className="px-4 py-3 border-b border-[#1e1e3a]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569]">Categories</h3>
        </div>
        <nav className="py-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex items-center gap-3 px-4 py-2 group hover:bg-[#141428] transition-colors"
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" color={cat.color ?? "#00d4ff"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors truncate">
                  {cat.name}
                </div>
                <div className="text-xs text-[#475569]">{cat._count.threads} threads</div>
              </div>
              <ChevronRight className="w-3 h-3 text-[#1e1e3a] group-hover:text-[#475569] transition-colors" />
            </Link>
          ))}
        </nav>
      </div>

      {/* Community Stats */}
      <div className="cyber-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-3">Community</h3>
        <div className="grid grid-cols-3 gap-2">
          <StatItem icon={Users} value={stats.users} label="Members" color="#00d4ff" />
          <StatItem icon={MessageSquare} value={stats.threads} label="Threads" color="#a855f7" />
          <StatItem icon={List} value={stats.posts} label="Posts" color="#06b6d4" />
        </div>
      </div>

      {/* Quick Links */}
      <div className="cyber-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-3">Quick Links</h3>
        <div className="flex flex-col gap-1">
          <SideLink href="/playlists" label="M3U Playlists" color="#06b6d4" />
          <SideLink href="/reviews" label="Provider Reviews" color="#f59e0b" />
          <SideLink href="/leaderboard" label="Leaderboard" color="#ec4899" />
          <SideLink href="/search" label="Search" color="#a855f7" />
        </div>
      </div>
    </aside>
  );
}

function StatItem({
  icon: Icon, value, label, color,
}: {
  icon: React.ComponentType<{ className?: string; color?: string }>;
  value: number;
  label: string;
  color: string;
}) {
  const fmt = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-lg bg-[#141428]">
      <Icon className="w-4 h-4" color={color} />
      <span className="text-sm font-semibold" style={{ color }}>{fmt}</span>
      <span className="text-xs text-[#475569]">{label}</span>
    </div>
  );
}

function SideLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#141428] transition-colors group"
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
