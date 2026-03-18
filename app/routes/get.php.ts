/**
 * M3U Playlist Generator
 *
 * This endpoint generates M3U playlists for IPTV players
 *
 * Standard format:
 * http://domain.com:port/get.php?username=XXX&password=XXX&type=m3u_plus&output=ts
 */

import { type LoaderArgs } from "@remix-run/node";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");
  const type = url.searchParams.get("type") || "m3u_plus";
  const output = url.searchParams.get("output") || "ts";

  // TODO: Validate credentials
  if (!username || !password) {
    return new Response("Unauthorized", { status: 401 });
  }

  // TODO: Fetch streams from database
  const domain = url.origin;

  const m3uContent = generateM3U(username, password, domain, output);

  return new Response(m3uContent, {
    headers: {
      "Content-Type": "application/x-mpegURL",
      "Content-Disposition": `attachment; filename="playlist_${username}.m3u"`,
    },
  });
}

function generateM3U(
  username: string,
  password: string,
  domain: string,
  output: string
): string {
  // TODO: Fetch real data from database
  const streams = [
    {
      id: 1,
      name: "HBO Sports HD",
      tvgId: "hbo-sports",
      tvgName: "HBO Sports HD",
      tvgLogo: "http://example.com/logos/hbo.png",
      groupTitle: "Sports",
    },
    {
      id: 2,
      name: "Discovery Channel HD",
      tvgId: "discovery",
      tvgName: "Discovery Channel HD",
      tvgLogo: "http://example.com/logos/discovery.png",
      groupTitle: "Entertainment",
    },
    {
      id: 3,
      name: "CNN International",
      tvgId: "cnn-int",
      tvgName: "CNN International",
      tvgLogo: "http://example.com/logos/cnn.png",
      groupTitle: "News",
    },
    {
      id: 4,
      name: "Cartoon Network",
      tvgId: "cartoon-network",
      tvgName: "Cartoon Network",
      tvgLogo: "http://example.com/logos/cn.png",
      groupTitle: "Kids",
    },
    {
      id: 5,
      name: "ESPN HD",
      tvgId: "espn-hd",
      tvgName: "ESPN HD",
      tvgLogo: "http://example.com/logos/espn.png",
      groupTitle: "Sports",
    },
  ];

  let m3u = "#EXTM3U\n";

  streams.forEach((stream) => {
    m3u += `#EXTINF:-1 tvg-id="${stream.tvgId}" tvg-name="${stream.tvgName}" tvg-logo="${stream.tvgLogo}" group-title="${stream.groupTitle}",${stream.name}\n`;
    m3u += `${domain}/live/${username}/${password}/${stream.id}.${output}\n`;
  });

  return m3u;
}
