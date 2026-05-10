import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { PlusCircle, MessageCircle, Eye, Pin, Lock, CheckCircle, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return {};
  return { title: `${cat.name} | StreamZone`, description: cat.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const PER_PAGE = 25;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: { include: { _count: { select: { threads: true } } } },
    },
  });
  if (!category) notFound();

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where: { categoryId: category.id, isDeleted: false },
      include: {
        author: { select: { username: true } },
        _count: { select: { posts: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.thread.count({ where: { categoryId: category.id, isDeleted: false } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const session = await auth();

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="cyber-card p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
          >
            <span className="text-xl">📺</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-[#475569] mb-1">
              <Link href="/" className="hover:text-[#00d4ff]">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: category.color ?? "#00d4ff" }}>{category.name}</span>
            </div>
            <h1 className="text-xl font-bold text-[#e2e8f0]">{category.name}</h1>
            {category.description && <p className="text-sm text-[#94a3b8] mt-1">{category.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-[#475569]">
              <span>{total} threads</span>
            </div>
          </div>
          {session?.user && (
            <Link
              href={`/categories/${slug}/new`}
              className="btn-neon-blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              New Thread
            </Link>
          )}
        </div>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {category.children.map((sub) => (
            <Link key={sub.id} href={`/categories/${sub.slug}`} className="cyber-card p-3 flex items-center gap-3 group">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color ?? "#00d4ff" }} />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#e2e8f0] group-hover:text-[#00d4ff]">{sub.name}</div>
                <div className="text-xs text-[#475569]">{sub._count.threads} threads</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Thread List */}
      <div className="cyber-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e1e3a] grid grid-cols-12 text-xs font-semibold uppercase tracking-wider text-[#475569]">
          <div className="col-span-7">Thread</div>
          <div className="col-span-2 text-center hidden sm:block">Replies</div>
          <div className="col-span-2 text-center hidden sm:block">Views</div>
          <div className="col-span-3 sm:col-span-1 text-right">Last Post</div>
        </div>

        {threads.length === 0 ? (
          <div className="p-10 text-center text-[#475569]">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No threads yet. Be the first to post!</p>
            {session?.user && (
              <Link href={`/categories/${slug}/new`} className="mt-3 btn-neon-blue px-4 py-2 rounded-lg text-sm inline-block">
                Create First Thread
              </Link>
            )}
          </div>
        ) : (
          <div>
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`px-4 py-3 grid grid-cols-12 items-center gap-2 border-b border-[#1e1e3a] last:border-b-0 hover:bg-[#141428] transition-colors ${thread.isPinned ? "bg-[#0f1620]" : ""}`}
              >
                <div className="col-span-9 sm:col-span-7 flex items-start gap-2 min-w-0">
                  <div className="flex flex-col gap-1 mt-0.5 flex-shrink-0">
                    {thread.isPinned && <Pin className="w-3 h-3 text-[#f59e0b]" />}
                    {thread.isLocked && <Lock className="w-3 h-3 text-[#ef4444]" />}
                    {thread.isSolved && <CheckCircle className="w-3 h-3 text-[#10b981]" />}
                    {!thread.isPinned && !thread.isLocked && !thread.isSolved && (
                      <MessageCircle className="w-3 h-3 text-[#475569]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/threads/${thread.id}`}
                      className="text-sm font-medium text-[#e2e8f0] hover:text-[#00d4ff] transition-colors line-clamp-1"
                    >
                      {thread.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-[#475569]">by {thread.author.username}</span>
                      {thread.tags.slice(0, 3).map(({ tag }) => (
                        <span key={tag.id} className="text-xs badge-neon badge-blue">{tag.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-center text-sm text-[#94a3b8] hidden sm:block">
                  {thread._count.posts - 1}
                </div>
                <div className="col-span-2 text-center text-sm text-[#94a3b8] hidden sm:flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" />{thread.viewCount}
                </div>
                <div className="col-span-3 sm:col-span-1 text-right text-xs text-[#475569]">
                  {formatRelativeTime(thread.lastPostAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/categories/${slug}?page=${p}`}
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
    </div>
  );
}
