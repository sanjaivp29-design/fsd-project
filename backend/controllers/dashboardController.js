import Vehicle from '../models/Vehicle.js';
import Service from '../models/Service.js';
import Insurance from '../models/Insurance.js';
import Maintenance from '../models/Maintenance.js';
import Expense from '../models/Expense.js';
import ProblemReport from '../models/ProblemReport.js';
import cache from '../config/redis.js';

// @desc    Get aggregated fleet dashboard analytics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(today.getDate() + 30);

    // Run parallel aggregation and counts
    const [
      totalVehicles,
      activeVehicles,
      underMaintenanceVehicles,
      requiringServiceVehicles,
      upcomingServices,
      insuranceAlerts,
      maintenanceCostAgg,
      operationalCostAgg,
      serviceCostAgg,
      insuranceCostAgg,
      healthDistribution,
      recentMaintenances,
      recentServices,
      pendingProblemReportsCount,
      recentProblemReports,
      cacheStats,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ currentStatus: 'Active' }),
      Vehicle.countDocuments({ currentStatus: 'Under Maintenance' }),
      Vehicle.countDocuments({
        $or: [
          { vehicleHealthStatus: 'Needs Service' },
          { currentStatus: 'In Service' },
        ],
      }),
      Service.find({
        status: { $in: ['Scheduled', 'In Progress'] },
      })
        .populate('vehicle', 'vehicleNumber model manufacturer vehicleType')
        .sort({ scheduledDate: 1 })
        .limit(5),
      Insurance.find({
        expiryDate: { $lte: thirtyDaysAhead },
      })
        .populate('vehicle', 'vehicleNumber model manufacturer assignedDriver')
        .sort({ expiryDate: 1 })
        .limit(5),
      Maintenance.aggregate([
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]),
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Service.aggregate([
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]),
      Insurance.aggregate([
        { $group: { _id: null, total: { $sum: '$premiumAmount' } } },
      ]),
      Vehicle.aggregate([
        { $group: { _id: '$vehicleHealthStatus', count: { $sum: 1 } } },
      ]),
      Maintenance.find()
        .populate('vehicle', 'vehicleNumber model')
        .sort({ createdAt: -1 })
        .limit(4),
      Service.find()
        .populate('vehicle', 'vehicleNumber model')
        .sort({ createdAt: -1 })
        .limit(4),
      ProblemReport.countDocuments({ status: { $in: ['Reported', 'Under Review'] } }),
      ProblemReport.find({ status: { $in: ['Reported', 'Under Review'] } })
        .populate('vehicle', 'vehicleNumber model manufacturer')
        .populate('reportedBy', 'name email')
        .sort({ reportedAt: -1 })
        .limit(5),
      cache.getStats(),
    ]);

    const totalMaintenanceCost = maintenanceCostAgg[0]?.total || 0;
    const totalOperationalCost = operationalCostAgg[0]?.total || 0;
    const totalServiceCost = serviceCostAgg[0]?.total || 0;
    const totalInsuranceCost = insuranceCostAgg[0]?.total || 0;

    // Structure vehicle health distribution map
    const healthMap = {
      Good: 0,
      'Needs Service': 0,
      'Under Maintenance': 0,
    };
    healthDistribution.forEach((item) => {
      if (item._id && healthMap[item._id] !== undefined) {
        healthMap[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        summary: {
          totalVehicles,
          activeVehicles,
          underMaintenanceVehicles,
          requiringServiceVehicles,
          totalMaintenanceCost,
          totalOperationalCost,
          totalServiceCost,
          totalInsuranceCost,
        },
        healthDistribution: healthMap,
        upcomingServices,
        insuranceAlerts,
        recentActivity: {
          maintenances: recentMaintenances,
          services: recentServices,
        },
        problemReports: {
          pendingCount: pendingProblemReportsCount,
          recent: recentProblemReports,
        },
        cacheStats,
      },
    });
  } catch (err) {
    next(err);
  }
};
