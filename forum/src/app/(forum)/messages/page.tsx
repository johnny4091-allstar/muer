import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Messages | StreamZone" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Get unique conversations
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      isDeleted: false,
    },
    include: {
      sender: { select: { id: true, username: true, name: true } },
      receiver: { select: { id: true, username: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by conversation partner
  const conversations = new Map<string, { user: any; lastMessage: (typeof messages)[0]; unread: number }>();
  for (const msg of messages) {
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!conversations.has(partner.id)) {
      const unread = messages.filter((m) => m.senderId === partner.id && m.receiverId === userId && !m.isRead).length;
      conversations.set(partner.id, { user: partner, lastMessage: msg, unread });
    }
  }

  const convList = Array.from(conversations.values());

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-[#a855f7]" />
        Messages
      </h1>

      {convList.length === 0 ? (
        <div className="cyber-card p-10 text-center text-[#475569]">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No messages yet.</p>
        </div>
      ) : (
        <div className="cyber-card overflow-hidden">
          {convList.map(({ user, lastMessage, unread }) => (
            <Link
              key={user.id}
              href={`/messages/${user.id}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e3a] last:border-b-0 hover:bg-[#141428] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {getInitials(user.name ?? user.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#e2e8f0]">{user.username}</span>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#a855f7] flex items-center justify-center text-xs text-white flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#475569] truncate">
                  {lastMessage.content.replace(/<[^>]*>/g, "").slice(0, 60)}
                </div>
                <div className="text-xs text-[#2d2d5a]">{formatRelativeTime(lastMessage.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
