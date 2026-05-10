import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDate, formatNumber, getReputationLevel } from "@/lib/utils";
import Link from "next/link";
import { MessageSquare, Award, Star, List, Calendar, Clock, Edit, Globe, MapPin } from "lucide-react";

interface Props { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { name: true, username: true } });
  if (!user) return {};
  return { title: `${user.name ?? user.username} | StreamZone` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      badges: { include: { badge: true } },
      threads: { where: { isDeleted: false }, orderBy: { createdAt: "desc" }, take: 5, include: { category: { select: { name: true, slug: true } } } },
      _count: { select: { posts: true, threads: true } },
    },
  });

  if (!user) notFound();

  const { level, title: levelTitle, color: levelColor, next } = getReputationLevel(user.profile?.reputation ?? 0);
  const rep = user.profile?.reputation ?? 0;
  const prevThreshold = level === 1 ? 0 : [0, 100, 500, 2000][level - 2] ?? 0;
  const pct = next === Infinity ? 100 : Math.round(((rep - prevThreshold) / (next - prevThreshold)) * 100);

  const isOwn = session?.user?.id === user.id;

  return (
    <div className="flex flex-col gap-4">
      {/* Profile Header */}
      <div className="cyber-card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#e2e8f0]">{user.name ?? user.username}</h1>
                <div className="text-sm text-[#475569]">@{user.username}</div>
                {user.profile?.customTitle && (
                  <div className="text-sm mt-0.5" style={{ color: levelColor }}>{user.profile.customTitle}</div>
                )}
              </div>
              {isOwn && (
                <Link href="/settings" className="btn-neon-blue px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </Link>
              )}
            </div>

            {user.profile?.bio && (
              <p className="text-sm text-[#94a3b8] mt-2">{user.profile.bio}</p>
            )}

            <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-[#475569]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {formatDate(user.createdAt)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Last seen {formatDate(user.lastSeenAt)}</span>
              {user.profile?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.profile.location}</span>}
              {user.profile?.website && (
                <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#00d4ff]">
                  <Globe className="w-3 h-3" />Website
                </a>
              )}
            </div>

            {user.profile?.iptvSetupInfo && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-[#00d4ff]/5 border border-[#00d4ff]/20 text-xs">
                <span className="text-[#475569]">IPTV Setup: </span>
                <span className="text-[#94a3b8]">{user.profile.iptvSetupInfo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1e1e3a]">
          <StatBox icon={MessageSquare} value={user._count.posts} label="Posts" color="#a855f7" />
          <StatBox icon={MessageSquare} value={user._count.threads} label="Threads" color="#06b6d4" />
          <StatBox icon={Star} value={formatNumber(rep)} label="Reputation" color={levelColor} />
        </div>

        {/* Level / Reputation bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: levelColor }}>Level {level}: {levelTitle}</span>
            {next !== Infinity && (
              <span className="text-xs text-[#475569]">{rep} / {next} rep</span>
            )}
          </div>
          <div className="h-1.5 bg-[#141428] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${levelColor}80, ${levelColor})` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Threads */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#a855f7]" />
            Recent Threads
          </h2>
          <div className="flex flex-col gap-2">
            {user.threads.map((thread) => (
              <div key={thread.id} className="cyber-card p-3">
                <Link href={`/threads/${thread.id}`} className="text-sm font-medium text-[#e2e8f0] hover:text-[#00d4ff] transition-colors">
                  {thread.title}
                </Link>
                <div className="text-xs text-[#475569] mt-1">
                  in <Link href={`/categories/${thread.category.slug}`} className="text-[#94a3b8] hover:text-[#00d4ff]">{thread.category.name}</Link>
                </div>
              </div>
            ))}
            {user.threads.length === 0 && (
              <div className="cyber-card p-6 text-center text-[#475569] text-sm">No threads yet</div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#f59e0b]" />
            Badges
          </h2>
          <div className="cyber-card p-3">
            {user.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.badges.map(({ badge }) => (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}30` }}
                  >
                    {badge.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#475569] text-center py-4">No badges yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, value, label, color }: { icon: any; value: any; label: string; color: string }) {
  return (
    <div className="rounded-lg bg-[#141428] p-3 flex flex-col items-center gap-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-[#475569]">{label}</div>
    </div>
  );
}
