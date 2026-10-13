import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

/**
 * Connects to MongoDB.
 *  - If MONGODB_URI is set, it is used (Atlas / any hosted Mongo).
 *  - Otherwise, outside production, an embedded MongoDB is started
 *    (mongodb-memory-server) and persisted to ./data/db so the project
 *    works with zero setup.
 */
export async function connectDB() {
  let uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required when NODE_ENV=production');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(process.env.EMBEDDED_DB_PATH || './data/db');
    fs.mkdirSync(dbPath, { recursive: true });
    const mongod = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' },
    });
    uri = mongod.getUri('chronicle');
    console.log(`[db] Embedded MongoDB started (data: ${dbPath})`);

    const stop = async () => {
      await mongoose.disconnect().catch(() => {});
      await mongod.stop().catch(() => {});
      process.exit(0);
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('[db] Connected');
}
