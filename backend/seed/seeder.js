import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Service from '../models/Service.js';
import Insurance from '../models/Insurance.js';
import Maintenance from '../models/Maintenance.js';
import Expense from '../models/Expense.js';
import ProblemReport from '../models/ProblemReport.js';
import { usersData, vehiclesData } from './seedData.js';
import { connectDB } from '../config/db.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking database state for initial fleet seed...');

    // Ensure both default role users exist in database
    for (const u of usersData) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        await User.create(u);
        console.log(`[Seeder] Created default user: ${u.email} (${u.role})`);
      }
    }

    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount > 0) {
      // Ensure staff vehicle assignment is linked
      const staffUser = await User.findOne({ email: 'staff@fleetflow.io' });
      if (staffUser) {
        const staffVeh = await Vehicle.findOne({ assignedStaff: staffUser._id });
        if (!staffVeh) {
          const firstVeh = await Vehicle.findOne({ currentStatus: 'Active' });
          if (firstVeh) {
            firstVeh.assignedStaff = staffUser._id;
            firstVeh.assignedDriver = staffUser.name;
            await firstVeh.save();
            console.log(`[Seeder] Assigned ${firstVeh.vehicleNumber} to ${staffUser.name}`);
          }
        }
      }
      console.log(`[Seeder] Database already populated (${vehicleCount} vehicles present).`);
      return;
    }

    console.log('[Seeder] Database is empty. Seeding initial fleet management sample data...');

    // 1. Seed Users
    await User.deleteMany();
    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log(`[Seeder] Seeded ${createdUsers.length} users (Fleet Manager: manager@fleetflow.io & Fleet Staff: staff@fleetflow.io / Password@123)`);

    // 2. Seed Vehicles
    await Vehicle.deleteMany();
    const createdVehicles = await Vehicle.insertMany(vehiclesData);
    if (createdUsers[1]) {
      await Vehicle.findByIdAndUpdate(createdVehicles[0]._id, {
        assignedStaff: createdUsers[1]._id,
        assignedDriver: createdUsers[1].name,
      });
    }
    console.log(`[Seeder] Seeded ${createdVehicles.length} fleet vehicles.`);

    // 3. Seed Services linked to created vehicles
    await Service.deleteMany();
    const today = new Date();
    const addDays = (d, days) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy;
    };

    const services = [
      {
        vehicle: createdVehicles[0]._id, // FLT-101
        serviceType: 'Routine Oil & Filter',
        scheduledDate: addDays(today, 5),
        status: 'Scheduled',
        cost: 160,
        serviceProvider: 'QuickLube Commercial Fleet Bay',
        odometerAtService: 42500,
        technicianNotes: 'Scheduled synthetic oil change and tire inspection.',
      },
      {
        vehicle: createdVehicles[1]._id, // FLT-102
        serviceType: 'Transmission Overhaul',
        scheduledDate: addDays(today, -2),
        status: 'In Progress',
        cost: 1850,
        serviceProvider: 'Freightliner Certified Center',
        odometerAtService: 185400,
        technicianNotes: 'Gear slippage diagnosis and heavy clutch pack rebuild.',
      },
      {
        vehicle: createdVehicles[3]._id, // FLT-104
        serviceType: 'Brake System Service',
        scheduledDate: addDays(today, -1),
        status: 'In Progress',
        cost: 450,
        serviceProvider: 'Mercedes Commercial Vans',
        odometerAtService: 89300,
        technicianNotes: 'Front disc rotor wear; installing heavy-duty ceramic pads.',
      },
      {
        vehicle: createdVehicles[4]._id, // FLT-105
        serviceType: 'Full Periodic Inspection',
        scheduledDate: addDays(today, -20),
        completedDate: addDays(today, -19),
        status: 'Completed',
        cost: 620,
        serviceProvider: 'Volvo Bus Service Depot',
        odometerAtService: 112500,
        technicianNotes: 'Passed complete 120-point passenger transport safety audit.',
      },
      {
        vehicle: createdVehicles[5]._id, // FLT-106
        serviceType: 'Coolant & Fluid Flush',
        scheduledDate: addDays(today, 8),
        status: 'Scheduled',
        cost: 210,
        serviceProvider: 'Metro Fleet Workshop',
        odometerAtService: 64200,
        technicianNotes: 'Bi-annual coolant flush and radiator pressure check.',
      },
    ];
    await Service.insertMany(services);
    console.log(`[Seeder] Seeded ${services.length} service records.`);

    // 4. Seed Insurance Policies
    await Insurance.deleteMany();
    const insurancePolicies = [
      {
        vehicle: createdVehicles[0]._id, // FLT-101
        provider: 'Allianz Commercial Fleet',
        policyNumber: 'ALZ-FLT-2024-8891',
        coverageType: 'Comprehensive Fleet',
        premiumAmount: 1450,
        startDate: addDays(today, -350),
        expiryDate: addDays(today, 15), // Expiring in 15 days!
        renewalStatus: 'Expiring Soon',
        contactNumber: '+1 (800) 555-0199',
        notes: 'Quote received from broker for 5% renewal discount.',
      },
      {
        vehicle: createdVehicles[1]._id, // FLT-102
        provider: 'Liberty Mutual Heavy Commercial',
        policyNumber: 'LM-TRK-77401-US',
        coverageType: 'Collision & Loss',
        premiumAmount: 3200,
        startDate: addDays(today, -370),
        expiryDate: addDays(today, -5), // Expired 5 days ago!
        renewalStatus: 'Expired',
        contactNumber: '+1 (800) 225-2467',
        notes: 'Action Required: Renew immediately to avoid regulatory grounding.',
      },
      {
        vehicle: createdVehicles[2]._id, // FLT-103
        provider: 'Progressive Commercial',
        policyNumber: 'PRG-UTIL-9021-99',
        coverageType: 'Comprehensive Fleet',
        premiumAmount: 980,
        startDate: addDays(today, -100),
        expiryDate: addDays(today, 265),
        renewalStatus: 'Active',
        contactNumber: '+1 (800) 876-5555',
        notes: 'Active policy with roadside assistance rider.',
      },
      {
        vehicle: createdVehicles[3]._id, // FLT-104
        provider: 'Travelers Business Insurance',
        policyNumber: 'TRV-VAN-44102-X',
        coverageType: 'Comprehensive Fleet',
        premiumAmount: 1250,
        startDate: addDays(today, -340),
        expiryDate: addDays(today, 25), // Expiring in 25 days!
        renewalStatus: 'Expiring Soon',
        contactNumber: '+1 (800) 238-7650',
        notes: 'Renewal proposal under review by accounting.',
      },
      {
        vehicle: createdVehicles[4]._id, // FLT-105
        provider: 'Zurich Passenger Transit Coverage',
        policyNumber: 'ZUR-BUS-6619-C',
        coverageType: 'Full Bumper-to-Bumper',
        premiumAmount: 4800,
        startDate: addDays(today, -150),
        expiryDate: addDays(today, 215),
        renewalStatus: 'Active',
        contactNumber: '+1 (800) 987-4242',
        notes: 'Includes full passenger public liability coverage up to $10M.',
      },
    ];
    await Insurance.insertMany(insurancePolicies);
    console.log(`[Seeder] Seeded ${insurancePolicies.length} insurance policies.`);

    // 5. Seed Maintenance records
    await Maintenance.deleteMany();
    const maintenances = [
      {
        vehicle: createdVehicles[1]._id, // FLT-102
        maintenanceType: 'Corrective',
        maintenanceDate: addDays(today, -3),
        description: 'Heavy vibration detected under full load in rear axle drive.',
        cost: 1450,
        status: 'In Progress',
        priority: 'High',
        replacedParts: ['Drive Shaft Center Bearing', 'Rear Axle Seal Kit'],
        mechanicName: 'Dave Miller (Master Tech)',
        resolutionNotes: 'Parts received; reassembly in progress.',
      },
      {
        vehicle: createdVehicles[3]._id, // FLT-104
        maintenanceType: 'Preventive',
        maintenanceDate: addDays(today, -1),
        description: 'Brake wear warning light triggered on dash.',
        cost: 380,
        status: 'In Progress',
        priority: 'Medium',
        replacedParts: ['Front Ceramic Brake Pads', 'Brake Wear Sensor Harness'],
        mechanicName: 'Samir Al-Mansoor',
        resolutionNotes: 'Rotors resurfaced and fresh sensors installed.',
      },
      {
        vehicle: createdVehicles[0]._id, // FLT-101
        maintenanceType: 'Inspection',
        maintenanceDate: addDays(today, -15),
        description: 'Pre-winter tire and cooling system check.',
        cost: 120,
        status: 'Completed',
        priority: 'Low',
        replacedParts: ['Wiper Blades', 'Cabin Air Filter'],
        mechanicName: 'QuickBay Auto',
        resolutionNotes: 'Vehicle cleared for winter operation.',
      },
      {
        vehicle: createdVehicles[5]._id, // FLT-106
        maintenanceType: 'Preventive',
        maintenanceDate: addDays(today, -5),
        description: 'Refrigeration unit compressor drive belt tension check.',
        cost: 290,
        status: 'Completed',
        priority: 'Medium',
        replacedParts: ['ThermoKing Alternator Belt'],
        mechanicName: 'ColdFleet Specialist',
        resolutionNotes: 'Tension adjusted within factory specs.',
      },
    ];
    await Maintenance.insertMany(maintenances);
    console.log(`[Seeder] Seeded ${maintenances.length} maintenance records.`);

    // 6. Seed Operational Expenses
    await Expense.deleteMany();
    const expenses = [
      {
        vehicle: createdVehicles[0]._id,
        category: 'Fuel',
        amount: 340,
        expenseDate: addDays(today, -2),
        description: 'Diesel bulk fuel fill-up (85 gallons)',
        referenceId: 'FL-99120',
        paidTo: 'Shell Fleet Card',
        paymentMethod: 'Fuel Card',
      },
      {
        vehicle: createdVehicles[1]._id,
        category: 'Maintenance',
        amount: 1450,
        expenseDate: addDays(today, -3),
        description: 'Axle bearing & seal overhaul',
        referenceId: 'INV-40192',
        paidTo: 'Fleet Workshop East',
        paymentMethod: 'Company Card',
      },
      {
        vehicle: createdVehicles[0]._id,
        category: 'Insurance',
        amount: 1450,
        expenseDate: addDays(today, -350),
        description: 'Annual Allianz insurance policy premium',
        referenceId: 'ALZ-FLT-2024-8891',
        paidTo: 'Allianz Commercial Fleet',
        paymentMethod: 'Bank Transfer',
      },
      {
        vehicle: createdVehicles[3]._id,
        category: 'Service',
        amount: 450,
        expenseDate: addDays(today, -1),
        description: 'Brake pad renewal and disc machining',
        referenceId: 'SRV-88219',
        paidTo: 'Mercedes Commercial Vans',
        paymentMethod: 'Company Card',
      },
      {
        vehicle: createdVehicles[4]._id,
        category: 'Fuel',
        amount: 680,
        expenseDate: addDays(today, -4),
        description: 'Ultra-low sulfur diesel fill for long haul shuttle',
        referenceId: 'FL-99144',
        paidTo: 'ExxonMobil Commercial',
        paymentMethod: 'Fuel Card',
      },
      {
        vehicle: createdVehicles[2]._id,
        category: 'Tolls & Permits',
        amount: 185,
        expenseDate: addDays(today, -6),
        description: 'State Highway Toll E-Pass recharge',
        referenceId: 'TOLL-3321',
        paidTo: 'Turnpike Authority',
        paymentMethod: 'Company Card',
      },
      {
        vehicle: createdVehicles[5]._id,
        category: 'Cleaning & Detailing',
        amount: 95,
        expenseDate: addDays(today, -8),
        description: 'Reefer sanitation and chemical wash bay',
        referenceId: 'CLN-1022',
        paidTo: 'BioClean Truck Wash',
        paymentMethod: 'Petty Cash',
      },
    ];
    await Expense.insertMany(expenses);
    console.log(`[Seeder] Seeded ${expenses.length} expense transactions.`);

    // 7. Seed Problem Reports
    await ProblemReport.deleteMany();
    if (createdUsers[1]) {
      await ProblemReport.create([
        {
          vehicle: createdVehicles[3]._id, // FLT-104
          reportedBy: createdUsers[1]._id,
          staffName: createdUsers[1].name,
          description: 'Spongy brake pedal feedback and squeaking under heavy deceleration.',
          severity: 'High',
          status: 'Reported',
          reportedAt: new Date(Date.now() - 4 * 3600 * 1000),
        },
        {
          vehicle: createdVehicles[0]._id, // FLT-101
          reportedBy: createdUsers[1]._id,
          staffName: createdUsers[1].name,
          description: 'Left side indicator lamp blinks rapidly; bulb replacement requested.',
          severity: 'Low',
          status: 'Reported',
          reportedAt: new Date(Date.now() - 24 * 3600 * 1000),
        },
      ]);
      console.log('[Seeder] Seeded 2 problem reports.');
    }

    console.log('[Seeder] All initial demo data seeded successfully!');
  } catch (err) {
    console.error('[Seeder] Error during database seeding:', err);
  }
};

// If run directly from terminal `npm run seed`
if (process.argv[1]?.endsWith('seeder.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  })();
}
