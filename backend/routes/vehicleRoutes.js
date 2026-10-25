import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats,
  getMyAssignedVehicle,
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(cacheMiddleware((req) => `fleet:vehicles:query:${req.url}`, 120), getVehicles)
  .post(createVehicle);

router.get('/stats', cacheMiddleware('fleet:vehicles:stats', 120), getVehicleStats);

router.get('/assigned/me', getMyAssignedVehicle);

router
  .route('/:id')
  .get(cacheMiddleware((req) => `fleet:vehicle:${req.params.id}`, 120), getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;
