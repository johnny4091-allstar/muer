"use client";

import { useState, useEffect, useCallback } from "react";
import type { XtreamChannel, XtreamVod, XtreamSeries } from "@/lib/types";

interface SearchResults {
  channels: XtreamChannel[];
  vod: XtreamVod[];
  series: XtreamSeries[];
}

interface SearchOverlayProps {
  onChannelSelect: (ch: XtreamChannel) => void;
  onVodSelect: (v: XtreamVod) => void;
  onSeriesSelect: (s: XtreamSeries) => void;
}

export function SearchOverlay({ onChannelSelect, onVodSelect, onSeriesSelect }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<SearchResults | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/xtream/live").then((r) => r.json()),
      fetch("/api/xtream/vod").then((r) => r.json()),
      fetch("/api/xtream/series").then((r) => r.json()),
    ]).then(([live, vod, series]) => {
      setAllData({
        channels: live.channels || [],
        vod: vod.streams || [],
        series: series.series || [],
      });
    });
  }, []);

  const search = useCallback(
    (q: string) => {
      if (!q.trim() || !allData) {
        setResults(null);
        return;
      }
      setLoading(true);
      const lower = q.toLowerCase();
      setResults({
        channels: allData.channels.filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 10),
        vod: allData.vod.filter((v) => v.name.toLowerCase().includes(lower)).slice(0, 10),
        series: allData.series.filter((s) => s.name.toLowerCase().includes(lower)).slice(0, 10),
      });
      setLoading(false);
    },
    [allData]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  const total = results ? results.channels.length + results.vod.length + results.series.length : 0;

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search live TV, movies, series..."
          autoFocus
          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {!query && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Start typing to search across all content</p>
        </div>
      )}

      {query && loading && (
        <p className="text-center text-muted-foreground text-sm">Searching...</p>
      )}

      {results && total === 0 && !loading && (
        <p className="text-center text-muted-foreground text-sm">No results for &quot;{query}&quot;</p>
      )}

      {results && total > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {results.channels.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Live TV</h3>
              <div className="space-y-1">
                {results.channels.map((ch) => (
                  <div
                    key={ch.stream_id}
                    onClick={() => onChannelSelect(ch)}
                    className="flex items-center gap-3 px-3 py-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <span className="text-sm text-muted-foreground w-5 text-right">{ch.num}</span>
                    <p className="text-sm text-foreground">{ch.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.vod.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Movies</h3>
              <div className="space-y-1">
                {results.vod.map((v) => (
                  <div
                    key={v.stream_id}
                    onClick={() => onVodSelect(v)}
                    className="flex items-center gap-3 px-3 py-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <p className="text-sm text-foreground">{v.name}</p>
                    {v.rating && <span className="text-xs text-muted-foreground ml-auto">★ {v.rating}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.series.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Series</h3>
              <div className="space-y-1">
                {results.series.map((s) => (
                  <div
                    key={s.series_id}
                    onClick={() => onSeriesSelect(s)}
                    className="flex items-center gap-3 px-3 py-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <p className="text-sm text-foreground">{s.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
