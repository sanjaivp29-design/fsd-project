import Service from '../models/Service.js';
import Vehicle from '../models/Vehicle.js';
import Expense from '../models/Expense.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';

// @desc    Get all service records with populated vehicle info
// @route   GET /api/services
// @access  Private
export const getServices = async (req, res, next) => {
  try {
    const { vehicle, status, search } = req.query;
    const query = {};

    if (vehicle) {
      query.vehicle = vehicle;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let services = await Service.find(query)
      .populate('vehicle', 'vehicleNumber model manufacturer vehicleType currentStatus mileage')
      .sort({ scheduledDate: -1 });

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      services = services.filter((srv) => {
        const vNum = srv.vehicle?.vehicleNumber?.toLowerCase() || '';
        const vModel = srv.vehicle?.model?.toLowerCase() || '';
        const type = srv.serviceType?.toLowerCase() || '';
        const provider = srv.serviceProvider?.toLowerCase() || '';
        return vNum.includes(s) || vModel.includes(s) || type.includes(s) || provider.includes(s);
      });
    }

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single service record
// @route   GET /api/services/:id
// @access  Private
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'vehicle',
      'vehicleNumber model manufacturer vehicleType currentStatus mileage vehicleHealthStatus'
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service record with ID ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new service schedule
// @route   POST /api/services
// @access  Private
export const createService = async (req, res, next) => {
  try {
    const { vehicle, cost, serviceType, scheduledDate, status } = req.body;

    const targetVehicle = await Vehicle.findById(vehicle);
    if (!targetVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Assigned vehicle does not exist.',
      });
    }

    const newService = await Service.create(req.body);

    // If status is In Progress, mark vehicle status
    if (status === 'In Progress') {
      await Vehicle.findByIdAndUpdate(vehicle, { currentStatus: 'In Service' });
    }

    // Automatically record an Expense if cost is present
    if (cost && Number(cost) > 0) {
      await Expense.create({
        vehicle,
        category: 'Service',
        amount: Number(cost),
        expenseDate: scheduledDate || new Date(),
        description: `Service scheduled: ${serviceType} (${targetVehicle.vehicleNumber})`,
        referenceId: `SRV-${newService._id.toString().slice(-6).toUpperCase()}`,
        paidTo: req.body.serviceProvider || 'Service Bay',
        paymentMethod: 'Company Card',
      });
    }

    await invalidateCache('fleet:dashboard', 'fleet:services', 'fleet:vehicle', 'fleet:expenses');

    res.status(201).json({
      success: true,
      message: 'Service scheduled successfully',
      data: newService,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update service record
// @route   PUT /api/services/:id
// @access  Private
export const updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service record ${req.params.id} not found.`,
      });
    }

    const { status, completedDate, odometerAtService, cost } = req.body;

    const updatePayload = { ...req.body };
    if (status === 'Completed' && !completedDate && !service.completedDate) {
      updatePayload.completedDate = new Date();
    }

    service = await Service.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    }).populate('vehicle', 'vehicleNumber model');

    // If service completed, update vehicle status and health
    if (status === 'Completed' && service.vehicle) {
      const vUpdate = {
        currentStatus: 'Active',
        vehicleHealthStatus: 'Good',
      };
      if (odometerAtService && Number(odometerAtService) > 0) {
        vUpdate.mileage = Number(odometerAtService);
      }
      await Vehicle.findByIdAndUpdate(service.vehicle._id, vUpdate);
    }

    await invalidateCache('fleet:dashboard', 'fleet:services', 'fleet:vehicle', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Service record updated successfully',
      data: service,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete service record
// @route   DELETE /api/services/:id
// @access  Private
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service record ${req.params.id} not found.`,
      });
    }

    await service.deleteOne();
    await invalidateCache('fleet:dashboard', 'fleet:services', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Service record deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
