import { createServer } from "http";
import next from "next";
import { Server as SocketServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000");

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => handle(req, res));

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL ?? "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

// Store io globally for access from API route handlers
globalThis.__socketIO = io;

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;

  if (userId) {
    socket.join(`user:${userId}`);
    io.emit("user:online", { userId });

    socket.on("subscribe:thread", (threadId) => {
      if (typeof threadId === "string") socket.join(`thread:${threadId}`);
    });

    socket.on("unsubscribe:thread", (threadId) => {
      if (typeof threadId === "string") socket.leave(`thread:${threadId}`);
    });

    socket.on("typing:start", ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit("typing:start", { userId, threadId });
    });

    socket.on("typing:stop", ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit("typing:stop", { userId, threadId });
    });

    socket.on("disconnect", () => {
      io.emit("user:offline", { userId });
    });
  }
});

httpServer.listen(port, hostname, () => {
  console.log(`> StreamZone ready on http://${hostname}:${port}`);
  console.log(`> Socket.IO attached`);
});
