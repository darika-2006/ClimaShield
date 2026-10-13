import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { styled, keyframes } from '../stitches.config';
import { Button } from '../components/Button';
import { StatCard, StatValue, StatLabel } from '../components/Card';
import { SeverityBadge } from '../components/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CloudRain, Clock, Shield, Navigation, MapPin, AlertTriangle, Layers, ExternalLink, Compass } from 'lucide-react';

const DISTRICT_SPECS = {
  Chennai: { lat: 13.0827, lon: 80.2707, elevation: 6.0, zone: 'Coastal Cyclone Belt' },
  Cuddalore: { lat: 11.7480, lon: 79.7714, elevation: 4.0, zone: 'Severe Coastal Surge' },
  Thoothukudi: { lat: 8.7642, lon: 78.1348, elevation: 3.0, zone: 'Gulf Coast Port Hub' },
  Tiruchirappalli: { lat: 10.7905, lon: 78.7047, elevation: 85.0, zone: 'Cauvery River Inflow' },
  Madurai: { lat: 9.9252, lon: 78.1198, elevation: 101.0, zone: 'Vaigai Basin Floodplain' },
  Coimbatore: { lat: 11.0168, lon: 76.9558, elevation: 411.0, zone: 'Western Ghats Foothills' },
};

const FALLBACK_SHELTERS = {
  Chennai: [
    { name: 'Mylapore Emergency Relief Center', capacity: 1000, lat: 13.0338, lon: 80.2676, contact_phone: '+91-44-24981001', distance_km: 5.6 },
    { name: 'Velachery Community Flood Shelter', capacity: 600, lat: 12.9815, lon: 80.2180, contact_phone: '+91-44-22431102', distance_km: 12.4 },
    { name: 'Tambaram Evacuation Shelter', capacity: 850, lat: 12.9229, lon: 80.1275, contact_phone: '+91-44-22265001', distance_km: 22.1 },
  ],
  Cuddalore: [
    { name: 'Cuddalore Port Coastal Cyclone Center', capacity: 1000, lat: 11.7510, lon: 79.7680, contact_phone: '+91-4142-230100', distance_km: 1.2 },
  ],
  Thoothukudi: [
    { name: 'VOC Port Disaster Relief Center, Thoothukudi', capacity: 900, lat: 8.7580, lon: 78.1420, contact_phone: '+91-461-2352201', distance_km: 1.5 },
  ],
  Madurai: [
    { name: 'Madurai Corporation Central Relief Camp, Tallakulam', capacity: 1200, lat: 9.9320, lon: 78.1360, contact_phone: '+91-452-2531001', distance_km: 2.1 },
    { name: 'Vaigai River Basin High-Ground Relief Hub, Arapalayam', capacity: 950, lat: 9.9380, lon: 78.1060, contact_phone: '+91-452-2532002', distance_km: 3.5 },
  ],
  Coimbatore: [
    { name: 'Coimbatore North Community Relief Campus', capacity: 1100, lat: 11.0250, lon: 76.9600, contact_phone: '+91-422-2300101', distance_km: 1.8 },
  ],
  Tiruchirappalli: [
    { name: 'Cauvery Delta Emergency Assembly Hall, Srirangam', capacity: 1400, lat: 10.8620, lon: 78.6940, contact_phone: '+91-431-2432001', distance_km: 8.2 },
  ],
  Salem: [
    { name: 'Salem Town Relief & Staging Ground', capacity: 800, lat: 11.6600, lon: 78.1500, contact_phone: '+91-427-2211001', distance_km: 1.2 },
  ],
  Tirunelveli: [
    { name: 'Palayamkottai Multi-Purpose Relief Center', capacity: 1000, lat: 8.7180, lon: 77.7400, contact_phone: '+91-462-2572001', distance_km: 1.9 },
  ],
};

const pulse = keyframes({
  '0%, 100%': { boxShadow: '0 0 0 0 rgba(42,157,143,0.4)' },
  '50%': { boxShadow: '0 0 0 14px rgba(42,157,143,0)' },
});

const Container = styled('div', {
  display: 'flex',
  height: 'calc(100vh - 72px)',
  width: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
  '@mobile': { flexDirection: 'column', height: 'auto', overflowY: 'auto' },
});

const ControlPanel = styled('aside', {
  width: '440px',
  background: '$cloudWhite',
  boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
  padding: '$6',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #cbd5e1',
  flexShrink: 0,
  '@mobile': { width: '100%', height: 'auto' },
});

const MapCanvasWrapper = styled('div', {
  flex: 1,
  position: 'relative',
  height: '100%',
  width: '100%',
});

const SectionTitle = styled('h2', {
  fontFamily: '$heading',
  fontSize: '$xl',
  fontWeight: '$bold',
  color: '$azure',
  marginBottom: '$4',
  paddingBottom: '$3',
  borderBottom: '2px solid $seafoam',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const FieldGroup = styled('div', {
  marginBottom: '$4',
});

const Label = styled('label', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  fontSize: '$sm',
  fontWeight: '$semibold',
  color: '$slateText',
  marginBottom: '$2',
});

const Select = styled('select', {
  width: '100%',
  padding: '$3 $4',
  borderRadius: '$md',
  border: '1px solid #cbd5e1',
  fontSize: '$md',
  background: 'white',
  color: '$slateText',
  fontFamily: '$body',
  transition: 'border $fast',
  '&:focus': {
    outline: 'none',
    borderColor: '$tealAccent',
  },
});

const SliderContainer = styled('div', {
  marginTop: '$2',
});

const SliderHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '$2',
});

const SliderTrack = styled('input', {
  width: '100%',
  height: '8px',
  borderRadius: '$full',
  appearance: 'none',
  background: 'linear-gradient(90deg, #B8E6D5, #FFD97D, #F4A261, #E76F51)',
  outline: 'none',
  cursor: 'pointer',
  '&::-webkit-slider-thumb': {
    appearance: 'none',
    width: '24px',
    height: '24px',
    borderRadius: '$full',
    background: 'white',
    border: '3px solid $tealAccent',
    boxShadow: '$md',
    cursor: 'pointer',
  },
});

const SliderValue = styled('span', {
  display: 'inline-flex',
  padding: '$1 $3',
  borderRadius: '$full',
  background: '$tealAccent',
  color: 'white',
  fontSize: '$xs',
  fontWeight: '$bold',
});

const SliderLabels = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '$xs',
  color: '$fogGray',
  marginTop: '$1',
});

const RunButton = styled(Button, {
  width: '100%',
  height: '50px',
  fontSize: '$md',
  borderRadius: '$md',
  marginTop: '$4',
  boxShadow: '$glow',
  animation: `${pulse} 2s infinite`,
});

const ResultsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '$3',
  marginTop: '$4',
});

const ShelterCard = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
  padding: '$3 $4',
  borderRadius: '$md',
  background: '$mistGray',
  border: '1px solid #cbd5e1',
  marginBottom: '$3',
  fontSize: '$sm',
});

const ShelterHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
});

const ShelterTitle = styled('div', {
  fontWeight: '$bold',
  color: '$slateText',
});

const ShelterSub = styled('div', {
  color: '$fogGray',
  fontSize: '$xs',
  marginTop: '2px',
});

const NavGoogleBtn = styled('button', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  width: '100%',
  padding: '$2 $3',
  marginTop: '$2',
  borderRadius: '$md',
  border: '1px solid #10b981',
  background: '#ffffff',
  color: '#059669',
  fontSize: '$xs',
  fontWeight: '$bold',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: '#10b981',
    color: '#ffffff',
  },
});

const Legend = styled('div', {
  position: 'absolute',
  bottom: '24px',
  right: '24px',
  zIndex: 1000,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(12px)',
  padding: '$4 $5',
  borderRadius: '$lg',
  boxShadow: '$md',
  border: '1px solid #cbd5e1',
});

const LegendItem = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  fontSize: '$xs',
  color: '$slateText',
  fontWeight: '$medium',
  marginBottom: '$1',
});

const LegendColor = styled('div', {
  width: '14px',
  height: '14px',
  borderRadius: '4px',
});

function MapFlyTo({ center, zoom = 10 }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

function turfCircleToLatLngs(circleFeature) {
  if (!circleFeature || !circleFeature.geometry || !circleFeature.geometry.coordinates) return [];
  const coords = circleFeature.geometry.coordinates[0];
  return coords.map((c) => [c[1], c[0]]);
}

const DisasterSimulator = () => {
  const [district, setDistrict] = useState('Chennai');
  const [disasterType, setDisasterType] = useState('Flood');
  
  // Parameters
  const [rainfall, setRainfall] = useState(180);
  const [duration, setDuration] = useState(24);
  const [magnitude, setMagnitude] = useState(6.5);
  const [depth, setDepth] = useState(12);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [osrmRoute, setOsrmRoute] = useState(null);
  const [routeEta, setRouteEta] = useState(null);

  const selectedSpec = DISTRICT_SPECS[district] || DISTRICT_SPECS.Chennai;

  // Launch Google Maps Turn-by-Turn Driving Navigation
  const handleOpenGoogleMapsNavigation = (shelterLat, shelterLon) => {
    const userLat = selectedSpec.lat;
    const userLon = selectedSpec.lon;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${shelterLat},${shelterLon}&travelmode=driving&dir_action=navigate`;
    window.open(googleMapsUrl, '_blank');
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setOsrmRoute(null);
    setRouteEta(null);

    const lat = selectedSpec.lat;
    const lon = selectedSpec.lon;
    const elev = selectedSpec.elevation;
    const centerPoint = [lon, lat];

    let zone1, zone2, zone3;
    let severity, subArea, estParamText, affectedPop;

    if (disasterType === 'Earthquake') {
      const r1 = Math.pow(10, 0.43 * magnitude - 1.2);
      const r2 = r1 * 2.2;
      const r3 = r1 * 4.2;

      zone1 = turf.circle(centerPoint, r1, { steps: 64, units: 'kilometers' });
      zone2 = turf.circle(centerPoint, r2, { steps: 64, units: 'kilometers' });
      zone3 = turf.circle(centerPoint, r3, { steps: 64, units: 'kilometers' });

      const pgaVal = Math.min(1.2, Math.pow(10, 0.5 * magnitude - 0.02 * depth - 1.8)).toFixed(2);
      const mmiText = magnitude >= 7.0 ? 'MMI IX (Violent)' : magnitude >= 6.0 ? 'MMI VII-VIII (Severe)' : magnitude >= 5.0 ? 'MMI V-VI (Moderate)' : 'MMI IV (Light)';

      severity = magnitude >= 6.8 ? 'CRITICAL' : magnitude >= 5.5 ? 'HIGH' : 'MODERATE';
      subArea = (Math.PI * Math.pow(r1, 2)).toFixed(1);
      estParamText = `${pgaVal}g (${mmiText})`;
      affectedPop = Math.round(Math.PI * Math.pow(r2, 2) * 450);
    } else {
      const Q = rainfall / Math.max(1, duration);
      const elevFactor = 15.0 / (elev + 5.0);
      const baseRadiusKm = Math.max(1.5, Math.min(22, Q * elevFactor * 2.2));

      zone1 = turf.circle(centerPoint, baseRadiusKm, { steps: 64, units: 'kilometers' });
      zone2 = turf.circle(centerPoint, baseRadiusKm * 1.8, { steps: 64, units: 'kilometers' });
      zone3 = turf.circle(centerPoint, baseRadiusKm * 2.8, { steps: 64, units: 'kilometers' });

      severity = rainfall > 250 ? 'CRITICAL' : rainfall > 120 ? 'HIGH' : 'MODERATE';
      subArea = (Math.PI * Math.pow(baseRadiusKm, 2)).toFixed(1);
      estParamText = `${(Q * 0.18 + (elev < 10 ? 1.2 : 0.3)).toFixed(1)} meters`;
      affectedPop = Math.round(subArea * (elev < 20 ? 850 : 220));
    }

    // Fetch shelters from Backend API or Fallback
    let fetchedShelters = [];
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/shelters/nearby?lat=${lat}&lon=${lon}&radius_km=30`
      );
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          fetchedShelters = json.data;
        }
      }
    } catch (err) {
      console.warn('Backend shelter API unavailable, using fallback shelters:', err);
    }

    if (fetchedShelters.length === 0) {
      if (FALLBACK_SHELTERS[district]) {
        fetchedShelters = FALLBACK_SHELTERS[district];
      } else {
        fetchedShelters = [
          {
            name: `${district} Municipal Flood Shelter`,
            capacity: 1000,
            lat: lat + 0.02,
            lon: lon + 0.02,
            contact_phone: '+91-44-28888000',
            distance_km: 2.8,
          },
          {
            name: `${district} High-Ground Evacuation Hub`,
            capacity: 800,
            lat: lat - 0.025,
            lon: lon + 0.015,
            contact_phone: '+91-44-28888001',
            distance_km: 4.1,
          },
        ];
      }
    }

    setShelters(fetchedShelters);

    // Query OSRM Route for Closest Safe Shelter
    if (fetchedShelters.length > 0) {
      const nearest = fetchedShelters[0];
      try {
        const osrmRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${lon},${lat};${nearest.lon},${nearest.lat}?overview=full&geometries=geojson`
        );
        if (osrmRes.ok) {
          const osrmJson = await osrmRes.json();
          if (osrmJson.routes && osrmJson.routes.length > 0) {
            const route = osrmJson.routes[0];
            const roadCoords = route.geometry.coordinates.map((c) => [c[1], c[0]]);
            const durationMins = Math.round(route.duration / 60);
            const distKm = (route.distance / 1000).toFixed(1);

            setOsrmRoute(roadCoords);
            setRouteEta({ durationMins, distKm, shelterName: nearest.name });
          }
        }
      } catch (err) {
        console.warn('OSRM road routing fallback:', err);
      }
    }

    setSimulationData({
      mode: disasterType,
      severity,
      submergedArea: subArea,
      paramText: estParamText,
      affectedPop,
      polygons: {
        critical: turfCircleToLatLngs(zone1),
        high: turfCircleToLatLngs(zone2),
        moderate: turfCircleToLatLngs(zone3),
      },
    });

    setIsSimulating(false);
  };

  useEffect(() => {
    runSimulation();
  }, [district, disasterType]);

  return (
    <Container>
      <ControlPanel>
        <SectionTitle>
          <Activity size={22} color="#457B9D" />
          {disasterType === 'Earthquake' ? 'Seismic Fault Simulator' : 'Flood Hazard Simulator'}
        </SectionTitle>

        <FieldGroup>
          <Label>
            <MapPin size={16} color="#2A9D8F" /> Target District
          </Label>
          <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="Chennai">Chennai (Coastal Metropolis)</option>
            <option value="Cuddalore">Cuddalore (Severe Cyclone Belt)</option>
            <option value="Thoothukudi">Thoothukudi (Gulf Coast Port)</option>
            <option value="Tiruchirappalli">Tiruchirappalli (Cauvery River Basin)</option>
            <option value="Madurai">Madurai (Vaigai Basin)</option>
            <option value="Coimbatore">Coimbatore (Western Ghats)</option>
          </Select>
        </FieldGroup>

        <FieldGroup>
          <Label>
            <Layers size={16} color="#2A9D8F" /> Scenario Mode
          </Label>
          <Select value={disasterType} onChange={(e) => setDisasterType(e.target.value)}>
            <option value="Flood">Coastal & Urban Flood</option>
            <option value="Earthquake">Earthquake & Fault Rupture</option>
          </Select>
        </FieldGroup>

        {disasterType === 'Flood' ? (
          <>
            <FieldGroup>
              <SliderHeader>
                <Label style={{ marginBottom: 0 }}>
                  <CloudRain size={16} color="#2A9D8F" /> Rainfall Intensity
                </Label>
                <SliderValue>{rainfall} mm</SliderValue>
              </SliderHeader>
              <SliderContainer>
                <SliderTrack
                  type="range"
                  min="20"
                  max="350"
                  step="5"
                  value={rainfall}
                  onChange={(e) => setRainfall(Number(e.target.value))}
                />
                <SliderLabels>
                  <span>20mm</span>
                  <span>120mm</span>
                  <span>250mm</span>
                  <span>350mm</span>
                </SliderLabels>
              </SliderContainer>
            </FieldGroup>

            <FieldGroup>
              <SliderHeader>
                <Label style={{ marginBottom: 0 }}>
                  <Clock size={16} color="#2A9D8F" /> Event Duration
                </Label>
                <SliderValue>{duration} hrs</SliderValue>
              </SliderHeader>
              <SliderContainer>
                <SliderTrack
                  type="range"
                  min="6"
                  max="72"
                  step="6"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
                <SliderLabels>
                  <span>6hrs</span>
                  <span>24hrs</span>
                  <span>48hrs</span>
                  <span>72hrs</span>
                </SliderLabels>
              </SliderContainer>
            </FieldGroup>
          </>
        ) : (
          <>
            <FieldGroup>
              <SliderHeader>
                <Label style={{ marginBottom: 0 }}>
                  <Activity size={16} color="#2A9D8F" /> Earthquake Magnitude (Mw)
                </Label>
                <SliderValue>{magnitude} Mw</SliderValue>
              </SliderHeader>
              <SliderContainer>
                <SliderTrack
                  type="range"
                  min="4.0"
                  max="7.8"
                  step="0.1"
                  value={magnitude}
                  onChange={(e) => setMagnitude(Number(e.target.value))}
                />
                <SliderLabels>
                  <span>4.0 Mw</span>
                  <span>5.5 Mw</span>
                  <span>6.8 Mw</span>
                  <span>7.8 Mw</span>
                </SliderLabels>
              </SliderContainer>
            </FieldGroup>

            <FieldGroup>
              <SliderHeader>
                <Label style={{ marginBottom: 0 }}>
                  <Compass size={16} color="#2A9D8F" /> Focal Depth (km)
                </Label>
                <SliderValue>{depth} km</SliderValue>
              </SliderHeader>
              <SliderContainer>
                <SliderTrack
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                />
                <SliderLabels>
                  <span>5km (Shallow)</span>
                  <span>15km</span>
                  <span>25km</span>
                  <span>35km (Deep)</span>
                </SliderLabels>
              </SliderContainer>
            </FieldGroup>
          </>
        )}

        <RunButton onClick={runSimulation} disabled={isSimulating}>
          {isSimulating ? 'COMPUTING GIS SIMULATION...' : 'RUN DISASTER SIMULATION'}
        </RunButton>

        <AnimatePresence>
          {simulationData && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#2C3E50' }}>Impact Assessment</span>
                <SeverityBadge level={simulationData.severity.toLowerCase()}>
                  [{simulationData.severity}]
                </SeverityBadge>
              </div>

              <ResultsGrid>
                <StatCard>
                  <StatLabel>Est. Affected Pop.</StatLabel>
                  <StatValue>{simulationData.affectedPop.toLocaleString()}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>{simulationData.mode === 'Earthquake' ? 'Rupture Area' : 'Inundated Area'}</StatLabel>
                  <StatValue>{simulationData.submergedArea} km²</StatValue>
                </StatCard>
                <StatCard css={{ gridColumn: 'span 2' }}>
                  <StatLabel>{simulationData.mode === 'Earthquake' ? 'Peak Ground Accel. (PGA)' : 'Peak Water Level'}</StatLabel>
                  <StatValue css={{ color: '$crimsonAlert', fontSize: '$xl' }}>
                    {simulationData.paramText}
                  </StatValue>
                </StatCard>
              </ResultsGrid>

              {routeEta && (
                <div style={{ marginTop: '14px', background: 'rgba(16,185,129,0.12)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #10b981' }}>
                  <strong style={{ color: '#059669', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Navigation size={15} /> Road Route Calculated (OSRM)
                  </strong>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#2C3E50' }}>
                    Path to <b>{routeEta.shelterName}</b>: <b>{routeEta.distKm} km</b> • Drive ETA: <b>{routeEta.durationMins} mins</b>
                  </p>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '13px', color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={16} color="#2A9D8F" />
                  {simulationData.mode === 'Earthquake' ? 'Open-Ground Shelters' : 'Evacuation Shelters'} ({shelters.length} Available)
                </div>
                {shelters.map((s, idx) => (
                  <ShelterCard key={idx}>
                    <ShelterHeader>
                      <div>
                        <ShelterTitle>{s.name}</ShelterTitle>
                        <ShelterSub>
                          Distance: {s.distance_km} km • Capacity: {s.capacity} persons • Tel: {s.contact_phone || '+91-44-28888000'}
                        </ShelterSub>
                      </div>
                    </ShelterHeader>
                    {/* Task 1: Google Maps Live Navigation Route Button */}
                    <NavGoogleBtn onClick={() => handleOpenGoogleMapsNavigation(s.lat, s.lon)}>
                      <Navigation size={14} />
                      Navigate to Safe Shelter (Google Maps)
                      <ExternalLink size={12} />
                    </NavGoogleBtn>
                  </ShelterCard>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ControlPanel>

      <MapCanvasWrapper>
        <MapContainer
          center={[selectedSpec.lat, selectedSpec.lon]}
          zoom={10}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFlyTo center={[selectedSpec.lat, selectedSpec.lon]} zoom={10} />

          {simulationData && (
            <>
              {/* Concentric Turf Hazard Zones */}
              <Polygon
                positions={simulationData.polygons.moderate}
                pathOptions={{ fillColor: '#f59e0b', fillOpacity: 0.25, color: '#f59e0b', weight: 1.5 }}
              />
              <Polygon
                positions={simulationData.polygons.high}
                pathOptions={{ fillColor: '#ea580c', fillOpacity: 0.4, color: '#ea580c', weight: 2 }}
              />
              <Polygon
                positions={simulationData.polygons.critical}
                pathOptions={{
                  fillColor: simulationData.mode === 'Earthquake' ? '#991b1b' : '#dc2626',
                  fillOpacity: 0.6,
                  color: simulationData.mode === 'Earthquake' ? '#991b1b' : '#dc2626',
                  weight: 2.5,
                }}
              />

              {/* OSRM Drivable Road Path */}
              {osrmRoute ? (
                <Polyline
                  positions={osrmRoute}
                  pathOptions={{ color: '#10b981', weight: 5, opacity: 0.95 }}
                />
              ) : (
                shelters.map((s, idx) => (
                  <Polyline
                    key={idx}
                    positions={[
                      [selectedSpec.lat, selectedSpec.lon],
                      [s.lat, s.lon],
                    ]}
                    pathOptions={{ color: '#00BFA6', weight: 3, dashArray: '8, 8', opacity: 0.8 }}
                  />
                ))
              )}

              {/* Epicenter Marker */}
              <CircleMarker
                center={[selectedSpec.lat, selectedSpec.lon]}
                radius={10}
                pathOptions={{
                  fillColor: simulationData.mode === 'Earthquake' ? '#991b1b' : '#dc2626',
                  color: '#ffffff',
                  weight: 3,
                  fillOpacity: 1,
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  <span style={{ fontWeight: 700, color: simulationData.mode === 'Earthquake' ? '#991b1b' : '#dc2626' }}>
                    {simulationData.mode === 'Earthquake' ? `Fault Epicenter (${district})` : `Flood Epicenter (${district})`}
                  </span>
                </Tooltip>
              </CircleMarker>

              {/* Render Shelter Markers */}
              {shelters.map((s, idx) => (
                <CircleMarker
                  key={idx}
                  center={[s.lat, s.lon]}
                  radius={9}
                  pathOptions={{ fillColor: '#10b981', color: '#ffffff', weight: 2.5, fillOpacity: 1 }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                      <strong style={{ color: '#2A9D8F', fontSize: '14px' }}>{s.name}</strong><br />
                      Capacity: <b>{s.capacity} persons</b><br />
                      Distance: <b>{s.distance_km} km</b><br />
                      Phone: <b>{s.contact_phone || '+91-44-28888000'}</b><br /><br />
                      <button
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                        onClick={() => handleOpenGoogleMapsNavigation(s.lat, s.lon)}
                      >
                        Navigate via Google Maps
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}
        </MapContainer>

        <Legend>
          <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '12px', color: '#457B9D' }}>
            GIS Hazard Layers ({disasterType})
          </div>
          {disasterType === 'Earthquake' ? (
            <>
              <LegendItem><LegendColor css={{ background: '#991b1b' }} /> MMI VIII+ Severe Rupture Zone</LegendItem>
              <LegendItem><LegendColor css={{ background: '#ea580c' }} /> MMI VI-VII Damage Zone</LegendItem>
              <LegendItem><LegendColor css={{ background: '#f59e0b' }} /> MMI IV-V Felt Tremor Zone</LegendItem>
              <LegendItem><LegendColor css={{ background: '#10b981' }} /> OSRM Evacuation Route</LegendItem>
            </>
          ) : (
            <>
              <LegendItem><LegendColor css={{ background: '#dc2626' }} /> Critical Inundation Zone</LegendItem>
              <LegendItem><LegendColor css={{ background: '#ea580c' }} /> High Risk Buffer</LegendItem>
              <LegendItem><LegendColor css={{ background: '#f59e0b' }} /> Moderate Risk Buffer</LegendItem>
              <LegendItem><LegendColor css={{ background: '#10b981' }} /> OSRM Evacuation Route</LegendItem>
            </>
          )}
        </Legend>
      </MapCanvasWrapper>
    </Container>
  );
};

export default DisasterSimulator;