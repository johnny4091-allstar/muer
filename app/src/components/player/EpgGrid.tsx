"use client";

import { useEffect, useState, useRef } from "react";
import type { XtreamChannel } from "@/lib/types";

interface EpgProgram {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface EpgGridProps {
  channels: XtreamChannel[];
  onChannelSelect: (channel: XtreamChannel) => void;
  activeChannelId?: number;
}

const HOUR_WIDTH = 200; // px per hour
const ROW_HEIGHT = 52;
const TIME_HEADER_HEIGHT = 32;
const CHANNEL_COL_WIDTH = 120;

export function EpgGrid({ channels, onChannelSelect, activeChannelId }: EpgGridProps) {
  const [epgData, setEpgData] = useState<Record<string, EpgProgram[]>>({});
  const [selectedProgram, setSelectedProgram] = useState<EpgProgram | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const startHour = new Date(now);
  startHour.setHours(now.getHours() - 1, 0, 0, 0);
  const totalHours = 8;

  useEffect(() => {
    const visibleChannels = channels.slice(0, 30);
    Promise.all(
      visibleChannels.map(async (ch) => {
        const res = await fetch(`/api/xtream/epg?channelId=${ch.stream_id}`);
        if (!res.ok) return { id: String(ch.stream_id), programs: [] };
        const data = await res.json();
        return { id: String(ch.stream_id), programs: data.programs || [] };
      })
    ).then((results) => {
      const map: Record<string, EpgProgram[]> = {};
      for (const r of results) map[r.id] = r.programs;
      setEpgData(map);
    });
  }, [channels]);

  function timeToX(time: Date): number {
    return ((time.getTime() - startHour.getTime()) / 3600000) * HOUR_WIDTH;
  }

  const timeLabels = Array.from({ length: totalHours + 1 }, (_, i) => {
    const t = new Date(startHour);
    t.setHours(t.getHours() + i);
    return t;
  });

  const nowX = timeToX(now);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {selectedProgram && (
        <div className="flex-shrink-0 bg-card border-b border-border px-4 py-2 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{selectedProgram.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedProgram.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
              {new Date(selectedProgram.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          {selectedProgram.description && (
            <p className="text-xs text-muted-foreground max-w-sm truncate">{selectedProgram.description}</p>
          )}
          <button onClick={() => setSelectedProgram(null)} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-auto">
        <div style={{ minWidth: CHANNEL_COL_WIDTH + totalHours * HOUR_WIDTH }}>
          {/* Time header */}
          <div className="sticky top-0 z-10 flex bg-card border-b border-border" style={{ height: TIME_HEADER_HEIGHT }}>
            <div style={{ width: CHANNEL_COL_WIDTH }} className="flex-shrink-0 border-r border-border" />
            <div className="relative flex-1">
              {timeLabels.map((t, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-muted-foreground"
                  style={{ left: i * HOUR_WIDTH, top: "50%", transform: "translateY(-50%)" }}
                >
                  {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              ))}
              {/* Now indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                style={{ left: Math.max(0, nowX) }}
              />
            </div>
          </div>

          {/* Channel rows */}
          {channels.slice(0, 30).map((ch) => {
            const programs = epgData[String(ch.stream_id)] || [];
            return (
              <div key={ch.stream_id} className="flex border-b border-border/40" style={{ height: ROW_HEIGHT }}>
                {/* Channel label */}
                <div
                  onClick={() => onChannelSelect(ch)}
                  className={`flex-shrink-0 flex items-center gap-2 px-2 border-r border-border cursor-pointer hover:bg-accent transition-colors ${activeChannelId === ch.stream_id ? "bg-primary/10" : ""}`}
                  style={{ width: CHANNEL_COL_WIDTH }}
                >
                  {ch.stream_icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ch.stream_icon} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                  <span className="text-xs text-foreground truncate">{ch.name}</span>
                </div>

                {/* Programs */}
                <div className="relative flex-1 overflow-hidden">
                  {programs.map((prog) => {
                    const left = Math.max(0, timeToX(new Date(prog.startTime)));
                    const right = Math.min(totalHours * HOUR_WIDTH, timeToX(new Date(prog.endTime)));
                    const width = right - left;
                    if (width <= 0) return null;
                    return (
                      <div
                        key={prog.id}
                        onClick={() => setSelectedProgram(prog)}
                        className="absolute top-1 bottom-1 bg-secondary border border-border/60 rounded px-1.5 overflow-hidden cursor-pointer hover:bg-accent transition-colors"
                        style={{ left, width: width - 2 }}
                      >
                        <p className="text-xs text-foreground truncate leading-tight mt-0.5">{prog.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(prog.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    );
                  })}
                  {/* Now line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 pointer-events-none"
                    style={{ left: Math.max(0, nowX) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
