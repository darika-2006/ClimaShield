import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, ShieldCheck, AlertTriangle, PhoneCall, Camera, Send, Plus, CheckCircle, Clock } from 'lucide-react';
import { logRecentActivity } from '../utils/auditLogger';

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, tDistrict, language } = useLanguage();

  // Geolocation locking: live GPS auto-lock with profile fallback
  const fallbackLat = user?.home_lat ? parseFloat(user.home_lat) : 9.138;
  const fallbackLon = user?.home_lon ? parseFloat(user.home_lon) : 77.813;
  const userDistrict = user?.home_district || 'Thoothukudi';

  const [coords, setCoords] = useState({
    lat: fallbackLat,
    lon: fallbackLon,
    isLiveGps: false,
  });
  const [resolvedPlaceName, setResolvedPlaceName] = useState(userDistrict);

  const [weather, setWeather] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [verifiedIncidents, setVerifiedIncidents] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hazard Report Form State
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidentType, setIncidentType] = useState('FLOOD');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [imageUrl, setImageUrl] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Immediately invoke navigator.geolocation on mount
  useEffect(() => {
    let active = true;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!active) return;
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCoords({ lat, lon, isLiveGps: true });

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const place = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Local Device Vicinity';
              if (active) setResolvedPlaceName(place);
            }
          } catch (e) {
            console.warn('Reverse geocode fallback:', e);
          }
        },
        (err) => {
          console.warn('Live GPS denied or timed out, falling back to registered home:', err.message);
          if (active) {
            setCoords({ lat: fallbackLat, lon: fallbackLon, isLiveGps: false });
            setResolvedPlaceName(userDistrict);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
    return () => { active = false; };
  }, [fallbackLat, fallbackLon, userDistrict]);

  // 2. Fetch telemetry and PostGIS shelters within 50km radius
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Fetch live Open-Meteo weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=relative_humidity_2m`
        );
        const weatherData = await weatherRes.json();
        setWeather(weatherData.current_weather || null);

        // 2. Fetch PostGIS nearby shelters (radius_km=50)
        const sheltersRes = await fetch(
          `http://localhost:5000/api/v1/shelters/nearby?lat=${coords.lat}&lon=${coords.lon}&radius_km=50`
        );
        const sheltersData = await sheltersRes.json();
        if (sheltersData.success) {
          setShelters(sheltersData.data || []);
          logRecentActivity('SHELTER_SEARCH', `${resolvedPlaceName || userDistrict} Shelter Search`);
        }

        // 3. Fetch verified community reports
        const reportsRes = await fetch('http://localhost:5000/api/v1/incidents/public');
        const reportsData = await reportsRes.json();
        if (reportsData.success) {
          setVerifiedIncidents(reportsData.data || []);
        }

        // 4. Fetch active admin broadcast alerts for district
        const alertDistrict = resolvedPlaceName || userDistrict;
        const alertsRes = await fetch(`http://localhost:5000/api/v1/alerts/active?district=${encodeURIComponent(alertDistrict)}`);
        const alertsData = await alertsRes.json();
        if (alertsData.success) {
          setActiveAlerts(alertsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching citizen dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [coords.lat, coords.lon, resolvedPlaceName, userDistrict]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitStatus('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('climashield_jwt_token');
      const res = await fetch('http://localhost:5000/api/v1/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          district_name: resolvedPlaceName || userDistrict,
          incident_type: incidentType,
          description,
          severity,
          image_url: imageUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
          reported_lat: coords.lat,
          reported_lon: coords.lon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitStatus('SUCCESS');
        setDescription('');
        setImageUrl('');
        setTimeout(() => {
          setShowReportModal(false);
          setSubmitStatus('');
        }, 2000);
      } else {
        setSubmitStatus('ERROR: ' + (data.error || 'Submission failed'));
      }
    } catch (err) {
      setSubmitStatus('ERROR: Network exception');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Risk Verdict Score
  const getRiskVerdict = () => {
    const criticalAlert = activeAlerts.find((a) => a.severity === 'CRITICAL' || a.severity === 'RED');
    const warningAlert = activeAlerts.find((a) => a.severity === 'WARNING' || a.severity === 'ORANGE');

    if (criticalAlert) {
      return {
        score: 25,
        level: t('criticalThreat'),
        color: '#e76f51',
        bg: '#fff0f0',
        desc: `${t('advisoryDispatched')}: ${criticalAlert.message}`,
      };
    }

    if (warningAlert) {
      return {
        score: 55,
        level: t('moderateRisk'),
        color: '#f4a261',
        bg: '#fffdf0',
        desc: `${t('activeBroadcastAdvisory')}: ${warningAlert.message}`,
      };
    }

    if (!weather) return { score: 92, level: t('safeNormal'), color: '#2a9d8f', bg: '#e6f4f1', desc: t('optimalEnv') };
    const temp = weather.temperature;
    const wind = weather.windspeed;

    if (temp > 38 || wind > 50) {
      return { score: 35, level: t('criticalThreat'), color: '#e76f51', bg: '#fff0f0', desc: t('advisoryDispatched') };
    } else if (temp > 34 || wind > 30) {
      return {
        score: 65,
        level: t('moderateRisk'),
        color: '#f4a261',
        bg: '#fffdf0',
        desc: language === 'ta' ? 'அதிகரித்த சுற்றுச்சூழல் வெப்ப அளவு பதிவாகியுள்ளது.' : 'Elevated ambient thermal levels observed.',
      };
    }
    return { score: 95, level: t('safeNormal'), color: '#2a9d8f', bg: '#e6f4f1', desc: t('optimalEnv') };
  };

  const risk = getRiskVerdict();

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(180deg, #e6f4f1 0%, #f0f7f4 100%)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Citizen Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2a9d8f, #457b9d)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(42, 157, 143, 0.2)',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#d4f1f4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {t('welcomeCitizen')}
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>
              {t('welcomePrefix')} {user?.full_name || t('residentCitizen')}
            </h1>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e8f4f8' }}>
              <MapPin size={16} color="#d4f1f4" />
              <span>
                {coords.isLiveGps
                  ? `${t('liveGpsLocked')}: ${resolvedPlaceName ? tDistrict(resolvedPlaceName) : (language === 'ta' ? 'உள்ளூர் இருப்பிடம்' : 'Local Device Vicinity')} (${coords.lat.toFixed(4)}° N, ${coords.lon.toFixed(4)}° E)`
                  : `${t('profileLocation')}: ${resolvedPlaceName ? tDistrict(resolvedPlaceName) : tDistrict(userDistrict)} ${t('districtSuffix')} (${coords.lat.toFixed(4)}° N, ${coords.lon.toFixed(4)}° E)`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/timeline')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '24px',
                padding: '12px 20px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <Clock size={16} /> {t('satelliteTimeMachineBtn')}
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              style={{
                background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                padding: '12px 22px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 191, 166, 0.35)',
              }}
            >
              <Plus size={18} /> {t('submitHazardReport')}
            </button>
          </div>
        </div>

        {/* Active Emergency Alert Banner if dispatched by Admin */}
        {activeAlerts.length > 0 && (
          <div
            style={{
              background: '#fff0f0',
              border: '2px solid #e76f51',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '28px',
              boxShadow: '0 8px 24px rgba(231, 111, 81, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e76f51', fontWeight: '800', fontSize: '15px', marginBottom: '8px' }}>
              <AlertTriangle size={22} />
              <span>{t('activeBroadcastAdvisory')} — {tDistrict(userDistrict).toUpperCase()} {t('districtSuffix').toUpperCase()}</span>
            </div>
            {activeAlerts.map((alert) => (
              <div key={alert.id} style={{ fontSize: '13px', color: '#2c3e50', background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f4a261', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: '#e76f51', fontSize: '14px' }}>{alert.title}</strong>
                  <span style={{ fontSize: '11px', color: '#6b8e9f' }}>{language === 'ta' ? 'வெளியிடப்பட்டது:' : 'Dispatched:'} {new Date(alert.created_at).toLocaleTimeString()}</span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{alert.message}</p>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#457b9d', fontWeight: '700' }}>
                  {language === 'ta' ? 'வெளியிட்டவர்:' : 'Issued by:'} {alert.dispatched_by ? tDistrict(alert.dispatched_by) : (language === 'ta' ? 'மாநில பேரிடர் செயல்பாட்டு மையம்' : 'State Operations Desk')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '28px' }}>
          {/* Left Column: Personal Risk & Hotlines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Risk Verdict Card */}
            <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b8e9f', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
                {t('personalRiskVerdict')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '42px', fontWeight: '900', color: risk.color, lineHeight: 1 }}>
                  {risk.score}<span style={{ fontSize: '20px', color: '#6b8e9f' }}>/100</span>
                </div>
                <div style={{ background: risk.bg, border: `1px solid ${risk.color}`, color: risk.color, padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>
                  {risk.level}
                </div>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#2c3e50', lineHeight: '1.5' }}>
                {risk.desc}
              </p>

              {/* Weather Telemetry */}
              {weather && (
                <div style={{ background: '#e8f4f8', border: '1px solid #a8dadc', borderRadius: '12px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#6b8e9f', display: 'block', fontSize: '11px', fontWeight: '600' }}>{t('temperatureLabel')}</span>
                    <strong style={{ color: '#2c3e50', fontSize: '18px', fontWeight: '800' }}>{weather.temperature}°C</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6b8e9f', display: 'block', fontSize: '11px', fontWeight: '600' }}>{t('windSpeedLabel')}</span>
                    <strong style={{ color: '#2c3e50', fontSize: '18px', fontWeight: '800' }}>{weather.windspeed} km/h</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Direct Contact Card */}
            <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <PhoneCall size={18} color="#2a9d8f" /> {t('emergencyHotlines')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="tel:1070" style={{ textDecoration: 'none', background: '#fff0f0', border: '1px solid #f08080', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#e76f51', fontSize: '14px' }}>{t('stateControlRoom')}</div>
                    <div style={{ fontSize: '12px', color: '#6b8e9f' }}>{language === 'ta' ? '24/7 மாநில அவசர உதவி & மீட்புப்பணி' : '24/7 Statewide Emergency & Rescue'}</div>
                  </div>
                  <span style={{ background: 'linear-gradient(135deg, #e76f51, #f08080)', color: '#ffffff', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>1070</span>
                </a>

                <a href="tel:1077" style={{ textDecoration: 'none', background: '#fffdf0', border: '1px solid #ffd97d', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#f4a261', fontSize: '14px' }}>{t('districtReliefCell')} ({tDistrict(userDistrict)})</div>
                    <div style={{ fontSize: '12px', color: '#6b8e9f' }}>{language === 'ta' ? 'உள்ளூர் பாதுகாப்பு மற்றும் நிவாரண உதவி' : 'Local Evacuation & Relief Support'}</div>
                  </div>
                  <span style={{ background: 'linear-gradient(135deg, #f4a261, #ffd97d)', color: '#ffffff', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>1077</span>
                </a>

                <a href="tel:108" style={{ textDecoration: 'none', background: '#f0fbfd', border: '1px solid #a8dadc', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#457b9d', fontSize: '14px' }}>{t('medicalAmbulance')}</div>
                    <div style={{ fontSize: '12px', color: '#6b8e9f' }}>{language === 'ta' ? 'உடனடி மருத்துவ அவசர சிகிச்சை & ஆம்புலன்ஸ்' : 'Immediate Medical Trauma Transport'}</div>
                  </div>
                  <span style={{ background: 'linear-gradient(135deg, #457b9d, #2a9d8f)', color: '#ffffff', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>108</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Nearest Shelters & Verified Incident Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Nearest Designated Safe Shelters */}
            <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                  <ShieldCheck size={20} color="#2a9d8f" /> {t('nearestShelters')}
                </h3>
                <span style={{ fontSize: '11px', color: '#2a9d8f', background: '#e6f4f1', padding: '3px 10px', borderRadius: '12px', fontWeight: '700', border: '1px solid #b8e6d5' }}>
                  {language === 'ta' ? 'PostGIS புவிசார் வரிசைப்படுத்தல்' : 'PostGIS Geodesic Sorted'}
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b8e9f' }}>{t('loadingShelters')}</div>
              ) : shelters.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b8e9f' }}>{t('noSheltersRegistered')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {shelters.map((shelter) => (
                    <div
                      key={shelter.id}
                      style={{
                        background: '#f8fffe',
                        border: '1px solid #b8e6d5',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#2c3e50', marginBottom: '4px' }}>
                          {tDistrict(shelter.name)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b8e9f', marginBottom: '6px' }}>
                          {tDistrict(shelter.address)} ({tDistrict(shelter.district_name)})
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                          <span style={{ color: '#2a9d8f', fontWeight: '700' }}>
                            {language === 'ta' ? `கொள்ளளவு: ${shelter.capacity - shelter.current_occupancy} இடங்கள் உள்ளன / மொத்தம் ${shelter.capacity}` : `Capacity: ${shelter.capacity - shelter.current_occupancy} available / ${shelter.capacity} total`}
                          </span>
                          <span style={{ color: '#457b9d', fontWeight: '700' }}>
                            {language === 'ta' ? `தொலைவு: ${shelter.distance_km} கி.மீ` : `Distance: ${shelter.distance_km} km`}
                          </span>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none',
                          background: 'linear-gradient(135deg, #2a9d8f, #00bfa6)',
                          color: '#ffffff',
                          padding: '10px 16px',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 12px rgba(42, 157, 143, 0.25)',
                        }}
                      >
                        <Navigation size={14} color="#ffffff" /> {t('navigateGoogleMaps')}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Community Hazard Reports Feed */}
            <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <AlertTriangle size={18} color="#f4a261" /> {t('verifiedFieldIncidents')}
              </h3>

              {verifiedIncidents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b8e9f', fontSize: '13px' }}>
                  {t('noActiveWarnings')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {verifiedIncidents.slice(0, 4).map((report) => (
                    <div
                      key={report.id}
                      style={{
                        background: '#fffdf0',
                        border: '1px solid #ffd97d',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'center',
                      }}
                    >
                      {report.image_url && (
                        <img
                          src={report.image_url}
                          alt="Incident proof"
                          style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #ffd97d' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ background: '#f4a261', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                            {report.incident_type}
                          </span>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: '#2c3e50' }}>{tDistrict(report.district_name)}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#2a9d8f', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} color="#2a9d8f" /> {t('verifiedByTnsdma')}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#2c3e50', lineHeight: '1.4' }}>{report.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Crowdsourced Hazard Report Submission */}
        {showReportModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(44, 62, 80, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #b8e6d5', width: '500px', padding: '28px', boxShadow: '0 16px 40px rgba(42, 157, 143, 0.2)' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Camera size={20} color="#2a9d8f" /> {t('submitHazardReport')}
              </h2>

              {submitStatus.startsWith('SUCCESS') && (
                <div style={{ background: '#e6f4f1', border: '1px solid #b8e6d5', color: '#2a9d8f', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <CheckCircle size={16} /> {t('reportSuccessMsg')}
                </div>
              )}

              {submitStatus.startsWith('ERROR') && (
                <div style={{ background: '#fff0f0', border: '1px solid #f08080', color: '#e76f51', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {submitStatus}
                </div>
              )}

              <form onSubmit={handleSubmitReport}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {t('incidentTypeLabel')}
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '14px', background: '#f8fffe', color: '#2c3e50' }}
                  >
                    <option value="FLOOD">{t('catInundation')}</option>
                    <option value="CYCLONE">{t('catImpassable')}</option>
                    <option value="HEATWAVE">{t('catHeatwave')}</option>
                    <option value="LANDSLIDE">{t('catOther')}</option>
                    <option value="INFRASTRUCTURE">{t('catFallenPole')}</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {t('severityLabel')}
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '14px', background: '#f8fffe', color: '#2c3e50' }}
                  >
                    <option value="MODERATE">{t('moderateRisk')}</option>
                    <option value="HIGH">{t('highRisk')}</option>
                    <option value="CRITICAL">{t('criticalThreat')}</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {t('groundObservationLabel')}
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={t('groundObservationPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {t('photoProofLabel')}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    style={{ background: '#e8f4f8', border: '1px solid #a8dadc', color: '#2c3e50', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)', border: 'none', color: '#ffffff', padding: '10px 22px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(42, 157, 143, 0.3)' }}
                  >
                    <Send size={16} /> {submitting ? t('submittingReportModal') : t('submitFieldReportBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
