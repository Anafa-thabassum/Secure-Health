import { Server } from "socket.io";
import { verifyAccessToken } from "./tokenService.js";
import { eventBus } from "./eventBus.js";

export const attachRealtime = (server, corsOrigins) => {
  const io = new Server(server, { path: "/socket.io", cors: { origin: corsOrigins, credentials: true } });
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Authentication required"));
      socket.user = verifyAccessToken(token);
      next();
    } catch { next(new Error("Invalid or expired token")); }
  });
  io.on("connection", (socket) => {
    socket.join(`organization:${socket.user.organizationId}`);
    if (["ADMIN", "AUDITOR"].includes(socket.user.role)) socket.join("security-center");
  });
  eventBus.on("security-event", (event) => {
    io.to("security-center").emit("security:event", event);
    if (event.organizationId) io.to(`organization:${event.organizationId}`).emit("security:event", event);
  });
  return io;
};

