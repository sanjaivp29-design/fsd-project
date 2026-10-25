import React, { useState } from 'react';
import { Truck, Lock, Mail, User, ArrowRight, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, register, loading, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('manager'); // 'manager' | 'staff'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager',
  });
  const [formError, setFormError] = useState('');

  const handleRoleTabChange = (role) => {
    setSelectedRoleTab(role);
    setFormData((prev) => ({
      ...prev,
      role: role,
    }));
    setFormError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (isRegister && !formData.name)) {
      setFormError('Please enter all required fields.');
      return;
    }

    if (isRegister) {
      const res = await register(formData);
      if (!res.success) setFormError(res.message);
    } else {
      // Login with typed email and password
      const res = await login(formData.email, formData.password);
      if (!res.success) setFormError(res.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(37, 99, 235, 0.18), transparent 70%), #090d16',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.15)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)',
              marginBottom: '16px',
            }}
          >
            <Truck size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Fleet<span style={{ color: '#38bdf8' }}>Flow</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px' }}>
            Intelligent Fleet & Maintenance Management System
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '5px',
            borderRadius: '12px',
            marginBottom: '22px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => handleRoleTabChange('manager')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: selectedRoleTab === 'manager' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedRoleTab === 'manager' ? '#2563eb' : 'transparent',
              color: selectedRoleTab === 'manager' ? '#ffffff' : '#94a3b8',
              boxShadow: selectedRoleTab === 'manager' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            }}
          >
            <Shield size={16} />
            <span>Fleet Manager</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('staff')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: selectedRoleTab === 'staff' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedRoleTab === 'staff' ? '#0284c7' : 'transparent',
              color: selectedRoleTab === 'staff' ? '#ffffff' : '#94a3b8',
              boxShadow: selectedRoleTab === 'staff' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
            }}
          >
            <UserCheck size={16} />
            <span>Fleet Staff</span>
          </button>
        </div>

        {/* Role Portal Context Description */}
        <div
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.03)',
            borderLeft: selectedRoleTab === 'manager' ? '3px solid #3b82f6' : '3px solid #0284c7',
            padding: '8px 12px',
            borderRadius: '4px',
            marginBottom: '20px',
            lineHeight: 1.45,
          }}
        >
          {selectedRoleTab === 'manager' ? (
            <>
              <strong style={{ color: '#60a5fa' }}>Fleet Manager (Admin):</strong> Full access to fleet dashboard, vehicle CRUD, preventive services, insurance alerts, cost analytics, and staff problem reports.
            </>
          ) : (
            <>
              <strong style={{ color: '#38bdf8' }}>Fleet Staff:</strong> Dedicated staff portal to view your assigned vehicle, check real-time vehicle status, review service/maintenance schedules, and report issues.
            </>
          )}
        </div>

        {(formError || error) && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            {formError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={selectedRoleTab === 'manager' ? 'e.g. Sarah Connor' : 'e.g. Carlos Mendez'}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={selectedRoleTab === 'manager' ? 'manager@fleetflow.io' : 'staff@fleetflow.io'}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Assign Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="manager">Fleet Manager (Admin)</option>
                <option value="staff">Fleet Staff</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '12px',
              height: '46px',
              fontSize: '14px',
              fontWeight: 600,
              background: selectedRoleTab === 'manager'
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            }}
            disabled={loading}
          >
            {loading ? (
              'Authenticating...'
            ) : isRegister ? (
              'Create Account'
            ) : selectedRoleTab === 'manager' ? (
              'Sign In as Fleet Manager'
            ) : (
              'Sign In as Fleet Staff'
            )}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#94a3b8' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setFormError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
