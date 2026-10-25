import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: [
        'Service',
        'Maintenance',
        'Insurance',
        'Fuel',
        'Tolls & Permits',
        'Cleaning & Detailing',
        'Tires & Accessories',
        'Other Operational',
      ],
      default: 'Fuel',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
      default: '',
    },
    paidTo: {
      type: String,
      trim: true,
      default: 'Fleet Vendor',
    },
    paymentMethod: {
      type: String,
      enum: ['Company Card', 'Bank Transfer', 'Petty Cash', 'Fuel Card'],
      default: 'Company Card',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ vehicle: 1, expenseDate: -1, category: 1 });

export default mongoose.model('Expense', expenseSchema);
