import mongoose from 'mongoose';
import { env } from './env';

let memoryServer: { stop: () => Promise<boolean> } | null = null;

async function maybeSeedOnStart(): Promise<void> {
  if (env.NODE_ENV === 'production') return;
  if (!env.SEED_ON_START) return;

  const { ensureSeedUsers } = await import('../seeds/users');
  await ensureSeedUsers();
  const { ensureSeedTopics } = await import('../seeds/topics');
  await ensureSeedTopics();
  const { ensureSeedBatches } = await import('../seeds/batches');
  await ensureSeedBatches();
  console.log('🔐 SEED_ON_START: demo accounts ensured (see server/src/seeds/users.ts)');
}

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    await maybeSeedOnStart();
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ MongoDB connection failed: ${message}`);

    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  try {
    console.warn('⚠️  Starting in-memory MongoDB for local development...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const server = await MongoMemoryServer.create();
    memoryServer = server;
    const uri = server.getUri('shine-al-furqan');
    await mongoose.connect(uri);
    console.log('✅ In-memory MongoDB ready');
    // In-memory DB is empty every boot — always seed demo users in development.
    const { ensureSeedUsers } = await import('../seeds/users');
    await ensureSeedUsers();
    const { ensureSeedTopics } = await import('../seeds/topics');
    await ensureSeedTopics();
    const { ensureSeedBatches } = await import('../seeds/batches');
    await ensureSeedBatches();
    console.log('🔐 Demo accounts seeded into in-memory MongoDB (see server/src/seeds/users.ts)');
  } catch (memoryError) {
    console.error('❌ In-memory MongoDB failed:', memoryError);
    console.warn('⚠️  Auth will not work until MongoDB is available');
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
