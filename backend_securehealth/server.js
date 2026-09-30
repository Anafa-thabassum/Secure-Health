import http from "node:http";
import dotenv from "dotenv";
dotenv.config();
const [{ createApp }, { connectDatabase, disconnectDatabase }, { connectRedis, disconnectRedis }, { getConfig }, { attachRealtime }] = await Promise.all([
  import("./app.js"), import("./config/database.js"), import("./config/redis.js"), import("./config/env.js"), import("./services/realtimeService.js"),
]);

const config = getConfig();
await connectDatabase(config.mongoUri);
await connectRedis(config.redisUrl);
const app = createApp();
const server = http.createServer(app);
attachRealtime(server, config.corsOrigins);
server.listen(config.port, () => console.log(`SecureHealth API listening on port ${config.port}`));

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down SecureHealth API`);
  server.close(async () => { await Promise.allSettled([disconnectRedis(), disconnectDatabase()]); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
