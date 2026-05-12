import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateDeviceToken, extractBearerToken } from "@/lib/device-auth";
import { markCommandsDelivered } from "@/lib/commands";

export async function GET(
  req: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = await validateDeviceToken(token);
  if (!auth || auth.deviceId !== params.deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const device = await prisma.device.findUnique({ where: { deviceId: params.deviceId } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const commands = await prisma.deviceCommand.findMany({
    where: { deviceId: device.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (commands.length > 0) {
    await markCommandsDelivered(commands.map((c) => c.id));
  }

  return NextResponse.json({
    commands: commands.map((c) => ({
      id: c.id,
      type: c.type,
      payload: c.payload,
    })),
  });
}
