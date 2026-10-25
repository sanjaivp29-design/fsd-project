import React, { useState, useEffect } from 'react';
import {
  Truck,
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle,
  FileText,
  Plus,
  RefreshCw,
  Calendar,
  Fuel,
  Gauge,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { vehicleAPI, problemReportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const FleetStaffDashboard = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [problemReports, setProblemReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicle'); // 'vehicle' | 'services' | 'reports'

  // Modal State for Reporting Problem
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');
  const [reportFormData, setReportFormData] = useState({
    description: '',
    severity: 'Medium',
  });
  const [reportError, setReportError] = useState('');

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Assigned Vehicle and Reports in parallel
      const [vehRes, reportsRes] = await Promise.all([
        vehicleAPI.getMyAssigned(),
        problemReportAPI.getAll(),
      ]);

      setVehicle(vehRes.data.data);
      setProblemReports(reportsRes.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load assigned vehicle information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleOpenReportModal = () => {
    setReportFormData({
      description: '',
      severity: 'Medium',
    });
    setReportError('');
    setReportSuccessMsg('');
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportFormData.description.trim()) {
      setReportError('Please provide a detailed description of the vehicle issue.');
      return;
    }
    if (!vehicle?._id) {
      setReportError('No assigned vehicle identified to attach this report to.');
      return;
    }

    try {
      setSubmittingReport(true);
      setReportError('');

      await problemReportAPI.create({
        vehicle: vehicle._id,
        description: reportFormData.description.trim(),
        severity: reportFormData.severity,
      });

      setReportSuccessMsg('Problem report submitted successfully! The Fleet Manager has been alerted.');
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccessMsg('');
        fetchStaffData();
      }, 1400);
    } catch (err) {
      setReportError(err.message || 'Failed to submit problem report');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '18px', color: '#94a3b8' }}>Loading assigned vehicle details...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Top Banner / Welcome */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              <Truck size={28} color="#38bdf8" />
              Fleet Staff Portal
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 10px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Fleet Staff
            </span>
          </div>
          <div className="page-subtitle">
            Assigned driver portal for <strong>{user?.name || 'Fleet Staff'}</strong> — Monitor vehicle status, view service records, and report problems.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchStaffData} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={handleOpenReportModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            }}
          >
            <AlertTriangle size={16} />
            Report Vehicle Problem
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Vehicle Status Warning if Under Maintenance */}
      {vehicle?.currentStatus === 'Under Maintenance' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <AlertTriangle size={24} color="#f87171" />
          <div>
            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '15px' }}>
              Notice: Vehicle is Currently Under Maintenance
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
              This vehicle is currently grounded or in the workshop. Please do not operate until cleared and marked Active by the Fleet Manager.
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation for Staff */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('vehicle')}
          className={`btn ${activeTab === 'vehicle' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Truck size={15} />
          My Assigned Vehicle
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <ShieldAlert size={15} />
          My Problem Reports ({problemReports.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Wrench size={15} />
          Service & Maintenance Records
        </button>
      </div>

      {/* TAB 1: Assigned Vehicle Overview */}
      {activeTab === 'vehicle' && vehicle && (
        <div>
          {/* Main Vehicle Hero Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                    {vehicle.vehicleNumber}
                  </h2>
                  <Badge status={vehicle.currentStatus} />
                  <Badge status={vehicle.vehicleHealthStatus} />
                </div>
                <div style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 500 }}>
                  {vehicle.manufacturer} {vehicle.model} &bull; <span style={{ color: '#38bdf8' }}>{vehicle.vehicleType}</span>
                </div>
              </div>

              <button
                onClick={handleOpenReportModal}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                }}
              >
                <AlertTriangle size={15} />
                Report an Issue With This Vehicle
              </button>
            </div>

            {/* Quick Specs Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Gauge size={16} color="#38bdf8" />
                  <span>Current Mileage</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                  {vehicle.mileage?.toLocaleString() || '0'} <span style={{ fontSize: '12px', color: '#94a3b8' }}>mi</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Fuel size={16} color="#10b981" />
                  <span>Fuel / Powertrain</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                  {vehicle.fuelType || 'Standard'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Building size={16} color="#a855f7" />
                  <span>Assigned Department</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                  {vehicle.department || 'Operations'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Calendar size={16} color="#f59e0b" />
                  <span>Registration Date</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                  {vehicle.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            {vehicle.notes && (
              <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '13px', color: '#94a3b8' }}>
                <strong style={{ color: '#cbd5e1' }}>Vehicle Notes:</strong> {vehicle.notes}
              </div>
            )}
          </div>

          {/* Quick Problem Report Callout */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <ShieldAlert size={18} color="#ef4444" />
                  Recent Problem Reports for {vehicle.vehicleNumber}
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('reports')}>
                  View All ({problemReports.length})
                </button>
              </div>

              {problemReports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {problemReports.slice(0, 3).map((rep) => (
                    <div
                      key={rep._id}
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        borderLeft: rep.severity === 'Critical' ? '3px solid #ef4444' : '3px solid #f59e0b',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <Badge status={rep.severity} />
                        <Badge status={rep.status} />
                      </div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500, margin: '6px 0' }}>
                        {rep.description}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Reported on {new Date(rep.reportedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '24px' }}>
                  No open problem reports for this vehicle. Everything is in order!
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Wrench size={18} color="#3b82f6" />
                  Upcoming Service Status
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('services')}>
                  View All Services
                </button>
              </div>

              {vehicle.services && vehicle.services.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {vehicle.services.slice(0, 3).map((srv) => (
                    <div
                      key={srv._id}
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#f8fafc' }}>{srv.serviceType}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          Due: {new Date(srv.scheduledDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge status={srv.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '24px' }}>
                  No scheduled services logged for this vehicle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: My Problem Reports */}
      {activeTab === 'reports' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <ShieldAlert size={20} color="#ef4444" />
                Submitted Problem Reports
              </h2>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>
                All vehicle defects and maintenance issues reported by you to the Fleet Manager
              </div>
            </div>

            <button onClick={handleOpenReportModal} className="btn btn-primary btn-sm">
              <Plus size={15} />
              Report New Issue
            </button>
          </div>

          {problemReports.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reported Date</th>
                    <th>Vehicle</th>
                    <th>Severity</th>
                    <th>Problem Description</th>
                    <th>Manager Status</th>
                    <th>Resolution Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {problemReports.map((rep) => (
                    <tr key={rep._id}>
                      <td style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        {new Date(rep.reportedAt).toLocaleDateString()}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(rep.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rep.vehicle?.vehicleNumber || vehicle?.vehicleNumber}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {rep.vehicle?.model || vehicle?.model}
                        </div>
                      </td>
                      <td>
                        <Badge status={rep.severity} />
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>
                          {rep.description}
                        </div>
                      </td>
                      <td>
                        <Badge status={rep.status} />
                      </td>
                      <td style={{ fontSize: '12.5px', color: rep.resolutionNotes ? '#cbd5e1' : '#64748b', fontStyle: rep.resolutionNotes ? 'normal' : 'italic' }}>
                        {rep.resolutionNotes || 'Pending Fleet Manager review'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No problem reports submitted. If you detect any mechanical or electrical issue, click "Report New Issue".
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Service & Maintenance Records */}
      {activeTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Service Schedules */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar size={18} color="#3b82f6" />
                Service Schedules ({vehicle?.vehicleNumber})
              </h2>
              <span className="badge badge-info">Preventive Care</span>
            </div>

            {vehicle?.services && vehicle.services.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Scheduled Date</th>
                      <th>Service Center</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicle.services.map((srv) => (
                      <tr key={srv._id}>
                        <td style={{ fontWeight: 600 }}>{srv.serviceType}</td>
                        <td>{new Date(srv.scheduledDate).toLocaleDateString()}</td>
                        <td>{srv.serviceCenter || 'Fleet Bay'}</td>
                        <td>
                          <Badge status={srv.status} />
                        </td>
                        <td style={{ fontSize: '12.5px', color: '#94a3b8' }}>{srv.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No scheduled service records on file.</div>
            )}
          </div>

          {/* Maintenance Records */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Wrench size={18} color="#f59e0b" />
                Maintenance & Workshop Work Orders ({vehicle?.vehicleNumber})
              </h2>
              <span className="badge badge-warning">Corrective Maintenance</span>
            </div>

            {vehicle?.maintenances && vehicle.maintenances.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Maintenance Date</th>
                      <th>Type</th>
                      <th>Description / Problem</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Repair Center</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicle.maintenances.map((mnt) => (
                      <tr key={mnt._id}>
                        <td>{mnt.maintenanceDate ? new Date(mnt.maintenanceDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ fontWeight: 500 }}>{mnt.maintenanceType}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{mnt.problem || mnt.description}</div>
                          {mnt.resolutionNotes && (
                            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                              Fix: {mnt.resolutionNotes}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge status={mnt.priority} />
                        </td>
                        <td>
                          <Badge status={mnt.status} />
                        </td>
                        <td style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                          {mnt.repairCenter || mnt.mechanicName || 'Fleet Workshop'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No maintenance records logged for this vehicle.</div>
            )}
          </div>
        </div>
      )}

      {/* REPORT VEHICLE PROBLEM MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Vehicle Problem"
      >
        <form onSubmit={handleReportSubmit}>
          {reportSuccessMsg && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              {reportSuccessMsg}
            </div>
          )}

          {reportError && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              {reportError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Assigned Vehicle</label>
            <input
              type="text"
              disabled
              value={`${vehicle?.vehicleNumber || 'Assigned Vehicle'} (${vehicle?.manufacturer || ''} ${vehicle?.model || ''})`}
              className="form-input"
              style={{ opacity: 0.8, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reported By</label>
            <input
              type="text"
              disabled
              value={`${user?.name || 'Fleet Staff'} (Fleet Staff)`}
              className="form-input"
              style={{ opacity: 0.8, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Issue Severity Level</label>
            <select
              value={reportFormData.severity}
              onChange={(e) => setReportFormData({ ...reportFormData, severity: e.target.value })}
              className="form-select"
            >
              <option value="Low">Low — Minor cosmetic or non-critical issue</option>
              <option value="Medium">Medium — Operational issue needing scheduled repair</option>
              <option value="High">High — Impaired performance, urgent maintenance required</option>
              <option value="Critical">Critical — Severe safety risk, immediate grounding required</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Description *</label>
            <textarea
              rows={4}
              value={reportFormData.description}
              onChange={(e) => setReportFormData({ ...reportFormData, description: e.target.value })}
              placeholder="Describe the symptoms, unusual noises, warning lights, brake response, steering issues, leaks, etc."
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="btn btn-secondary"
              disabled={submittingReport}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              disabled={submittingReport}
            >
              {submittingReport ? 'Submitting Report...' : 'Submit Report to Fleet Manager'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FleetStaffDashboard;
