import React, { useState, useEffect } from 'react';
import { Zap, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { dashboardAPI } from '../../services/api';

const CacheBanner = () => {
  const [lastEvent, setLastEvent] = useState(null);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState('');

  useEffect(() => {
    const handleCacheEvent = (e) => {
      setLastEvent(e.detail);
      setFlushMessage('');
    };

    window.addEventListener('fleet:cache_event', handleCacheEvent);
    return () => window.removeEventListener('fleet:cache_event', handleCacheEvent);
  }, []);

  const handleFlush = async () => {
    setIsFlushing(true);
    try {
      await dashboardAPI.flushCache();
      setFlushMessage('Redis Cache Flushed! Next request will be live DB fetch.');
      setTimeout(() => setFlushMessage(''), 4000);
    } catch (err) {
      setFlushMessage('Failed to flush cache');
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 24px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '12.5px',
        color: '#94a3b8',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#f8fafc' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          Redis Layer:
        </span>

        {lastEvent ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              background: lastEvent.status === 'HIT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
              color: lastEvent.status === 'HIT' ? '#34d399' : '#22d3ee',
              border: `1px solid ${lastEvent.status === 'HIT' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
            }}
          >
            {lastEvent.status === 'HIT' ? <Zap size={12} /> : <Database size={12} />}
            {lastEvent.status === 'HIT' ? 'CACHE HIT (Redis In-Memory)' : 'CACHE MISS (MongoDB Query)'}
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#cbd5e1' }}>{lastEvent.key || lastEvent.url}</span>
            <span style={{ color: '#64748b' }}>({lastEvent.time})</span>
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>Ready • Queries cached automatically</span>
        )}

        {flushMessage && (
          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
            <CheckCircle2 size={13} /> {flushMessage}
          </span>
        )}
      </div>

      <button
        onClick={handleFlush}
        disabled={isFlushing}
        className="btn btn-secondary btn-sm"
        style={{ fontSize: '11.5px', padding: '4px 10px', height: '26px' }}
        title="Flushes Redis cache keys to test Cache Miss -> Cache Hit behavior"
      >
        <RefreshCw size={12} className={isFlushing ? 'spin' : ''} />
        {isFlushing ? 'Flushing...' : 'Flush Redis Cache'}
      </button>
    </div>
  );
};

export default CacheBanner;
