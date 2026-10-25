import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, iconColor = '#3b82f6', iconBg = 'rgba(59, 130, 246, 0.12)', onClick }) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
