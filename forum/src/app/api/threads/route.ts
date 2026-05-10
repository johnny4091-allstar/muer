import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugifyStr } from "@/lib/utils";
import { awardPoints } from "@/lib/reputation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, content, categorySlug, tags } = await req.json();
    if (!title?.trim() || !content?.trim() || !categorySlug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const baseSlug = slugifyStr(title);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.thread.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const thread = await prisma.$transaction(async (tx) => {
      const t = await tx.thread.create({
        data: {
          title: title.trim(),
          slug,
          categoryId: category.id,
          authorId: session.user.id,
        },
      });

      await tx.post.create({
        data: {
          threadId: t.id,
          authorId: session.user.id,
          content,
          isFirstPost: true,
        },
      });

      if (tags?.length) {
        for (const tagName of tags.slice(0, 5)) {
          const tag = await tx.tag.upsert({
            where: { slug: slugifyStr(tagName) },
            update: {},
            create: { name: tagName, slug: slugifyStr(tagName) },
          });
          await tx.threadTag.upsert({
            where: { threadId_tagId: { threadId: t.id, tagId: tag.id } },
            update: {},
            create: { threadId: t.id, tagId: tag.id },
          });
        }
      }

      await tx.profile.update({
        where: { userId: session.user.id },
        data: { threadCount: { increment: 1 }, postCount: { increment: 1 } },
      });

      return t;
    });

    await awardPoints(session.user.id, "thread_created");
    await awardPoints(session.user.id, "post_created");

    return NextResponse.json({ id: thread.id, slug: thread.slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
