import React, { useState, useEffect } from 'react';
import {
  Hammer,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  User,
  Wrench,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { maintenanceAPI, vehicleAPI, problemReportAPI } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const initialMaintenanceForm = {
  vehicle: '',
  problem: '',
  maintenanceType: 'Corrective',
  maintenanceDate: new Date().toISOString().split('T')[0],
  startDate: new Date().toISOString().split('T')[0],
  expectedCompletionDate: '',
  completionDate: '',
  repairCenter: 'Fleet Central Maintenance Bay',
  description: '',
  cost: 0,
  status: 'In Progress',
  priority: 'Medium',
  replacedParts: '',
  mechanicName: 'Fleet Maintenance Bay',
  resolutionNotes: '',
};

const MaintenancePage = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reports'
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [problemReports, setProblemReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState(initialMaintenanceForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const res = await maintenanceAPI.getAll({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        search: search || undefined,
      });
      setRecords(res.data.data || []);
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemReports = async () => {
    try {
      const res = await problemReportAPI.getAll();
      setProblemReports(res.data.data || []);
    } catch (err) {
      console.error('Error fetching problem reports:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await vehicleAPI.getAll();
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchVehicles();
    fetchProblemReports();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMaintenanceData();
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialMaintenanceForm,
      vehicle: vehicles[0]?._id || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setSelectedRecord(rec);
    setFormData({
      vehicle: rec.vehicle?._id || rec.vehicle,
      problem: rec.problem || '',
      maintenanceType: rec.maintenanceType || 'Corrective',
      maintenanceDate: rec.maintenanceDate ? rec.maintenanceDate.split('T')[0] : '',
      startDate: rec.startDate ? rec.startDate.split('T')[0] : (rec.maintenanceDate ? rec.maintenanceDate.split('T')[0] : ''),
      expectedCompletionDate: rec.expectedCompletionDate ? rec.expectedCompletionDate.split('T')[0] : '',
      completionDate: rec.completionDate ? rec.completionDate.split('T')[0] : '',
      repairCenter: rec.repairCenter || rec.mechanicName || 'Fleet Central Maintenance Bay',
      description: rec.description || '',
      cost: rec.cost || 0,
      status: rec.status || 'In Progress',
      priority: rec.priority || 'Medium',
      replacedParts: rec.replacedParts ? rec.replacedParts.join(', ') : '',
      mechanicName: rec.mechanicName || '',
      resolutionNotes: rec.resolutionNotes || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleConvertReportToMaintenance = (rep) => {
    setFormData({
      ...initialMaintenanceForm,
      vehicle: rep.vehicle?._id || rep.vehicle,
      problem: rep.description,
      description: `Staff Reported Issue: ${rep.description}`,
      priority: rep.severity || 'Medium',
      status: 'In Progress',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleQuickStatusComplete = async (rec) => {
    try {
      await maintenanceAPI.update(rec._id, {
        status: 'Completed',
        completionDate: new Date().toISOString(),
      });
      fetchMaintenanceData();
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle) {
      setFormError('Please select a vehicle');
      return;
    }
    setSubmitting(true);
    try {
      const partsArray = formData.replacedParts
        ? formData.replacedParts.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      await maintenanceAPI.create({
        ...formData,
        description: formData.description || formData.problem,
        replacedParts: partsArray,
      });
      setIsAddModalOpen(false);
      fetchMaintenanceData();
      fetchVehicles();
      fetchProblemReports();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const partsArray = formData.replacedParts
        ? formData.replacedParts.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      await maintenanceAPI.update(selectedRecord._id, {
        ...formData,
        description: formData.description || formData.problem,
        replacedParts: partsArray,
      });
      setIsEditModalOpen(false);
      fetchMaintenanceData();
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this maintenance record?')) {
      try {
        await maintenanceAPI.delete(id);
        fetchMaintenanceData();
        fetchVehicles();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const totalCost = records.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Hammer size={28} color="#3b82f6" />
            Maintenance & Repairs Management
          </h1>
          <div className="page-subtitle">
            Manage work orders, corrective repairs, problem reports, workshop centers, and costs
          </div>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          Create Maintenance Record
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Hammer size={15} />
          Maintenance Work Orders ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <ShieldAlert size={15} />
          Staff Problem Reports ({problemReports.length})
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          {/* Toolbar */}
          <div className="toolbar">
            <form onSubmit={handleSearchSubmit} className="search-box">
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Search description, vehicle #, mechanic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Status:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 12px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Priority:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 12px' }}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  fontSize: '13px',
                  color: '#c4b5fd',
                  fontWeight: 600,
                }}
              >
                Total Maintenance Cost: ${totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Problem & Description</th>
                  <th>Repair Center</th>
                  <th>Timeline</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Replaced Parts</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      Loading maintenance records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      No maintenance records found.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec._id}>
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                          {rec.vehicle?.vehicleNumber || 'Unassigned'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{rec.vehicle?.model}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.problem || rec.description}</div>
                        {rec.resolutionNotes && (
                          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                            Notes: {rec.resolutionNotes}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#f1f5f9' }}>
                          {rec.repairCenter || rec.mechanicName || 'Fleet Bay'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Start: {rec.startDate ? new Date(rec.startDate).toLocaleDateString() : (rec.maintenanceDate ? new Date(rec.maintenanceDate).toLocaleDateString() : 'N/A')}
                        </div>
                        {rec.completionDate ? (
                          <div style={{ fontSize: '11px', color: '#10b981' }}>
                            Done: {new Date(rec.completionDate).toLocaleDateString()}
                          </div>
                        ) : rec.expectedCompletionDate ? (
                          <div style={{ fontSize: '11px', color: '#f59e0b' }}>
                            Est: {new Date(rec.expectedCompletionDate).toLocaleDateString()}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <Badge status={rec.priority} />
                      </td>
                      <td>
                        <Badge status={rec.status} />
                      </td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>
                        ${rec.cost?.toLocaleString()}
                      </td>
                      <td>
                        {rec.replacedParts && rec.replacedParts.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {rec.replacedParts.map((p, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '11px',
                                  background: 'rgba(255,255,255,0.06)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>None</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {rec.status !== 'Completed' && (
                            <button
                              className="btn btn-success btn-sm"
                              title="Mark Completed & Restore Vehicle to Active"
                              onClick={() => handleQuickStatusComplete(rec)}
                            >
                              <CheckCircle2 size={13} />
                              Complete
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Edit Record"
                            onClick={() => handleOpenEdit(rec)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            title="Delete Record"
                            onClick={() => handleDelete(rec._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* STAFF PROBLEM REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <ShieldAlert size={18} color="#ef4444" />
                Problem Reports from Fleet Staff
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Review issues filed by Fleet Staff and quickly convert them into maintenance work orders
              </div>
            </div>
          </div>

          {problemReports.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reported Date</th>
                    <th>Vehicle</th>
                    <th>Staff Member</th>
                    <th>Severity</th>
                    <th>Issue Description</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {problemReports.map((rep) => (
                    <tr key={rep._id}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(rep.reportedAt).toLocaleDateString()}
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {new Date(rep.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                          {rep.vehicle?.vehicleNumber || 'Unassigned'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {rep.vehicle?.model} &bull; <Badge status={rep.vehicle?.currentStatus} />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {rep.reportedBy?.name || rep.staffName || 'Fleet Staff'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {rep.reportedBy?.email}
                        </div>
                      </td>
                      <td>
                        <Badge status={rep.severity} />
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontSize: '13px', color: '#f1f5f9' }}>{rep.description}</div>
                      </td>
                      <td>
                        <Badge status={rep.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConvertReportToMaintenance(rep)}
                        >
                          <Hammer size={13} />
                          Log Work Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No problem reports found from staff.</div>
          )}
        </div>
      )}

      {/* CREATE MAINTENANCE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Maintenance Record"
        size="lg"
      >
        {formError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {formError}
          </div>
        )}
        <form onSubmit={handleAddSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Vehicle *</label>
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="form-select"
                required
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} — {v.manufacturer} {v.model} ({v.currentStatus})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Maintenance Classification *</label>
              <select
                name="maintenanceType"
                value={formData.maintenanceType}
                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                className="form-select"
              >
                <option value="Corrective">Corrective Repair</option>
                <option value="Preventive">Preventive Maintenance</option>
                <option value="Emergency">Emergency Breakdown</option>
                <option value="Inspection">Safety / State Inspection</option>
                <option value="Recall Repair">Manufacturer Recall</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem / Symptom *</label>
            <input
              type="text"
              name="problem"
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="e.g. Brake pedal spongy, transmission slip, check engine light..."
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Notes / Work Description</label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of repairs required..."
              className="form-input"
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Service / Repair Center</label>
              <input
                type="text"
                name="repairCenter"
                value={formData.repairCenter}
                onChange={(e) => setFormData({ ...formData, repairCenter: e.target.value })}
                placeholder="e.g. Fleet Central Workshop Bay 3"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cost ($)</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                min="0"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maintenance Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="In Progress">In Progress (Grounds Vehicle)</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending Slot</option>
                <option value="Completed">Completed (Restores Vehicle Active)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Completion Date</label>
              <input
                type="date"
                name="expectedCompletionDate"
                value={formData.expectedCompletionDate}
                onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Completion Date</label>
              <input
                type="date"
                name="completionDate"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="form-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Replaced Parts (comma separated)</label>
              <input
                type="text"
                name="replacedParts"
                value={formData.replacedParts}
                onChange={(e) => setFormData({ ...formData, replacedParts: e.target.value })}
                placeholder="e.g. Brake Pads, Caliper Pin, Brake Fluid"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Create Maintenance Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MAINTENANCE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Maintenance Record"
        size="lg"
      >
        {formError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {formError}
          </div>
        )}
        <form onSubmit={handleEditSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Vehicle</label>
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="form-select"
                required
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} — {v.manufacturer} {v.model} ({v.currentStatus})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Maintenance Classification</label>
              <select
                name="maintenanceType"
                value={formData.maintenanceType}
                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                className="form-select"
              >
                <option value="Corrective">Corrective Repair</option>
                <option value="Preventive">Preventive Maintenance</option>
                <option value="Emergency">Emergency Breakdown</option>
                <option value="Inspection">Safety / State Inspection</option>
                <option value="Recall Repair">Manufacturer Recall</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem / Symptom *</label>
            <input
              type="text"
              name="problem"
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Notes / Work Description</label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Service / Repair Center</label>
              <input
                type="text"
                name="repairCenter"
                value={formData.repairCenter}
                onChange={(e) => setFormData({ ...formData, repairCenter: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cost ($)</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                min="0"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maintenance Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="In Progress">In Progress (Grounds Vehicle)</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending Slot</option>
                <option value="Completed">Completed (Restores Vehicle to Active)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Completion Date</label>
              <input
                type="date"
                name="expectedCompletionDate"
                value={formData.expectedCompletionDate}
                onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Completion Date</label>
              <input
                type="date"
                name="completionDate"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="form-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Replaced Parts (comma separated)</label>
              <input
                type="text"
                name="replacedParts"
                value={formData.replacedParts}
                onChange={(e) => setFormData({ ...formData, replacedParts: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Resolution Notes / Action Taken</label>
            <input
              type="text"
              name="resolutionNotes"
              value={formData.resolutionNotes}
              onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
              placeholder="e.g. Master cylinder bled, new ceramic pads installed, road test passed"
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
