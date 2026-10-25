import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    maintenanceType: {
      type: String,
      required: [true, 'Maintenance type is required'],
      enum: ['Preventive', 'Corrective', 'Emergency', 'Inspection', 'Recall Repair'],
      default: 'Preventive',
    },
    maintenanceDate: {
      type: Date,
      required: [true, 'Maintenance date is required'],
      default: Date.now,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expectedCompletionDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    problem: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Maintenance cost is required'],
      min: [0, 'Cost cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    replacedParts: [
      {
        type: String,
        trim: true,
      },
    ],
    mechanicName: {
      type: String,
      trim: true,
      default: 'Fleet Maintenance Bay',
    },
    repairCenter: {
      type: String,
      trim: true,
      default: 'Fleet Maintenance Bay',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

maintenanceSchema.index({ vehicle: 1, maintenanceDate: -1, status: 1 });

export default mongoose.model('Maintenance', maintenanceSchema);
