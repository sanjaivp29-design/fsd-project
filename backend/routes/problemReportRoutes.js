import express from 'express';
import {
  getProblemReports,
  getProblemReportById,
  createProblemReport,
  updateProblemReport,
  deleteProblemReport,
} from '../controllers/problemReportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getProblemReports).post(createProblemReport);
router.route('/:id').get(getProblemReportById).put(updateProblemReport).delete(deleteProblemReport);

export default router;
