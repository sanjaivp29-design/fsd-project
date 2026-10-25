import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import CacheBanner from './components/common/CacheBanner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import ServicesPage from './pages/ServicesPage';
import InsurancePage from './pages/InsurancePage';
import MaintenancePage from './pages/MaintenancePage';
import VehicleHealthPage from './pages/VehicleHealthPage';
import CostManagementPage from './pages/CostManagementPage';
import FleetStaffDashboard from './pages/FleetStaffDashboard';

const FleetAppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Role-based portal separation: Fleet Staff view
  if (user?.role === 'staff') {
    return (
      <div className="app-container" style={{ display: 'block', minHeight: '100vh', background: '#090d16' }}>
        <Navbar activePage="staff" onNavigate={() => {}} />
        <CacheBanner />
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px' }}>
          <FleetStaffDashboard />
        </main>
      </div>
    );
  }

  // Fleet Manager (Admin) Full System View
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActivePage} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'services':
        return <ServicesPage />;
      case 'insurance':
        return <InsurancePage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'health':
        return <VehicleHealthPage onNavigate={setActivePage} />;
      case 'costs':
        return <CostManagementPage />;
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-content">
        <Navbar activePage={activePage} onNavigate={setActivePage} />
        <CacheBanner />
        <main>{renderActivePage()}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <FleetAppContent />
    </AuthProvider>
  );
}

export default App;
