import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import {
  List, Download, CheckCircle, XCircle, Clock, User,
  ExternalLink, Hash, ChevronRight
} from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return { title: "Playlist Not Found" };
  return { title: `${playlist.title} | StreamZone Playlists` };
}

export default async function PlaylistDetailPage({ params }: Props) {
  const { id } = await params;

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, name: true } },
    },
  });

  if (!playlist) notFound();

  const statusConfig = {
    VALID: { icon: CheckCircle, color: "#10b981", label: "Valid" },
    INVALID: { icon: XCircle, color: "#ef4444", label: "Invalid" },
    PENDING: { icon: Clock, color: "#f59e0b", label: "Pending" },
    EXPIRED: { icon: XCircle, color: "#6b7280", label: "Expired" },
  };
  const statusInfo = statusConfig[playlist.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#475569]">
        <Link href="/" className="hover:text-[#94a3b8] transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/playlists" className="hover:text-[#94a3b8] transition-colors">Playlists</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#94a3b8] truncate max-w-[200px]">{playlist.title}</span>
      </nav>

      {/* Header */}
      <div className="cyber-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center flex-shrink-0">
            <List className="w-6 h-6" color="#06b6d4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-[#e2e8f0]">{playlist.title}</h1>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </div>
            </div>
            {playlist.description && (
              <p className="text-sm text-[#94a3b8] mt-2">{playlist.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#1e1e3a]">
          <div className="flex flex-col items-center gap-1 p-3 bg-[#141428] rounded-lg">
            <Hash className="w-4 h-4" color="#06b6d4" />
            <span className="text-lg font-bold text-[#e2e8f0]">
              {playlist.channelCount ?? "—"}
            </span>
            <span className="text-xs text-[#475569]">Channels</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-[#141428] rounded-lg">
            <Download className="w-4 h-4" color="#a855f7" />
            <span className="text-lg font-bold text-[#e2e8f0]">
              {formatNumber(playlist.downloadCount)}
            </span>
            <span className="text-xs text-[#475569]">Downloads</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-[#141428] rounded-lg">
            <User className="w-4 h-4" color="#00d4ff" />
            <span className="text-sm font-bold text-[#e2e8f0] truncate w-full text-center">
              {playlist.author.username}
            </span>
            <span className="text-xs text-[#475569]">Author</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-xs text-[#475569]">
          <span>Submitted {formatRelativeTime(playlist.createdAt)}</span>
          {playlist.validatedAt && (
            <span>Validated {formatRelativeTime(playlist.validatedAt)}</span>
          )}
        </div>
      </div>

      {/* Download / URL */}
      <div className="cyber-card p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
          Playlist URL
        </h2>
        {playlist.m3uUrl ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-[#06b6d4] font-mono p-2 bg-[#0a0a0f] rounded-lg border border-[#1e1e3a] truncate">
              {playlist.m3uUrl}
            </code>
            <a
              href={`/api/playlists/${playlist.id}/download`}
              className="btn-neon-blue px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#475569]">File-based playlist</span>
            <a
              href={`/api/playlists/${playlist.id}/download`}
              className="btn-neon-blue px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download M3U
            </a>
          </div>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link
          href="/playlists"
          className="text-sm text-[#00d4ff] hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Browse all playlists
        </Link>
      </div>
    </div>
  );
}
