import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number/registration code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Truck', 'Van', 'Car', 'Bus', 'SUV', 'Pickup'],
      default: 'Van',
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    currentStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Maintenance', 'In Service'],
      default: 'Active',
    },
    mileage: {
      type: Number,
      required: [true, 'Mileage is required'],
      min: [0, 'Mileage cannot be negative'],
      default: 0,
    },
    vehicleHealthStatus: {
      type: String,
      enum: ['Good', 'Needs Service', 'Under Maintenance'],
      default: 'Good',
    },
    fuelType: {
      type: String,
      enum: ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'],
      default: 'Diesel',
    },
    assignedDriver: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: 'Logistics',
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

// Virtual index for quick search
vehicleSchema.index({ vehicleNumber: 1, currentStatus: 1, vehicleHealthStatus: 1 });

export default mongoose.model('Vehicle', vehicleSchema);
