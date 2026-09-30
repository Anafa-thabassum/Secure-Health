import mongoose from "mongoose";

export const connectDatabase = async (uri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000 });
  return mongoose.connection;
};

export const disconnectDatabase = () => mongoose.disconnect();

export const databaseHealth = () => ({
  connected: mongoose.connection.readyState === 1,
  state: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
});
