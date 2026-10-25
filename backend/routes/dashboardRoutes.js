import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import cache from '../config/redis.js';

const router = express.Router();

router.use(protect);

router.get('/stats', cacheMiddleware('fleet:dashboard:stats', 60), getDashboardStats);

// Route to inspect cache status or manually flush cache for demo purposes
router.get('/cache/status', async (req, res) => {
  const stats = await cache.getStats();
  res.json({
    success: true,
    data: stats,
  });
});

router.post('/cache/flush', async (req, res) => {
  await cache.flushall();
  res.json({
    success: true,
    message: 'Fleet cache successfully flushed',
  });
});

export default router;
