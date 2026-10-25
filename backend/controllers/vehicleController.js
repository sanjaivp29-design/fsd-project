import Vehicle from '../models/Vehicle.js';
import Service from '../models/Service.js';
import Insurance from '../models/Insurance.js';
import Maintenance from '../models/Maintenance.js';
import Expense from '../models/Expense.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';

// @desc    Get all vehicles with filtering, searching, and sorting
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res, next) => {
  try {
    const { search, status, health, type, sortBy = '-createdAt' } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.currentStatus = status;
    }

    if (health && health !== 'All') {
      query.vehicleHealthStatus = health;
    }

    if (type && type !== 'All') {
      query.vehicleType = type;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { vehicleNumber: searchRegex },
        { model: searchRegex },
        { manufacturer: searchRegex },
        { assignedDriver: searchRegex },
        { department: searchRegex },
      ];
    }

    const vehicles = await Vehicle.find(query).sort(sortBy);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single vehicle details including service & maintenance history
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${req.params.id} not found.`,
      });
    }

    // Fetch related records in parallel for comprehensive vehicle detail view
    const [services, insurances, maintenances, expenses] = await Promise.all([
      Service.find({ vehicle: vehicle._id }).sort({ scheduledDate: -1 }).limit(10),
      Insurance.find({ vehicle: vehicle._id }).sort({ expiryDate: -1 }),
      Maintenance.find({ vehicle: vehicle._id }).sort({ maintenanceDate: -1 }).limit(10),
      Expense.find({ vehicle: vehicle._id }).sort({ expenseDate: -1 }),
    ]);

    const totalExpense = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...vehicle.toObject(),
        services,
        insurances,
        maintenances,
        expenses,
        totalOperationalCost: totalExpense,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private
export const createVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber } = req.body;

    const existing = await Vehicle.findOne({
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : '',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A vehicle with registration number ${vehicleNumber} already exists.`,
      });
    }

    const vehicle = await Vehicle.create(req.body);

    // Invalidate Redis caches
    await invalidateCache('fleet:dashboard', 'fleet:vehicle', 'fleet:expenses');

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private
export const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with ID ${req.params.id}`,
      });
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Invalidate caches
    await invalidateCache('fleet:dashboard', 'fleet:vehicle', `fleet:vehicle:${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with ID ${req.params.id}`,
      });
    }

    // Cascade delete related records
    await Promise.all([
      Service.deleteMany({ vehicle: vehicle._id }),
      Insurance.deleteMany({ vehicle: vehicle._id }),
      Maintenance.deleteMany({ vehicle: vehicle._id }),
      Expense.deleteMany({ vehicle: vehicle._id }),
      vehicle.deleteOne(),
    ]);

    // Invalidate caches
    await invalidateCache('fleet:dashboard', 'fleet:vehicle', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: `Vehicle ${vehicle.vehicleNumber} and associated records successfully removed`,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get aggregated vehicle health and status statistics
// @route   GET /api/vehicles/stats
// @access  Private
export const getVehicleStats = async (req, res, next) => {
  try {
    const [total, active, underMaintenance, needsService, byType] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ currentStatus: 'Active' }),
      Vehicle.countDocuments({ currentStatus: 'Under Maintenance' }),
      Vehicle.countDocuments({ vehicleHealthStatus: 'Needs Service' }),
      Vehicle.aggregate([
        { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        underMaintenance,
        needsService,
        byType,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vehicle assigned to logged-in user (Fleet Staff)
// @route   GET /api/vehicles/assigned/me
// @access  Private
export const getMyAssignedVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findOne({
      $or: [
        { assignedStaff: req.user._id },
        { assignedDriver: new RegExp(req.user.name.split(' ')[0], 'i') },
      ],
    });

    if (!vehicle) {
      vehicle = await Vehicle.findOne({ currentStatus: { $ne: 'Inactive' } });
      if (vehicle && req.user.role === 'staff') {
        vehicle.assignedStaff = req.user._id;
        vehicle.assignedDriver = req.user.name;
        await vehicle.save();
      }
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle currently assigned to your account.',
      });
    }

    const [services, maintenances] = await Promise.all([
      Service.find({ vehicle: vehicle._id }).sort({ scheduledDate: -1 }),
      Maintenance.find({ vehicle: vehicle._id }).sort({ maintenanceDate: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...vehicle.toObject(),
        services,
        maintenances,
      },
    });
  } catch (err) {
    next(err);
  }
};

