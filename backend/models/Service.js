import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
      enum: [
        'Routine Oil & Filter',
        'Brake System Service',
        'Tire Rotation & Balance',
        'Full Periodic Inspection',
        'Transmission Overhaul',
        'Engine Tune-Up',
        'Battery & Electrical Check',
        'Coolant & Fluid Flush',
        'Suspension & Alignment',
      ],
      default: 'Routine Oil & Filter',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'],
      default: 'Scheduled',
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    nextServiceDate: {
      type: Date,
    },
    serviceProvider: {
      type: String,
      trim: true,
      default: 'In-house Service Bay',
    },
    technicianNotes: {
      type: String,
      trim: true,
      default: '',
    },
    odometerAtService: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ vehicle: 1, scheduledDate: 1, status: 1 });

export default mongoose.model('Service', serviceSchema);
