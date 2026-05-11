export interface DvrJobPayload {
  scheduleId: string;
  deviceId: string;
  channelId: string;
  streamUrl: string;
  title: string;
  startTime: string;
  endTime: string;
}
