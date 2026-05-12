import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { CommandType } from "./types";

export async function enqueueCommand(
  deviceId: string,
  type: CommandType,
  payload?: Record<string, unknown>
) {
  return prisma.deviceCommand.create({
    data: { deviceId, type, payload: payload ?? undefined },
  });
}

export async function enqueueBulkCommands(
  deviceIds: string[],
  type: CommandType,
  payload?: Record<string, unknown>
) {
  return prisma.deviceCommand.createMany({
    data: deviceIds.map((deviceId) => ({
      deviceId,
      type,
      payload: payload as Prisma.InputJsonValue | undefined,
    })),
  });
}

export async function getPendingCommands(deviceId: string) {
  return prisma.deviceCommand.findMany({
    where: { deviceId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
}

export async function markCommandsDelivered(ids: string[]) {
  return prisma.deviceCommand.updateMany({
    where: { id: { in: ids } },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
}
