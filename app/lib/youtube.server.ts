const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set in environment variables");
  return key;
}

// Parse ISO 8601 duration (e.g. "PT3M45S") to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0") * 3600 +
    parseInt(match[2] || "0") * 60 +
    parseInt(match[3] || "0")
  );
}

// Normalise a YouTube API item (from videos.list or search.list) into the
// shape the existing Muer components expect (mirrors Invidious structure).
export function normalizeVideoItem(item: any) {
  // search results have id.videoId; video items have id as a plain string
  const videoId =
    typeof item.id === "string" ? item.id : item.id?.videoId ?? "";
  const snippet = item.snippet ?? {};
  const statistics = item.statistics ?? {};
  const contentDetails = item.contentDetails ?? {};

  return {
    videoId,
    title: snippet.title ?? "",
    author: snippet.channelTitle ?? "",
    // Keep the same array shape Muer expects
    videoThumbnails: [
      { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` },
    ],
    description: snippet.description ?? "",
    viewCount: parseInt(statistics.viewCount ?? "0") || 0,
    likeCount: parseInt(statistics.likeCount ?? "0") || 0,
    lengthSeconds: parseDuration(contentDetails.duration ?? ""),
    published: snippet.publishedAt ?? "",
    // Shim so the existing root.tsx title/artist display still works
    musicTracks: [
      {
        song: snippet.title ?? "",
        artist: snippet.channelTitle ?? "",
      },
    ],
  };
}

/** Trending music videos (YouTube Music chart equivalent) */
export async function fetchTrending() {
  const params = new URLSearchParams({
    part: "snippet,statistics",
    chart: "mostPopular",
    videoCategoryId: "10", // Music
    maxResults: "20",
    key: getApiKey(),
  });
  const res = await fetch(`${YT_API_BASE}/videos?${params}`);
  if (!res.ok) throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.items ?? []).map(normalizeVideoItem);
}

/** Search music videos */
export async function searchVideos(q: string) {
  const params = new URLSearchParams({
    part: "snippet",
    q,
    type: "video",
    videoCategoryId: "10", // Music
    maxResults: "20",
    key: getApiKey(),
  });
  const res = await fetch(`${YT_API_BASE}/search?${params}`);
  if (!res.ok) throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.items ?? []).map(normalizeVideoItem);
}

/** Full video metadata (for the currently playing track) */
export async function getVideoDetails(videoId: string) {
  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoId,
    key: getApiKey(),
  });
  const res = await fetch(`${YT_API_BASE}/videos?${params}`);
  if (!res.ok) throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error("Video not found");
  return normalizeVideoItem(item);
}

/** Related videos — used to build the radio/queue */
export async function getRelatedVideos(videoId: string) {
  const params = new URLSearchParams({
    part: "snippet",
    relatedToVideoId: videoId,
    type: "video",
    maxResults: "10",
    key: getApiKey(),
  });
  const res = await fetch(`${YT_API_BASE}/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map(normalizeVideoItem);
}
