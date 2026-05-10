import { searchThreads, searchPosts, searchUsers } from "@/lib/search";
import Link from "next/link";
import { Search, MessageSquare, FileText, User } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Props { searchParams: Promise<{ q?: string; type?: string }> }

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q} | StreamZone` : "Search | StreamZone" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, type = "threads" } = await searchParams;

  let threads: Awaited<ReturnType<typeof searchThreads>> = [];
  let posts: Awaited<ReturnType<typeof searchPosts>> = [];
  let users: Awaited<ReturnType<typeof searchUsers>> = [];

  if (q) {
    if (type === "threads") threads = await searchThreads(q);
    else if (type === "posts") posts = await searchPosts(q);
    else if (type === "users") users = await searchUsers(q);
  }

  const tabs = [
    { id: "threads", label: "Threads", icon: MessageSquare },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "users", label: "Users", icon: User },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2 mb-3">
          <Search className="w-6 h-6 text-[#a855f7]" />
          Search
        </h1>
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search StreamZone…"
            className="flex-1 px-4 py-2.5 cyber-input text-sm rounded-lg"
            autoFocus
          />
          <button type="submit" className="btn-neon-blue px-5 py-2.5 rounded-lg text-sm font-semibold">
            Search
          </button>
        </form>
      </div>

      {q && (
        <>
          <div className="flex gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`/search?q=${encodeURIComponent(q)}&type=${id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  type === id
                    ? "bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7]"
                    : "bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {type === "threads" && threads.map((r) => (
              <Link key={r.id} href={`/threads/${r.id}`} className="cyber-card p-3 hover:border-[#a855f7]/30">
                <div className="font-medium text-[#e2e8f0] hover:text-[#a855f7]">{r.title}</div>
                <div className="text-xs text-[#475569] mt-1">{formatRelativeTime(r.createdAt)}</div>
              </Link>
            ))}
            {type === "posts" && posts.map((r) => (
              <div key={r.id} className="cyber-card p-3">
                <p className="text-sm text-[#94a3b8] line-clamp-3">{r.excerpt}</p>
                <div className="text-xs text-[#475569] mt-1">{formatRelativeTime(r.createdAt)}</div>
              </div>
            ))}
            {type === "users" && users.map((r) => (
              <Link key={r.id} href={`/profile/${r.username}`} className="cyber-card p-3 flex items-center gap-3 hover:border-[#a855f7]/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-sm font-bold text-white">
                  {r.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-[#e2e8f0]">{r.username}</div>
                  <div className="text-xs text-[#475569]">{r.title}</div>
                </div>
              </Link>
            ))}

            {((type === "threads" && threads.length === 0) ||
              (type === "posts" && posts.length === 0) ||
              (type === "users" && users.length === 0)) && (
              <div className="cyber-card p-8 text-center text-[#475569]">
                No {type} found for &quot;{q}&quot;
              </div>
            )}
          </div>
        </>
      )}

      {!q && (
        <div className="cyber-card p-10 text-center text-[#475569]">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Enter a search term to find threads, posts, and users.</p>
        </div>
      )}
    </div>
  );
}
