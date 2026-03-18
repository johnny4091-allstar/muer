/**
 * Xtream Codes API Compatibility Layer
 *
 * This endpoint provides compatibility with Xtream Codes API
 * which is the standard for IPTV players like IPTV Smarters, TiviMate, etc.
 *
 * Standard Xtream API format:
 * http://domain.com:port/player_api.php?username=XXX&password=XXX&action=ACTION
 */

import { json, type LoaderArgs } from "@remix-run/node";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");
  const action = url.searchParams.get("action");

  // TODO: Validate credentials against database
  if (!username || !password) {
    return json(
      {
        user_info: { auth: 0, status: "Disabled", message: "Invalid credentials" },
      },
      { status: 401 }
    );
  }

  // Handle different API actions
  switch (action) {
    case "get_live_categories":
      return json(await getLiveCategories());

    case "get_live_streams":
      return json(await getLiveStreams());

    case "get_vod_categories":
      return json(await getVodCategories());

    case "get_vod_streams":
      return json(await getVodStreams());

    case "get_series_categories":
      return json(await getSeriesCategories());

    case "get_series":
      return json(await getSeries());

    case "get_series_info":
      const seriesId = url.searchParams.get("series_id");
      return json(await getSeriesInfo(seriesId));

    case "get_vod_info":
      const vodId = url.searchParams.get("vod_id");
      return json(await getVodInfo(vodId));

    case "get_short_epg":
      const streamId = url.searchParams.get("stream_id");
      const limit = url.searchParams.get("limit") || "10";
      return json(await getShortEpg(streamId, limit));

    case "get_simple_data_table":
      const streamId2 = url.searchParams.get("stream_id");
      return json(await getSimpleDataTable(streamId2));

    default:
      // Default action - return user info and server info
      return json(await getUserInfo(username, password));
  }
}

// User authentication and info
async function getUserInfo(username: string, password: string) {
  // TODO: Fetch from database
  const currentTime = Math.floor(Date.now() / 1000);
  const expiryTime = currentTime + 30 * 24 * 60 * 60; // 30 days from now

  return {
    user_info: {
      username: username,
      password: password,
      message: "Welcome to IPTV Panel",
      auth: 1,
      status: "Active",
      exp_date: expiryTime.toString(),
      is_trial: "0",
      active_cons: "1",
      created_at: "1640000000",
      max_connections: "3",
      allowed_output_formats: ["m3u8", "ts", "rtmp"],
    },
    server_info: {
      url: "http://your-domain.com",
      port: "80",
      https_port: "443",
      server_protocol: "http",
      rtmp_port: "1935",
      timezone: "America/New_York",
      timestamp_now: currentTime,
      time_now: new Date().toISOString(),
    },
  };
}

// Live TV Categories
async function getLiveCategories() {
  // TODO: Fetch from database
  return [
    {
      category_id: "1",
      category_name: "Entertainment",
      parent_id: 0,
    },
    {
      category_id: "2",
      category_name: "Sports",
      parent_id: 0,
    },
    {
      category_id: "3",
      category_name: "News",
      parent_id: 0,
    },
    {
      category_id: "4",
      category_name: "Movies",
      parent_id: 0,
    },
    {
      category_id: "5",
      category_name: "Kids",
      parent_id: 0,
    },
  ];
}

// Live TV Streams
async function getLiveStreams() {
  // TODO: Fetch from database
  return [
    {
      num: 1,
      name: "HBO Sports HD",
      stream_type: "live",
      stream_id: 1,
      stream_icon: "http://example.com/logos/hbo.png",
      epg_channel_id: "hbo-sports",
      added: "1640000000",
      category_id: "2",
      custom_sid: "",
      tv_archive: 1,
      direct_source: "",
      tv_archive_duration: 7,
    },
    {
      num: 2,
      name: "Discovery Channel HD",
      stream_type: "live",
      stream_id: 2,
      stream_icon: "http://example.com/logos/discovery.png",
      epg_channel_id: "discovery",
      added: "1640000000",
      category_id: "1",
      custom_sid: "",
      tv_archive: 1,
      direct_source: "",
      tv_archive_duration: 7,
    },
    {
      num: 3,
      name: "CNN International",
      stream_type: "live",
      stream_id: 3,
      stream_icon: "http://example.com/logos/cnn.png",
      epg_channel_id: "cnn-int",
      added: "1640000000",
      category_id: "3",
      custom_sid: "",
      tv_archive: 1,
      direct_source: "",
      tv_archive_duration: 3,
    },
  ];
}

// VOD Categories
async function getVodCategories() {
  // TODO: Fetch from database
  return [
    {
      category_id: "1",
      category_name: "Action",
      parent_id: 0,
    },
    {
      category_id: "2",
      category_name: "Comedy",
      parent_id: 0,
    },
    {
      category_id: "3",
      category_name: "Drama",
      parent_id: 0,
    },
    {
      category_id: "4",
      category_name: "Horror",
      parent_id: 0,
    },
    {
      category_id: "5",
      category_name: "Sci-Fi",
      parent_id: 0,
    },
  ];
}

// VOD Streams
async function getVodStreams() {
  // TODO: Fetch from database
  return [
    {
      num: 1,
      name: "Inception",
      stream_type: "movie",
      stream_id: 1,
      stream_icon: "http://example.com/posters/inception.jpg",
      rating: "8.8",
      rating_5based: 4.4,
      added: "1640000000",
      category_id: "5",
      container_extension: "mp4",
      custom_sid: "",
      direct_source: "",
    },
    {
      num: 2,
      name: "The Dark Knight",
      stream_type: "movie",
      stream_id: 2,
      stream_icon: "http://example.com/posters/dark-knight.jpg",
      rating: "9.0",
      rating_5based: 4.5,
      added: "1640000000",
      category_id: "1",
      container_extension: "mp4",
      custom_sid: "",
      direct_source: "",
    },
  ];
}

// Series Categories
async function getSeriesCategories() {
  // TODO: Fetch from database
  return [
    {
      category_id: "1",
      category_name: "Drama",
      parent_id: 0,
    },
    {
      category_id: "2",
      category_name: "Comedy",
      parent_id: 0,
    },
    {
      category_id: "3",
      category_name: "Thriller",
      parent_id: 0,
    },
  ];
}

// Series List
async function getSeries() {
  // TODO: Fetch from database
  return [
    {
      num: 1,
      name: "Breaking Bad",
      series_id: 1,
      cover: "http://example.com/covers/breaking-bad.jpg",
      plot: "A high school chemistry teacher turned methamphetamine manufacturer",
      cast: "Bryan Cranston, Aaron Paul",
      director: "Vince Gilligan",
      genre: "Crime, Drama, Thriller",
      releaseDate: "2008",
      last_modified: "1640000000",
      rating: "9.5",
      rating_5based: 4.75,
      backdrop_path: ["http://example.com/backdrops/breaking-bad.jpg"],
      youtube_trailer: "https://youtube.com/watch?v=example",
      episode_run_time: "47",
      category_id: "1",
    },
  ];
}

// Series Details with Seasons and Episodes
async function getSeriesInfo(seriesId: string | null) {
  if (!seriesId) {
    return { error: "Series ID required" };
  }

  // TODO: Fetch from database
  return {
    seasons: [
      {
        air_date: "2008-01-20",
        episode_count: 7,
        id: 1,
        name: "Season 1",
        overview: "The first season of Breaking Bad",
        season_number: 1,
        cover: "http://example.com/seasons/bb-s1.jpg",
        cover_big: "http://example.com/seasons/bb-s1-big.jpg",
      },
      {
        air_date: "2009-03-08",
        episode_count: 13,
        id: 2,
        name: "Season 2",
        overview: "The second season of Breaking Bad",
        season_number: 2,
        cover: "http://example.com/seasons/bb-s2.jpg",
        cover_big: "http://example.com/seasons/bb-s2-big.jpg",
      },
    ],
    info: {
      name: "Breaking Bad",
      cover: "http://example.com/covers/breaking-bad.jpg",
      plot: "A high school chemistry teacher turned methamphetamine manufacturer",
      cast: "Bryan Cranston, Aaron Paul",
      director: "Vince Gilligan",
      genre: "Crime, Drama, Thriller",
      releaseDate: "2008",
      last_modified: "1640000000",
      rating: "9.5",
      rating_5based: 4.75,
      backdrop_path: ["http://example.com/backdrops/breaking-bad.jpg"],
      youtube_trailer: "https://youtube.com/watch?v=example",
      episode_run_time: "47",
      category_id: "1",
    },
    episodes: {
      "1": [
        {
          id: "1",
          episode_num: 1,
          title: "Pilot",
          container_extension: "mp4",
          info: {
            air_date: "2008-01-20",
            crew: "Director: Vince Gilligan",
            rating: "8.9",
            movie_image: "http://example.com/episodes/bb-s1e1.jpg",
            duration_secs: "3480",
            duration: "58:00",
            video: {},
            audio: {},
            bitrate: 5000,
          },
          custom_sid: "",
          added: "1640000000",
          season: 1,
          direct_source: "",
        },
        // More episodes...
      ],
      "2": [
        {
          id: "14",
          episode_num: 1,
          title: "Seven Thirty-Seven",
          container_extension: "mp4",
          info: {
            air_date: "2009-03-08",
            crew: "Director: Bryan Cranston",
            rating: "8.5",
            movie_image: "http://example.com/episodes/bb-s2e1.jpg",
            duration_secs: "2820",
            duration: "47:00",
            video: {},
            audio: {},
            bitrate: 5000,
          },
          custom_sid: "",
          added: "1640000000",
          season: 2,
          direct_source: "",
        },
        // More episodes...
      ],
    },
  };
}

// VOD Details
async function getVodInfo(vodId: string | null) {
  if (!vodId) {
    return { error: "VOD ID required" };
  }

  // TODO: Fetch from database
  return {
    info: {
      tmdb_id: "27205",
      name: "Inception",
      o_name: "Inception",
      cover_big: "http://example.com/posters/inception-big.jpg",
      movie_image: "http://example.com/backdrops/inception.jpg",
      releasedate: "2010-07-16",
      episode_run_time: "148",
      youtube_trailer: "https://youtube.com/watch?v=example",
      director: "Christopher Nolan",
      actors: "Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page",
      cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page",
      description:
        "A thief who steals corporate secrets through the use of dream-sharing technology",
      plot: "A thief who steals corporate secrets through the use of dream-sharing technology",
      age: "PG-13",
      country: "USA, UK",
      genre: "Action, Sci-Fi, Thriller",
      duration_secs: "8880",
      duration: "2h 28m",
      video: {},
      audio: {},
      bitrate: 8000,
      rating: "8.8",
      rating_5based: 4.4,
    },
    movie_data: {
      stream_id: 1,
      name: "Inception",
      added: "1640000000",
      category_id: "5",
      container_extension: "mp4",
      custom_sid: "",
      direct_source: "",
    },
  };
}

// EPG (Electronic Program Guide)
async function getShortEpg(streamId: string | null, limit: string) {
  if (!streamId) {
    return { error: "Stream ID required" };
  }

  // TODO: Fetch from database
  const epgData = {
    epg_listings: [
      {
        id: "1",
        epg_id: "1",
        title: "Morning News",
        lang: "en",
        start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        description: "Latest news and updates from around the world",
        channel_id: streamId,
        start_timestamp: Math.floor(Date.now() / 1000) - 7200,
        stop_timestamp: Math.floor(Date.now() / 1000) - 3600,
      },
      {
        id: "2",
        epg_id: "2",
        title: "Current Program",
        lang: "en",
        start: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        description: "This is the current program being broadcast",
        channel_id: streamId,
        start_timestamp: Math.floor(Date.now() / 1000) - 3600,
        stop_timestamp: Math.floor(Date.now() / 1000) + 3600,
      },
      {
        id: "3",
        epg_id: "3",
        title: "Evening Show",
        lang: "en",
        start: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        description: "Evening entertainment and talk show",
        channel_id: streamId,
        start_timestamp: Math.floor(Date.now() / 1000) + 3600,
        stop_timestamp: Math.floor(Date.now() / 1000) + 10800,
      },
    ],
  };

  return epgData;
}

// Simple data table for EPG
async function getSimpleDataTable(streamId: string | null) {
  if (!streamId) {
    return { error: "Stream ID required" };
  }

  return await getShortEpg(streamId, "10");
}

// Stream URL endpoints would be:
// Live: http://domain.com/live/username/password/streamId.m3u8
// VOD: http://domain.com/movie/username/password/vodId.mp4
// Series: http://domain.com/series/username/password/episodeId.mp4
