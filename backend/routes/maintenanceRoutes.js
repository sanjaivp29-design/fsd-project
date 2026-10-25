import express from 'express';
import {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../controllers/maintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getMaintenanceRecords).post(createMaintenanceRecord);
router.route('/:id').get(getMaintenanceById).put(updateMaintenanceRecord).delete(deleteMaintenanceRecord);

export default router;
