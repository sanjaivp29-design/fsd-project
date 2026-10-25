import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    provider: {
      type: String,
      required: [true, 'Insurance provider is required'],
      trim: true,
    },
    policyNumber: {
      type: String,
      required: [true, 'Policy number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    coverageType: {
      type: String,
      enum: ['Comprehensive Fleet', 'Third-Party Liability', 'Collision & Loss', 'Full Bumper-to-Bumper'],
      default: 'Comprehensive Fleet',
    },
    premiumAmount: {
      type: Number,
      required: [true, 'Premium amount is required'],
      min: [0, 'Premium cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Policy start date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Policy expiry date is required'],
    },
    renewalStatus: {
      type: String,
      enum: ['Active', 'Expiring Soon', 'Expired', 'Renewed'],
      default: 'Active',
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

insuranceSchema.index({ vehicle: 1, expiryDate: 1, renewalStatus: 1 });

export default mongoose.model('Insurance', insuranceSchema);
