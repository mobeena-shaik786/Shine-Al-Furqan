import { Router } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

function healthPayload() {
  const mongoReady = mongoose.connection.readyState === 1;
  return {
    status: mongoReady ? 'ok' : 'degraded',
    service: 'Shine Al Furqan API',
    ready: mongoReady,
    checks: {
      mongodb: mongoReady ? 'up' : 'down',
    },
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

/**
 * Readiness-aware health:
 * - 200 when MongoDB is connected
 * - 503 when the process is up but MongoDB is not ready
 */
router.get('/health', (_req, res) => {
  const data = healthPayload();
  if (!data.ready) {
    return res.status(503).json({
      success: false,
      code: 'NOT_READY',
      message: 'Service not ready',
      data,
      ...(res.locals.requestId ? { requestId: res.locals.requestId } : {}),
    });
  }
  return sendSuccess(res, data, 'API is healthy');
});

export default router;
