import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  ShieldCheck,
  Hammer,
  Activity,
  DollarSign,
  Server,
  Layers,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicle Management', icon: Truck },
  { id: 'services', label: 'Service Management', icon: Wrench },
  { id: 'insurance', label: 'Insurance Management', icon: ShieldCheck },
  { id: 'maintenance', label: 'Maintenance Records', icon: Hammer },
  { id: 'health', label: 'Vehicle Health', icon: Activity },
  { id: 'costs', label: 'Cost Management', icon: DollarSign },
];

const Sidebar = ({ activePage, onNavigate }) => {
  return (
    <aside
      style={{
        width: 260,
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b',
            padding: '0 12px 14px',
          }}
        >
          Navigation Modules
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#3b82f6' : '#64748b'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tech Stack Info Box */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Layers size={14} color="#38bdf8" />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>MERN Core + Redis</span>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
          MongoDB • Express • React • Node • Redis Cache • Docker
        </div>
        <div
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '10.5px',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Server size={12} /> REST API Connected
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
