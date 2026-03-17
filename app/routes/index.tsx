import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";

import ThumbnailGrid from "~/components/ThumbnailGrid";
import { fetchTrending } from "~/lib/youtube.server";

export async function loader({ request }: LoaderArgs) {
  try {
    const trendingVideos = await fetchTrending();
    return json({ trendingVideos });
  } catch (error) {
    console.error("Error fetching trending videos:", error);
    return json({ trendingVideos: [] });
  }
}

export default function IndexPage() {
  const { trendingVideos } = useLoaderData<typeof loader>();
  const { onThumbnailClick } = useOutletContext<any>();

  return (
    <div className="px-6 py-16 bg-gradient-to-b from-violet-950/60 bg-no-repeat bg-[length:auto_50vh]">
      <p className="text-white font-bold text-3xl tracking-tight">Good morning</p>
      <p className="text-white font-bold text-2xl tracking-tight py-6">Trending</p>
      <ThumbnailGrid videos={trendingVideos} onThumbnailClick={onThumbnailClick} />
      <div className="py-16">
        <p className="text-sm text-white font-semibold py-2">Organization</p>
        <p className="text-sm text-neutral-400 py-2">
          A modern, music-centric front-end powered by YouTube Music.
        </p>
      </div>
    </div>
  );
}
