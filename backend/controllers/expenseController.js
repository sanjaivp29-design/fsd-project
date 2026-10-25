import Expense from '../models/Expense.js';
import Vehicle from '../models/Vehicle.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const { category, vehicle, search } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (vehicle && vehicle !== 'All') query.vehicle = vehicle;

    let expenses = await Expense.find(query)
      .populate('vehicle', 'vehicleNumber model manufacturer vehicleType')
      .sort({ expenseDate: -1 });

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      expenses = expenses.filter((exp) => {
        const vNum = exp.vehicle?.vehicleNumber?.toLowerCase() || '';
        const desc = exp.description?.toLowerCase() || '';
        const paidTo = exp.paidTo?.toLowerCase() || '';
        const ref = exp.referenceId?.toLowerCase() || '';
        return vNum.includes(s) || desc.includes(s) || paidTo.includes(s) || ref.includes(s);
      });
    }

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate(
      'vehicle',
      'vehicleNumber model manufacturer'
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: `Expense with ID ${req.params.id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create(req.body);

    await invalidateCache('fleet:dashboard', 'fleet:expenses');

    res.status(201).json({
      success: true,
      message: 'Expense logged successfully',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('vehicle', 'vehicleNumber model');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: `Expense ${req.params.id} not found.`,
      });
    }

    await invalidateCache('fleet:dashboard', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: `Expense ${req.params.id} not found.`,
      });
    }

    await expense.deleteOne();
    await invalidateCache('fleet:dashboard', 'fleet:expenses');

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get aggregated cost breakdown by category, vehicle, and overall total
// @route   GET /api/expenses/summary
// @access  Private
export const getExpenseSummary = async (req, res, next) => {
  try {
    // 1. Overall total and category breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalOperationalCost = categoryBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    // 2. Vehicle-wise costs
    const vehicleBreakdown = await Expense.aggregate([
      { $match: { vehicle: { $ne: null } } },
      {
        $group: {
          _id: '$vehicle',
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo',
        },
      },
      { $unwind: '$vehicleInfo' },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          count: 1,
          vehicleNumber: '$vehicleInfo.vehicleNumber',
          model: '$vehicleInfo.model',
          manufacturer: '$vehicleInfo.manufacturer',
          vehicleType: '$vehicleInfo.vehicleType',
        },
      },
    ]);

    // 3. Monthly trends (last 6 months)
    const monthlyTrends = await Expense.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOperationalCost,
        categoryBreakdown,
        vehicleBreakdown,
        monthlyTrends,
      },
    });
  } catch (err) {
    next(err);
  }
};
