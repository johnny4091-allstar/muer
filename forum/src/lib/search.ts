import { prisma } from "@/lib/db";

export interface SearchResult {
  type: "thread" | "post" | "user";
  id: string;
  title?: string;
  excerpt?: string;
  slug?: string;
  username?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export async function searchThreads(query: string, page = 1, limit = 20): Promise<SearchResult[]> {
  const offset = (page - 1) * limit;

  const results = await prisma.$queryRaw<any[]>`
    SELECT t.id, t.title, t.slug, t."createdAt",
      ts_rank(to_tsvector('english', t.title), plainto_tsquery('english', ${query})) AS rank
    FROM "Thread" t
    WHERE to_tsvector('english', t.title) @@ plainto_tsquery('english', ${query})
      AND t."isDeleted" = false
    ORDER BY rank DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return results.map((r) => ({
    type: "thread" as const,
    id: r.id,
    title: r.title,
    slug: r.slug,
    createdAt: r.createdAt,
  }));
}

export async function searchPosts(query: string, page = 1, limit = 20): Promise<SearchResult[]> {
  const offset = (page - 1) * limit;

  const results = await prisma.$queryRaw<any[]>`
    SELECT p.id, p.content, p."createdAt",
      ts_rank(to_tsvector('english', p.content), plainto_tsquery('english', ${query})) AS rank
    FROM "Post" p
    WHERE to_tsvector('english', p.content) @@ plainto_tsquery('english', ${query})
      AND p."isDeleted" = false
    ORDER BY rank DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return results.map((r) => ({
    type: "post" as const,
    id: r.id,
    excerpt: r.content?.replace(/<[^>]*>/g, "").slice(0, 200),
    createdAt: r.createdAt,
  }));
}

export async function searchUsers(query: string, limit = 10): Promise<SearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
      isBanned: false,
    },
    include: { profile: { select: { avatarUrl: true } } },
    take: limit,
  });

  return users.map((u) => ({
    type: "user" as const,
    id: u.id,
    username: u.username,
    title: u.name ?? u.username,
    avatarUrl: u.profile?.avatarUrl ?? undefined,
    createdAt: u.createdAt,
  }));
}
