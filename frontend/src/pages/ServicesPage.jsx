import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { serviceAPI, vehicleAPI } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const initialServiceForm = {
  vehicle: '',
  serviceType: 'Routine Oil & Filter',
  scheduledDate: new Date().toISOString().split('T')[0],
  status: 'Scheduled',
  cost: 0,
  nextServiceDate: '',
  serviceProvider: 'Fleet Care Bay',
  technicianNotes: '',
  odometerAtService: 0,
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState(initialServiceForm);
  const [completeData, setCompleteData] = useState({
    odometerAtService: '',
    completedDate: new Date().toISOString().split('T')[0],
    technicianNotes: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await serviceAPI.getAll({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: search || undefined,
      });
      setServices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesList = async () => {
    try {
      const res = await vehicleAPI.getAll();
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [statusFilter]);

  useEffect(() => {
    fetchVehiclesList();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialServiceForm,
      vehicle: vehicles[0]?._id || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenComplete = (service) => {
    setSelectedService(service);
    setCompleteData({
      odometerAtService: service.vehicle?.mileage || '',
      completedDate: new Date().toISOString().split('T')[0],
      technicianNotes: service.technicianNotes || 'Service completed successfully.',
    });
    setIsCompleteModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle) {
      setFormError('Please select a vehicle');
      return;
    }
    setSubmitting(true);
    try {
      await serviceAPI.create(formData);
      setIsAddModalOpen(false);
      fetchServices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await serviceAPI.update(selectedService._id, {
        status: 'Completed',
        completedDate: completeData.completedDate,
        odometerAtService: Number(completeData.odometerAtService),
        technicianNotes: completeData.technicianNotes,
      });
      setIsCompleteModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this service log entry?')) {
      try {
        await serviceAPI.delete(id);
        fetchServices();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const totalCost = services.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Wrench size={28} color="#3b82f6" />
            Fleet Service Management
          </h1>
          <div className="page-subtitle">
            Preventive service scheduling, history tracking, and odometer service intervals
          </div>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          Schedule Service
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search service, vehicle #, provider..."
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
              <option value="All">All Schedules</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '13px',
              color: '#93c5fd',
              fontWeight: 600,
            }}
          >
            Total Service Investment: ${totalCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Service Type</th>
              <th>Scheduled Date</th>
              <th>Status</th>
              <th>Service Cost</th>
              <th>Service Center / Provider</th>
              <th>Odometer</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  Loading service records...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  No service records found matching criteria.
                </td>
              </tr>
            ) : (
              services.map((srv) => (
                <tr key={srv._id}>
                  <td>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {srv.vehicle?.vehicleNumber || 'Unassigned'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{srv.vehicle?.model}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{srv.serviceType}</div>
                    {srv.technicianNotes && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {srv.technicianNotes}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} color="#64748b" />
                      {new Date(srv.scheduledDate).toLocaleDateString()}
                    </div>
                    {srv.completedDate && (
                      <div style={{ fontSize: '11px', color: '#10b981' }}>
                        Done: {new Date(srv.completedDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge status={srv.status} />
                  </td>
                  <td style={{ fontWeight: 600, color: '#34d399' }}>
                    ${srv.cost?.toLocaleString() || 0}
                  </td>
                  <td>{srv.serviceProvider}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {srv.odometerAtService ? `${srv.odometerAtService.toLocaleString()} mi` : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {srv.status !== 'Completed' && (
                        <button
                          className="btn btn-success btn-sm"
                          title="Mark Service Completed"
                          onClick={() => handleOpenComplete(srv)}
                        >
                          <CheckCircle2 size={14} />
                          Complete
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-icon"
                        title="Delete Log"
                        onClick={() => handleDelete(srv._id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Service Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Preventive Vehicle Service"
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
              <label className="form-label">Select Vehicle *</label>
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
              <label className="form-label">Service Type *</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="form-select"
              >
                <option value="Routine Oil & Filter">Routine Oil & Filter</option>
                <option value="Brake System Service">Brake System Service</option>
                <option value="Tire Rotation & Balance">Tire Rotation & Balance</option>
                <option value="Full Periodic Inspection">Full Periodic Inspection</option>
                <option value="Transmission Overhaul">Transmission Overhaul</option>
                <option value="Engine Tune-Up">Engine Tune-Up</option>
                <option value="Battery & Electrical Check">Battery & Electrical Check</option>
                <option value="Coolant & Fluid Flush">Coolant & Fluid Flush</option>
                <option value="Suspension & Alignment">Suspension & Alignment</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Scheduled Date *</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated / Actual Cost ($)</label>
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
              <label className="form-label">Initial Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Service Provider / Workshop</label>
              <input
                type="text"
                name="serviceProvider"
                value={formData.serviceProvider}
                onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                placeholder="e.g. Official Dealer Service Bay"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Next Service Date (Interval)</label>
              <input
                type="date"
                name="nextServiceDate"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technician Notes / Instructions</label>
            <textarea
              name="technicianNotes"
              value={formData.technicianNotes}
              onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
              placeholder="Scope of work, synthetic oil specs, parts needed..."
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Completed Modal */}
      {selectedService && (
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title={`Complete Service: ${selectedService.serviceType}`}
        >
          <form onSubmit={handleCompleteSubmit}>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '16px' }}>
              Marking this service completed will restore <strong>{selectedService.vehicle?.vehicleNumber}</strong> to <strong>Active</strong> status and set vehicle health to <strong>Good</strong>.
            </p>

            <div className="form-group">
              <label className="form-label">Completion Date *</label>
              <input
                type="date"
                value={completeData.completedDate}
                onChange={(e) => setCompleteData({ ...completeData, completedDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Odometer Reading at Completion (miles)</label>
              <input
                type="number"
                value={completeData.odometerAtService}
                onChange={(e) => setCompleteData({ ...completeData, odometerAtService: e.target.value })}
                className="form-input"
                placeholder="e.g. 45000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Technician Resolution Notes</label>
              <textarea
                value={completeData.technicianNotes}
                onChange={(e) => setCompleteData({ ...completeData, technicianNotes: e.target.value })}
                className="form-textarea"
                placeholder="Filter changed, lubricants topped up..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success" disabled={submitting}>
                {submitting ? 'Updating...' : 'Confirm Service Completion'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ServicesPage;
