import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  Hammer,
} from 'lucide-react';
import { dashboardAPI, problemReportAPI } from '../services/api';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';

const DashboardPage = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      await problemReportAPI.update(reportId, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update report status');
    }
  };

  if (loading && !data) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '18px', color: '#94a3b8' }}>Loading fleet intelligence dashboard...</div>
      </div>
    );
  }

  const { summary, healthDistribution, upcomingServices, insuranceAlerts, recentActivity, cacheStats } = data || {};

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={28} color="#3b82f6" />
            Fleet Overview Dashboard
          </h1>
          <div className="page-subtitle">
            Real-time monitoring of vehicles, preventive maintenance, insurance alerts & operational expenses
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('vehicles')}
            className="btn btn-primary"
          >
            <Truck size={16} />
            Manage Vehicles
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Row 1: Vehicle & Fleet Status KPIs (4 cards) */}
      <div className="grid-4">
        <StatCard
          title="Total Vehicles"
          value={summary?.totalVehicles ?? 0}
          subtext="Registered in Fleet"
          icon={Truck}
          iconColor="#38bdf8"
          iconBg="rgba(56, 189, 248, 0.12)"
          onClick={() => onNavigate('vehicles')}
        />
        <StatCard
          title="Active Vehicles"
          value={summary?.activeVehicles ?? 0}
          subtext="In Operational Service"
          icon={CheckCircle}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.12)"
          onClick={() => onNavigate('vehicles')}
        />
        <StatCard
          title="Under Maintenance"
          value={summary?.underMaintenanceVehicles ?? 0}
          subtext="In Repair or Shop"
          icon={Wrench}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.12)"
          onClick={() => onNavigate('maintenance')}
        />
        <StatCard
          title="Requiring Service"
          value={summary?.requiringServiceVehicles ?? 0}
          subtext="Needs Service or Check"
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBg="rgba(239, 68, 68, 0.12)"
          onClick={() => onNavigate('health')}
        />
      </div>

      {/* Row 2: Financial & Operational Cost Metrics (4 cards) */}
      <div className="grid-4">
        <StatCard
          title="Total Operational Cost"
          value={`$${(summary?.totalOperationalCost ?? 0).toLocaleString()}`}
          subtext="All Fuel, Maint, Ins, Fees"
          icon={DollarSign}
          iconColor="#3b82f6"
          iconBg="rgba(59, 130, 246, 0.12)"
          onClick={() => onNavigate('costs')}
        />
        <StatCard
          title="Maintenance Cost"
          value={`$${(summary?.totalMaintenanceCost ?? 0).toLocaleString()}`}
          subtext="Repairs & Labor Total"
          icon={Wrench}
          iconColor="#8b5cf6"
          iconBg="rgba(139, 92, 246, 0.12)"
          onClick={() => onNavigate('maintenance')}
        />
        <StatCard
          title="Insurance Premiums"
          value={`$${(summary?.totalInsuranceCost ?? 0).toLocaleString()}`}
          subtext="Total Policy Investment"
          icon={ShieldAlert}
          iconColor="#06b6d4"
          iconBg="rgba(6, 182, 212, 0.12)"
          onClick={() => onNavigate('insurance')}
        />
        <StatCard
          title="Service Expenses"
          value={`$${(summary?.totalServiceCost ?? 0).toLocaleString()}`}
          subtext="Scheduled Servicing"
          icon={TrendingUp}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.12)"
          onClick={() => onNavigate('services')}
        />
      </div>

      {/* Fleet Staff Problem Report Alerts */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid #ef4444' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <div>
              <h2 className="card-title" style={{ margin: 0 }}>
                Fleet Staff Vehicle Problem Alerts
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Issues and defects submitted directly by assigned Fleet Staff
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="badge"
              style={{
                background: data?.problemReports?.pendingCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                color: data?.problemReports?.pendingCount > 0 ? '#f87171' : '#34d399',
                border: data?.problemReports?.pendingCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {data?.problemReports?.pendingCount || 0} Pending Review
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('maintenance')}>
              <Hammer size={14} />
              Open Maintenance
            </button>
          </div>
        </div>

        {data?.problemReports?.recent && data.problemReports.recent.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Reported By</th>
                  <th>Severity</th>
                  <th>Problem Description</th>
                  <th>Reported Time</th>
                  <th>Status</th>
                  <th>Manager Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.problemReports.recent.map((rep) => (
                  <tr key={rep._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                        {rep.vehicle?.vehicleNumber || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {rep.vehicle?.model} &bull; <Badge status={rep.vehicle?.currentStatus} />
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#38bdf8' }}>
                        {rep.reportedBy?.name || rep.staffName || 'Fleet Staff'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {rep.reportedBy?.email || 'staff'}
                      </div>
                    </td>
                    <td>
                      <Badge status={rep.severity} />
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>
                        {rep.description}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                      {new Date(rep.reportedAt).toLocaleDateString()}
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {new Date(rep.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <Badge status={rep.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {rep.vehicle?.currentStatus !== 'Under Maintenance' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '11.5px',
                              padding: '4px 8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                            }}
                            title="Ground vehicle into Under Maintenance"
                            onClick={() => handleUpdateReportStatus(rep._id, 'In Maintenance')}
                          >
                            Set Under Maintenance
                          </button>
                        )}
                        {rep.status !== 'Resolved' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11.5px', padding: '4px 8px' }}
                            onClick={() => handleUpdateReportStatus(rep._id, 'Resolved')}
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '20px' }}>
            No problem reports reported by Fleet Staff at this time. All vehicles clear.
          </div>
        )}
      </div>

      {/* Row 3: Vehicle Health Distribution Bar & Redis Telemetry */}
      <div className="grid-2">
        {/* Health Score Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <CheckCircle size={18} color="#10b981" />
              Fleet Health Status Distribution
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('health')}>
              Health Details
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Good Condition</span>
                <span style={{ fontWeight: 700 }}>{healthDistribution?.Good ?? 0} Vehicles</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#10b981',
                    width: `${summary?.totalVehicles ? ((healthDistribution?.Good || 0) / summary.totalVehicles) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Needs Service</span>
                <span style={{ fontWeight: 700 }}>{healthDistribution?.['Needs Service'] ?? 0} Vehicles</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#f59e0b',
                    width: `${summary?.totalVehicles ? ((healthDistribution?.['Needs Service'] || 0) / summary.totalVehicles) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Under Maintenance</span>
                <span style={{ fontWeight: 700 }}>{healthDistribution?.['Under Maintenance'] ?? 0} Vehicles</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#ef4444',
                    width: `${summary?.totalVehicles ? ((healthDistribution?.['Under Maintenance'] || 0) / summary.totalVehicles) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Redis Cache & Performance Monitoring */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Zap size={18} color="#38bdf8" />
              Redis Cache Performance
            </h2>
            <span className="badge badge-info">Live Stats</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cache Type</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                {cacheStats?.type === 'standalone-redis-server' ? 'External Redis' : 'Redis In-Memory'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cache Hits</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {cacheStats?.hits ?? 0}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Active Keys</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                {cacheStats?.activeKeys ?? 0}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            Frequent dashboard queries and vehicle lookups are cached to ensure near-zero latency (&lt;20ms).
            Mutations (creating, updating, deleting vehicles) automatically flush and invalidate affected keys.
          </p>
        </div>
      </div>

      {/* Row 4: Upcoming Service Schedules & Insurance Expiry Alerts */}
      <div className="grid-2">
        {/* Upcoming Services Widget */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={18} color="#3b82f6" />
              Upcoming Service Schedules
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('services')}>
              View All
            </button>
          </div>

          {upcomingServices && upcomingServices.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Service Type</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingServices.map((srv) => (
                    <tr key={srv._id}>
                      <td style={{ fontWeight: 600 }}>
                        {srv.vehicle?.vehicleNumber || 'Unassigned'}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{srv.vehicle?.model}</div>
                      </td>
                      <td>{srv.serviceType}</td>
                      <td>{new Date(srv.scheduledDate).toLocaleDateString()}</td>
                      <td>
                        <Badge status={srv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No scheduled services pending.</div>
          )}
        </div>

        {/* Insurance Expiry Alerts Widget */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <ShieldAlert size={18} color="#ef4444" />
              Insurance Expiry Alerts
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('insurance')}>
              Manage Policies
            </button>
          </div>

          {insuranceAlerts && insuranceAlerts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Provider / Policy</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {insuranceAlerts.map((pol) => (
                    <tr key={pol._id}>
                      <td style={{ fontWeight: 600 }}>
                        {pol.vehicle?.vehicleNumber || 'Fleet Vehicle'}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{pol.vehicle?.assignedDriver}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{pol.provider}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          {pol.policyNumber}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: pol.renewalStatus === 'Expired' ? '#ef4444' : '#f59e0b' }}>
                        {new Date(pol.expiryDate).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge status={pol.renewalStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">All insurance policies are actively covered.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
