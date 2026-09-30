import mongoose from "mongoose";

let checkpointConnection;

export const connectCheckpointDatabase = async (uri, { tls = false } = {}) => {
  if (!uri) return null;
  checkpointConnection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8_000, maxPoolSize: 5, ...(tls ? { tls: true } : {}) }).asPromise();
  return checkpointConnection;
};

export const getCheckpointConnection = () => checkpointConnection;
export const checkpointDatabaseHealth = () => ({ connected: Boolean(checkpointConnection?.readyState === 1), state: checkpointConnection ? ["disconnected", "connected", "connecting", "disconnecting"][checkpointConnection.readyState] : "main-database-fallback" });
export const disconnectCheckpointDatabase = async () => { if (checkpointConnection) await checkpointConnection.close(); };
