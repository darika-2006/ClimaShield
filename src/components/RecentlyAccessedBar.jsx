import React, { useEffect, useState } from 'react';
import { History, MapPin } from 'lucide-react';

export default function RecentlyAccessedBar() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('climashield_audit_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        setHistory([]);
      }
    } else {
      const initial = [
        { label: 'Thoothukudi Shelter Search', timestamp: '10:42 AM', type: 'SHELTER_LOOKUP' },
        { label: 'Chennai Rain Forecast', timestamp: '10:30 AM', type: 'WEATHER_QUERY' },
        { label: 'Madurai Heat Analysis', timestamp: '10:15 AM', type: 'SIMULATION' },
      ];
      setHistory(initial);
      localStorage.setItem('climashield_audit_history', JSON.stringify(initial));
    }
  }, []);

  if (history.length === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #e6f4f1 0%, #f0f7f4 100%)',
        borderBottom: '1px solid #b8e6d5',
        padding: '8px 24px',
        color: '#2c3e50',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#2a9d8f',
          fontWeight: '700',
          whiteSpace: 'nowrap',
          fontSize: '11px',
          letterSpacing: '0.04em',
        }}
      >
        <History size={14} color="#2a9d8f" /> AUDIT RECENT:
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              background: '#ffffff',
              border: '1px solid #b8e6d5',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(42, 157, 143, 0.06)',
            }}
          >
            <MapPin size={12} color="#457b9d" />
            <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '12px' }}>{item.label}</span>
            <span style={{ color: '#6b8e9f', fontSize: '11px' }}>({item.timestamp})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
