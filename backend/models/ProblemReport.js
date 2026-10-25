import mongoose from 'mongoose';

const problemReportSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting staff reference is required'],
    },
    staffName: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Reported', 'Under Review', 'In Maintenance', 'Resolved', 'Dismissed'],
      default: 'Reported',
    },
    reportedAt: {
      type: Date,
      default: Date.now,
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

problemReportSchema.index({ vehicle: 1, status: 1, reportedAt: -1 });

export default mongoose.model('ProblemReport', problemReportSchema);
