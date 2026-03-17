import { LoaderArgs, json } from "@remix-run/node";
import { z } from "zod";
import { zx } from "zodix";
import { getVideoDetails, getRelatedVideos } from "~/lib/youtube.server";

export async function loader({ params }: LoaderArgs) {
  const { videoId } = zx.parseParams(params, {
    videoId: z.string().trim().min(1).max(256),
  });

  try {
    const [video, relatedVideos] = await Promise.all([
      getVideoDetails(videoId),
      getRelatedVideos(videoId),
    ]);

    return json({
      video: {
        ...video,
        recommendedVideos: relatedVideos,
      },
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return json({});
  }
}
