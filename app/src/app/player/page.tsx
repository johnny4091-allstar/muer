"use client";

import { useState, useEffect, useCallback } from "react";
import { HlsPlayer } from "@/components/player/HlsPlayer";
import { ChannelList } from "@/components/player/ChannelList";
import { VodGrid } from "@/components/player/VodGrid";
import { SeriesDetail } from "@/components/player/SeriesDetail";
import { SearchOverlay } from "@/components/player/SearchOverlay";
import { EpgGrid } from "@/components/player/EpgGrid";
import type { XtreamChannel, XtreamVod, XtreamSeries, XtreamCategory } from "@/lib/types";

type Tab = "live" | "vod" | "series" | "search" | "epg" | "dvr" | "favorites";

export default function PlayerPage() {
  const [tab, setTab] = useState<Tab>("live");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState<string>("");

  // Live TV
  const [liveCategories, setLiveCategories] = useState<XtreamCategory[]>([]);
  const [channels, setChannels] = useState<XtreamChannel[]>([]);
  const [liveCategory, setLiveCategory] = useState("");
  const [activeChannel, setActiveChannel] = useState<XtreamChannel | null>(null);

  // VOD
  const [vodCategories, setVodCategories] = useState<XtreamCategory[]>([]);
  const [vodStreams, setVodStreams] = useState<XtreamVod[]>([]);
  const [vodCategory, setVodCategory] = useState("");

  // Series
  const [seriesCategories, setSeriesCategories] = useState<XtreamCategory[]>([]);
  const [seriesList, setSeriesList] = useState<XtreamSeries[]>([]);
  const [seriesCategory, setSeriesCategory] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<XtreamSeries | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [errors, setErrors] = useState<string[]>([]);

  // Load live channels
  useEffect(() => {
    if (tab === "live" || tab === "epg") {
      fetch(`/api/xtream/live${liveCategory ? `?category=${liveCategory}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          setLiveCategories(d.categories || []);
          setChannels(d.channels || []);
        });
    }
  }, [tab, liveCategory]);

  // Load VOD
  useEffect(() => {
    if (tab === "vod") {
      fetch(`/api/xtream/vod${vodCategory ? `?category=${vodCategory}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          setVodCategories(d.categories || []);
          setVodStreams(d.streams || []);
        });
    }
  }, [tab, vodCategory]);

  // Load Series
  useEffect(() => {
    if (tab === "series" && !selectedSeries) {
      fetch(`/api/xtream/series${seriesCategory ? `?category=${seriesCategory}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          setSeriesCategories(d.categories || []);
          setSeriesList(d.series || []);
        });
    }
  }, [tab, seriesCategory, selectedSeries]);

  // Load favorites
  useEffect(() => {
    fetch("/api/favorites/sync?deviceId=web")
      .then((r) => r.ok ? r.json() : { channels: [], movies: [], series: [] })
      .then((d) => {
        const ids = new Set<string>([
          ...d.channels.map((f: { itemId: string }) => f.itemId),
          ...d.movies.map((f: { itemId: string }) => f.itemId),
          ...d.series.map((f: { itemId: string }) => f.itemId),
        ]);
        setFavorites(ids);
      })
      .catch(() => null);
  }, []);

  function playStream(url: string, title: string) {
    setStreamUrl(url);
    setStreamTitle(title);
  }

  function selectChannel(ch: XtreamChannel) {
    setActiveChannel(ch);
    playStream(`/api/xtream/stream/${ch.stream_id}?type=live`, ch.name);
  }

  function selectVod(vod: XtreamVod) {
    playStream(`/api/xtream/stream/${vod.stream_id}?type=vod&ext=${vod.container_extension}`, vod.name);
  }

  function selectEpisode(streamId: number, ext: string) {
    playStream(`/api/xtream/stream/${streamId}?type=series&ext=${ext}`, `Episode ${streamId}`);
  }

  const toggleFavorite = useCallback(
    async (itemType: "CHANNEL" | "MOVIE" | "SERIES", itemId: string, metadata: Record<string, unknown>) => {
      const action = favorites.has(itemId) ? "remove" : "add";
      setFavorites((prev) => {
        const next = new Set(prev);
        if (action === "remove") next.delete(itemId);
        else next.add(itemId);
        return next;
      });
      await fetch("/api/favorites/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "web", action, itemType, itemId, metadata }),
      });
    },
    [favorites]
  );

  function handleError(type: string) {
    setErrors((prev) => [...prev.slice(-4), type]);
  }

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: "live", label: "Live TV" },
    { key: "epg", label: "EPG Grid" },
    { key: "vod", label: "Movies" },
    { key: "series", label: "Series" },
    { key: "search", label: "Search" },
    { key: "dvr", label: "DVR" },
    { key: "favorites", label: "Favorites" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <a href="/portal/dashboard" className="text-xs text-muted-foreground hover:text-foreground mr-2">← Portal</a>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
        {streamTitle && (
          <span className="ml-auto text-xs text-muted-foreground truncate max-w-xs">▶ {streamTitle}</span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar / Content area */}
        <div className="w-72 flex-shrink-0 border-r border-border overflow-hidden">
          {tab === "live" && (
            <ChannelList
              categories={liveCategories}
              channels={channels}
              selectedCategory={liveCategory}
              onCategoryChange={setLiveCategory}
              onChannelSelect={selectChannel}
              activeChannelId={activeChannel?.stream_id}
              favorites={favorites}
              onToggleFavorite={(ch) => toggleFavorite("CHANNEL", String(ch.stream_id), { name: ch.name, icon: ch.stream_icon })}
            />
          )}
          {tab === "vod" && (
            <VodGrid
              categories={vodCategories}
              streams={vodStreams}
              selectedCategory={vodCategory}
              onCategoryChange={setVodCategory}
              onSelect={selectVod}
              favorites={favorites}
              onToggleFavorite={(v) => toggleFavorite("MOVIE", String(v.stream_id), { name: v.name, icon: v.stream_icon })}
            />
          )}
          {tab === "series" && !selectedSeries && (
            <div className="flex h-full overflow-hidden">
              <div className="w-36 flex-shrink-0 border-r border-border overflow-y-auto">
                {seriesCategories.map((cat) => (
                  <div
                    key={cat.category_id}
                    onClick={() => setSeriesCategory(cat.category_id)}
                    className={`px-3 py-2 text-xs cursor-pointer transition-colors truncate ${seriesCategory === cat.category_id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                  >
                    {cat.category_name}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {seriesList.map((s) => (
                  <div
                    key={s.series_id}
                    onClick={() => setSelectedSeries(s)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    {s.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.cover} alt="" className="w-8 h-10 object-cover rounded flex-shrink-0" />
                    ) : <div className="w-8 h-10 bg-muted rounded flex-shrink-0" />}
                    <p className="text-xs text-foreground">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "series" && selectedSeries && (
            <SeriesDetail
              series={selectedSeries}
              onEpisodeSelect={selectEpisode}
              onBack={() => setSelectedSeries(null)}
            />
          )}
          {tab === "search" && (
            <SearchOverlay
              onChannelSelect={(ch) => { selectChannel(ch); setTab("live"); }}
              onVodSelect={(v) => { selectVod(v); setTab("vod"); }}
              onSeriesSelect={(s) => { setSelectedSeries(s); setTab("series"); }}
            />
          )}
          {tab === "favorites" && (
            <div className="p-4 overflow-y-auto h-full">
              <h3 className="text-sm font-medium text-foreground mb-3">Favorites</h3>
              {favorites.size === 0 ? (
                <p className="text-xs text-muted-foreground">No favorites yet. Star channels, movies, or series to add them here.</p>
              ) : (
                <p className="text-xs text-muted-foreground">{favorites.size} item(s) saved</p>
              )}
            </div>
          )}
          {tab === "dvr" && (
            <div className="p-4 overflow-y-auto h-full">
              <h3 className="text-sm font-medium text-foreground mb-3">Cloud DVR</h3>
              <p className="text-xs text-muted-foreground mb-3">Schedule recordings from the EPG Grid tab. Manage recordings from the portal.</p>
              <a href="/portal/dvr" className="text-xs text-primary hover:underline">Open DVR Manager →</a>
            </div>
          )}
        </div>

        {/* Player / EPG area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "epg" ? (
            <EpgGrid
              channels={channels}
              onChannelSelect={selectChannel}
              activeChannelId={activeChannel?.stream_id}
            />
          ) : (
            <>
              {streamUrl ? (
                <HlsPlayer
                  src={streamUrl}
                  onError={handleError}
                  onFreeze={() => handleError("STUCK_PLAYER")}
                  className="flex-1"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-black">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Select a channel or movie to start watching</p>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="flex-shrink-0 px-4 py-2 bg-destructive/10 border-t border-destructive/30">
                  <p className="text-xs text-destructive">Recent errors: {errors.join(", ")}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
