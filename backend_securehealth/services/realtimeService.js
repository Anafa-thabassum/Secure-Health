import { Server } from "socket.io";
import { verifyAccessToken } from "./tokenService.js";
import { eventBus } from "./eventBus.js";
import { isAccessTokenRevoked } from "./sessionService.js";
import { User } from "../models/User.js";

export const attachRealtime = (server, corsOrigins) => {
  const io = new Server(server, { path: "/socket.io", cors: { origin: corsOrigins, credentials: true } });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      if (await isAccessTokenRevoked(payload)) return next(new Error("Revoked token"));
      const user = await User.findOne({ userId: payload.sub }).lean();
      if (!user || user.status !== "ACTIVE" || payload.sv !== (user.sessionVersion || 1)) return next(new Error("Session unavailable"));
      socket.user = payload;
      next();
    } catch { next(new Error("Invalid or expired token")); }
  });
  io.on("connection", (socket) => {
    socket.join(`organization:${socket.user.organizationId}`);
    if (["ADMINISTRATOR", "AUDITOR"].includes(socket.user.role)) socket.join("security-center");
  });
  eventBus.on("security-event", (event) => {
    io.to("security-center").emit("security:event", event);
    if (event.organizationId) io.to(`organization:${event.organizationId}`).emit("security:event", event);
  });
  return io;
};
