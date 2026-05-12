import type {
  Reseller,
  Device,
  DeviceCommand,
  ErrorLog,
  Broadcast,
  FleetSettings,
  EpgEntry,
  DvrSchedule,
  DvrRecording,
  Favorite,
  AppBuild,
  WebPlayerDeployment,
  CommandType,
  ErrorType,
  ScheduleStatus,
  BuildStatus,
  Tier,
  FavoriteType,
} from "@prisma/client";

export type {
  Reseller,
  Device,
  DeviceCommand,
  ErrorLog,
  Broadcast,
  FleetSettings,
  EpgEntry,
  DvrSchedule,
  DvrRecording,
  Favorite,
  AppBuild,
  WebPlayerDeployment,
  CommandType,
  ErrorType,
  ScheduleStatus,
  BuildStatus,
  Tier,
  FavoriteType,
};

// Xtream API types
export interface XtreamChannel {
  num: number;
  name: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  category_id: string;
  category_name?: string;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamVod {
  num: number;
  name: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  release_date?: string;
  container_extension: string;
  category_id: string;
}

export interface XtreamSeries {
  series_id: number;
  name: string;
  cover: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  release_date?: string;
  rating?: string;
  category_id: string;
}

export interface XtreamEpgProgram {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
}

// Portal session type extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tier: Tier;
    };
  }
}

// Device heartbeat response
export interface HeartbeatResponse {
  commands: Array<{
    id: string;
    type: CommandType;
    payload: Record<string, unknown> | null;
  }>;
  settings: {
    bufferSize: number;
    epgRefreshInterval: number;
    playbackOptions: Record<string, unknown> | null;
    version: number;
  } | null;
  broadcasts: Array<{
    id: string;
    broadcastId: string;
    title: string;
    body: string;
  }>;
  tokenRefresh?: string;
}
