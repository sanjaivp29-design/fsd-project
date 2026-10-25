import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  TrendingUp,
  PieChart,
  Truck,
  CreditCard,
  FileText,
  Calendar,
  Trash2,
} from 'lucide-react';
import { expenseAPI, vehicleAPI } from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import StatCard from '../components/common/StatCard';

const initialExpenseForm = {
  vehicle: '',
  category: 'Fuel',
  amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
  description: '',
  referenceId: '',
  paidTo: '',
  paymentMethod: 'Company Card',
};

const CostManagementPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialExpenseForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const [expRes, sumRes] = await Promise.all([
        expenseAPI.getAll({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          search: search || undefined,
        }),
        expenseAPI.getSummary(),
      ]);
      setExpenses(expRes.data.data || []);
      setSummary(sumRes.data.data || null);
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
    fetchExpenseData();
  }, [categoryFilter]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpenseData();
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialExpenseForm,
      vehicle: vehicles[0]?._id || '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }
    setSubmitting(true);
    try {
      await expenseAPI.create({
        ...formData,
        amount: Number(formData.amount),
        vehicle: formData.vehicle || null,
      });
      setIsAddModalOpen(false);
      fetchExpenseData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense record?')) {
      try {
        await expenseAPI.delete(id);
        fetchExpenseData();
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
            <DollarSign size={28} color="#3b82f6" />
            Fleet Cost & Expense Management
          </h1>
          <div className="page-subtitle">
            Track service, maintenance, fuel, insurance and operational expenditures across the fleet
          </div>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          Log Fleet Expense
        </button>
      </div>

      {/* Top Cost Breakdown Metrics */}
      <div className="grid-4">
        <StatCard
          title="Total Fleet Expenditure"
          value={`$${(summary?.totalOperationalCost || 0).toLocaleString()}`}
          subtext="Cumulative Expenses"
          icon={DollarSign}
          iconColor="#34d399"
          iconBg="rgba(16, 185, 129, 0.12)"
        />
        <StatCard
          title="Service Expenses"
          value={`$${(summary?.categoryBreakdown?.find((c) => c._id === 'Service')?.totalAmount || 0).toLocaleString()}`}
          subtext="Scheduled Bay Maintenance"
          icon={TrendingUp}
          iconColor="#38bdf8"
          iconBg="rgba(56, 189, 248, 0.12)"
        />
        <StatCard
          title="Repairs & Overhauls"
          value={`$${(summary?.categoryBreakdown?.find((c) => c._id === 'Maintenance')?.totalAmount || 0).toLocaleString()}`}
          subtext="Corrective Work Orders"
          icon={CreditCard}
          iconColor="#8b5cf6"
          iconBg="rgba(139, 92, 246, 0.12)"
        />
        <StatCard
          title="Fuel & Operational"
          value={`$${(summary?.categoryBreakdown?.find((c) => c._id === 'Fuel')?.totalAmount || 0).toLocaleString()}`}
          subtext="Bulk Diesel / Electric Fill"
          icon={PieChart}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.12)"
        />
      </div>

      {/* Vehicle-wise Cost Ranking & Category Distribution */}
      <div className="grid-2">
        {/* Category Breakdown Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <PieChart size={18} color="#38bdf8" />
              Expenses by Operational Category
            </h2>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
                  <th>Total Spent</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                  summary.categoryBreakdown.map((cat) => {
                    const percent = summary.totalOperationalCost
                      ? ((cat.totalAmount / summary.totalOperationalCost) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={cat._id}>
                        <td style={{ fontWeight: 600 }}>{cat._id}</td>
                        <td>{cat.count} txns</td>
                        <td style={{ fontWeight: 700, color: '#34d399' }}>
                          ${cat.totalAmount.toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${percent}%`, height: '100%', background: '#3b82f6' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{percent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No category transactions recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle-wise Spend Ranking */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Truck size={18} color="#10b981" />
              Top Spending Vehicles
            </h2>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Model / Type</th>
                  <th>Recorded Txns</th>
                  <th>Total Invested</th>
                </tr>
              </thead>
              <tbody>
                {summary?.vehicleBreakdown && summary.vehicleBreakdown.length > 0 ? (
                  summary.vehicleBreakdown.map((vb) => (
                    <tr key={vb._id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                        {vb.vehicleNumber}
                      </td>
                      <td>
                        <div>{vb.model}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{vb.vehicleType}</div>
                      </td>
                      <td>{vb.count} entries</td>
                      <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                        ${vb.totalSpent?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No vehicle-attributed expenses yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search description, reference #, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Category:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Service">Service</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Insurance">Insurance</option>
              <option value="Fuel">Fuel</option>
              <option value="Tolls & Permits">Tolls & Permits</option>
              <option value="Cleaning & Detailing">Cleaning & Detailing</option>
              <option value="Other Operational">Other Operational</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Category</th>
              <th>Description / Purpose</th>
              <th>Amount ($)</th>
              <th>Vendor / Payee</th>
              <th>Payment Method</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  Loading expense transactions...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  No expense records match criteria.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp._id}>
                  <td>
                    <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    {exp.vehicle ? (
                      <div>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                          {exp.vehicle.vehicleNumber}
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{exp.vehicle.model}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>General Fleet Overhead</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{exp.category}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.description}</div>
                    {exp.referenceId && (
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                        Ref: {exp.referenceId}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: '#34d399', fontSize: '14.5px' }}>
                    ${exp.amount?.toLocaleString()}
                  </td>
                  <td>{exp.paidTo}</td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{exp.paymentMethod}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-danger btn-icon"
                      title="Delete Expense"
                      onClick={() => handleDelete(exp._id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Operational Fleet Expense"
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
              <label className="form-label">Associated Vehicle (Optional)</label>
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="form-select"
              >
                <option value="">General Fleet Overhead (No single vehicle)</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} — {v.manufacturer} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                <option value="Fuel">Fuel (Diesel / Gas / Charge)</option>
                <option value="Service">Scheduled Service Bay</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Insurance">Insurance Policy Premium</option>
                <option value="Tolls & Permits">Highway Tolls & Permits</option>
                <option value="Cleaning & Detailing">Sanitization & Wash</option>
                <option value="Tires & Accessories">Tires & Equipment</option>
                <option value="Other Operational">Other Operational Cost</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Expense Amount ($) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expense Date *</label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="form-select"
              >
                <option value="Company Card">Company Card</option>
                <option value="Fuel Card">Fuel Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Petty Cash">Petty Cash</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Vendor / Station / Payee</label>
              <input
                type="text"
                name="paidTo"
                value={formData.paidTo}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                placeholder="e.g. Shell Express, Turnpike E-Pass"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Receipt / Invoice Ref #</label>
              <input
                type="text"
                name="referenceId"
                value={formData.referenceId}
                onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                placeholder="e.g. INV-90218"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expense Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of cost..."
              className="form-textarea"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CostManagementPage;
