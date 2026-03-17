import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { z } from "zod";
import { zx } from "zodix";
import ThumbnailGrid from "~/components/ThumbnailGrid";
import { searchVideos } from "~/lib/youtube.server";

export async function loader({ params }: LoaderArgs) {
  const { q } = zx.parseParams(params, {
    q: z.string().trim().min(1).max(256),
  });

  try {
    const results = await searchVideos(q);
    return json({ results, q });
  } catch (error) {
    console.error("Cannot fetch search results:", error);
    return json({ results: [], q, errors: ["Cannot fetch search results"] });
  }
}

export default function SearchPage() {
  const { results, q } = useLoaderData<typeof loader>();
  const { onThumbnailClick } = useOutletContext<any>();

  return (
    <div className="px-6 py-6">
      <p className="text-white font-bold text-2xl tracking-tight py-6">
        {q ? `Results for "${q}"` : "Songs"}
      </p>
      <ThumbnailGrid videos={results} onThumbnailClick={onThumbnailClick} />
    </div>
  );
}
