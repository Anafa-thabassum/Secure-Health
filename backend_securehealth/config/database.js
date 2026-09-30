import mongoose from "mongoose";

export const connectDatabase = async (uri, { tls = false } = {}) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000, maxPoolSize: 20, minPoolSize: 2, ...(tls ? { tls: true } : {}) });
  return mongoose.connection;
};

export const disconnectDatabase = () => mongoose.disconnect();

export const databaseHealth = () => ({
  connected: mongoose.connection.readyState === 1,
  state: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
});
