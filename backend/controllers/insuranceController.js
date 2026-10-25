import Insurance from '../models/Insurance.js';
import Vehicle from '../models/Vehicle.js';
import Expense from '../models/Expense.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';

// Helper to determine status dynamically based on expiry date
const computeRenewalStatus = (expiryDate) => {
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  return 'Active';
};

// @desc    Get all insurance policies
// @route   GET /api/insurance
// @access  Private
export const getInsurancePolicies = async (req, res, next) => {
  try {
    const { vehicle, renewalStatus, search } = req.query;
    const query = {};

    if (vehicle) query.vehicle = vehicle;
    if (renewalStatus && renewalStatus !== 'All') {
      query.renewalStatus = renewalStatus;
    }

    let policies = await Insurance.find(query)
      .populate('vehicle', 'vehicleNumber model manufacturer vehicleType')
      .sort({ expiryDate: 1 });

    // Sync computed renewal status if changed
    const updatedPolicies = await Promise.all(
      policies.map(async (policy) => {
        const computed = computeRenewalStatus(policy.expiryDate);
        if (policy.renewalStatus !== 'Renewed' && policy.renewalStatus !== computed) {
          policy.renewalStatus = computed;
          await policy.save();
        }
        return policy;
      })
    );

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      const filtered = updatedPolicies.filter((p) => {
        const vNum = p.vehicle?.vehicleNumber?.toLowerCase() || '';
        const provider = p.provider?.toLowerCase() || '';
        const policyNo = p.policyNumber?.toLowerCase() || '';
        return vNum.includes(s) || provider.includes(s) || policyNo.includes(s);
      });
      return res.status(200).json({
        success: true,
        count: filtered.length,
        data: filtered,
      });
    }

    res.status(200).json({
      success: true,
      count: updatedPolicies.length,
      data: updatedPolicies,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single insurance policy
// @route   GET /api/insurance/:id
// @access  Private
export const getInsuranceById = async (req, res, next) => {
  try {
    const policy = await Insurance.findById(req.params.id).populate(
      'vehicle',
      'vehicleNumber model manufacturer currentStatus'
    );

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Insurance policy with ID ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new insurance policy
// @route   POST /api/insurance
// @access  Private
export const createInsurancePolicy = async (req, res, next) => {
  try {
    const { vehicle, policyNumber, premiumAmount, expiryDate, provider, startDate } = req.body;

    const existingPolicy = await Insurance.findOne({
      policyNumber: policyNumber ? policyNumber.toUpperCase().trim() : '',
    });

    if (existingPolicy) {
      return res.status(400).json({
        success: false,
        message: `Policy number '${policyNumber}' already registered in system.`,
      });
    }

    const targetVehicle = await Vehicle.findById(vehicle);
    if (!targetVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Assigned vehicle does not exist.',
      });
    }

    const renewalStatus = computeRenewalStatus(expiryDate);
    const policy = await Insurance.create({
      ...req.body,
      renewalStatus,
    });

    // Auto-record insurance expense
    if (premiumAmount && Number(premiumAmount) > 0) {
      await Expense.create({
        vehicle,
        category: 'Insurance',
        amount: Number(premiumAmount),
        expenseDate: startDate || new Date(),
        description: `Insurance premium: ${provider} (Policy: ${policyNumber})`,
        referenceId: policyNumber,
        paidTo: provider,
        paymentMethod: 'Bank Transfer',
      });
    }

    await invalidateCache('fleet:dashboard', 'fleet:insurance', 'fleet:expenses');

    res.status(201).json({
      success: true,
      message: 'Insurance policy recorded successfully',
      data: policy,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update insurance policy
// @route   PUT /api/insurance/:id
// @access  Private
export const updateInsurancePolicy = async (req, res, next) => {
  try {
    let policy = await Insurance.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Insurance policy ${req.params.id} not found.`,
      });
    }

    if (req.body.expiryDate) {
      req.body.renewalStatus = computeRenewalStatus(req.body.expiryDate);
    }

    policy = await Insurance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('vehicle', 'vehicleNumber model');

    await invalidateCache('fleet:dashboard', 'fleet:insurance', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Insurance policy updated successfully',
      data: policy,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete insurance policy
// @route   DELETE /api/insurance/:id
// @access  Private
export const deleteInsurancePolicy = async (req, res, next) => {
  try {
    const policy = await Insurance.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Insurance policy ${req.params.id} not found.`,
      });
    }

    await policy.deleteOne();
    await invalidateCache('fleet:dashboard', 'fleet:insurance', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Insurance policy deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming insurance expiration alerts (<=30 days or expired)
// @route   GET /api/insurance/alerts
// @access  Private
export const getInsuranceAlerts = async (req, res, next) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const alerts = await Insurance.find({
      expiryDate: { $lte: thirtyDaysFromNow },
    })
      .populate('vehicle', 'vehicleNumber model manufacturer assignedDriver currentStatus')
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};
