import type {
  XtreamChannel,
  XtreamCategory,
  XtreamVod,
  XtreamSeries,
  XtreamEpgProgram,
} from "./types";

export class XtreamClient {
  private base: string;

  constructor(
    private panelUrl: string,
    private username: string,
    private password: string
  ) {
    this.base = `${panelUrl}/player_api.php?username=${username}&password=${password}`;
  }

  private async get<T>(action: string, extra = ""): Promise<T> {
    const url = `${this.base}&action=${action}${extra}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "IPTVSaaS/1.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Xtream API error: ${res.status} ${url}`);
    return res.json() as Promise<T>;
  }

  async getLiveCategories(): Promise<XtreamCategory[]> {
    return this.get<XtreamCategory[]>("get_live_categories");
  }

  async getLiveChannels(categoryId?: string): Promise<XtreamChannel[]> {
    const extra = categoryId ? `&category_id=${categoryId}` : "";
    return this.get<XtreamChannel[]>("get_live_streams", extra);
  }

  async getVodCategories(): Promise<XtreamCategory[]> {
    return this.get<XtreamCategory[]>("get_vod_categories");
  }

  async getVodStreams(categoryId?: string): Promise<XtreamVod[]> {
    const extra = categoryId ? `&category_id=${categoryId}` : "";
    return this.get<XtreamVod[]>("get_vod_streams", extra);
  }

  async getSeriesCategories(): Promise<XtreamCategory[]> {
    return this.get<XtreamCategory[]>("get_series_categories");
  }

  async getSeries(categoryId?: string): Promise<XtreamSeries[]> {
    const extra = categoryId ? `&category_id=${categoryId}` : "";
    return this.get<XtreamSeries[]>("get_series", extra);
  }

  async getSeriesInfo(seriesId: number) {
    return this.get(`get_series_info`, `&series_id=${seriesId}`);
  }

  async getShortEpg(streamId: number, limit = 4): Promise<{ epg_listings: XtreamEpgProgram[] }> {
    return this.get(`get_short_epg`, `&stream_id=${streamId}&limit=${limit}`);
  }

  async getEpg(streamId: number): Promise<{ epg_listings: XtreamEpgProgram[] }> {
    return this.get(`get_simple_data_table`, `&stream_id=${streamId}`);
  }

  buildLiveStreamUrl(streamId: number, ext = "ts"): string {
    return `${this.panelUrl}/live/${this.username}/${this.password}/${streamId}.${ext}`;
  }

  buildVodStreamUrl(streamId: number, ext = "mp4"): string {
    return `${this.panelUrl}/movie/${this.username}/${this.password}/${streamId}.${ext}`;
  }

  buildSeriesStreamUrl(streamId: number, ext = "mp4"): string {
    return `${this.panelUrl}/series/${this.username}/${this.password}/${streamId}.${ext}`;
  }
}

export async function getXtreamClient(resellerId: string): Promise<XtreamClient | null> {
  const { prisma } = await import("./prisma");
  const cfg = await prisma.xtreamConfig.findUnique({ where: { resellerId } });
  if (!cfg) return null;
  return new XtreamClient(cfg.panelUrl, cfg.username, cfg.password);
}
