import { prisma } from "@/lib/db";
import { ReactionType } from "@prisma/client";

const POINTS: Record<string, number> = {
  post_created: 2,
  thread_created: 5,
  reaction_helpful: 3,
  reaction_love: 3,
  reaction_like: 1,
  post_marked_solution: 15,
  review_posted: 10,
  playlist_valid: 8,
  post_deleted_by_mod: -5,
  warning_issued: -10,
};

export async function awardPoints(userId: string, event: keyof typeof POINTS) {
  const points = POINTS[event] ?? 0;
  if (points === 0) return;

  const profile = await prisma.profile.update({
    where: { userId },
    data: { reputation: { increment: points } },
  });

  // Update level
  const { level } = getLevel(profile.reputation);
  if (profile.level !== level) {
    await prisma.profile.update({
      where: { userId },
      data: { level },
    });
  }

  await checkAndAwardBadges(userId, profile.reputation);
}

export function getLevel(reputation: number): { level: number; title: string } {
  if (reputation >= 5000) return { level: 5, title: "Legend" };
  if (reputation >= 2000) return { level: 4, title: "Veteran" };
  if (reputation >= 500)  return { level: 3, title: "Regular" };
  if (reputation >= 100)  return { level: 2, title: "Member" };
  return { level: 1, title: "Newcomer" };
}

async function checkAndAwardBadges(userId: string, reputation: number) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { postCount: true, threadCount: true },
  });
  if (!profile) return;

  const allBadges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedIds = new Set(userBadges.map((b) => b.badgeId));

  const toAward: string[] = [];

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue;
    if (badge.name === "First Post" && profile.postCount >= 1) toAward.push(badge.id);
    if (badge.name === "Thread Starter" && profile.threadCount >= 1) toAward.push(badge.id);
    if (badge.name === "Regular" && reputation >= 500) toAward.push(badge.id);
    if (badge.name === "Veteran" && reputation >= 2000) toAward.push(badge.id);
    if (badge.name === "Legend" && reputation >= 5000) toAward.push(badge.id);
  }

  for (const badgeId of toAward) {
    await prisma.userBadge.create({ data: { userId, badgeId } });
    const badge = allBadges.find((b) => b.id === badgeId)!;
    await prisma.notification.create({
      data: {
        userId,
        type: "BADGE_EARNED",
        title: `Badge Earned: ${badge.name}`,
        body: badge.description,
        actionUrl: `/profile`,
      },
    });
  }
}

export function getReactionEvent(type: ReactionType): keyof typeof POINTS | null {
  if (type === "HELPFUL") return "reaction_helpful";
  if (type === "LOVE") return "reaction_love";
  if (type === "LIKE") return "reaction_like";
  return null;
}
