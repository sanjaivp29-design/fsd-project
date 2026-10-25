import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Fuel,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { vehicleAPI } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const initialVehicleForm = {
  vehicleNumber: '',
  vehicleType: 'Van',
  model: '',
  manufacturer: '',
  registrationDate: new Date().toISOString().split('T')[0],
  purchaseDate: new Date().toISOString().split('T')[0],
  currentStatus: 'Active',
  mileage: 0,
  vehicleHealthStatus: 'Good',
  fuelType: 'Diesel',
  assignedDriver: '',
  department: 'Logistics',
  notes: '',
};

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState(initialVehicleForm);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleAPI.getAll({
        search: search || undefined,
        status: statusFilter,
        type: typeFilter,
      });
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleAddOpen = () => {
    setFormData(initialVehicleForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleEditOpen = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      model: vehicle.model,
      manufacturer: vehicle.manufacturer,
      registrationDate: vehicle.registrationDate ? vehicle.registrationDate.split('T')[0] : '',
      purchaseDate: vehicle.purchaseDate ? vehicle.purchaseDate.split('T')[0] : '',
      currentStatus: vehicle.currentStatus,
      mileage: vehicle.mileage,
      vehicleHealthStatus: vehicle.vehicleHealthStatus,
      fuelType: vehicle.fuelType,
      assignedDriver: vehicle.assignedDriver,
      department: vehicle.department,
      notes: vehicle.notes || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleDetailOpen = async (vehicle) => {
    try {
      const res = await vehicleAPI.getById(vehicle._id);
      setSelectedVehicle(res.data.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOpen = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vehicleAPI.create(formData);
      setIsAddModalOpen(false);
      fetchVehicles();
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
      await vehicleAPI.update(selectedVehicle._id, formData);
      setIsEditModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      await vehicleAPI.delete(selectedVehicle._id);
      setIsDeleteModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={28} color="#3b82f6" />
            Vehicle Fleet Management
          </h1>
          <div className="page-subtitle">
            Manage your fleet inventory, track mileage, monitor health condition, and assign drivers
          </div>
        </div>

        <button onClick={handleAddOpen} className="btn btn-primary">
          <Plus size={16} />
          Register New Vehicle
        </button>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search by vehicle #, model, driver..."
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
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="In Service">In Service</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Type:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Pickup">Pickup</option>
              <option value="Bus">Bus</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Data Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle Number</th>
              <th>Type & Model</th>
              <th>Manufacturer</th>
              <th>Current Status</th>
              <th>Health Status</th>
              <th>Mileage</th>
              <th>Assigned Driver</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  Loading vehicle fleet...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  No vehicles found matching current criteria.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v._id}>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {v.vehicleNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.model}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{v.vehicleType} • {v.fuelType}</div>
                  </td>
                  <td>{v.manufacturer}</td>
                  <td>
                    <Badge status={v.currentStatus} />
                  </td>
                  <td>
                    <Badge status={v.vehicleHealthStatus} />
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {v.mileage.toLocaleString()} mi
                  </td>
                  <td>
                    <div>{v.assignedDriver || 'Unassigned'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{v.department}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-icon"
                        title="View Full History"
                        onClick={() => handleDetailOpen(v)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn btn-secondary btn-icon"
                        title="Edit Vehicle"
                        onClick={() => handleEditOpen(v)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn btn-danger btn-icon"
                        title="Delete Vehicle"
                        onClick={() => handleDeleteOpen(v)}
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

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register New Fleet Vehicle' : `Edit Vehicle (${formData.vehicleNumber})`}
        size="lg"
      >
        {formError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {formError}
          </div>
        )}
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Vehicle Registration Number *</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleFormChange}
                placeholder="e.g. FLT-201"
                className="form-input"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type *</label>
              <select name="vehicleType" value={formData.vehicleType} onChange={handleFormChange} className="form-select">
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Pickup">Pickup</option>
                <option value="Bus">Bus</option>
                <option value="SUV">SUV</option>
                <option value="Car">Car</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Model Name *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleFormChange}
                placeholder="e.g. Transit 350 High Roof"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Manufacturer *</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleFormChange}
                placeholder="e.g. Ford, Mercedes, Freightliner"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select name="fuelType" value={formData.fuelType} onChange={handleFormChange} className="form-select">
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Current Status</label>
              <select name="currentStatus" value={formData.currentStatus} onChange={handleFormChange} className="form-select">
                <option value="Active">Active</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="In Service">In Service</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Health Status</label>
              <select name="vehicleHealthStatus" value={formData.vehicleHealthStatus} onChange={handleFormChange} className="form-select">
                <option value="Good">Good</option>
                <option value="Needs Service">Needs Service</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Mileage (miles) *</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleFormChange}
                min="0"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleFormChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Date</label>
              <input
                type="date"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleFormChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Assigned Driver</label>
              <input
                type="text"
                name="assignedDriver"
                value={formData.assignedDriver}
                onChange={handleFormChange}
                placeholder="Driver full name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department / Depot</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                placeholder="e.g. Express Delivery"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Notes / Operational Details</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Route details, special equipment, warranty notes..."
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isAddModalOpen ? 'Register Vehicle' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detailed Vehicle History Drawer / Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Vehicle Profile & History: ${selectedVehicle.vehicleNumber}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Summary Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: '#fff' }}>{selectedVehicle.manufacturer} {selectedVehicle.model}</h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                    Type: <span style={{ color: '#fff' }}>{selectedVehicle.vehicleType}</span> • Fuel: <span style={{ color: '#fff' }}>{selectedVehicle.fuelType}</span> • Driver: <span style={{ color: '#fff' }}>{selectedVehicle.assignedDriver}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge status={selectedVehicle.currentStatus} />
                  <Badge status={selectedVehicle.vehicleHealthStatus} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>ODOMETER</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{selectedVehicle.mileage?.toLocaleString()} mi</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>TOTAL EXPENSES</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#34d399' }}>${selectedVehicle.totalOperationalCost?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>PURCHASE DATE</div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{selectedVehicle.purchaseDate ? new Date(selectedVehicle.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>DEPARTMENT</div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{selectedVehicle.department}</div>
                </div>
              </div>
            </div>

            {/* Service Records for this vehicle */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#93c5fd' }}>
                Service & Maintenance History ({selectedVehicle.services?.length || 0} records)
              </h4>
              <div className="table-container" style={{ maxHeight: '180px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Date</th>
                      <th>Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVehicle.services && selectedVehicle.services.length > 0 ? (
                      selectedVehicle.services.map((s) => (
                        <tr key={s._id}>
                          <td>{s.serviceType}</td>
                          <td>{new Date(s.scheduledDate).toLocaleDateString()}</td>
                          <td>${s.cost || 0}</td>
                          <td><Badge status={s.status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No service records yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance Work Orders */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#f59e0b' }}>
                Maintenance Work Orders ({selectedVehicle.maintenances?.length || 0})
              </h4>
              <div className="table-container" style={{ maxHeight: '180px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVehicle.maintenances && selectedVehicle.maintenances.length > 0 ? (
                      selectedVehicle.maintenances.map((m) => (
                        <tr key={m._id}>
                          <td>{m.description}</td>
                          <td>{m.maintenanceType}</td>
                          <td>${m.cost || 0}</td>
                          <td><Badge status={m.status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No maintenance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Vehicle Removal"
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '17px', color: '#fff', marginBottom: '8px' }}>
              Remove Vehicle {selectedVehicle.vehicleNumber}?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
              This will permanently delete vehicle <strong>{selectedVehicle.manufacturer} {selectedVehicle.model}</strong> along with all associated service records, maintenance logs, and insurance documents.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VehiclesPage;
