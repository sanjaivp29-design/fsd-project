import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seeder.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import Route Handlers
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import insuranceRoutes from './routes/insuranceRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import problemReportRoutes from './routes/problemReportRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow requests from any frontend client during development & testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Cache', 'X-Cache-Key'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// System Health & API Meta Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'FleetFlow - Enterprise Fleet Management System',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      services: '/api/services',
      insurance: '/api/insurance',
      maintenance: '/api/maintenance',
      expenses: '/api/expenses',
      dashboard: '/api/dashboard/stats',
      problemReports: '/api/problem-reports',
      cacheStatus: '/api/dashboard/cache/status',
    },
    documentation: 'See README.md for full REST API specifications',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/problem-reports', problemReportRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if configured
    if (process.env.AUTO_SEED_IF_EMPTY !== 'false') {
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 FleetFlow Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 REST API Root: http://localhost:${PORT}/`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
      console.log(`====================================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Server Error] Unhandled Rejection:`, err.message);
    });
  } catch (err) {
    console.error(`[Server Fatal Error] Failed to start application:`, err);
    process.exit(1);
  }
};

startServer();
