import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { List, Plus, Download, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

export const metadata = { title: "M3U Playlists | StreamZone" };

export default async function PlaylistsPage() {
  const session = await auth();

  const playlists = await prisma.playlist.findMany({
    where: { isPublic: true },
    include: { author: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusIcon = {
    VALID: <CheckCircle className="w-4 h-4 text-[#10b981]" />,
    INVALID: <XCircle className="w-4 h-4 text-[#ef4444]" />,
    PENDING: <Clock className="w-4 h-4 text-[#f59e0b]" />,
    EXPIRED: <XCircle className="w-4 h-4 text-[#475569]" />,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
            <List className="w-6 h-6 text-[#06b6d4]" />
            M3U Playlists
          </h1>
          <p className="text-sm text-[#475569] mt-1">Share and discover IPTV playlists</p>
        </div>
        {session?.user && (
          <Link href="/playlists/submit" className="btn-neon-blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Submit Playlist
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {playlists.map((pl) => (
          <div key={pl.id} className="cyber-card p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex items-center justify-center flex-shrink-0">
              <List className="w-5 h-5 text-[#06b6d4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/playlists/${pl.id}`} className="font-semibold text-[#e2e8f0] hover:text-[#06b6d4] transition-colors">
                  {pl.title}
                </Link>
                {statusIcon[pl.status]}
              </div>
              {pl.description && <p className="text-sm text-[#475569] mt-1 line-clamp-2">{pl.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-[#475569]">
                <span>by {pl.author.username}</span>
                <span>{formatRelativeTime(pl.createdAt)}</span>
                {pl.channelCount && <span className="text-[#06b6d4]">{pl.channelCount} channels</span>}
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{pl.downloadCount}</span>
              </div>
              {pl.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {pl.tags.map((tag) => (
                    <span key={tag} className="badge-neon badge-blue">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            {pl.m3uUrl && (
              <a
                href={pl.m3uUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon-blue px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
            )}
          </div>
        ))}

        {playlists.length === 0 && (
          <div className="cyber-card p-10 text-center text-[#475569]">
            <List className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No playlists yet.</p>
            {session?.user && (
              <Link href="/playlists/submit" className="mt-3 btn-neon-blue px-4 py-2 rounded-lg text-sm inline-block">
                Submit First Playlist
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
