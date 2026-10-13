import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '../stitches.config';
import { Button } from '../components/Button';
import { FileText, MapPin, AlertTriangle, CheckCircle, Crosshair, Send, Upload, X, Eye, ShieldCheck, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Container = styled('div', {
  minHeight: 'calc(100vh - 72px)',
  width: '100%',
  backgroundColor: '$lightBg',
  padding: '$8 $6',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  '@mobile': { padding: '$4' },
});

const Card = styled('div', {
  maxWidth: '780px',
  width: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '$lg',
  border: '1px solid #b8e6d5',
  boxShadow: '0 8px 32px rgba(42,157,143,0.08)',
  padding: '$8',
  boxSizing: 'border-box',
  '@mobile': { padding: '$5' },
});

const Header = styled('div', {
  marginBottom: '$6',
  paddingBottom: '$4',
  borderBottom: '2px solid $seafoam',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '@mobile': { flexDirection: 'column', alignItems: 'flex-start', gap: '$3' },
});

const Title = styled('h1', {
  fontFamily: '$heading',
  fontSize: '$2xl',
  fontWeight: '$bold',
  color: '$azure',
  margin: '0 0 $2 0',
  display: 'flex',
  alignItems: 'center',
  gap: '$3',
});

const Subtitle = styled('p', {
  fontSize: '$sm',
  color: '$fogGray',
  margin: 0,
});

const Form = styled('form', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$5',
});

const FormGroup = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
  position: 'relative',
});

const Label = styled('label', {
  fontSize: '$sm',
  fontWeight: '$semibold',
  color: '$slateText',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const Select = styled('select', {
  width: '100%',
  padding: '$3 $4',
  borderRadius: '$md',
  border: '1px solid #a8dadc',
  fontSize: '$md',
  backgroundColor: '#f8fffe',
  color: '$slateText',
  fontFamily: '$body',
  boxSizing: 'border-box',
  '&:focus': {
    outline: 'none',
    borderColor: '$tealAccent',
  },
});

const Input = styled('input', {
  width: '100%',
  padding: '$3 $4',
  borderRadius: '$md',
  border: '1px solid #a8dadc',
  fontSize: '$md',
  backgroundColor: '#f8fffe',
  color: '$slateText',
  fontFamily: '$body',
  boxSizing: 'border-box',
  '&:focus': {
    outline: 'none',
    borderColor: '$tealAccent',
  },
});

const Textarea = styled('textarea', {
  width: '100%',
  padding: '$3 $4',
  borderRadius: '$md',
  border: '1px solid #a8dadc',
  fontSize: '$md',
  backgroundColor: '#f8fffe',
  color: '$slateText',
  fontFamily: '$body',
  minHeight: '100px',
  resize: 'vertical',
  boxSizing: 'border-box',
  '&:focus': {
    outline: 'none',
    borderColor: '$tealAccent',
  },
});

const GPSBox = styled('div', {
  display: 'flex',
  gap: '$3',
  alignItems: 'center',
  '@mobile': { flexDirection: 'column', alignItems: 'stretch' },
});

const GPSButton = styled('button', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  padding: '$3 $4',
  borderRadius: '$md',
  border: '1px solid #2A9D8F',
  backgroundColor: 'rgba(42, 157, 143, 0.08)',
  color: '#2A9D8F',
  fontWeight: '$bold',
  fontSize: '$sm',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#2A9D8F',
    color: '#ffffff',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

const SubmitBtn = styled(Button, {
  height: '48px',
  fontSize: '$md',
  fontWeight: '$bold',
  borderRadius: '$md',
  marginTop: '$2',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)',
});

const SuggestionsDropdown = styled('div', {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: '#ffffff',
  border: '1px solid #b8e6d5',
  borderRadius: '$md',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  maxHeight: '220px',
  overflowY: 'auto',
  marginTop: '4px',
});

const SuggestionItem = styled('div', {
  padding: '$3 $4',
  cursor: 'pointer',
  fontSize: '$sm',
  color: '$slateText',
  borderBottom: '1px solid #f0f7f4',
  '&:hover': {
    backgroundColor: '#e8f4f8',
    color: '$tealAccent',
    fontWeight: '$semibold',
  },
});

export default function ReportIncidentPage() {
  const navigate = useNavigate();
  const { isOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState('SUBMIT'); // 'SUBMIT' | 'REVIEW'

  // Location Autocomplete State
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('Kovilpatti, Thoothukudi');
  const [useCustomLandmark, setUseCustomLandmark] = useState(false);
  const [customLandmark, setCustomLandmark] = useState('');
  const debounceRef = useRef(null);

  // Form Fields
  const [hazardType, setHazardType] = useState('Severe Urban Inundation / Waterlogging');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('9.1724');
  const [lon, setLon] = useState('77.8690');
  const [photoDataUrl, setPhotoDataUrl] = useState('');

  // Status State
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Reviewer Moderation Queue State
  const [pendingReports, setPendingReports] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // OpenStreetMap Nominatim Bounded Search
  const searchLocations = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=76.22,13.55,80.35,8.08&bounded=1&limit=6&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((item) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          placeName: item.display_name.split(',')[0] + ', ' + (item.display_name.split(',')[1] || ''),
        }));
        setSuggestions(formatted);
      }
    } catch (err) {
      console.warn('Nominatim search exception:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleSelectSuggestion = (item) => {
    setSelectedPlaceName(item.placeName);
    setLocationQuery(item.placeName);
    setLat(item.lat.toFixed(4));
    setLon(item.lon.toFixed(4));
    setSuggestions([]);
  };

  // Image Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result); // Base64 Data URI
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFetchGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        setLat(userLat.toFixed(4));
        setLon(userLon.toFixed(4));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const place = addr.village || addr.town || addr.city || addr.suburb || 'Detected GPS Location';
            setSelectedPlaceName(place);
            setLocationQuery(place);
          }
        } catch (e) {
          console.warn('Reverse geocode fallback:', e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('GPS location fetch error:', err);
        setIsLocating(false);
        alert('Unable to access GPS location.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalPlace = useCustomLandmark && customLandmark.trim()
      ? customLandmark.trim()
      : (selectedPlaceName || locationQuery || 'Tamil Nadu Location');

    try {
      const token = localStorage.getItem('climashield_jwt_token');
      const response = await fetch('http://localhost:5000/api/v1/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          district: finalPlace,
          place_name: finalPlace,
          hazard_type: hazardType,
          description,
          image_url: photoDataUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
          reported_lat: parseFloat(lat),
          reported_lon: parseFloat(lon),
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setSubmittedData(json.data);
        } else {
          alert('Submission failed: ' + (json.error || 'Unknown error'));
        }
      } else {
        alert('Server returned status ' + response.status);
      }
    } catch (err) {
      console.error('Failed to submit incident:', err);
      alert('Network error submitting incident report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reviewer Moderation Queue Fetch
  const fetchPendingReports = async () => {
    setLoadingPending(true);
    const token = localStorage.getItem('climashield_jwt_token');
    try {
      const res = await fetch('http://localhost:5000/api/v1/incidents/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPendingReports(data.data || []);
      }
    } catch (err) {
      console.error('Pending reports fetch error:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REVIEW') {
      fetchPendingReports();
    }
  }, [activeTab]);

  const handleVerifyReport = async (id, status) => {
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
        fetchPendingReports();
      }
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  return (
    <Container>
      <Card>
        <Header>
          <div>
            <Title>
              <FileText size={28} color="#2A9D8F" />
              Citizen Emergency Incident Report
            </Title>
            <Subtitle>
              Submit real-time disaster, inundation, or infrastructure hazard reports with location autocomplete and photo proofs.
            </Subtitle>
          </div>

          {isOfficer && (
            <div style={{ display: 'flex', gap: '8px', background: '#e8f4f8', padding: '4px', borderRadius: '20px', border: '1px solid #a8dadc' }}>
              <button
                onClick={() => setActiveTab('SUBMIT')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === 'SUBMIT' ? '#2a9d8f' : 'transparent',
                  color: activeTab === 'SUBMIT' ? '#ffffff' : '#2c3e50',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Submit Form
              </button>
              <button
                onClick={() => setActiveTab('REVIEW')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === 'REVIEW' ? '#2a9d8f' : 'transparent',
                  color: activeTab === 'REVIEW' ? '#ffffff' : '#2c3e50',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={14} /> Reviewer Desk
              </button>
            </div>
          )}
        </Header>

        {activeTab === 'REVIEW' ? (
          <div>
            <h3 style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#2a9d8f" /> Pending Field Incident Verification Desk
            </h3>

            {loadingPending ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#6b8e9f' }}>Loading review queue...</div>
            ) : pendingReports.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#e6f4f1', borderRadius: '12px', color: '#2a9d8f', fontWeight: '600', fontSize: '14px' }}>
                All clear! No unverified citizen hazard reports pending review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingReports.map((report) => (
                  <div key={report.id} style={{ background: '#f8fffe', border: '1px solid #b8e6d5', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#2a9d8f', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                          {report.hazard_type}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#2c3e50' }}>{report.district}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#6b8e9f' }}>GPS: {parseFloat(report.lat || 0).toFixed(4)}°, {parseFloat(report.lon || 0).toFixed(4)}°</span>
                    </div>

                    <p style={{ fontSize: '13px', color: '#2c3e50', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                      {report.description}
                    </p>

                    {report.image_url && (
                      <div style={{ marginBottom: '12px' }}>
                        <img src={report.image_url} alt="Proof" style={{ maxHeight: '160px', borderRadius: '8px', border: '1px solid #b8e6d5', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #e8f4f8', paddingTop: '10px' }}>
                      <button
                        onClick={() => handleVerifyReport(report.id, 'REJECTED')}
                        style={{ background: '#fff0f0', border: '1px solid #f08080', color: '#e76f51', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Reject Report
                      </button>
                      <button
                        onClick={() => handleVerifyReport(report.id, 'VERIFIED_ACTIVE')}
                        style={{ background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)', border: 'none', color: '#ffffff', padding: '6px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Approve & Broadcast
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : submittedData ? (
          <div style={{ background: '#e6f4f1', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={48} color="#2a9d8f" />
            <h3 style={{ margin: 0, color: '#2a9d8f', fontSize: '20px', fontWeight: 800 }}>
              Incident Report Transmitted Successfully
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50' }}>
              Report Reference ID: <b>#{submittedData.id}</b> • Location: <b>{submittedData.district}</b>
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b8e9f' }}>
              Your report has been recorded in the PostGIS database and forwarded to TNSDMA teams for ground verification.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button onClick={() => navigate('/')}>View on Live GIS Map</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmittedData(null);
                  setDescription('');
                  setPhotoDataUrl('');
                }}
              >
                Submit Another Report
              </Button>
            </div>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {/* Task 2A: Location Autocomplete Input */}
            <FormGroup>
              <Label>
                <MapPin size={18} color="#2A9D8F" /> Location Search (OpenStreetMap Nominatim Autocomplete)
              </Label>
              <div style={{ position: 'relative' }}>
                <Input
                  type="text"
                  placeholder="Type area, city or village name (e.g., Kovilpatti, Kovilambakkam, Tenkasi)..."
                  value={locationQuery}
                  onChange={handleQueryChange}
                  required={!useCustomLandmark}
                />
                <Search size={16} color="#6b8e9f" style={{ position: 'absolute', right: '14px', top: '14px' }} />

                {isSearchingLocation && (
                  <div style={{ position: 'absolute', right: '40px', top: '12px', fontSize: '11px', color: '#2a9d8f' }}>
                    Searching...
                  </div>
                )}

                {suggestions.length > 0 && (
                  <SuggestionsDropdown>
                    {suggestions.map((item, idx) => (
                      <SuggestionItem key={idx} onClick={() => handleSelectSuggestion(item)}>
                        <strong>{item.placeName}</strong>
                        <div style={{ fontSize: '11px', color: '#6b8e9f', marginTop: '2px' }}>{item.displayName}</div>
                      </SuggestionItem>
                    ))}
                  </SuggestionsDropdown>
                )}
              </div>

              {/* Custom Landmark Toggle */}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="customToggle"
                  checked={useCustomLandmark}
                  onChange={(e) => setUseCustomLandmark(e.target.checked)}
                />
                <label htmlFor="customToggle" style={{ fontSize: '13px', color: '#2c3e50', cursor: 'pointer', fontWeight: '500' }}>
                  Specify Custom Landmark / Other Area
                </label>
              </div>

              {useCustomLandmark && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    type="text"
                    placeholder="Enter custom landmark or specific area name..."
                    value={customLandmark}
                    onChange={(e) => setCustomLandmark(e.target.value)}
                    required
                  />
                </div>
              )}
            </FormGroup>

            {/* Incident Category */}
            <FormGroup>
              <Label>
                <AlertTriangle size={18} color="#2A9D8F" /> Hazard / Incident Category
              </Label>
              <Select value={hazardType} onChange={(e) => setHazardType(e.target.value)}>
                <option value="Severe Urban Inundation / Waterlogging">Severe Urban Inundation / Waterlogging</option>
                <option value="Impassable Roadway / Bridge Submerged">Impassable Roadway / Bridge Submerged</option>
                <option value="Fallen Electric Pole / Wire Hazard">Fallen Electric Pole / Wire Hazard</option>
                <option value="Extreme Heatwave / Heatstroke Risk">Extreme Heatwave / Heatstroke Risk</option>
                <option value="Other Emergency / Structural Hazard">Other Emergency / Structural Hazard</option>
              </Select>
            </FormGroup>

            {/* GPS Coordinates & Fetch Button */}
            <FormGroup>
              <Label>
                <Crosshair size={18} color="#2A9D8F" /> Geolocation Coordinates (GPS)
              </Label>
              <GPSBox>
                <GPSButton type="button" onClick={handleFetchGPSLocation} disabled={isLocating}>
                  <Crosshair size={16} />
                  {isLocating ? 'Acquiring GPS Signal...' : 'Fetch Current Location (GPS)'}
                </GPSButton>
              </GPSBox>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>Latitude</span>
                  <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>Longitude</span>
                  <Input type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} required />
                </div>
              </div>
            </FormGroup>

            {/* Task 2B: Photo Upload & Preview */}
            <FormGroup>
              <Label>
                <Upload size={18} color="#2A9D8F" /> Upload Incident Photo Proof
              </Label>
              <div style={{ background: '#f8fffe', border: '1px dashed #a8dadc', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  id="photoInput"
                />
                <label
                  htmlFor="photoInput"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#e8f4f8',
                    border: '1px solid #a8dadc',
                    color: '#2a9d8f',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={16} /> Select Photo or Camera Capture (&lt; 5MB)
                </label>

                {photoDataUrl && (
                  <div style={{ marginTop: '14px', position: 'relative', display: 'inline-block' }}>
                    <img src={photoDataUrl} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #b8e6d5' }} />
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl('')}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#e76f51',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </FormGroup>

            {/* Description */}
            <FormGroup>
              <Label>
                <FileText size={18} color="#2A9D8F" /> Field Observations & Emergency Notes
              </Label>
              <Textarea
                placeholder="Provide specific details regarding inundation depth, road blockage, structural damage, or emergency assistance required..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </FormGroup>

            <SubmitBtn type="submit" disabled={isSubmitting}>
              <Send size={18} />
              {isSubmitting ? 'TRANSMITTING REPORT TO EMERGENCY DATABASE...' : 'SUBMIT INCIDENT REPORT'}
            </SubmitBtn>
          </Form>
        )}
      </Card>
    </Container>
  );
}
