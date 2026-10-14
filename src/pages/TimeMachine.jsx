import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { styled } from '../stitches.config';
import { Card } from '../components/Card';
import { TrendingUp, CloudRain, Calendar, MapPin, Clock, Layers, Globe, Compass, CheckCircle, Navigation, Info, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { logRecentActivity } from '../utils/auditLogger';

const GIBS_THEN = '2002-05-15';
const GIBS_NOW = '2024-05-15';
const gibsUrl = (date) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
const LIVE_ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const NASA_REGIONAL_PRESETS = [
  {
    id: 'tn-state',
    name: 'Tamil Nadu Statewide View',
    lat: 11.1271,
    lon: 78.6569,
    zoom: 8,
    city: 'Tiruchirappalli',
  },
  {
    id: 'chennai-metro',
    name: 'Greater Chennai & Coast',
    lat: 13.0400,
    lon: 80.2000,
    zoom: 9,
    city: 'Chennai',
  },
  {
    id: 'coimbatore-basin',
    name: 'Coimbatore & Western Belt',
    lat: 11.0168,
    lon: 76.9558,
    zoom: 9,
    city: 'Coimbatore',
  },
  {
    id: 'madurai-central',
    name: 'Madurai & Vaigai Basin',
    lat: 9.9252,
    lon: 78.1198,
    zoom: 9,
    city: 'Madurai',
  },
  {
    id: 'thoothukudi-gulf',
    name: 'Thoothukudi Coastal Port Zone',
    lat: 8.7642,
    lon: 78.1348,
    zoom: 9,
    city: 'Thoothukudi',
  },
];

const EXPANSION_FOCUS_COORDS = {
  Chennai: {
    name: 'Chennai (Sholinganallur / OMR IT Corridor)',
    lat: 12.8988,
    lon: 80.2285,
    zoom: 14,
  },
  Coimbatore: {
    name: 'Coimbatore (Peelamedu / Saravanampatti Tech Zone)',
    lat: 11.0280,
    lon: 77.0120,
    zoom: 14,
  },
  Madurai: {
    name: 'Madurai (Mattuthavani / Ring Road Expansion)',
    lat: 9.9472,
    lon: 78.1632,
    zoom: 14,
  },
  Tiruchirappalli: {
    name: 'Tiruchirappalli (Srirangam Island & Ring Road)',
    lat: 10.8620,
    lon: 78.6940,
    zoom: 13,
  },
  Salem: {
    name: 'Salem (Steel Plant & Bypass Corridor)',
    lat: 11.6600,
    lon: 78.1300,
    zoom: 13,
  },
  Thoothukudi: {
    name: 'Thoothukudi (VOC Port & Coastal Industrial Area)',
    lat: 8.7580,
    lon: 78.1420,
    zoom: 13,
  },
  Cuddalore: {
    name: 'Cuddalore (Port & Coastal Surge Zone)',
    lat: 11.7510,
    lon: 79.7680,
    zoom: 13,
  },
  Tirunelveli: {
    name: 'Tirunelveli (Palayamkottai Growth Belt)',
    lat: 8.7180,
    lon: 77.7400,
    zoom: 13,
  },
};

const PageContainer = styled('div', {
  padding: '16px 24px',
  maxWidth: '1600px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  minHeight: 'calc(100vh - 66px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  backgroundColor: '$lightBg',
  '@mobile': { padding: '12px 12px', gap: '10px' },
});

const HeaderSection = styled('div', {
  textAlign: 'center',
  maxWidth: '960px',
  margin: '0 auto',
});

const Title = styled('h1', {
  fontFamily: '$heading',
  fontSize: '24px',
  fontWeight: '$bold',
  color: '$azure',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
});

const Subtitle = styled('p', {
  fontSize: '13px',
  color: '$fogGray',
  lineHeight: 1.4,
});

const ControlsCard = styled(Card, {
  maxWidth: '960px',
  margin: '0 auto',
  width: '100%',
  textAlign: 'center',
  padding: '10px 18px',
  background: '#ffffff',
  border: '1px solid #b8e6d5',
  boxShadow: '0 4px 16px rgba(42, 157, 143, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
});

const CitySelect = styled('select', {
  padding: '4px 10px',
  borderRadius: '$md',
  border: '1px solid #a8dadc',
  fontSize: '13px',
  fontFamily: '$body',
  fontWeight: '$semibold',
  color: '$azure',
  marginBottom: '0px',
  outline: 'none',
  cursor: 'pointer',
  background: '#f8fffe',
  '&:focus': { borderColor: '$tealAccent' },
});

const YearNumber = styled('div', {
  fontFamily: '$heading',
  fontSize: '24px',
  fontWeight: '$bold',
  color: '$tealAccent',
  lineHeight: 1.1,
  letterSpacing: '-0.5px',
});

const DeltaBadge = styled('div', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '0px',
  padding: '3px 10px',
  borderRadius: '$full',
  background: 'rgba(231,111,81,0.12)',
  color: '$crimsonAlert',
  fontSize: '12px',
  fontWeight: '$bold',
});


const ChartsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '$6',
  '@mobile': { gridTemplateColumns: '1fr' },
});

const ChartCard = styled(Card, {
  padding: '$6',
  border: '1px solid #b8e6d5',
  background: '#ffffff',
  boxShadow: '0 4px 16px rgba(42,157,143,0.06)',
});

const ChartHeader = styled('h3', {
  fontFamily: '$heading',
  fontSize: '$xl',
  fontWeight: '$bold',
  color: '$azure',
  marginBottom: '$5',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

function MapController({ lat, lon, zoom = 14, maxZoom = 18 }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      if (maxZoom) {
        map.setMaxZoom(maxZoom);
      }
      map.flyTo([lat, lon], zoom, { duration: 1.0 });
    }
  }, [lat, lon, zoom, maxZoom, map]);
  return null;
}

function SyncMaps({ map1, map2 }) {
  useEffect(() => {
    if (!map1 || !map2) return;

    let isSyncing = false;

    const sync = (source, target) => {
      if (isSyncing) return;
      isSyncing = true;
      target.setView(source.getCenter(), source.getZoom(), { animate: false });
      isSyncing = false;
    };

    const onMove1 = () => sync(map1, map2);
    const onMove2 = () => sync(map2, map1);

    map1.on('move', onMove1);
    map2.on('move', onMove2);

    return () => {
      map1.off('move', onMove1);
      map2.off('move', onMove2);
    };
  }, [map1, map2]);

  return null;
}

function turfCircleToLatLngs(circleFeature) {
  if (!circleFeature || !circleFeature.geometry || !circleFeature.geometry.coordinates) return [];
  const coords = circleFeature.geometry.coordinates[0];
  return coords.map((c) => [c[1], c[0]]);
}

const TimeMachine = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, tDistrict, language } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const selectedYear = 2024;
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Comparative View Mode State: 'MODE_A' | 'MODE_B' | 'MODE_C' (Default: Mode C Historic Topo Catchment vs 2024 Satellite)
  const [comparativeMode, setComparativeMode] = useState('MODE_C');
  const [activeRegionalId, setActiveRegionalId] = useState('tn-state');

  // User Geolocation Auto-Lock state
  const [userDetectedCoords, setUserDetectedCoords] = useState(null);
  const [detectedPlaceName, setDetectedPlaceName] = useState(null);

  // Active target center & zoom for maps (Default: Chennai Drainage Catchment)
  const [currentCoord, setCurrentCoord] = useState({
    lat: 12.8988,
    lon: 80.2285,
    zoom: 14,
    name: 'Chennai (Historic Catchment & Drainage Baseline vs. 2024 Urban Footprint)',
  });

  const [map1, setMap1] = useState(null);
  const [map2, setMap2] = useState(null);

  // Auto-Lock User Location on Mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLon = pos.coords.longitude;
          setUserDetectedCoords({ lat: userLat, lon: userLon, zoom: 14 });
          setCurrentCoord((prev) => ({ lat: userLat, lon: userLon, zoom: prev.zoom, name: 'Your Location' }));

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const place = addr.village || addr.town || addr.city || addr.suburb || addr.county || 'Your Detected Area';
              setDetectedPlaceName(place);
            }
          } catch (err) {
            console.warn('Time Machine reverse geocode fallback:', err);
            setDetectedPlaceName('Your Detected Vicinity');
          }
        },
        (err) => {
          console.warn('Geolocation unavailable for Time Machine:', err.message);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Handle switching comparative modes
  const handleModeChange = (mode) => {
    setComparativeMode(mode);
    if (mode === 'MODE_B') {
      const preset = NASA_REGIONAL_PRESETS.find((p) => p.id === activeRegionalId) || NASA_REGIONAL_PRESETS[0];
      setCurrentCoord({ lat: preset.lat, lon: preset.lon, zoom: preset.zoom, name: preset.name });
      setSelectedCity(preset.city);
      logRecentActivity('TIME_MACHINE', `${preset.name} NASA 2002 Telemetry Scan`);
    } else if (mode === 'MODE_C') {
      const base = EXPANSION_FOCUS_COORDS[selectedCity] || EXPANSION_FOCUS_COORDS.Chennai;
      setCurrentCoord({ lat: base.lat, lon: base.lon, zoom: 14, name: base.name });
      logRecentActivity('TIME_MACHINE', `${selectedCity} Topo Catchment vs 2024 Satellite Scan`);
    }
  };

  // Regional preset selection in Mode B
  const handleSelectRegionalPreset = (preset) => {
    setActiveRegionalId(preset.id);
    setSelectedCity(preset.city);
    setUserDetectedCoords(null);
    setDetectedPlaceName(null);
    setCurrentCoord({ lat: preset.lat, lon: preset.lon, zoom: preset.zoom, name: preset.name });
    logRecentActivity('TIME_MACHINE', `${preset.name} NASA 2002 Scan`);
  };

  // Handle city selection from dropdown
  const handleCitySelectChange = (cityName) => {
    setSelectedCity(cityName);
    setUserDetectedCoords(null);
    setDetectedPlaceName(null);
    const coords = EXPANSION_FOCUS_COORDS[cityName] || EXPANSION_FOCUS_COORDS.Chennai;
    const targetZ = comparativeMode === 'MODE_B' ? 9 : coords.zoom || 14;
    setCurrentCoord({ lat: coords.lat, lon: coords.lon, zoom: targetZ, name: coords.name });
  };

  // Focus user's registered home district from AuthContext
  const handleJumpToUserDistrict = () => {
    if (!user) return;
    const dist = (user.home_district || 'Chennai').toLowerCase();
    const key = Object.keys(EXPANSION_FOCUS_COORDS).find((c) => dist.includes(c.toLowerCase()));
    const zoomFor = (z) => (comparativeMode === 'MODE_B' ? 9 : z || 14);
    setUserDetectedCoords(null);
    setDetectedPlaceName(null);
    if (key) {
      const c = EXPANSION_FOCUS_COORDS[key];
      setSelectedCity(key);
      setCurrentCoord({ lat: c.lat, lon: c.lon, zoom: zoomFor(c.zoom), name: c.name });
    } else {
      const uLat = user.home_lat ? parseFloat(user.home_lat) : 11.1271;
      const uLon = user.home_lon ? parseFloat(user.home_lon) : 78.6569;
      setSelectedCity(user.home_district || 'Tiruchirappalli');
      setCurrentCoord({ lat: uLat, lon: uLon, zoom: zoomFor(10), name: `${user.home_district || 'Home'} District Area` });
    }
  };

  const cityCenter = [currentCoord.lat, currentCoord.lon];
  const cityPoint = [currentCoord.lon, currentCoord.lat];
  const activeLocationDisplayName = detectedPlaceName || currentCoord.name || selectedCity;

  // Fetch city-level historical climate data for 2014-2024 from Express API
  useEffect(() => {
    async function fetchHistoricalData() {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/v1/climate/historical?district=${selectedCity}&start_year=2014&end_year=2024`
        );
        if (response.ok) {
          const json = await response.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setHistoryData(json.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend climate API unavailable, generating fallback series:', err);
      }

      const fallback = [];
      for (let y = 2014; y <= 2024; y++) {
        const warming = (y - 2014) * 0.05;
        fallback.push({
          year: y,
          mean_temp: parseFloat((29.8 + warming + Math.sin(y) * 0.2).toFixed(2)),
          total_rainfall: Math.round(920 + Math.cos(y) * 110),
        });
      }
      setHistoryData(fallback);
      setLoading(false);
    }

    fetchHistoricalData();
  }, [selectedCity]);

  // Environmental Metrics Calculations (2014 -> 2024)
  const yearProgress = Math.min(Math.max((selectedYear - 2014) / 10, 0), 1);
  const canopyPercentage = Math.round(58 - yearProgress * 28); // 58% -> 30%
  const concretePercentage = Math.round(42 + yearProgress * 36); // 42% -> 78%

  // 2014 Baseline Vector Boundary
  const vegCircle2014 = useMemo(() => {
    const radius = comparativeMode === 'MODE_B' ? 12 : 3.5;
    const feature = turf.circle(cityPoint, radius, { steps: 64, units: 'kilometers' });
    return turfCircleToLatLngs(feature);
  }, [cityPoint, comparativeMode]);

  // Selected Year Vector Boundaries (Green Canopy + Urban Expansion Zone)
  const { currentVegLatLngs, currentHeatLatLngs } = useMemo(() => {
    const scale = comparativeMode === 'MODE_B' ? 3.5 : 1;
    const vegRadius = Math.max(1.2 * scale, (3.5 - yearProgress * 2.1) * scale);
    const heatRadius = Math.max(0.8 * scale, (0.8 + yearProgress * 3.2) * scale);

    const vegFeature = turf.circle(cityPoint, vegRadius, { steps: 64, units: 'kilometers' });
    const heatFeature = turf.circle(cityPoint, heatRadius, { steps: 64, units: 'kilometers' });

    return {
      currentVegLatLngs: turfCircleToLatLngs(vegFeature),
      currentHeatLatLngs: turfCircleToLatLngs(heatFeature),
    };
  }, [cityPoint, yearProgress, comparativeMode]);

  const baselineItem = useMemo(() => {
    if (historyData.length === 0) return { year: 2014, mean_temp: 29.8, total_rainfall: 940 };
    return historyData.find((d) => d.year === 2014) || historyData[0];
  }, [historyData]);

  const currentItem = useMemo(() => {
    if (historyData.length === 0) return { year: selectedYear, mean_temp: 31.36, total_rainfall: 920 };
    return historyData.find((d) => d.year === selectedYear) || historyData[historyData.length - 1];
  }, [historyData, selectedYear]);

  const tempDelta = (currentItem.mean_temp - baselineItem.mean_temp).toFixed(2);

  return (
    <PageContainer>
      <HeaderSection>
        <Title>
          <Clock size={20} color="#457B9D" /> {t('timelineHeading')}
        </Title>
        <Subtitle>
          {t('timelineSubtitle')}
        </Subtitle>
      </HeaderSection>

      {isAuthenticated && user && (
        <div
          style={{
            background: 'linear-gradient(135deg, #e6f4f1 0%, #f0f7f4 100%)',
            border: '1px solid #b8e6d5',
            borderRadius: '10px',
            padding: '7px 16px',
            marginBottom: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(42, 157, 143, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#2c3e50' }}>
            <UserCheck size={16} color="#2a9d8f" />
            <span>
              Logged in: <strong>{user.full_name || user.email}</strong> ({user.role}) — Registered District:{' '}
              <strong>{user.home_district || 'Statewide HQ'}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleJumpToUserDistrict}
            style={{
              background: 'linear-gradient(135deg, #2a9d8f, #00bfa6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(42, 157, 143, 0.2)',
            }}
          >
            <Navigation size={12} /> {t('focusMyDistrict')} ({tDistrict(user.home_district) || 'Home'})
          </button>
        </div>
      )}

      <ControlsCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <MapPin size={15} color="#2A9D8F" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B8E9F' }}>
            {t('targetDistrictCorridor')}
          </span>
          <CitySelect
            value={userDetectedCoords ? 'GPS' : selectedCity}
            onChange={(e) => {
              if (e.target.value === 'GPS') {
                setCurrentCoord({
                  lat: userDetectedCoords.lat,
                  lon: userDetectedCoords.lon,
                  zoom: comparativeMode === 'MODE_B' ? 9 : 14,
                  name: detectedPlaceName || 'Your Location',
                });
              } else {
                handleCitySelectChange(e.target.value);
              }
            }}
          >
            {userDetectedCoords && <option value="GPS">{t('yourDetectedLocation')} ({tDistrict(detectedPlaceName) || t('gpsLock')})</option>}
            {Object.keys(EXPANSION_FOCUS_COORDS).map((c) => (
              <option key={c} value={c}>
                {tDistrict(EXPANSION_FOCUS_COORDS[c].name)}
              </option>
            ))}
          </CitySelect>
        </div>

        <YearNumber>{t('thenVsNow')}</YearNumber>
        <DeltaBadge>
          <TrendingUp size={14} /> {t('decadalEnvironmentalShift')} ({tDistrict(activeLocationDisplayName)})
        </DeltaBadge>
      </ControlsCard>

      {/* Comparative View Mode Toggle Container */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #b8e6d5',
          borderRadius: '12px',
          padding: '10px 16px',
          boxShadow: '0 3px 12px rgba(42, 157, 143, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#457B9D', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={14} color="#2A9D8F" /> {t('selectComparativeViewMode')}
          </div>
          <span style={{ fontSize: '11px', color: '#6B8E9F', fontWeight: 600 }}>
            {t('activeSensor')} {comparativeMode === 'MODE_B' ? (language === 'ta' ? 'நாசா MODIS டெர்ரா (2002)' : 'NASA GIBS MODIS Terra (2002)') : (language === 'ta' ? 'ஓபன் டோபோ வரைபடம்' : 'OpenTopoMap Topographic Basemap')}
          </span>
        </div>

        {/* 2-Pill Toggle Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleModeChange('MODE_B')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: comparativeMode === 'MODE_B' ? '2px solid #2a9d8f' : '1px solid #b8e6d5',
              background: comparativeMode === 'MODE_B' ? 'linear-gradient(135deg, #00bfa6, #2a9d8f)' : '#f8fffe',
              color: comparativeMode === 'MODE_B' ? '#ffffff' : '#2c3e50',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: comparativeMode === 'MODE_B' ? '0 2px 8px rgba(42,157,143,0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Globe size={15} /> {t('mode1Name')}
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('MODE_C')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: comparativeMode === 'MODE_C' ? '2px solid #2a9d8f' : '1px solid #b8e6d5',
              background: comparativeMode === 'MODE_C' ? 'linear-gradient(135deg, #00bfa6, #2a9d8f)' : '#f8fffe',
              color: comparativeMode === 'MODE_C' ? '#ffffff' : '#2c3e50',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: comparativeMode === 'MODE_C' ? '0 2px 8px rgba(42,157,143,0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Compass size={15} /> {t('mode2Name')}
          </button>
        </div>

        {/* Sub-bar: Mode B Regional Presets */}
        {comparativeMode === 'MODE_B' && (
          <div
            style={{
              background: '#f8fffe',
              border: '1px solid #a8dadc',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#457B9D', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={13} color="#457B9D" /> {t('nasaGibsStatewideStream')}
              </span>
              <span style={{ fontSize: '10px', color: '#6b8e9f' }}>
                {t('nasaGibsSubtext')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {NASA_REGIONAL_PRESETS.map((preset) => {
                const isActive = activeRegionalId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectRegionalPreset(preset)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: isActive ? '#457B9D' : '#ffffff',
                      color: isActive ? '#ffffff' : '#2C3E50',
                      border: isActive ? '1px solid #457B9D' : '1px solid #a8dadc',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isActive ? '0 2px 6px rgba(69,123,157,0.2)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tDistrict(preset.name)}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#e8f4f8',
                        color: isActive ? '#ffffff' : '#457B9D',
                        fontWeight: 700,
                      }}
                    >
                      Zoom {preset.zoom}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub-bar: Mode C Explanatory Banner */}
        {comparativeMode === 'MODE_C' && (
          <div
            style={{
              background: '#f8fffe',
              border: '1px solid #ffd97d',
              borderRadius: '8px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Compass size={16} color="#f4a261" />
            <div style={{ fontSize: '11px', color: '#2C3E50', lineHeight: 1.4 }}>
              {t('modeCExplanatory')}
            </div>
          </div>
        )}
      </div>

      {/* Unified Synchronised Split-Screen Satellite Viewer */}
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            height: '480px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #b8e6d5',
            boxShadow: '0 8px 32px rgba(42,157,143,0.1)',
            position: 'relative',
            background: '#0f172a',
          }}
        >
          {/* Left Viewport: Historical Baseline */}
          <div style={{ position: 'relative', height: '100%', borderRight: '2px solid #0f172a' }}>
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.88)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span>
                {comparativeMode === 'MODE_A'
                  ? `${t('baselineControl')} (${tDistrict(activeLocationDisplayName)})`
                  : comparativeMode === 'MODE_B'
                  ? `${t('nasa2002Baseline')} (${tDistrict(activeLocationDisplayName)})`
                  : `${t('historicCartoSurvey')} (${tDistrict(activeLocationDisplayName)})`}
              </span>
              <span style={{ fontSize: '10px', color: '#00bfa6', fontWeight: 600 }}>
                {comparativeMode === 'MODE_A'
                  ? '[FEBRUARY 2014 ESRI WAYBACK RELEASE 10842]'
                  : comparativeMode === 'MODE_B'
                  ? t('nasaModisTerra')
                  : t('opentopoContours')}
              </span>
            </div>

            <MapContainer
              center={cityCenter}
              zoom={currentCoord.zoom}
              ref={setMap1}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
              maxZoom={comparativeMode === 'MODE_B' ? 9 : 18}
            >
              {/* Dynamic Left Tile Layer based on Comparative Mode */}
              {comparativeMode === 'MODE_B' && (
                <TileLayer
                  key="gibs-then"
                  attribution="NASA GIBS EarthData Archive (2002-05-15 Cloud-Free Summer Capture)"
                  url={gibsUrl(GIBS_THEN)}
                  maxZoom={9}
                />
              )}

              {comparativeMode === 'MODE_C' && (
                <TileLayer
                  attribution="OpenTopoMap (Cartographic Topo Survey)"
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
                />
              )}

              <MapController
                lat={currentCoord.lat}
                lon={currentCoord.lon}
                zoom={currentCoord.zoom}
                maxZoom={comparativeMode === 'MODE_B' ? 9 : 18}
              />

              <Polygon
                positions={vegCircle2014}
                pathOptions={{ fill: false, color: '#2a9d8f', weight: 1.5, dashArray: '4, 4' }}
              />

              <CircleMarker
                center={cityCenter}
                radius={comparativeMode === 'MODE_B' ? 4 : 6}
                pathOptions={{ fillColor: '#2a9d8f', color: '#ffffff', weight: 2, fillOpacity: 0.9 }}
              >
                <Tooltip permanent direction="top">
                  <span style={{ fontWeight: 700 }}>
                    {comparativeMode === 'MODE_B'
                      ? t('nasaTarget')
                      : comparativeMode === 'MODE_C'
                      ? t('topoCatchmentCenter')
                      : `${t('baselineControl')} ${t('baselineCenter')}`}
                  </span>
                </Tooltip>
              </CircleMarker>
            </MapContainer>
          </div>

          {/* Right Viewport: Contemporary Observed Satellite */}
          <div style={{ position: 'relative', height: '100%' }}>
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.88)',
                color: '#38bdf8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid rgba(56,189,248,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '2px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span>{selectedYear} {t('observedState')} ({tDistrict(activeLocationDisplayName)})</span>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
                {comparativeMode === 'MODE_B'
                  ? `[NASA MODIS TERRA ${GIBS_NOW}]`
                  : t('contemporaryUrbanPass')}
              </span>
            </div>

            <MapContainer
              center={cityCenter}
              zoom={currentCoord.zoom}
              ref={setMap2}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              maxZoom={comparativeMode === 'MODE_B' ? 9 : 18}
            >
              {/* Contemporary High-Res Esri World Imagery Tile Layer */}
              {(() => {
                const url = comparativeMode === 'MODE_B' ? gibsUrl(GIBS_NOW) : LIVE_ESRI;
                return (
                  <TileLayer
                    key={url}
                    attribution="Esri World Imagery / NASA GIBS"
                    url={url}
                    maxNativeZoom={comparativeMode === 'MODE_B' ? 9 : 18}
                    maxZoom={comparativeMode === 'MODE_B' ? 9 : 18}
                  />
                );
              })()}

              <MapController
                lat={currentCoord.lat}
                lon={currentCoord.lon}
                zoom={currentCoord.zoom}
                maxZoom={comparativeMode === 'MODE_B' ? 9 : 18}
              />

              <Polygon
                positions={currentVegLatLngs}
                pathOptions={{ fill: false, color: '#2a9d8f', weight: 1.5, dashArray: '4, 4' }}
              />

              <Polygon
                positions={currentHeatLatLngs}
                pathOptions={{ fill: false, color: '#e76f51', weight: 2 }}
              />

              <CircleMarker
                center={cityCenter}
                radius={comparativeMode === 'MODE_B' ? 4 : 6}
                pathOptions={{ fillColor: '#e76f51', color: '#ffffff', weight: 2, fillOpacity: 0.9 }}
              >
                <Tooltip permanent direction="top">
                  <span style={{ fontWeight: 700 }}>{selectedYear} {t('growthZone')}</span>
                </Tooltip>
              </CircleMarker>
            </MapContainer>
          </div>

          <SyncMaps map1={map1} map2={map2} />
        </div>

        {/* Metric Comparison HUD directly below container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {/* Left HUD Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #b8e6d5',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 4px 16px rgba(42,157,143,0.06)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#457B9D', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} />{' '}
                {comparativeMode === 'MODE_A'
                  ? `${t('baselineControl')} (${tDistrict(activeLocationDisplayName)})`
                  : comparativeMode === 'MODE_B'
                  ? `${t('nasa2002Telemetry')} (${tDistrict(activeLocationDisplayName)})`
                  : `${t('historicTopoSurvey')} (${tDistrict(activeLocationDisplayName)})`}
              </span>
              <span style={{ fontSize: '11px', color: '#2A9D8F', fontWeight: 600 }}>
                {comparativeMode === 'MODE_A' ? t('esriWayback') : comparativeMode === 'MODE_B' ? t('nasaGibsTerra') : t('openTopoMap')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>
                  {comparativeMode === 'MODE_B' ? t('sensorSystem') : comparativeMode === 'MODE_C' ? t('surveyContours') : t('meanTemp')}
                </span>
                <br />
                <strong style={{ color: '#2c3e50', fontSize: '15px' }}>
                  {comparativeMode === 'MODE_B' ? t('modisResolution') : comparativeMode === 'MODE_C' ? t('naturalElevation') : `${baselineItem.mean_temp} °C`}
                </strong>
              </div>

              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>
                  {comparativeMode === 'MODE_B' ? t('captureTimestamp') : comparativeMode === 'MODE_C' ? t('hydrology') : t('imperviousSurface')}
                </span>
                <br />
                <strong style={{ color: '#2c3e50', fontSize: '15px' }}>
                  {comparativeMode === 'MODE_B' ? '2002-05-15' : comparativeMode === 'MODE_C' ? t('riverDrainage') : '~42%'}
                </strong>
              </div>

              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>
                  {comparativeMode === 'MODE_B' ? t('decadeReference') : comparativeMode === 'MODE_C' ? t('landPermeability') : t('treeCanopy')}
                </span>
                <br />
                <strong style={{ color: '#2a9d8f', fontSize: '15px' }}>
                  {comparativeMode === 'MODE_B' ? t('early2000s') : comparativeMode === 'MODE_C' ? t('highAbsorption') : '~58%'}
                </strong>
              </div>

              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>
                  {comparativeMode === 'MODE_B' ? t('terrainState') : comparativeMode === 'MODE_C' ? t('surfaceType') : `${t('baselineControl')} Thermal`}
                </span>
                <br />
                <strong style={{ color: '#2a9d8f', fontSize: '15px' }}>
                  {comparativeMode === 'MODE_B' ? t('preExpansion') : comparativeMode === 'MODE_C' ? t('unpavedCatchment') : t('controlThermal')}
                </strong>
              </div>
            </div>
          </div>

          {/* Right HUD Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #b8e6d5',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 4px 16px rgba(42,157,143,0.06)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2a9d8f', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} /> {selectedYear} {t('observedState')} ({tDistrict(activeLocationDisplayName)})
              </span>
              <span style={{ fontSize: '11px', color: '#457B9D', fontWeight: 600 }}>
                {comparativeMode === 'MODE_B' ? `NASA GIBS Terra ${GIBS_NOW}` : t('esriWorldImagery')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>{t('meanTemp')}</span>
                <br />
                <strong style={{ color: '#e76f51', fontSize: '15px' }}>{currentItem.mean_temp} °C</strong>
              </div>

              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>{t('imperviousSurface')}</span>
                <br />
                <strong style={{ color: '#f4a261', fontSize: '15px' }}>~{concretePercentage}%</strong>
              </div>

              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>{t('treeCanopy')}</span>
                <br />
                <strong style={{ color: '#2a9d8f', fontSize: '15px' }}>~{canopyPercentage}%</strong>
              </div>

              <div style={{ background: '#e8f4f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a8dadc' }}>
                <span style={{ fontSize: '11px', color: '#6b8e9f', fontWeight: 600 }}>{t('thermalShift')}</span>
                <br />
                <strong style={{ color: '#e76f51', fontSize: '15px' }}>+{tempDelta} °C</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChartsGrid>
        <ChartCard>
          <ChartHeader>
            <TrendingUp size={20} color="#E76F51" /> {t('meanTempTrend')} ({tDistrict(activeLocationDisplayName)}, 2014 - 2024)
          </ChartHeader>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F8" />
              <XAxis dataKey="year" stroke="#6B8E9F" fontSize={12} />
              <YAxis stroke="#6B8E9F" fontSize={12} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <RechartsTooltip />
              <Line
                type="monotone"
                dataKey="mean_temp"
                stroke="#E76F51"
                strokeWidth={3}
                dot={{ r: 4, fill: '#E76F51' }}
                activeDot={{ r: 8 }}
                name={t('meanTempUnit')}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <CloudRain size={20} color="#2A9D8F" /> {t('annualRainfallDist')} ({tDistrict(activeLocationDisplayName)}, mm)
          </ChartHeader>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F8" />
              <XAxis dataKey="year" stroke="#6B8E9F" fontSize={12} />
              <YAxis stroke="#6B8E9F" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="total_rainfall" fill="#2A9D8F" radius={[6, 6, 0, 0]} name={t('rainfallUnit')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>
    </PageContainer>
  );
};

export default TimeMachine;