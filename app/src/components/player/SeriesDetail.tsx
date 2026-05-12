"use client";

import { useState, useEffect } from "react";
import type { XtreamSeries } from "@/lib/types";

interface Episode {
  id: number;
  title: string;
  episode_num: number;
  season: number;
  container_extension: string;
}

interface SeriesDetailProps {
  series: XtreamSeries;
  onEpisodeSelect: (streamId: number, ext: string) => void;
  onBack: () => void;
}

export function SeriesDetail({ series, onEpisodeSelect, onBack }: SeriesDetailProps) {
  const [info, setInfo] = useState<{ seasons?: unknown[]; episodes?: Record<string, Episode[]> } | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>("1");

  useEffect(() => {
    fetch(`/api/xtream/series?id=${series.series_id}`)
      .then((r) => r.json())
      .then(setInfo);
  }, [series.series_id]);

  const episodes: Episode[] = (info?.episodes as Record<string, Episode[]>)?.[selectedSeason] || [];
  const seasons = info?.episodes ? Object.keys(info.episodes).sort((a, b) => Number(a) - Number(b)) : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-border">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-3">← Back</button>
        <div className="flex gap-4">
          {series.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={series.cover} alt={series.name} className="w-16 h-24 object-cover rounded flex-shrink-0" />
          )}
          <div>
            <h2 className="text-base font-semibold text-foreground">{series.name}</h2>
            {series.genre && <p className="text-xs text-muted-foreground mt-1">{series.genre}</p>}
            {series.plot && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{series.plot}</p>}
          </div>
        </div>
      </div>

      {seasons.length > 0 && (
        <div className="flex-shrink-0 flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeason(s)}
              className={`px-3 py-1 rounded text-xs flex-shrink-0 transition-colors ${selectedSeason === s ? "bg-primary text-primary-foreground" : "bg-input border border-border text-muted-foreground hover:text-foreground"}`}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!info ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : episodes.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm p-8">No episodes found</p>
        ) : (
          <div className="divide-y divide-border">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => onEpisodeSelect(ep.id, ep.container_extension)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent cursor-pointer"
              >
                <span className="text-muted-foreground text-sm w-6 text-right">{ep.episode_num}</span>
                <p className="text-sm text-foreground flex-1">{ep.title || `Episode ${ep.episode_num}`}</p>
                <span className="text-xs text-muted-foreground">▶</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
