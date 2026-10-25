import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Truck,
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { vehicleAPI } from '../services/api';
import Badge from '../components/common/Badge';

const VehicleHealthPage = ({ onNavigate }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHealth, setFilterHealth] = useState('All');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleAPI.getAll({
        health: filterHealth !== 'All' ? filterHealth : undefined,
      });
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filterHealth]);

  const handleUpdateHealth = async (vehicleId, newHealth) => {
    try {
      await vehicleAPI.update(vehicleId, { vehicleHealthStatus: newHealth });
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  // Group counts
  const total = vehicles.length;
  const goodCount = vehicles.filter((v) => v.vehicleHealthStatus === 'Good').length;
  const needsServiceCount = vehicles.filter((v) => v.vehicleHealthStatus === 'Needs Service').length;
  const underMaintenanceCount = vehicles.filter((v) => v.vehicleHealthStatus === 'Under Maintenance').length;

  const fleetHealthIndex = total > 0 ? Math.round((goodCount / total) * 100) : 0;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <HeartPulse size={28} color="#ef4444" />
            Vehicle Health & Diagnostics Command
          </h1>
          <div className="page-subtitle">
            Fleet-wide diagnostic monitoring, triage classifications (Good, Needs Service, Under Maintenance), and preventive intervention
          </div>
        </div>
      </div>

      {/* Fleet Health Index & Triage Cards */}
      <div className="grid-4">
        {/* Scorecard */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase' }}>
            Fleet Health Index
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            {fleetHealthIndex}%
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Operational Readiness Score
          </div>
        </div>

        {/* Good Condition */}
        <div
          className="card"
          onClick={() => setFilterHealth('Good')}
          style={{
            cursor: 'pointer',
            borderColor: filterHealth === 'Good' ? '#10b981' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>Good Condition</span>
            <CheckCircle size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            {goodCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Road ready & operating within specs</div>
        </div>

        {/* Needs Service */}
        <div
          className="card"
          onClick={() => setFilterHealth('Needs Service')}
          style={{
            cursor: 'pointer',
            borderColor: filterHealth === 'Needs Service' ? '#f59e0b' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>Needs Service</span>
            <AlertTriangle size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            {needsServiceCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Overdue or mileage check recommended</div>
        </div>

        {/* Under Maintenance */}
        <div
          className="card"
          onClick={() => setFilterHealth('Under Maintenance')}
          style={{
            cursor: 'pointer',
            borderColor: filterHealth === 'Under Maintenance' ? '#ef4444' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase' }}>Under Maintenance</span>
            <Wrench size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            {underMaintenanceCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Currently grounded in workshop</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['All', 'Good', 'Needs Service', 'Under Maintenance'].map((tab) => (
          <button
            key={tab}
            className={`btn ${filterHealth === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterHealth(tab)}
          >
            {tab} Vehicles ({tab === 'All' ? total : vehicles.filter((v) => v.vehicleHealthStatus === tab).length})
          </button>
        ))}
      </div>

      {/* Health Cards Grid */}
      <div className="grid-3">
        {loading ? (
          <div style={{ colSpan: '3', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Evaluating vehicle health telemetry...
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{ colSpan: '3', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No vehicles under status '{filterHealth}'.
          </div>
        ) : (
          vehicles.map((v) => {
            const isGood = v.vehicleHealthStatus === 'Good';
            const isNeedsService = v.vehicleHealthStatus === 'Needs Service';
            const isUnderMaintenance = v.vehicleHealthStatus === 'Under Maintenance';

            return (
              <div
                key={v._id}
                className="card"
                style={{
                  borderLeft: `4px solid ${
                    isGood ? '#10b981' : isNeedsService ? '#f59e0b' : '#ef4444'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {v.vehicleNumber}
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                      {v.manufacturer} {v.model}
                    </div>
                  </div>
                  <Badge status={v.vehicleHealthStatus} />
                </div>

                <div style={{ fontSize: '12.5px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div>
                    Mileage: <strong style={{ color: '#fff' }}>{v.mileage.toLocaleString()} mi</strong>
                  </div>
                  <div>
                    Current Status: <strong style={{ color: '#fff' }}>{v.currentStatus}</strong>
                  </div>
                  <div>
                    Assigned Driver: <strong style={{ color: '#fff' }}>{v.assignedDriver}</strong>
                  </div>
                  {v.notes && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                      {v.notes}
                    </div>
                  )}
                </div>

                {/* Quick Diagnostics Action Bar */}
                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Change Health:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!isGood && (
                      <button
                        onClick={() => handleUpdateHealth(v._id, 'Good')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        title="Set to Good"
                      >
                        Pass
                      </button>
                    )}
                    {!isNeedsService && (
                      <button
                        onClick={() => handleUpdateHealth(v._id, 'Needs Service')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px', color: '#fbbf24' }}
                        title="Flag Needs Service"
                      >
                        Flag Service
                      </button>
                    )}
                    {!isUnderMaintenance && (
                      <button
                        onClick={() => handleUpdateHealth(v._id, 'Under Maintenance')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px', color: '#f87171' }}
                        title="Send to Maintenance"
                      >
                        Ground
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VehicleHealthPage;
