import React from 'react';

const Badge = ({ type = 'neutral', status, label, className = '' }) => {
  const text = label || status || 'Unknown';
  let badgeClass = 'badge-neutral';

  const s = String(status || label).toLowerCase();

  if (['active', 'good', 'completed', 'renewed', 'low', 'resolved'].includes(s)) {
    badgeClass = 'badge-success';
  } else if (['in progress', 'needs service', 'expiring soon', 'medium', 'in service', 'reported'].includes(s)) {
    badgeClass = 'badge-warning';
  } else if (['under maintenance', 'expired', 'high', 'critical', 'overdue', 'cancelled', 'in maintenance'].includes(s)) {
    badgeClass = 'badge-danger';
  } else if (['scheduled', 'inspection', 'preventive', 'under review'].includes(s)) {
    badgeClass = 'badge-info';
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      <span className="badge-dot" />
      {text}
    </span>
  );
};

export default Badge;
