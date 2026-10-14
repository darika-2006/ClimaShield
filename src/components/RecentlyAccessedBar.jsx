import React, { useEffect, useState } from 'react';
import { History, Activity, Radio, MapPin, Eye, Waves, ShieldCheck } from 'lucide-react';
import { getRecentActivity, formatRelativeTime } from '../utils/auditLogger';
import { useLanguage } from '../context/LanguageContext';

export default function RecentlyAccessedBar() {
  const { t, tDistrict, language } = useLanguage();
  const [history, setHistory] = useState([]);
  const [serverAudit, setServerAudit] = useState([]);
  const [, setTick] = useState(0);

  // Timer tick every 15s to update relative times ("Just now", "2m ago")
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateHistory = () => {
      const sessionItems = getRecentActivity();
      setHistory(sessionItems);
    };

    updateHistory();
    window.addEventListener('session_activity_updated', updateHistory);
    window.addEventListener('storage', updateHistory);

    // Also attempt to fetch from backend audit endpoint
    async function fetchServerAudit() {
      try {
        const res = await fetch('http://localhost:5000/api/v1/audit/recent');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setServerAudit(json.data);
          }
        }
      } catch (e) {
        // Fall back gracefully to sessionStorage
      }
    }
    fetchServerAudit();

    return () => {
      window.removeEventListener('session_activity_updated', updateHistory);
      window.removeEventListener('storage', updateHistory);
    };
  }, []);

  // Merge session items with server audit items if available, avoiding duplicate labels
  const combinedActivities = [...history];
  for (const s of serverAudit) {
    if (!combinedActivities.some((c) => c.label === s.label)) {
      combinedActivities.push(s);
    }
  }

  const getActionIcon = (type) => {
    switch (type) {
      case 'VIEW_DISTRICT':
        return <Eye size={12} color="#0284c7" />;
      case 'SHELTER_SEARCH':
        return <ShieldCheck size={12} color="#10b981" />;
      case 'SIMULATION':
        return <Waves size={12} color="#f59e0b" />;
      case 'BROADCAST_ALERT':
        return <Radio size={12} color="#ef4444" />;
      default:
        return <MapPin size={12} color="#457b9d" />;
    }
  };

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
        <History size={14} color="#2a9d8f" /> {t('sessionAudit')}
      </div>

      {combinedActivities.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b8e9f',
            fontStyle: 'italic',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          <Activity size={13} color="#00bfa6" />
          <span>{t('liveSessionAuditActive')}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {combinedActivities.map((item, index) => (
            <div
              key={item.id || index}
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
              {getActionIcon(item.type)}
              <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '12px' }}>
                {language === 'ta' ? tDistrict(item.label) : item.label}
              </span>
              <span style={{ color: '#00bfa6', fontWeight: '700', fontSize: '11px' }}>
                ({formatRelativeTime(item.time, language)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
