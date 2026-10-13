import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MAJOR_CITIES, getDistrictMeta, TN_DISTRICTS } from "../data/tnDistricts";
import { useTNWeather } from "../hooks/useTNWeather";
import { getLiveRadarTileUrl } from "../services/rainViewerService";
import { Shield, Thermometer, CloudRain, Radio, MapPin, AlertTriangle, RefreshCw, CheckCircle, FileText, Crosshair, Navigation } from "lucide-react";

// Map center for Tamil Nadu
const TN_CENTER = [11.1271, 78.6569];
const INITIAL_ZOOM = 7.2;

// Custom Inspect Pin Icon
const pinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom User Location Pin Icon (Blue/Teal)
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 44],
  iconAnchor: [14, 44],
  popupAnchor: [1, -36],
  shadowSize: [41, 41]
});

const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36]
});

function MapFlyTo({ target, zoom = 9 }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom, { duration: 1.2 });
    }
  }, [target, zoom, map]);
  return null;
}

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function getRiskColor(level) {
  switch (level) {
    case "CRITICAL WARNING":
      return "#e76f51";
    case "ALERT":
      return "#f4a261";
    case "WATCH":
      return "#457b9d";
    case "NORMAL":
    default:
      return "#2a9d8f";
  }
}

function getTempColor(temp) {
  if (temp >= 38) return "#e76f51";
  if (temp >= 33) return "#f4a261";
  if (temp >= 26) return "#ffd97d";
  return "#2a9d8f";
}

function getRainColor(rain) {
  if (rain > 50) return "#457b9d";
  if (rain >= 15) return "#00bfa6";
  if (rain >= 1) return "#a8dadc";
  return "#f8fffe";
}

export default function TamilNaduLiveMap() {
  const { districtData, loading, isCached, error, lastUpdated, refetch } = useTNWeather();
  const [selectedMetric, setSelectedMetric] = useState("risk");
  const [selectedDistrictKey, setSelectedDistrictKey] = useState("Chennai");
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);

  // Live Doppler Radar & Incidents State
  const [showRadar, setShowRadar] = useState(false);
  const [radarUrl, setRadarUrl] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  // Point Inspection & User Geolocation State
  const [inspectMarker, setInspectMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [pointInspection, setPointInspection] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [newIncident, setNewIncident] = useState({
    district: 'Chennai',
    hazard_type: 'Flood',
    description: '',
  });

  const geoJsonLayerRef = useRef(null);

  // Task 1: Auto-Lock User Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocation({ lat, lon, label: "Your Current Location" });
          setMapTarget([lat, lon]);
          setInspectMarker([lat, lon]);
          handleArbitraryPointClick(lat, lon, "Your Current Location");
        },
        (err) => {
          console.warn("Geolocation permission denied or unavailable:", err.message);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    async function loadGeoJSON() {
      try {
        const response = await fetch("/assets/geojson/tamilnadu_districts.json");
        if (response.ok) {
          const data = await response.json();
          setGeoJsonData(data);
        } else {
          throw new Error("Local GeoJSON asset not found");
        }
      } catch (err) {
        try {
          const res = await fetch(
            "https://raw.githubusercontent.com/sabarisastha/iTantra-POC/main/Project_documents/tamilnadu_districts.json"
          );
          if (res.ok) {
            const data = await res.json();
            setGeoJsonData(data);
          }
        } catch (e) {
          console.error("Failed to load GeoJSON boundaries:", e);
        }
      }
    }
    loadGeoJSON();
  }, []);

  useEffect(() => {
    async function loadRadarAndIncidents() {
      const rUrl = await getLiveRadarTileUrl();
      if (rUrl) setRadarUrl(rUrl);

      try {
        const incRes = await fetch("http://localhost:5000/api/v1/incidents");
        if (incRes.ok) {
          const incJson = await incRes.json();
          if (incJson.success && Array.isArray(incJson.data)) {
            setIncidents(incJson.data);
          }
        }
      } catch (e) {
        console.warn("Backend incidents endpoint offline:", e);
      }
    }
    loadRadarAndIncidents();
  }, []);

  const handleArbitraryPointClick = async (lat, lng, customLabel = null) => {
    setInspectMarker([lat, lng]);
    setMapTarget([lat, lng]);
    setInspectLoading(true);

    let townName = customLabel || `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    let temp = 30.0;
    let rain = 0.0;
    let wind = 12.0;
    let humidity = 65;

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const addr = geoData.address || {};
        const detectedName = addr.village || addr.town || addr.city || addr.suburb || addr.county;
        if (detectedName) {
          townName = customLabel ? `${customLabel} (${detectedName})` : detectedName;
        }
      }
    } catch (err) {
      console.warn("Nominatim reverse geocode fallback:", err);
    }

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&wind_speed_unit=kmh`
      );
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        if (wData.current) {
          temp = wData.current.temperature_2m;
          rain = wData.current.precipitation || 0.0;
          wind = wData.current.wind_speed_10m || 12.0;
          humidity = wData.current.relative_humidity_2m || 65;
        }
      }
    } catch (err) {
      console.warn("Open-Meteo point lookup fallback:", err);
    }

    let riskLevel = "NORMAL";
    let hazard = "Low environmental risk detected at location.";
    if (rain > 45 || temp >= 39) {
      riskLevel = "CRITICAL WARNING";
      hazard = rain > 45 ? "Severe Local Flash Flood Warning" : "Extreme Heatwave Red Alert";
    } else if (rain > 15 || temp >= 34) {
      riskLevel = "ALERT";
      hazard = rain > 15 ? "Heavy Local Rain Inundation" : "High Heat Advisory";
    } else if (rain > 5 || temp >= 31) {
      riskLevel = "WATCH";
      hazard = "Moderate Weather Observation";
    }

    setPointInspection({
      name: townName,
      lat,
      lng,
      temp,
      rain,
      wind,
      humidity,
      riskLevel,
      hazard,
      isPoint: true,
    });

    setInspectLoading(false);
  };

  const handleCheckMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation({ lat, lon, label: "Your Current Location" });
        handleArbitraryPointClick(lat, lon, "Your Current Location");
      },
      (err) => {
        alert("Unable to retrieve GPS coordinates: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFetchGPSForModal = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setInspectMarker([lat, lon]);
        setMapTarget([lat, lon]);
        handleArbitraryPointClick(lat, lon);
      },
      (err) => {
        alert("Unable to retrieve GPS coordinates: " + err.message);
      }
    );
  };

  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    const targetCityMeta = TN_DISTRICTS[selectedDistrictKey] || TN_DISTRICTS['Chennai'];
    const lat = inspectMarker ? inspectMarker[0] : (targetCityMeta ? targetCityMeta.lat : 13.0827);
    const lon = inspectMarker ? inspectMarker[1] : (targetCityMeta ? targetCityMeta.lon : 80.2707);

    try {
      const response = await fetch("http://localhost:5000/api/v1/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: selectedDistrictKey,
          hazard_type: newIncident.hazard_type,
          description: newIncident.description,
          lat,
          lon,
        }),
      });
      if (response.ok) {
        const json = await response.json();
        setIncidents((prev) => [json.data, ...prev]);
        setShowIncidentForm(false);
        setNewIncident({ district: 'Chennai', hazard_type: 'Flood', description: '' });
        alert("Incident report submitted successfully to ClimaShield TN.");
      }
    } catch (err) {
      alert("Failed to submit report. Please try again.");
    }
  };

  const handleSelectDistrict = (districtName, lat, lon) => {
    const meta = getDistrictMeta(districtName);
    const resolvedKey = meta ? meta.name : districtName;
    if (districtData && districtData[resolvedKey]) {
      setSelectedDistrictKey(resolvedKey);
      setPointInspection(null);
    }
    if (lat && lon) {
      setMapTarget([lat, lon]);
    }
  };

  const activeInspection = useMemo(() => {
    if (pointInspection) return pointInspection;
    if (!districtData || !selectedDistrictKey) return null;
    return districtData[selectedDistrictKey] || null;
  }, [pointInspection, districtData, selectedDistrictKey]);

  const styleFeature = (feature) => {
    const props = feature.properties || {};
    const rawName =
      props.district ||
      props.DISTRICT ||
      props.NAME_2 ||
      props.dtname ||
      props.district_name ||
      props.shapeName ||
      "";

    const meta = getDistrictMeta(rawName);
    const key = meta ? meta.name : rawName;
    const data = districtData ? districtData[key] : null;

    let fillColor = "#b8e6d5";
    if (data) {
      if (selectedMetric === "risk") {
        fillColor = getRiskColor(data.riskLevel);
      } else if (selectedMetric === "temp") {
        fillColor = getTempColor(data.temp);
      } else if (selectedMetric === "rain") {
        fillColor = getRainColor(data.rain);
      }
    }

    const isSelected = key === selectedDistrictKey && !pointInspection;

    return {
      fillColor,
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? "#2A9D8F" : "#457B9D",
      fillOpacity: selectedMetric === "rain" && data && data.rain === 0 ? 0.35 : 0.75,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const rawName =
      props.district ||
      props.DISTRICT ||
      props.NAME_2 ||
      props.dtname ||
      props.district_name ||
      props.shapeName ||
      "District";

    const meta = getDistrictMeta(rawName);
    const key = meta ? meta.name : rawName;

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 3, color: "#2A9D8F", fillOpacity: 0.9 });
      },
      mouseout: (e) => {
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.resetStyle(e.target);
        }
      },
      click: () => {
        const d = districtData ? districtData[key] : null;
        const lat = d ? d.lat : TN_DISTRICTS[key]?.lat;
        const lon = d ? d.lon : TN_DISTRICTS[key]?.lon;
        handleSelectDistrict(key, lat, lon);
      },
    });

    if (districtData && districtData[key]) {
      const d = districtData[key];
      layer.bindTooltip(
        `<div style="font-family: Inter, sans-serif; font-size: 13px; line-height: 1.4; color: #2C3E50;">
          <strong style="color: #2A9D8F; font-size: 14px;">${key}</strong><br/>
          <span>Status: <b>${d.riskLevel}</b></span><br/>
          Temp: <b>${d.temp}°C</b> | Rain: <b>${d.rain}mm</b>
        </div>`,
        { sticky: true }
      );
    }
  };

  const getBadgeStyle = (level) => {
    switch (level) {
      case "CRITICAL WARNING":
        return { bg: "#fff0f0", text: "#e76f51" };
      case "ALERT":
        return { bg: "#fffdf0", text: "#f4a261" };
      case "WATCH":
        return { bg: "#f0fbfd", text: "#457b9d" };
      case "NORMAL":
      default:
        return { bg: "#e6f4f1", text: "#2a9d8f" };
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER BAR */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ClimaShield TN — Live GIS & Citizen DSS Platform</h1>
          <p style={styles.subtitle}>
            38-District & Any-Town Precise Weather, Doppler Radar & Emergency Warning System
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.safeBtn} onClick={handleCheckMyLocation}>
            <Navigation size={15} /> Check My Location
          </button>
          <button style={styles.reportBtn} onClick={() => setShowIncidentForm(true)}>
            <FileText size={15} /> Report Incident
          </button>
          <button style={styles.refreshBtn} onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </header>

      {/* METRIC TOGGLES & RADAR SWITCH */}
      <div style={styles.controlsBar}>
        <div style={styles.metricGroup}>
          <span style={styles.metricLabel}>Choropleth Layer:</span>
          <button
            style={selectedMetric === "risk" ? styles.metricActiveBtn : styles.metricBtn}
            onClick={() => { setSelectedMetric("risk"); setPointInspection(null); }}
          >
            <Shield size={14} /> Disaster Threat
          </button>
          <button
            style={selectedMetric === "temp" ? styles.metricActiveBtn : styles.metricBtn}
            onClick={() => { setSelectedMetric("temp"); setPointInspection(null); }}
          >
            <Thermometer size={14} /> Temperature
          </button>
          <button
            style={selectedMetric === "rain" ? styles.metricActiveBtn : styles.metricBtn}
            onClick={() => { setSelectedMetric("rain"); setPointInspection(null); }}
          >
            <CloudRain size={14} /> Rainfall
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            style={showRadar ? styles.radarActiveBtn : styles.radarBtn}
            onClick={() => setShowRadar(!showRadar)}
          >
            <Radio size={14} /> Doppler Radar Overlay {showRadar ? "[ON]" : "[OFF]"}
          </button>

          {lastUpdated && (
            <div style={styles.lastUpdatedText}>
              Updated: {lastUpdated.toLocaleTimeString()} | Live Location Lock Active
            </div>
          )}
        </div>
      </div>

      {/* MAJOR URBAN HUBS QUICK ACCESS (TOP RIBBON ONLY - CANVAS IS CLEAN) */}
      <section style={styles.hubSection}>
        <h3 style={styles.hubTitle}>Major Urban Hub Quick-Access (Top Navigation Ribbon)</h3>
        <div style={styles.hubGrid}>
          {MAJOR_CITIES.map((cityName) => {
            const data = districtData ? districtData[cityName] : null;
            const isSelected = selectedDistrictKey === cityName && !pointInspection;
            const bStyle = data ? getBadgeStyle(data.riskLevel) : { bg: '#E8F4F8', text: '#6B8E9F' };

            return (
              <div
                key={cityName}
                style={{
                  ...styles.hubCard,
                  ...(isSelected ? styles.hubCardSelected : {})
                }}
                onClick={() =>
                  handleSelectDistrict(
                    cityName,
                    TN_DISTRICTS[cityName]?.lat,
                    TN_DISTRICTS[cityName]?.lon
                  )
                }
              >
                <div style={styles.hubCardHeader}>
                  <strong style={styles.hubCityName}>{cityName}</strong>
                  {data && (
                    <span style={{ ...styles.miniBadge, backgroundColor: bStyle.bg, color: bStyle.text }}>
                      {data.riskLevel}
                    </span>
                  )}
                </div>
                {data ? (
                  <div style={styles.hubMetrics}>
                    <span>Temp: {data.temp}°C</span>
                    <span>Rain: {data.rain}mm</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", color: "#6B8E9F" }}>Loading...</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* MAIN CONTENT SPLIT */}
      <div style={styles.mainContent}>
        {/* LEAFLET GIS MAP CONTAINER */}
        <div style={styles.mapWrapper}>
          {inspectLoading && (
            <div style={styles.mapOverlayLoader}>
              <span>Fetching Live Weather for Exact Coordinates...</span>
            </div>
          )}

          <MapContainer
            center={TN_CENTER}
            zoom={INITIAL_ZOOM}
            style={{ width: "100%", height: "100%", borderRadius: "16px" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showRadar && radarUrl && (
              <TileLayer url={radarUrl} opacity={0.65} zIndex={100} />
            )}

            <MapFlyTo target={mapTarget} zoom={12} />
            <MapEventsHandler onMapClick={handleArbitraryPointClick} />

            {geoJsonData && (
              <GeoJSON
                ref={geoJsonLayerRef}
                key={`${selectedMetric}-${lastUpdated ? lastUpdated.getTime() : 0}-${JSON.stringify(districtData)}`}
                data={geoJsonData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}

            {/* SINGLE CLEAN USER LOCATION MARKER */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lon]} icon={userLocationIcon}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                    <strong style={{ color: '#2a9d8f' }}>Your Current Location</strong><br />
                    <span>Lat: {userLocation.lat.toFixed(4)}°, Lon: {userLocation.lon.toFixed(4)}°</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* INSPECT POINT MARKER */}
            {inspectMarker && (!userLocation || (inspectMarker[0] !== userLocation.lat && inspectMarker[1] !== userLocation.lon)) && (
              <Marker position={inspectMarker} icon={pinIcon}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                    <strong style={{ color: '#e76f51' }}>{pointInspection?.name || 'Inspected Point'}</strong><br />
                    <span>Lat: {inspectMarker[0].toFixed(4)}, Lon: {inspectMarker[1].toFixed(4)}</span><br />
                    {pointInspection && (
                      <>
                        Temp: <b>{pointInspection.temp}°C</b> | Rain: <b>{pointInspection.rain}mm</b>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* COMMUNITY REPORT INCIDENT MARKERS */}
            {incidents.map((inc) => (
              <Marker key={inc.id} position={[inc.lat, inc.lon]} icon={incidentIcon}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                    <strong style={{ color: '#e76f51' }}>Citizen Report ({inc.hazard_type})</strong><br />
                    <span>District: <b>{inc.district}</b></span><br />
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#555' }}>{inc.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* NOTE: City pins on map canvas removed for clean view; cities remain accessible on top ribbon! */}
          </MapContainer>

          {/* MAP LEGEND */}
          <div style={styles.legendOverlay}>
            <div style={styles.legendTitle}>Legend ({selectedMetric.toUpperCase()})</div>
            {selectedMetric === "risk" && (
              <div style={styles.legendItems}>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#2a9d8f" }} /> Normal</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#457b9d" }} /> Watch</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#f4a261" }} /> Alert</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#e76f51" }} /> Critical Warning</div>
              </div>
            )}
            {selectedMetric === "temp" && (
              <div style={styles.legendItems}>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#2a9d8f" }} /> &lt;26°C (Cool)</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#ffd97d" }} /> 26-32°C</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#f4a261" }} /> 33-38°C</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#e76f51" }} /> &gt;38°C (Heatwave)</div>
              </div>
            )}
            {selectedMetric === "rain" && (
              <div style={styles.legendItems}>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#f8fffe" }} /> 0mm (Dry)</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#a8dadc" }} /> 1-15mm (Light)</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#00bfa6" }} /> 15-50mm (Heavy)</div>
                <div><span style={{ ...styles.legendDot, backgroundColor: "#457b9d" }} /> &gt;50mm (Severe)</div>
              </div>
            )}
          </div>
        </div>

        {/* INSPECTION DRAWER */}
        <aside style={styles.drawer}>
          {activeInspection ? (
            <div>
              <div style={styles.drawerHeader}>
                <div>
                  <h2 style={styles.districtName}>{activeInspection.name}</h2>
                  <span style={styles.zoneText}>
                    {activeInspection.isPoint
                      ? `Point Telemetry (${activeInspection.lat.toFixed(3)}, ${activeInspection.lng.toFixed(3)})`
                      : activeInspection.zone}
                  </span>
                </div>
                {(() => {
                  const bStyle = getBadgeStyle(activeInspection.riskLevel);
                  return (
                    <span style={{ ...styles.statusPill, backgroundColor: bStyle.bg, color: bStyle.text }}>
                      [{activeInspection.riskLevel}]
                    </span>
                  );
                })()}
              </div>

              <div style={styles.hazardBox}>
                <AlertTriangle size={20} color="#2A9D8F" />
                <div>
                  <strong style={{ color: "#2C3E50", fontSize: "14px" }}>
                    Primary Threat Assessment
                  </strong>
                  <p style={{ color: "#6B8E9F", fontSize: "13px", margin: "2px 0 0 0" }}>
                    {activeInspection.hazard}
                  </p>
                </div>
              </div>

              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Temperature</span>
                  <strong style={styles.statValue}>{activeInspection.temp} °C</strong>
                </div>

                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Precipitation</span>
                  <strong style={styles.statValue}>{activeInspection.rain} mm</strong>
                </div>

                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Wind Speed</span>
                  <strong style={styles.statValue}>{activeInspection.wind} km/h</strong>
                </div>

                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Humidity</span>
                  <strong style={styles.statValue}>{activeInspection.humidity} %</strong>
                </div>
              </div>

              <div style={styles.guidanceBox}>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#2A9D8F", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={15} /> Emergency Safety Verdict
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#2C3E50", lineHeight: "1.4" }}>
                  {activeInspection.riskLevel === "CRITICAL WARNING"
                    ? "HIGH HAZARD VERDICT: Move to higher ground or seek shelter immediately. Monitor NDRF emergency channels."
                    : activeInspection.riskLevel === "ALERT"
                    ? "ELEVATED RISK VERDICT: Prepare emergency kit, restrict travel through floodprone roads."
                    : "SAFE VERDICT: Conditions normal at this location. Continue routine weather tracking."}
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.emptyDrawer}>
              <span>Click ANY town or spot on the map to inspect live weather & threat score</span>
            </div>
          )}
        </aside>
      </div>

      {/* INCIDENT REPORT MODAL */}
      {showIncidentForm && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: '0 0 12px 0', color: '#457B9D', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Submit Community Incident Report
            </h3>
            <p style={{ fontSize: '13px', color: '#6B8E9F', marginBottom: '16px' }}>
              Mark location on map first, then fill details below to alert emergency teams:
            </p>
            <form onSubmit={handleSubmitIncident}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#2C3E50' }}>
                    Location (GPS / Map)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchGPSForModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid #2A9D8F',
                      background: 'rgba(42,157,143,0.1)',
                      color: '#2A9D8F',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <Crosshair size={12} /> Fetch Current Location (GPS)
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#6B8E9F', background: '#f8fffe', padding: '6px 10px', borderRadius: '6px', border: '1px solid #b8e6d5' }}>
                  {inspectMarker ? `Lat: ${inspectMarker[0].toFixed(4)}, Lon: ${inspectMarker[1].toFixed(4)}` : `Default (${selectedDistrictKey} Center)`}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#2C3E50' }}>
                  District
                </label>
                <select
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #b8e6d5', background: '#f8fffe', color: '#2c3e50' }}
                  value={selectedDistrictKey}
                  onChange={(e) => setSelectedDistrictKey(e.target.value)}
                >
                  {MAJOR_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#2C3E50' }}>
                  Hazard Type
                </label>
                <select
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #b8e6d5', background: '#f8fffe', color: '#2c3e50' }}
                  value={newIncident.hazard_type}
                  onChange={(e) => setNewIncident({ ...newIncident, hazard_type: e.target.value })}
                >
                  <option value="Severe Urban Inundation / Waterlogging">Severe Urban Inundation / Waterlogging</option>
                  <option value="Impassable Roadway / Bridge Submerged">Impassable Roadway / Bridge Submerged</option>
                  <option value="Fallen Electric Pole / Wire Hazard">Fallen Electric Pole / Wire Hazard</option>
                  <option value="Extreme Heatwave / Heatstroke Risk">Extreme Heatwave / Heatstroke Risk</option>
                  <option value="Other Emergency / Structural Hazard">Other Emergency / Structural Hazard</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#2C3E50' }}>
                  Incident Description
                </label>
                <textarea
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #b8e6d5', minHeight: '70px', background: '#f8fffe', color: '#2c3e50' }}
                  placeholder="Describe damage, water level height, or assistance required..."
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  style={{ padding: '8px 16px', background: '#e8f4f8', border: '1px solid #a8dadc', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#2c3e50' }}
                  onClick={() => setShowIncidentForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    fontFamily: "Inter, sans-serif",
    backgroundColor: "#F0F7F4",
    minHeight: "calc(100vh - 72px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "24px",
    fontWeight: "700",
    color: "#457B9D",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#6B8E9F",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  safeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#2A9D8F",
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(42, 157, 143, 0.25)",
  },
  reportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#ffffff",
    border: "1px solid #2A9D8F",
    color: "#2A9D8F",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#6B8E9F",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
  },
  controlsBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "12px 20px",
    borderRadius: "12px",
    border: "1px solid #b8e6d5",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(42, 157, 143, 0.05)",
  },
  metricGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  metricLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#2C3E50",
  },
  metricBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F0F7F4",
    border: "1px solid #b8e6d5",
    color: "#6B8E9F",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  metricActiveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(42, 157, 143, 0.12)",
    border: "1px solid #2A9D8F",
    color: "#2A9D8F",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  radarBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F0F7F4",
    border: "1px solid #a8dadc",
    color: "#457B9D",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  radarActiveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(69, 123, 157, 0.15)",
    border: "1px solid #457B9D",
    color: "#457B9D",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  lastUpdatedText: {
    fontSize: "12px",
    color: "#6B8E9F",
  },
  hubSection: {
    marginBottom: "20px",
  },
  hubTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2C3E50",
    margin: "0 0 10px 0",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  hubGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: "10px",
  },
  hubCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #b8e6d5",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  hubCardSelected: {
    borderColor: "#2A9D8F",
    backgroundColor: "rgba(42, 157, 143, 0.08)",
    boxShadow: "0 2px 10px rgba(42, 157, 143, 0.15)",
  },
  hubCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  hubCityName: {
    fontSize: "13px",
    color: "#2C3E50",
  },
  miniBadge: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "12px",
  },
  hubMetrics: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#6B8E9F",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "20px",
    height: "640px",
  },
  mapWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(42, 157, 143, 0.1)",
    border: "1px solid #b8e6d5",
  },
  mapOverlayLoader: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    backgroundColor: "rgba(42, 157, 143, 0.95)",
    color: "#ffffff",
    padding: "8px 18px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  legendOverlay: {
    position: "absolute",
    bottom: 24,
    left: 24,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(8px)",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #b8e6d5",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  legendTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: "8px",
  },
  legendItems: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "11px",
    color: "#2C3E50",
  },
  legendDot: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginRight: "6px",
  },
  drawer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #b8e6d5",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(42, 157, 143, 0.08)",
    overflowY: "auto",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e8f4f8",
  },
  districtName: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "20px",
    fontWeight: "700",
    color: "#2C3E50",
    margin: 0,
  },
  zoneText: {
    fontSize: "12px",
    color: "#6B8E9F",
  },
  statusPill: {
    fontSize: "11px",
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  hazardBox: {
    display: "flex",
    gap: "12px",
    backgroundColor: "#E8F4F8",
    border: "1px solid #a8dadc",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  statCard: {
    backgroundColor: "#f8fffe",
    border: "1px solid #b8e6d5",
    padding: "12px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "11px",
    color: "#6B8E9F",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2C3E50",
    marginTop: "2px",
  },
  guidanceBox: {
    backgroundColor: "#e6f4f1",
    border: "1px solid #b8e6d5",
    padding: "14px",
    borderRadius: "10px",
  },
  emptyDrawer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6B8E9F",
    fontSize: "13px",
    textAlign: "center",
    padding: "20px",
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(44, 62, 80, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    width: "480px",
    border: "1px solid #b8e6d5",
    boxShadow: "0 16px 40px rgba(42, 157, 143, 0.2)",
  },
};
