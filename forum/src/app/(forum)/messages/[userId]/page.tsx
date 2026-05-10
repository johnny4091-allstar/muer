import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime, getInitials } from "@/lib/utils";
import MessageComposer from "./MessageComposer";

interface Props { params: Promise<{ userId: string }> }

export default async function ConversationPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId: partnerId } = await params;
  const currentUserId = session.user.id;

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, username: true, name: true },
  });
  if (!partner) notFound();

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId },
      ],
      isDeleted: false,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: currentUserId, isRead: false },
    data: { isRead: true },
  });

  return (
    <div className="flex flex-col gap-4 max-h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-sm font-bold text-white">
          {getInitials(partner.name ?? partner.username)}
        </div>
        <div>
          <div className="font-semibold text-[#e2e8f0]">{partner.username}</div>
          <div className="text-xs text-[#475569]">Direct Message</div>
        </div>
      </div>

      <div className="flex-1 cyber-card p-4 flex flex-col gap-3 overflow-y-auto min-h-[300px] max-h-[500px]">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                  isOwn
                    ? "bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#e2e8f0]"
                    : "bg-[#141428] border border-[#1e1e3a] text-[#e2e8f0]"
                }`}
              >
                {msg.content}
                <div className="text-xs text-[#475569] mt-1 text-right">{formatDateTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center text-[#475569] py-8">No messages yet. Say hello!</div>
        )}
      </div>

      <MessageComposer receiverId={partnerId} />
    </div>
  );
}
