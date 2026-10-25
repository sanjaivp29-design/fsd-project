import express from 'express';
import {
  getInsurancePolicies,
  getInsuranceById,
  createInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
  getInsuranceAlerts,
} from '../controllers/insuranceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/alerts', getInsuranceAlerts);
router.route('/').get(getInsurancePolicies).post(createInsurancePolicy);
router.route('/:id').get(getInsuranceById).put(updateInsurancePolicy).delete(deleteInsurancePolicy);

export default router;
