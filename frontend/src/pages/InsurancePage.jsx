import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Phone,
  DollarSign,
  Edit2,
  Trash2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { insuranceAPI, vehicleAPI } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const initialInsuranceForm = {
  vehicle: '',
  provider: '',
  policyNumber: '',
  coverageType: 'Comprehensive Fleet',
  premiumAmount: 1200,
  startDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  contactNumber: '',
  notes: '',
};

const InsurancePage = () => {
  const [policies, setPolicies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewalFilter, setRenewalFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [formData, setFormData] = useState(initialInsuranceForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInsuranceData = async () => {
    try {
      setLoading(true);
      const [polRes, alertRes] = await Promise.all([
        insuranceAPI.getAll({
          renewalStatus: renewalFilter !== 'All' ? renewalFilter : undefined,
          search: search || undefined,
        }),
        insuranceAPI.getAlerts(),
      ]);
      setPolicies(polRes.data.data || []);
      setAlerts(alertRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await vehicleAPI.getAll();
      setVehicles(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInsuranceData();
  }, [renewalFilter]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInsuranceData();
  };

  const handleOpenAdd = () => {
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    setFormData({
      ...initialInsuranceForm,
      vehicle: vehicles[0]?._id || '',
      expiryDate: oneYearLater.toISOString().split('T')[0],
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setSelectedPolicy(policy);
    setFormData({
      vehicle: policy.vehicle?._id || policy.vehicle,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      coverageType: policy.coverageType,
      premiumAmount: policy.premiumAmount,
      startDate: policy.startDate ? policy.startDate.split('T')[0] : '',
      expiryDate: policy.expiryDate ? policy.expiryDate.split('T')[0] : '',
      contactNumber: policy.contactNumber || '',
      notes: policy.notes || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle) {
      setFormError('Please select a vehicle');
      return;
    }
    setSubmitting(true);
    try {
      await insuranceAPI.create(formData);
      setIsAddModalOpen(false);
      fetchInsuranceData();
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
      await insuranceAPI.update(selectedPolicy._id, formData);
      setIsEditModalOpen(false);
      fetchInsuranceData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this insurance policy?')) {
      try {
        await insuranceAPI.delete(id);
        fetchInsuranceData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck size={28} color="#3b82f6" />
            Fleet Insurance Management
          </h1>
          <div className="page-subtitle">
            Policy tracking, renewal status monitoring, premium expenses, and automatic expiry alerts
          </div>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          Add Insurance Policy
        </button>
      </div>

      {/* Critical Expiry Alerts Banner if any policies expiring soon or expired */}
      {alerts.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fecaca', fontSize: '14px' }}>
                Action Required: {alerts.length} Policy Expiry Alert(s) Detected
              </div>
              <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                Vehicles with expired or policies expiring in &le;30 days must be renewed to maintain legal road compliance.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {alerts.slice(0, 3).map((a) => (
              <span key={a._id} className="badge badge-danger">
                {a.vehicle?.vehicleNumber}: {a.renewalStatus}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search provider, policy #, vehicle..."
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
              value={renewalFilter}
              onChange={(e) => setRenewalFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Renewed">Renewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Provider & Policy Number</th>
              <th>Coverage Plan</th>
              <th>Premium Amount</th>
              <th>Valid Period</th>
              <th>Renewal Status</th>
              <th>Support Contact</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  Loading insurance policies...
                </td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  No insurance records found.
                </td>
              </tr>
            ) : (
              policies.map((pol) => {
                const isUrgent = pol.renewalStatus === 'Expired' || pol.renewalStatus === 'Expiring Soon';
                return (
                  <tr key={pol._id} style={{ background: isUrgent ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                        {pol.vehicle?.vehicleNumber || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{pol.vehicle?.model}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{pol.provider}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                        {pol.policyNumber}
                      </div>
                    </td>
                    <td>{pol.coverageType}</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>
                      ${pol.premiumAmount?.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {new Date(pol.startDate).toLocaleDateString()} &rarr;{' '}
                        <strong style={{ color: isUrgent ? '#f87171' : '#f8fafc' }}>
                          {new Date(pol.expiryDate).toLocaleDateString()}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <Badge status={pol.renewalStatus} />
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        {pol.contactNumber || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Policy"
                          onClick={() => handleOpenEdit(pol)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Delete Policy"
                          onClick={() => handleDelete(pol._id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Policy Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register Vehicle Insurance Policy' : `Edit Policy: ${formData.policyNumber}`}
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
              <label className="form-label">Insured Vehicle *</label>
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="form-select"
                required
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} — {v.manufacturer} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Insurance Provider / Carrier *</label>
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g. Allianz Commercial, Liberty Mutual"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Policy Number *</label>
              <input
                type="text"
                name="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                placeholder="e.g. POL-88910"
                className="form-input"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Coverage Type</label>
              <select
                name="coverageType"
                value={formData.coverageType}
                onChange={(e) => setFormData({ ...formData, coverageType: e.target.value })}
                className="form-select"
              >
                <option value="Comprehensive Fleet">Comprehensive Fleet</option>
                <option value="Third-Party Liability">Third-Party Liability</option>
                <option value="Collision & Loss">Collision & Loss</option>
                <option value="Full Bumper-to-Bumper">Full Bumper-to-Bumper</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Annual Premium ($) *</label>
              <input
                type="number"
                name="premiumAmount"
                value={formData.premiumAmount}
                onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                min="0"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Policy Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Policy Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Claim / Agent Phone</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+1 (800) 555-0199"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Policy Notes & Special Riders</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Roadside assistance, deductible amounts, broker contact..."
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
              {submitting ? 'Saving...' : isAddModalOpen ? 'Save Policy' : 'Update Policy'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InsurancePage;
