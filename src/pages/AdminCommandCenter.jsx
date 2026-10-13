import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, CheckCircle, XCircle, AlertOctagon, Radio, Users, Building, Home, Edit3, Send, Eye, RefreshCw } from 'lucide-react';

export default function AdminCommandCenter() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [metrics, setMetrics] = useState(null);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Broadcast state
  const [broadcastDistrict, setBroadcastDistrict] = useState('Statewide');
  const [broadcastSeverity, setBroadcastSeverity] = useState('CRITICAL');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // Shelter Edit Modal state
  const [editingShelter, setEditingShelter] = useState(null);
  const [editOccupancy, setEditOccupancy] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('climashield_jwt_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Metrics
      const mRes = await fetch('http://localhost:5000/api/v1/admin/metrics', { headers });
      const mData = await mRes.json();
      if (mData.success) setMetrics(mData.data);

      // 2. Pending Incidents
      const pRes = await fetch('http://localhost:5000/api/v1/incidents/pending', { headers });
      const pData = await pRes.json();
      if (pData.success) setPendingIncidents(pData.data);

      // 3. Shelters
      const sRes = await fetch('http://localhost:5000/api/v1/shelters');
      const sData = await sRes.json();
      if (sData.success) setShelters(sData.data);
    } catch (err) {
      console.error('Error fetching admin command metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVerifyIncident = async (id, status) => {
    const token = localStorage.getItem('climashield_jwt_token');
    try {
      const res = await fetch(`http://localhost:5000/api/v1/incidents/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Incident verification failed:', err);
    }
  };

  const handleUpdateShelter = async (e) => {
    e.preventDefault();
    if (!editingShelter) return;
    const token = localStorage.getItem('climashield_jwt_token');
    try {
      const res = await fetch(`http://localhost:5000/api/v1/admin/shelters/${editingShelter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_occupancy: parseInt(editOccupancy),
          capacity: parseInt(editCapacity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingShelter(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Shelter update failed:', err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setBroadcastStatus('');
    const token = localStorage.getItem('climashield_jwt_token');
    try {
      const res = await fetch('http://localhost:5000/api/v1/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_district: broadcastDistrict,
          severity: broadcastSeverity,
          message: broadcastMsg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastStatus(`Advisory successfully dispatched to ${broadcastDistrict}`);
        setBroadcastMsg('');
      } else {
        setBroadcastStatus('Broadcast error: ' + data.error);
      }
    } catch (err) {
      setBroadcastStatus('Broadcast error: network exception');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(180deg, #e6f4f1 0%, #f0f7f4 100%)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #457b9d, #2a9d8f)', color: '#ffffff', borderRadius: '16px', padding: '24px 28px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.2)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#d4f1f4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Statewide Disaster Operations Command Center
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>
              Incident Verification & Resource Control Desk
            </h1>
            <div style={{ marginTop: '6px', fontSize: '13px', color: '#e8f4f8' }}>
              Officer Persona: <strong>{user?.full_name}</strong> | Role: <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.3)' }}>{user?.role}</span>
            </div>
          </div>

          <button
            onClick={fetchDashboardData}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', padding: '10px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Refresh Telemetry
          </button>
        </div>

        {/* Telemetry Metrics Bar */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #a8dadc', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 16px rgba(42, 157, 143, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b8e9f', fontSize: '12px', fontWeight: '700' }}>
                <Users size={18} color="#457b9d" /> Registered Accounts
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#457b9d', marginTop: '8px' }}>{metrics.totalUsers}</div>
            </div>

            <div style={{ background: '#fffdf0', border: '1px solid #ffd97d', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 16px rgba(244, 162, 97, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4a261', fontSize: '12px', fontWeight: '700' }}>
                <AlertOctagon size={18} color="#f4a261" /> Pending Incidents
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#f4a261', marginTop: '8px' }}>{metrics.pendingIncidents}</div>
            </div>

            <div style={{ background: '#e6f4f1', border: '1px solid #b8e6d5', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 16px rgba(42, 157, 143, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2a9d8f', fontSize: '12px', fontWeight: '700' }}>
                <Building size={18} color="#2a9d8f" /> Active Shelters
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#2a9d8f', marginTop: '8px' }}>{metrics.totalShelters}</div>
            </div>

            <div style={{ background: '#f0fbfd', border: '1px solid #a8dadc', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 16px rgba(0, 191, 166, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00bfa6', fontSize: '12px', fontWeight: '700' }}>
                <Home size={18} color="#00bfa6" /> Bed Capacity (Beds)
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#00bfa6', marginTop: '8px' }}>
                {metrics.totalCapacity - metrics.totalOccupancy} <span style={{ fontSize: '14px', color: '#6b8e9f', fontWeight: '500' }}>avail / {metrics.totalCapacity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Command Desk Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '28px' }}>
          {/* Left Column: Ground-Truth Incident Verification Desk */}
          <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <ShieldAlert size={20} color="#f4a261" /> Ground-Truth Incident Moderation Queue
            </h2>

            {pendingIncidents.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#e6f4f1', borderRadius: '12px', border: '1px solid #b8e6d5', color: '#2a9d8f', fontSize: '14px', fontWeight: '600' }}>
                All clear! No unverified citizen hazard reports pending review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingIncidents.map((incident) => (
                  <div key={incident.id} style={{ background: '#e8f4f8', border: '1px solid #a8dadc', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#457b9d', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                          {incident.incident_type}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#2c3e50' }}>{incident.district_name}</span>
                        <span style={{ fontSize: '12px', color: '#6b8e9f' }}>By {incident.reporter_name || 'Citizen'}</span>
                      </div>

                      {incident.image_url && (
                        <button
                          onClick={() => setPreviewImage(incident.image_url)}
                          style={{ background: '#ffffff', border: '1px solid #a8dadc', color: '#2a9d8f', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} /> View Proof
                        </button>
                      )}
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#2c3e50', lineHeight: '1.5' }}>
                      {incident.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #a8dadc', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#6b8e9f' }}>
                        Coordinates: {parseFloat(incident.reported_lat || 0).toFixed(4)}°, {parseFloat(incident.reported_lon || 0).toFixed(4)}°
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleVerifyIncident(incident.id, 'REJECTED')}
                          style={{ background: '#fff0f0', border: '1px solid #f08080', color: '#e76f51', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          onClick={() => handleVerifyIncident(incident.id, 'VERIFIED_ACTIVE')}
                          style={{ background: 'linear-gradient(135deg, #2a9d8f, #00bfa6)', border: 'none', color: '#ffffff', padding: '6px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(42, 157, 143, 0.25)' }}
                        >
                          <CheckCircle size={14} /> Verify & Broadcast
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Shelter Capacity Override & Emergency Broadcast Dispatcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Broadcast Advisory Dispatcher */}
            <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Radio size={20} color="#e76f51" /> Emergency Advisory Dispatcher
              </h2>

              {broadcastStatus && (
                <div style={{ background: '#e6f4f1', border: '1px solid #b8e6d5', color: '#2a9d8f', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: '600' }}>
                  {broadcastStatus}
                </div>
              )}

              <form onSubmit={handleSendBroadcast}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    Target District / Jurisdiction
                  </label>
                  <select
                    value={broadcastDistrict}
                    onChange={(e) => setBroadcastDistrict(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '13px', background: '#f8fffe', color: '#2c3e50' }}
                  >
                    <option value="Statewide">All Districts (Statewide)</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Thoothukudi">Thoothukudi</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Tiruchirappalli">Tiruchirappalli</option>
                    <option value="Cuddalore">Cuddalore</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    Advisory Severity Level
                  </label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '13px', background: '#f8fffe', color: '#2c3e50' }}
                  >
                    <option value="CRITICAL">RED ALERT (CRITICAL EMERGENCY)</option>
                    <option value="HIGH">ORANGE WARNING (HIGH RISK)</option>
                    <option value="ADVISORY">YELLOW ADVISORY (CAUTION)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    Advisory Directive Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter official evacuation instructions or extreme weather directives..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #a8dadc', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #e76f51, #f4a261)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(231, 111, 81, 0.3)' }}
                >
                  <Send size={16} /> Dispatch Official Broadcast Alert
                </button>
              </form>
            </div>

            {/* Shelter Capacity Control Matrix */}
            <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Building size={20} color="#2a9d8f" /> Shelter Capacity Override Matrix
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {shelters.map((shelter) => (
                  <div key={shelter.id} style={{ background: '#f8fffe', border: '1px solid #b8e6d5', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#2c3e50' }}>{shelter.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b8e9f' }}>{shelter.district_name} • Occupancy: <strong>{shelter.current_occupancy} / {shelter.capacity}</strong></div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingShelter(shelter);
                        setEditOccupancy(shelter.current_occupancy);
                        setEditCapacity(shelter.capacity);
                      }}
                      style={{ background: '#e8f4f8', border: '1px solid #a8dadc', color: '#2a9d8f', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Edit Shelter Capacity */}
        {editingShelter && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44, 62, 80, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '400px', border: '1px solid #b8e6d5', boxShadow: '0 16px 40px rgba(42, 157, 143, 0.2)' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2c3e50', fontWeight: '700' }}>Update Shelter Capacity</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b8e9f' }}>{editingShelter.name} ({editingShelter.district_name})</p>

              <form onSubmit={handleUpdateShelter}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>Total Capacity (Beds)</label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #a8dadc', borderRadius: '8px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>Current Occupancy (Persons)</label>
                  <input
                    type="number"
                    value={editOccupancy}
                    onChange={(e) => setEditOccupancy(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #a8dadc', borderRadius: '8px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingShelter(null)} style={{ background: '#e8f4f8', border: '1px solid #a8dadc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#2c3e50', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Image Proof Preview */}
        {previewImage && (
          <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44, 62, 80, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, cursor: 'pointer' }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', maxWidth: '600px', border: '1px solid #b8e6d5' }}>
              <img src={previewImage} alt="Incident Proof Full" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#6b8e9f' }}>Click anywhere to close</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
