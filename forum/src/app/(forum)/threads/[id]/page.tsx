import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { formatRelativeTime, formatDate, getInitials } from "@/lib/utils";
import {
  ChevronRight, Pin, Lock, CheckCircle, Eye, MessageCircle,
  ThumbsUp, Heart, Laugh, ThumbsDown, Star, Zap
} from "lucide-react";
import ReactionBar from "@/components/forum/ReactionBar";
import ReplyForm from "@/components/forum/ReplyForm";

interface Props { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }

const REACTION_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  LIKE: { icon: ThumbsUp, color: "#00d4ff", label: "Like" },
  LOVE: { icon: Heart, color: "#ec4899", label: "Love" },
  LAUGH: { icon: Laugh, color: "#f59e0b", label: "Haha" },
  HELPFUL: { icon: Star, color: "#10b981", label: "Helpful" },
  DISLIKE: { icon: ThumbsDown, color: "#ef4444", label: "Dislike" },
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const thread = await prisma.thread.findUnique({ where: { id }, select: { title: true } });
  if (!thread) return {};
  return { title: `${thread.title} | StreamZone` };
}

export default async function ThreadPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const PER_PAGE = 20;

  const session = await auth();

  const thread = await prisma.thread.findUnique({
    where: { id, isDeleted: false },
    include: {
      category: { select: { name: true, slug: true, color: true } },
      author: { include: { profile: true } },
      tags: { include: { tag: true } },
      poll: { include: { options: { include: { votes: true } } } },
    },
  });
  if (!thread) notFound();

  // Increment view count
  await prisma.thread.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { threadId: id, isDeleted: false },
      include: {
        author: { include: { profile: true, badges: { include: { badge: true }, take: 3 } } },
        reactions: true,
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.post.count({ where: { threadId: id, isDeleted: false } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#475569]">
        <Link href="/" className="hover:text-[#00d4ff]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/categories/${thread.category.slug}`} className="hover:text-[#00d4ff]" style={{ color: thread.category.color ?? undefined }}>
          {thread.category.name}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="truncate max-w-[200px] text-[#94a3b8]">{thread.title}</span>
      </div>

      {/* Thread Header */}
      <div className="cyber-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {thread.isPinned && (
                <span className="badge-neon badge-yellow flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5" />Pinned
                </span>
              )}
              {thread.isLocked && (
                <span className="badge-neon badge-red flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />Locked
                </span>
              )}
              {thread.isSolved && (
                <span className="badge-neon badge-green flex items-center gap-1">
                  <CheckCircle className="w-2.5 h-2.5" />Solved
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#e2e8f0] mb-2">{thread.title}</h1>
            <div className="flex items-center gap-3 text-xs text-[#475569]">
              <span>by <Link href={`/profile/${thread.author.username}`} className="text-[#94a3b8] hover:text-[#00d4ff]">{thread.author.username}</Link></span>
              <span>{formatDate(thread.createdAt)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.viewCount}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{total - 1} replies</span>
            </div>
            {thread.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {thread.tags.map(({ tag }) => (
                  <span key={tag.id} className="badge-neon badge-blue">{tag.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Poll */}
      {thread.poll && (
        <div className="cyber-card p-4">
          <h3 className="font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00d4ff]" />
            {thread.poll.question}
          </h3>
          <div className="flex flex-col gap-2">
            {thread.poll.options.map((opt) => {
              const totalVotes = thread.poll!.options.reduce((a, o) => a + o.voteCount, 0);
              const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
              return (
                <div key={opt.id} className="relative">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#e2e8f0]">{opt.text}</span>
                    <span className="text-[#475569]">{pct}% ({opt.voteCount})</span>
                  </div>
                  <div className="h-2 bg-[#141428] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, #00d4ff, #a855f7)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#475569] mt-2">
            {thread.poll.options.reduce((a, o) => a + o.voteCount, 0)} total votes
          </p>
        </div>
      )}

      {/* Posts */}
      <div className="flex flex-col gap-3">
        {posts.map((post, index) => (
          <div key={post.id} id={`post-${post.id}`} className={`cyber-card overflow-hidden ${post.isSolution ? "border-[#10b981]/40" : ""}`}>
            {post.isSolution && (
              <div className="px-4 py-1.5 bg-[#10b981]/10 border-b border-[#10b981]/20 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                <span className="text-xs font-semibold text-[#10b981]">Accepted Solution</span>
              </div>
            )}
            <div className="flex gap-4 p-4">
              {/* User sidebar */}
              <div className="w-20 flex-shrink-0 hidden sm:flex flex-col items-center gap-2">
                <Link href={`/profile/${post.author.username}`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-lg font-bold text-white">
                    {getInitials(post.author.name ?? post.author.username)}
                  </div>
                </Link>
                <Link href={`/profile/${post.author.username}`} className="text-xs font-medium text-[#94a3b8] hover:text-[#00d4ff] text-center">
                  {post.author.username}
                </Link>
                {post.author.profile?.customTitle && (
                  <span className="text-xs text-[#475569] text-center">{post.author.profile.customTitle}</span>
                )}
                <div className="text-xs text-[#475569]">
                  Rep: <span className="text-[#00d4ff]">{post.author.profile?.reputation ?? 0}</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {post.author.badges.slice(0, 2).map(({ badge }) => (
                    <span
                      key={badge.id}
                      title={badge.description}
                      className="text-xs px-1 rounded"
                      style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                    >
                      {badge.icon}
                    </span>
                  ))}
                </div>
              </div>

              {/* Post content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 sm:hidden">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white">
                      {getInitials(post.author.name ?? post.author.username)}
                    </div>
                    <Link href={`/profile/${post.author.username}`} className="text-sm font-medium text-[#94a3b8] hover:text-[#00d4ff]">
                      {post.author.username}
                    </Link>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-xs text-[#475569]">
                    <span>{formatRelativeTime(post.createdAt)}</span>
                    {post.editedAt && <span className="text-[#2d2d5a]">(edited)</span>}
                    <span>#{(page - 1) * PER_PAGE + index + 1}</span>
                  </div>
                </div>

                <div
                  className="post-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <ReactionBar
                  postId={post.id}
                  reactions={post.reactions}
                  currentUserId={session?.user?.id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/threads/${id}?page=${p}`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                p === page
                  ? "bg-[#00d4ff]/20 border border-[#00d4ff]/50 text-[#00d4ff]"
                  : "bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {session?.user && !thread.isLocked && (
        <ReplyForm threadId={thread.id} />
      )}
      {thread.isLocked && (
        <div className="cyber-card p-4 text-center text-sm text-[#475569] flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          This thread is locked and no longer accepts replies.
        </div>
      )}
    </div>
  );
}
