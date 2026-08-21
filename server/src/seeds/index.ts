import mongoose from 'mongoose';
import { env } from '../config/env';
import { ensureSeedUsers, SEED_USERS } from './users';
import { ensureSeedTopics } from './topics';
import { ensureSeedBatches } from './batches';

async function seed() {
  if (env.NODE_ENV === 'production') {
    console.error('❌ Refusing to seed: NODE_ENV=production');
    console.error('   Demo seed scripts must not run against production databases.');
    console.error('   Create operator accounts through the admin UI or a controlled migration.');
    process.exit(1);
  }

  console.log('🌱 Connecting to MongoDB...');
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');
  } catch {
    console.warn('⚠️  Local MongoDB unavailable — using in-memory MongoDB for seed');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memory = await MongoMemoryServer.create();
    await mongoose.connect(memory.getUri('shine-al-furqan'));
    console.log('✅ In-memory MongoDB connected (seed only; start server separately for API)');
  }

  await ensureSeedUsers();
  await ensureSeedTopics();
  await ensureSeedBatches();

  console.log('🎉 Seed completed. Accounts (passwords not logged):');
  for (const u of SEED_USERS) {
    console.log(`   ${u.role.padEnd(12)} ${u.email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (error) => {
  console.error('❌ Seed failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
