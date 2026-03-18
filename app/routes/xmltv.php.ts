/**
 * EPG (Electronic Program Guide) XML Generator
 *
 * This endpoint generates XMLTV format EPG data
 *
 * Standard format:
 * http://domain.com:port/xmltv.php?username=XXX&password=XXX
 */

import { type LoaderArgs } from "@remix-run/node";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");

  // TODO: Validate credentials
  if (!username || !password) {
    return new Response("Unauthorized", { status: 401 });
  }

  const xmlContent = generateXMLTV();

  return new Response(xmlContent, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="epg_${username}.xml"`,
    },
  });
}

function generateXMLTV(): string {
  // TODO: Fetch real EPG data from database
  const now = new Date();
  const channels = [
    { id: "hbo-sports", name: "HBO Sports HD" },
    { id: "discovery", name: "Discovery Channel HD" },
    { id: "cnn-int", name: "CNN International" },
    { id: "cartoon-network", name: "Cartoon Network" },
    { id: "espn-hd", name: "ESPN HD" },
  ];

  const programs = [
    {
      channel: "hbo-sports",
      title: "NBA Finals - Lakers vs Celtics",
      start: formatXMLTVDate(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
      desc: "Live NBA Finals coverage",
      category: "Sports",
    },
    {
      channel: "hbo-sports",
      title: "Post Game Analysis",
      start: formatXMLTVDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 2 * 60 * 60 * 1000)),
      desc: "Expert analysis of the game",
      category: "Sports",
    },
    {
      channel: "discovery",
      title: "Planet Earth III",
      start: formatXMLTVDate(new Date(now.getTime() - 1 * 60 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
      desc: "Explore the wonders of our planet",
      category: "Documentary",
    },
    {
      channel: "discovery",
      title: "How It's Made",
      start: formatXMLTVDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 2 * 60 * 60 * 1000)),
      desc: "Discover how everyday items are manufactured",
      category: "Documentary",
    },
    {
      channel: "cnn-int",
      title: "World News Tonight",
      start: formatXMLTVDate(new Date(now.getTime() - 1 * 60 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
      desc: "Latest news from around the world",
      category: "News",
    },
    {
      channel: "cartoon-network",
      title: "Adventure Time",
      start: formatXMLTVDate(new Date(now.getTime() - 30 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 30 * 60 * 1000)),
      desc: "Finn and Jake's adventures in the Land of Ooo",
      category: "Animation",
    },
    {
      channel: "espn-hd",
      title: "NFL GameDay",
      start: formatXMLTVDate(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
      stop: formatXMLTVDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
      desc: "Live NFL coverage and analysis",
      category: "Sports",
    },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE tv SYSTEM "xmltv.dtd">\n';
  xml += '<tv generator-info-name="IPTV Panel EPG Generator">\n';

  // Add channels
  channels.forEach((channel) => {
    xml += `  <channel id="${channel.id}">\n`;
    xml += `    <display-name>${escapeXML(channel.name)}</display-name>\n`;
    xml += `  </channel>\n`;
  });

  // Add programs
  programs.forEach((program) => {
    xml += `  <programme start="${program.start}" stop="${program.stop}" channel="${program.channel}">\n`;
    xml += `    <title lang="en">${escapeXML(program.title)}</title>\n`;
    xml += `    <desc lang="en">${escapeXML(program.desc)}</desc>\n`;
    xml += `    <category lang="en">${escapeXML(program.category)}</category>\n`;
    xml += `  </programme>\n`;
  });

  xml += "</tv>\n";

  return xml;
}

function formatXMLTVDate(date: Date): string {
  // Format: YYYYMMDDHHmmss +OFFSET
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Get timezone offset
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
  const offsetSign = offset >= 0 ? "+" : "-";

  return `${year}${month}${day}${hours}${minutes}${seconds} ${offsetSign}${offsetHours}${offsetMinutes}`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
