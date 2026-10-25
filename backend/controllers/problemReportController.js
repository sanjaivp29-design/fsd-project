import ProblemReport from '../models/ProblemReport.js';
import Vehicle from '../models/Vehicle.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';

// @desc    Get all problem reports (Staff gets own reports, Manager gets all)
// @route   GET /api/problem-reports
// @access  Private
export const getProblemReports = async (req, res, next) => {
  try {
    const { vehicle, status, severity } = req.query;
    const query = {};

    // Role-based visibility
    if (req.user && req.user.role === 'staff') {
      query.reportedBy = req.user._id;
    }

    if (vehicle) query.vehicle = vehicle;
    if (status && status !== 'All') query.status = status;
    if (severity && severity !== 'All') query.severity = severity;

    const reports = await ProblemReport.find(query)
      .populate('vehicle', 'vehicleNumber model manufacturer vehicleType currentStatus vehicleHealthStatus mileage')
      .populate('reportedBy', 'name email role')
      .sort({ reportedAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single problem report
// @route   GET /api/problem-reports/:id
// @access  Private
export const getProblemReportById = async (req, res, next) => {
  try {
    const report = await ProblemReport.findById(req.params.id)
      .populate('vehicle', 'vehicleNumber model manufacturer vehicleType currentStatus vehicleHealthStatus mileage')
      .populate('reportedBy', 'name email role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Problem report ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new problem report (Fleet Staff or Manager)
// @route   POST /api/problem-reports
// @access  Private
export const createProblemReport = async (req, res, next) => {
  try {
    const { vehicle, description, severity, reportedAt } = req.body;

    const targetVehicle = await Vehicle.findById(vehicle);
    if (!targetVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Reported vehicle does not exist.',
      });
    }

    const report = await ProblemReport.create({
      vehicle,
      reportedBy: req.user._id,
      staffName: req.user.name,
      description,
      severity: severity || 'Medium',
      reportedAt: reportedAt || new Date(),
      status: 'Reported',
    });

    // If severity is Critical, mark vehicle health status immediately to Needs Service
    if (severity === 'Critical' || severity === 'High') {
      await Vehicle.findByIdAndUpdate(vehicle, { vehicleHealthStatus: 'Needs Service' });
    }

    await invalidateCache('fleet:dashboard', 'fleet:problem_reports', 'fleet:vehicle');

    const populated = await ProblemReport.findById(report._id)
      .populate('vehicle', 'vehicleNumber model manufacturer')
      .populate('reportedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Vehicle problem report submitted successfully. Fleet Manager has been alerted.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update problem report status (Manager review / action)
// @route   PUT /api/problem-reports/:id
// @access  Private
export const updateProblemReport = async (req, res, next) => {
  try {
    let report = await ProblemReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Problem report ${req.params.id} not found.`,
      });
    }

    const { status, resolutionNotes } = req.body;

    report = await ProblemReport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('vehicle', 'vehicleNumber model currentStatus vehicleHealthStatus')
      .populate('reportedBy', 'name email');

    // If Fleet Manager advances status to "In Maintenance", ground vehicle
    if (status === 'In Maintenance' && report.vehicle) {
      await Vehicle.findByIdAndUpdate(report.vehicle._id, {
        currentStatus: 'Under Maintenance',
        vehicleHealthStatus: 'Under Maintenance',
      });
    }

    await invalidateCache('fleet:dashboard', 'fleet:problem_reports', 'fleet:vehicle');

    res.status(200).json({
      success: true,
      message: 'Problem report status updated successfully',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete problem report
// @route   DELETE /api/problem-reports/:id
// @access  Private
export const deleteProblemReport = async (req, res, next) => {
  try {
    const report = await ProblemReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Problem report ${req.params.id} not found.`,
      });
    }

    await report.deleteOne();
    await invalidateCache('fleet:dashboard', 'fleet:problem_reports');

    res.status(200).json({
      success: true,
      message: 'Problem report removed successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
