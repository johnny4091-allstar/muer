import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { useActionData, useLoaderData, useOutletContext, useSubmit } from "@remix-run/react";
import { SERVERS, randomFetch } from "~/utils";

import { useEffect, useState } from "react";
import VideoThumbnail from "~/components/videoThumbnail";
import ThumbnailGrid from "~/components/ThumbnailGrid";

// Cache for trending videos with 5 minute TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
let trendingCache: { data: any; timestamp: number } | null = null;

export async function loader({ request }: LoaderArgs) {
  // const { supabase, response } = useSupabase(request);
  // const url = new URL(request.url);
  // const page = parseInt(url.searchParams.get("page") ?? '0')

  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (trendingCache && (now - trendingCache.timestamp) < CACHE_TTL) {
      console.log('Returning cached trending videos');
      return json({ trendingVideos: trendingCache.data });
    }

    const trendingResponse = await randomFetch('api/v1/trending?type=music');
    const trendingVideos = await trendingResponse.json();

    // Cache the response
    trendingCache = {
      data: trendingVideos,
      timestamp: now
    };

    console.log('Cached new trending videos');
    return json({ trendingVideos },
      // { headers: response.headers }
    );
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return json({})
  }
};


export default function IndexPage() {
  const { trendingVideos } = useLoaderData();
  const { onThumbnailClick } = useOutletContext<any>()

  // const actionData = useActionData();

  // const [timer, setTimer] = useState<any>()
  // const fetcher = useFetcher();

  // const inputOnChange = async (event: any) => {
  //   const value = event.target.value;
  //   clearTimeout(timer);
  //   if (value == '') {
  //     setQuickSearchResults([])
  //     setTimer(null);
  //     return;
  //   }


  //   const t = setTimeout(() => {
  //     console.log('debug fetching news')
  //     fetcher.load(`/video?q=${value}`);
  //   }, 100)
  //   setTimer(t);
  // }

  // const [quickSearchResults, setQuickSearchResults] = useState<any[]>([]);
  // useEffect(() => {
  //   console.log('debug done fetching', fetcher.data)
  //   if (!fetcher.data) return;
  //   if (fetcher.data.error) return;
  //   if (!fetcher.data.result) return;
  //   setQuickSearchResults(fetcher.data.result);
  //   setTimer(null);
  //   // setFetchingNews(false);
  // }, [fetcher.data]);

  return (

    <div className="px-6 py-16 bg-gradient-to-b from-violet-950/60 bg-no-repeat bg-[length:auto_50vh]">

      <p className="text-white font-bold text-3xl tracking-tight">Good morning</p>
      <p className="text-white font-bold text-2xl tracking-tight py-6">Trending</p>
      <ThumbnailGrid
        videos={trendingVideos}
        onThumbnailClick={onThumbnailClick}
      />
      <div className="py-16">
        <p className="text-sm text-white font-semibold py-2">Organization</p>
        <p className="text-sm text-neutral-400 py-2">Muer is a modern, music-centric front-end of Invidious.</p>
      </div>

    </div>
  );
}

