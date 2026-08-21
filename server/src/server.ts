import type { Server } from 'http';
import app from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { assertProductionSafety } from './config/productionGuards';

async function runHealthCheck(port: number): Promise<void> {
  const url = `http://127.0.0.1:${port}/api/v1/health`;
  try {
    const res = await fetch(url);
    const body = (await res.json()) as {
      success?: boolean;
      message?: string;
      data?: { ready?: boolean; checks?: { mongodb?: string } };
    };
    if (res.ok && body.success && body.data?.ready) {
      console.log(`✅ Health check: ${res.status} — ${body.message ?? 'OK'}`);
      console.log(`   MongoDB: ${body.data.checks?.mongodb ?? 'unknown'}`);
      console.log(`   ${url}`);
    } else {
      console.warn(`⚠️  Health check failed: ${res.status}`, body);
    }
  } catch (error) {
    console.warn('⚠️  Health check request failed:', error);
  }
}

async function bootstrap() {
  assertProductionSafety();

  const port = env.PORT;

  console.log(`⏳ Starting Shine Al Furqan API on port ${port}...`);
  await connectDatabase();

  const server: Server = app.listen(port, async () => {
    console.log(`🚀 Shine Al Furqan API running`);
    console.log(`📡 Port: ${port}`);
    console.log(`🔗 URL:  http://localhost:${port}`);
    console.log(`📚 Environment: ${env.NODE_ENV}`);
    await runHealthCheck(port);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      console.error(`   Stop the other process, or set PORT in server/.env`);
    } else {
      console.error('❌ Server failed to listen:', err);
    }
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
