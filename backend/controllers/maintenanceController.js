import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import Expense from '../models/Expense.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { vehicle, status, priority, type, search } = req.query;
    const query = {};

    if (vehicle) query.vehicle = vehicle;
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (type && type !== 'All') query.maintenanceType = type;

    let records = await Maintenance.find(query)
      .populate('vehicle', 'vehicleNumber model manufacturer vehicleType currentStatus vehicleHealthStatus')
      .sort({ maintenanceDate: -1 });

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      records = records.filter((rec) => {
        const vNum = rec.vehicle?.vehicleNumber?.toLowerCase() || '';
        const desc = rec.description?.toLowerCase() || '';
        const mechanic = rec.mechanicName?.toLowerCase() || '';
        return vNum.includes(s) || desc.includes(s) || mechanic.includes(s);
      });
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
// @access  Private
export const getMaintenanceById = async (req, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id).populate(
      'vehicle',
      'vehicleNumber model manufacturer currentStatus vehicleHealthStatus mileage'
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Maintenance record ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new maintenance record
// @route   POST /api/maintenance
// @access  Private
export const createMaintenanceRecord = async (req, res, next) => {
  try {
    const { vehicle, cost, description, status, maintenanceDate, maintenanceType } = req.body;

    const targetVehicle = await Vehicle.findById(vehicle);
    if (!targetVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Assigned vehicle does not exist.',
      });
    }

    const record = await Maintenance.create(req.body);

    // If status is Pending or In Progress, update vehicle health and status
    if (status !== 'Completed') {
      await Vehicle.findByIdAndUpdate(vehicle, {
        currentStatus: 'Under Maintenance',
        vehicleHealthStatus: 'Under Maintenance',
      });
    }

    // Auto-record maintenance expense
    if (cost && Number(cost) > 0) {
      await Expense.create({
        vehicle,
        category: 'Maintenance',
        amount: Number(cost),
        expenseDate: maintenanceDate || new Date(),
        description: `Maintenance: ${description} (${targetVehicle.vehicleNumber})`,
        referenceId: `MNT-${record._id.toString().slice(-6).toUpperCase()}`,
        paidTo: req.body.mechanicName || 'Fleet Workshop',
        paymentMethod: 'Company Card',
      });
    }

    await invalidateCache('fleet:dashboard', 'fleet:maintenance', 'fleet:vehicle', 'fleet:expenses');

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private
export const updateMaintenanceRecord = async (req, res, next) => {
  try {
    let record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Maintenance record ${req.params.id} not found.`,
      });
    }

    const { status } = req.body;

    record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('vehicle', 'vehicleNumber model');

    // If status changed to Completed, restore vehicle health & active status if no other active maintenance
    if (status === 'Completed' && record.vehicle) {
      const activeMnt = await Maintenance.countDocuments({
        vehicle: record.vehicle._id,
        status: { $in: ['Pending', 'In Progress'] },
      });

      if (activeMnt === 0) {
        await Vehicle.findByIdAndUpdate(record.vehicle._id, {
          currentStatus: 'Active',
          vehicleHealthStatus: 'Good',
        });
      }
    }

    await invalidateCache('fleet:dashboard', 'fleet:maintenance', 'fleet:vehicle', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete maintenance record
// @route   DELETE /api/maintenance/:id
// @access  Private
export const deleteMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Maintenance record ${req.params.id} not found.`,
      });
    }

    await record.deleteOne();
    await invalidateCache('fleet:dashboard', 'fleet:maintenance', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
