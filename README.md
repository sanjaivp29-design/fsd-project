# 🚛 FleetFlow — Enterprise Fleet Management System

A full-stack, enterprise-grade Fleet Management System engineered completely from scratch using the **MERN** technology stack (**MongoDB, Express.js, React.js, Node.js**), integrated with **Redis** in-memory caching and containerized with **Docker & Docker Compose**.

---

## 📑 Table of Contents

1. [Project Overview & Objective](#-project-overview--objective)
2. [Technology Stack & Architectural Roles](#-technology-stack--architectural-roles)
3. [System Architecture & Data Flow](#-system-architecture--data-flow)
4. [Complete Project Folder Structure](#-complete-project-folder-structure)
5. [Database Models & Schemas](#-database-models--schemas)
6. [REST API Endpoints Specification](#-rest-api-endpoints-specification)
7. [Redis Caching Strategy & Telemetry](#-redis-caching-strategy--telemetry)
8. [Frontend Pages & UI Components](#-frontend-pages--ui-components)
9. [Docker & Containerization Setup](#-docker--containerization-setup)
10. [Installation & Execution Guide](#-installation--execution-guide)
11. [Sample Demonstration Data & Credentials](#-sample-demonstration-data--credentials)
12. [Git & GitHub Setup Guide](#-git--github-setup-guide)

---

## 🎯 Project Overview & Objective

Organizations operating vehicle fleets (logistics, public transportation, delivery services, utility fleets) face operational challenges in monitoring servicing schedules, insurance renewals, maintenance expenditures, vehicle health, and fuel costs.

**FleetFlow** solves these issues through a centralized dashboard and modular management workflows:
- **Vehicle Inventory & Tracking**: Centralized registration, mileage tracking, driver allocation, and fuel classifications.
- **Preventive Service Scheduling**: Next service forecasting, workshop bay scheduling, and automated status transitions.
- **Insurance Compliance & Alerts**: Policy tracking with real-time automated alerts for policies expiring within 30 days or expired.
- **Maintenance & Work Orders**: Corrective repair logging, priority triage, technician assignment, and replacement part inventories.
- **Vehicle Health Command**: Fleet Health Index calculation with classification into `Good`, `Needs Service`, and `Under Maintenance`.
- **Operational Cost Analytics**: Cumulative and vehicle-specific expenditure breakdown across Service, Maintenance, Insurance, Fuel, and Tolls.

---

## 🛠️ Technology Stack & Architectural Roles

| Technology | Layer | Purpose & Implementation in FleetFlow |
| :--- | :--- | :--- |
| **MongoDB** | Database | NoSQL document database storing collections for Users, Vehicles, Services, Insurance, Maintenance, and Expenses with Mongoose schema validation and indexing. |
| **Express.js** | Backend Web Framework | MVC routing, middleware pipeline, JWT authentication, centralized error handling, and RESTful API endpoints. |
| **React.js (Vite)** | Frontend Client | Responsive Single-Page Application (SPA) with custom design tokens, reusable modal dialogs, KPI cards, and live Redis cache telemetry. |
| **Node.js** | Backend Runtime | Non-blocking asynchronous JavaScript execution environment hosting the Express REST API server and database connections. |
| **Redis** | In-Memory Cache | Caches high-frequency dashboard analytics and vehicle lookups (`fleet:dashboard:stats`, `fleet:vehicles:query:*`) with TTL and automatic write-invalidation. |
| **Docker & Docker Compose** | DevOps / Deployment | Multi-container orchestration isolating MongoDB, Redis, Express Backend, and React (Nginx) into a reproducible virtual network. |

---

## 🏗️ Complete Project Folder Structure

```
fsd/
├── .gitignore                          # Git ignore rules for node_modules, dist, .env
├── docker-compose.yml                  # Multi-container orchestration (Mongo, Redis, API, Web)
├── package.json                        # Root workspace scripts for concurrent execution
├── README.md                           # Comprehensive documentation and API specifications
│
├── backend/                            # Node.js + Express REST API Backend
│   ├── .dockerignore
│   ├── .env                            # Environment configurations
│   ├── .env.example                    # Template environment file
│   ├── Dockerfile                      # Production Node.js alpine container
│   ├── package.json                    # Backend dependencies & scripts
│   ├── server.js                       # Express app bootstrap, middleware, and server listener
│   │
│   ├── config/
│   │   ├── db.js                       # MongoDB connection with embedded engine fallback
│   │   └── redis.js                    # Redis client initialization & in-memory fallback layer
│   │
│   ├── controllers/
│   │   ├── authController.js           # Register, login, profile authentication
│   │   ├── dashboardController.js      # Aggregated fleet metrics, health counts, cost totals
│   │   ├── expenseController.js        # Cost logging, category breakdown, vehicle ranking
│   │   ├── insuranceController.js      # Policy tracking, dynamic expiry logic, alerts
│   │   ├── maintenanceController.js    # Work orders, parts tracking, status workflow
│   │   ├── serviceController.js        # Preventive scheduling, odometer updates, auto-expenses
│   │   └── vehicleController.js        # Vehicle CRUD, search, filter, cascading deletions
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js           # JWT Bearer token authentication & role authorization
│   │   ├── cacheMiddleware.js          # Redis caching middleware & cache invalidation helpers
│   │   └── errorMiddleware.js          # Centralized Mongoose and Express error formatting
│   │
│   ├── models/
│   │   ├── Expense.js                  # Operational expense schema
│   │   ├── Insurance.js                # Vehicle insurance policy schema
│   │   ├── Maintenance.js              # Workshop repair and work order schema
│   │   ├── Service.js                  # Preventive servicing schedule schema
│   │   ├── User.js                     # Authentication credentials and roles schema
│   │   └── Vehicle.js                  # Vehicle master registry schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth
│   │   ├── dashboardRoutes.js          # /api/dashboard
│   │   ├── expenseRoutes.js            # /api/expenses
│   │   ├── insuranceRoutes.js          # /api/insurance
│   │   ├── maintenanceRoutes.js        # /api/maintenance
│   │   ├── serviceRoutes.js            # /api/services
│   │   └── vehicleRoutes.js            # /api/vehicles
│   │
│   └── seed/
│       ├── seedData.js                 # Realistic fleet vehicles, policies, and repair logs
│       └── seeder.js                   # Database initialization and automated seeding script
│
└── frontend/                           # React.js Single Page Application (SPA)
    ├── .dockerignore
    ├── Dockerfile                      # Multi-stage build container (Node builder -> Nginx)
    ├── index.html                      # Entry HTML with meta tags and Google typography
    ├── nginx.conf                      # Production Nginx reverse proxy configuration
    ├── package.json                    # Frontend dependencies (React, Lucide, Axios)
    ├── vite.config.js                  # Vite configuration
    │
    └── src/
        ├── App.jsx                     # Root application container & page navigation router
        ├── index.css                   # Custom CSS tokens, glassmorphism, responsive grid
        ├── main.jsx                    # React DOM client entry point
        │
        ├── components/
        │   ├── common/
        │   │   ├── Badge.jsx           # Status & health indicator badge with pulsing dot
        │   │   ├── CacheBanner.jsx     # Live Redis telemetry bar (Hit/Miss indicator & flush)
        │   │   ├── Modal.jsx           # Accessible dialog backdrop with ESC navigation
        │   │   └── StatCard.jsx        # KPI metric card with icon highlights
        │   └── layout/
        │       ├── Navbar.jsx          # Top bar with fleet branding, user profile, sign out
        │       └── Sidebar.jsx         # Module navigation links & technology indicators
        │
        ├── context/
        │   └── AuthContext.jsx         # Authentication state, persistent token, demo logins
        │
        ├── pages/
        │   ├── CostManagementPage.jsx  # Expense tracking, category breakdowns, vehicle ranking
        │   ├── DashboardPage.jsx       # 8 KPI metrics, health distribution, upcoming schedules
        │   ├── InsurancePage.jsx       # Policy tracking, expiration highlight badges, alerts
        │   ├── LoginPage.jsx           # Sign in, register, and one-click demo credentials
        │   ├── MaintenancePage.jsx     # Work orders, repair triage, technician logs
        │   ├── ServicesPage.jsx        # Service schedules, completion odometer updates
        │   ├── VehicleHealthPage.jsx   # Fleet Health Index, triage cards, status updates
        │   └── VehiclesPage.jsx        # Full vehicle CRUD, filter/search, detail drawer
        │
        └── services/
            └── api.js                  # Axios client, auth interceptor, cache telemetry events
```

---

## 🗄️ Database Models & Schemas

### 1. `Vehicle`
Represents physical assets in the fleet.
- `vehicleNumber` (String, Unique, Indexed, Uppercase): Registration code (e.g. `FLT-101`).
- `vehicleType` (String, Enum): `['Truck', 'Van', 'Car', 'Bus', 'SUV', 'Pickup']`.
- `model` (String): Commercial vehicle model.
- `manufacturer` (String): Automaker name.
- `registrationDate` & `purchaseDate` (Date): Lifecycle dates.
- `currentStatus` (String, Enum): `['Active', 'Inactive', 'Under Maintenance', 'In Service']`.
- `mileage` (Number): Current odometer reading in miles.
- `vehicleHealthStatus` (String, Enum): `['Good', 'Needs Service', 'Under Maintenance']`.
- `fuelType` (String, Enum): `['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG']`.
- `assignedDriver` (String): Allocated operator.
- `department` (String): Logistics division.

### 2. `Service`
Represents scheduled and periodic preventive maintenance.
- `vehicle` (ObjectId, Ref: `Vehicle`): Associated vehicle.
- `serviceType` (String, Enum): Oil & Filter, Brake System, Full Inspection, Transmission, etc.
- `scheduledDate` (Date): Target date.
- `completedDate` (Date, Optional): Actual resolution date.
- `status` (String, Enum): `['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled']`.
- `cost` (Number): Labor & fluids expenditure.
- `nextServiceDate` (Date): Subsequent service interval.
- `serviceProvider` (String): Service bay or dealer center.
- `technicianNotes` (String): Work report.
- `odometerAtService` (Number): Vehicle mileage logged during the service.

### 3. `Insurance`
Represents regulatory and commercial insurance coverage policies.
- `vehicle` (ObjectId, Ref: `Vehicle`): Covered vehicle.
- `provider` (String): Underwriter company (e.g., Allianz, Liberty Mutual).
- `policyNumber` (String, Unique): Policy identification identifier.
- `coverageType` (String, Enum): Comprehensive, Third-Party Liability, Collision, etc.
- `premiumAmount` (Number): Annual insurance premium cost.
- `startDate` & `expiryDate` (Date): Effective duration.
- `renewalStatus` (String, Enum): `['Active', 'Expiring Soon', 'Expired', 'Renewed']`.
- `contactNumber` (String): Claims telephone contact.

### 4. `Maintenance`
Represents unscheduled corrective repairs and mechanical work orders.
- `vehicle` (ObjectId, Ref: `Vehicle`): Associated vehicle.
- `maintenanceType` (String, Enum): `['Preventive', 'Corrective', 'Emergency', 'Inspection']`.
- `maintenanceDate` (Date): Work order timestamp.
- `description` (String): Defect or diagnostic observation.
- `cost` (Number): Total parts and labor cost.
- `status` (String, Enum): `['Pending', 'In Progress', 'Completed']`.
- `priority` (String, Enum): `['Low', 'Medium', 'High', 'Critical']`.
- `replacedParts` (Array of Strings): Specific replacement components.
- `mechanicName` (String): Lead technician.

### 5. `Expense`
Centralized financial ledger tracking operational overheads.
- `vehicle` (ObjectId, Ref: `Vehicle`, Optional): Specific vehicle or null for global fleet costs.
- `category` (String, Enum): `Service`, `Maintenance`, `Insurance`, `Fuel`, `Tolls & Permits`, `Cleaning & Detailing`, `Other Operational`.
- `amount` (Number): Total expense amount.
- `expenseDate` (Date): Date of transaction.
- `description` (String): Purpose of expense.
- `paidTo` (String): Vendor or merchant.
- `paymentMethod` (String, Enum): Company Card, Fuel Card, Bank Transfer, Petty Cash.

### 6. `User`
Access control and authentication credentials.
- `name` (String): Operator's full name.
- `email` (String, Unique): Login email address.
- `password` (String, Hashed with bcrypt): Encrypted credential.
- `role` (String, Enum): `['admin', 'manager', 'dispatcher']`.

---

## 📡 REST API Endpoints Specification

All protected endpoints require a JWT Bearer token via `Authorization: Bearer <token>`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | Public |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Protected |

### Vehicle Management Endpoints (`/api/vehicles`)
| Method | Endpoint | Description | Cache Layer |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vehicles` | List vehicles with search, type & status filters | Redis (`120s TTL`) |
| `GET` | `/api/vehicles/:id` | Get vehicle details with full service history | Redis (`120s TTL`) |
| `GET` | `/api/vehicles/stats` | Aggregated status & type counts | Redis (`120s TTL`) |
| `POST` | `/api/vehicles` | Register new fleet vehicle | Invalidation |
| `PUT` | `/api/vehicles/:id` | Update vehicle parameters | Invalidation |
| `DELETE`| `/api/vehicles/:id` | Delete vehicle and cascade related records | Invalidation |

### Service Management Endpoints (`/api/services`)
| Method | Endpoint | Description | Side Effects |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/services` | Query services by vehicle, status, or search | — |
| `GET` | `/api/services/:id` | Single service details | — |
| `POST` | `/api/services` | Schedule new service | Auto-creates Expense if cost > 0 |
| `PUT` | `/api/services/:id` | Update service / Mark completed | Auto-updates vehicle health & mileage |
| `DELETE`| `/api/services/:id` | Remove service log | Invalidates dashboard cache |

### Insurance Management Endpoints (`/api/insurance`)
| Method | Endpoint | Description | Expiry Evaluation |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/insurance` | List policies with dynamic expiry status | Syncs renewal status |
| `GET` | `/api/insurance/alerts` | Policies expiring in $\le$ 30 days or expired | Dedicated alert query |
| `GET` | `/api/insurance/:id` | Single policy details | — |
| `POST` | `/api/insurance` | Register insurance policy | Auto-logs premium Expense |
| `PUT` | `/api/insurance/:id` | Update policy details | Recalculates expiry status |
| `DELETE`| `/api/insurance/:id` | Delete policy record | Invalidates caches |

### Maintenance Management Endpoints (`/api/maintenance`)
| Method | Endpoint | Description | Workflow Action |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | List work orders with priority/status filters | — |
| `GET` | `/api/maintenance/:id`| Work order details with replaced parts | — |
| `POST` | `/api/maintenance` | Log maintenance work order | Sets vehicle to Under Maintenance |
| `PUT` | `/api/maintenance/:id` | Update work order / Mark completed | Restores vehicle to Active / Good |
| `DELETE`| `/api/maintenance/:id` | Delete maintenance record | Invalidates caches |

### Expense & Cost Endpoints (`/api/expenses`)
| Method | Endpoint | Description | Aggregations |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses` | List all expense transactions | Filter by category & vehicle |
| `GET` | `/api/expenses/summary`| Aggregated operational cost breakdown | Category share, vehicle rankings |
| `POST` | `/api/expenses` | Log new expense receipt | Invalidates financial caches |
| `DELETE`| `/api/expenses/:id` | Delete expense entry | Invalidates caches |

### Dashboard Analytics Endpoints (`/api/dashboard`)
| Method | Endpoint | Description | Redis Cache Key |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregated fleet KPIs, costs, health, alerts | `fleet:dashboard:stats` (60s) |
| `GET` | `/api/dashboard/cache/status` | Read live Redis hit/miss telemetry | Live system probe |
| `POST` | `/api/dashboard/cache/flush` | Flush Redis cache keys on demand | Purges all keys |

---

## ⚡ Redis Caching Strategy & Telemetry

Fleet management dashboards are read-heavy: dispatchers and managers frequently check vehicle statuses, upcoming services, and operational costs.

### Caching Architecture
1. **Cache Middleware**: Express intercepts incoming GET requests. If a matching key exists in Redis, the payload is served in **< 15 milliseconds** with the HTTP header `X-Cache: HIT`.
2. **Cache Miss & Population**: If the key does not exist (`X-Cache: MISS`), the server queries MongoDB, stores the result in Redis with an expiration TTL (e.g. 60–120s), and returns the payload.
3. **Automated Cache Invalidation**: Whenever a mutation occurs (POST, PUT, or DELETE on vehicles, services, insurance, maintenance, or expenses), the backend automatically invalidates matching keys (`fleet:dashboard*`, `fleet:vehicles*`).
4. **Live Telemetry Banner**: The frontend features a live status bar at the top displaying real-time Redis telemetry (`CACHE HIT` vs `CACHE MISS`), the exact cache key, and an interactive **Flush Redis Cache** button for live evaluation demonstrations.

---

## 💻 Frontend Pages & UI Components

The frontend is constructed using pure **React.js (Vite)** with custom Vanilla CSS design tokens:
1. **Login Page**: Modern authenticated portal for **Fleet Operations Manager** featuring standard manual email/password verification and new manager registration switching.
2. **Dashboard**: 8 metric cards displaying total vehicles, active vehicles, maintenance count, requiring service count, cumulative operational cost, maintenance cost, insurance premiums, and service expenses, alongside a Vehicle Health status distribution bar, upcoming service schedules, and insurance alerts.
3. **Vehicle Management**: Searchable and filterable data table, Add/Edit Vehicle modal forms with input validation, Delete confirmation dialogs, and a full **Vehicle Profile Drawer** displaying linked service history, insurance coverage, and work orders.
4. **Service Management**: Preventive service tracking with scheduled dates, workshop provider, estimated cost, and a **Mark Complete** action that automatically updates the vehicle's odometer and resets its health to `Good`.
5. **Insurance Management**: Policy tracker with real-time countdown alerts for policies expiring within 30 days or expired, plus policy registration and premium logging.
6. **Maintenance Management**: Work order manager displaying defect descriptions, priorities (`Low`, `Medium`, `High`, `Critical`), replaced parts lists, and status progression (`Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`).
7. **Vehicle Health Monitoring**: Health command center featuring the **Fleet Health Index score**, diagnostic breakdown cards (`Good`, `Needs Service`, `Under Maintenance`), and quick-action health status overrides.
8. **Cost Management**: Overall operational expenditure analyzer, category distribution charts, and a vehicle ranking leaderboard identifying the top spending assets in the fleet.

---

## 🐳 Docker & Containerization Setup

FleetFlow includes production-ready Dockerfiles and a `docker-compose.yml` to launch the complete system with a single command.

### Multi-Container Topology:
1. `fleetflow_mongodb`: MongoDB 7.0 database container on port `27017` with volume persistence.
2. `fleetflow_redis`: Redis 7 Alpine in-memory cache container on port `6379`.
3. `fleetflow_backend`: Node.js Express REST API container on port `5000` connected to MongoDB and Redis via internal bridge network.
4. `fleetflow_frontend`: Production multi-stage build container running Nginx on port `80` (and `3000`), serving optimized static assets and proxying `/api` requests.

---

## 🚀 Installation & Execution Guide

### Option A: Standard Local Execution (Recommended for Immediate Testing)

#### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

#### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/fleet-management-system.git
cd fleet-management-system
```

#### Step 2: Install Backend Dependencies & Start Server
```bash
cd backend
npm install
npm run dev
```
> **Zero-Configuration Feature**: If a local MongoDB or Redis service is not detected on your host, the backend automatically boots a built-in embedded engine and Redis fallback layer with **zero manual configuration required**, and automatically seeds initial sample vehicles, services, insurance, and expenses!
> The backend will be live at: `http://localhost:5000`

#### Step 3: Install Frontend Dependencies & Start Client (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
> The frontend client will be live at: `http://localhost:5173`

---

### Option B: Docker Compose Execution

#### Prerequisites
- **Docker Desktop** installed and running

#### Run the entire stack:
```bash
docker compose up --build
```

- Frontend App: `http://localhost:3000` or `http://localhost`
- Backend REST API: `http://localhost:5000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

To stop containers:
```bash
docker compose down
```

---

## 📊 Sample Demonstration Data & Credentials

The system includes pre-configured sample data for instant demonstration:

### Default Login Account
| Role | Email | Password |
| :--- | :--- | :--- |
| **Fleet Operations Manager** | `manager@fleetflow.io` | `Password@123` |

*(Enter these credentials into the Email Address and Password fields and click "Sign In to Dashboard")*

### Pre-Seeded Fleet Assets
- **FLT-101**: Ford Transit 350 High Roof (Van, Active, Good, Routine Service Scheduled, Allianz Insurance expiring in 15 days)
- **FLT-102**: Freightliner Cascadia 126 (Truck, Under Maintenance, Liberty Mutual Insurance Expired)
- **FLT-103**: Toyota Hilux Revo 4x4 (Pickup, Active, Good, Progressive Commercial Policy)
- **FLT-104**: Mercedes-Benz Sprinter 2500 (Van, In Service, Needs Service, Brake pads wear)
- **FLT-105**: Volvo 9700 Luxury Coach (Bus, Active, Good, Inspection completed)
- **FLT-106**: Isuzu NPR-HD Gas (Truck, Active, Needs Service, Reefer unit maintenance)
- **FLT-107**: Toyota RAV4 Hybrid (SUV, Active, Good, Fleet operations inspection vehicle)
- **FLT-108**: Ford F-150 Lightning Pro (Electric Pickup, Active, Good)

---

## 🐙 Git & GitHub Setup Guide

To initialize Git and push this repository to GitHub:

```bash
# 1. Initialize Git in the project root
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "feat: complete FleetFlow enterprise fleet management system with MERN, Redis, and Docker"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/your-username/fleet-management-system.git

# 6. Push code to GitHub
git push -u origin main
```
