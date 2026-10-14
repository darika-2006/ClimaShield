/**
 * ClimaShield TN - Dynamic Session Audit Logger
 * Tracks actual user actions in sessionStorage under 'climashield_recent_activity'
 */

const STORAGE_KEY = 'climashield_recent_activity';

export function logRecentActivity(type, label) {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    let list = stored ? JSON.parse(stored) : [];

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type, // 'VIEW_DISTRICT' | 'SHELTER_SEARCH' | 'SIMULATION' | 'TIME_MACHINE' | 'AUTH'
      label,
      time: new Date().toISOString(),
    };

    // Filter out immediate duplicates with the exact same label
    list = [newEntry, ...list.filter((item) => item.label !== label)].slice(0, 10);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('session_activity_updated'));
  } catch (e) {
    console.warn('Failed to log recent activity to sessionStorage:', e);
  }
}

export function getRecentActivity() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

export function formatRelativeTime(isoString, lang = 'en') {
  if (!isoString) return lang === 'ta' ? 'சற்று முன்' : 'Just now';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 15) return lang === 'ta' ? 'சற்று முன்' : 'Just now';
  if (diffSec < 60) return lang === 'ta' ? `${diffSec} விநாடிகளுக்கு முன்` : `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return lang === 'ta' ? `${diffMin} நிமிடங்களுக்கு முன்` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return lang === 'ta' ? `${diffHr} மணிநேரங்களுக்கு முன்` : `${diffHr}h ago`;
}
