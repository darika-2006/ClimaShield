import React, { useEffect, useState, useCallback } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorBanner from './ErrorBanner';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleSequential } from 'd3-scale';
import { interpolateRdYlBu } from 'd3-scale-chromatic';
// Color helpers
import { getTempColor, getRainColor, getAQIColor } from '../utils/colorScale';

const STATE_CODES = {
  "Andaman and Nicobar": "AN",
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chandigarh": "CH",
  "Chhattisgarh": "CG",
  "Dadra and Nagar Haveli": "DN",
  "Daman and Diu": "DD",
  "Delhi": "DL",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jammu and Kashmir": "JK",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Ladakh": "LA",
  "Lakshadweep": "LD",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Orissa": "OR",
  "Puducherry": "PY",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Tripura": "TR",
  "Uttaranchal": "UT",
  "Uttar Pradesh": "UP",
  "West Bengal": "WB"
};

// Mock weather data (state code => data)
const mockWeather = {
  AN: { temp: 29, rain24h: 15, aqi: 45 },
  AP: { temp: 32, rain24h: 12, aqi: 78 },
  AR: { temp: 18, rain24h: 40, aqi: 20 },
  AS: { temp: 26, rain24h: 30, aqi: 42 },
  BR: { temp: 28, rain24h: 5, aqi: 110 },
  CH: { temp: 35, rain24h: 0, aqi: 105 },
  CG: { temp: 33, rain24h: 18, aqi: 88 },
  DN: { temp: 31, rain24h: 10, aqi: 65 },
  DD: { temp: 31, rain24h: 8, aqi: 70 },
  DL: { temp: 42, rain24h: 0, aqi: 180 },
  GA: { temp: 30, rain24h: 25, aqi: 40 },
  GJ: { temp: 38, rain24h: 2, aqi: 120 },
  HR: { temp: 39, rain24h: 0, aqi: 140 },
  HP: { temp: 22, rain24h: 15, aqi: 35 },
  JK: { temp: 20, rain24h: 10, aqi: 50 },
  JH: { temp: 32, rain24h: 22, aqi: 95 },
  KA: { temp: 31, rain24h: 65, aqi: 62 },
  KL: { temp: 28, rain24h: 80, aqi: 30 },
  LA: { temp: 15, rain24h: 2, aqi: 25 },
  LD: { temp: 29, rain24h: 20, aqi: 30 },
  MP: { temp: 37, rain24h: 5, aqi: 115 },
  MH: { temp: 34, rain24h: 45, aqi: 85 },
  MN: { temp: 25, rain24h: 35, aqi: 40 },
  ML: { temp: 23, rain24h: 90, aqi: 35 },
  MZ: { temp: 24, rain24h: 40, aqi: 30 },
  NL: { temp: 24, rain24h: 25, aqi: 35 },
  OR: { temp: 33, rain24h: 30, aqi: 80 },
  PY: { temp: 32, rain24h: 50, aqi: 50 },
  PB: { temp: 38, rain24h: 0, aqi: 130 },
  RJ: { temp: 40, rain24h: 0, aqi: 150 },
  SK: { temp: 19, rain24h: 20, aqi: 25 },
  TN: { temp: 33, rain24h: 70, aqi: 55 },
  TR: { temp: 27, rain24h: 30, aqi: 45 },
  UT: { temp: 25, rain24h: 15, aqi: 60 },
  UP: { temp: 39, rain24h: 2, aqi: 160 },
  WB: { temp: 34, rain24h: 35, aqi: 100 }
};



const GEO_URL = '/data/india-states-full.geojson';

const IndiaChoroplethMap = ({ metric, onTooltipContent }) => {
  const [geoData, setGeoData] = useState(null);
  const [weather, setWeather] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load GeoJSON
  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then(setGeoData)
      .catch((e) => setError('Failed to load map data'));
  }, []);

  const loadWeather = useCallback(() => {
    setLoading(true);
    // Use mock data directly
    setWeather(mockWeather);
    setWarnings([]);
    setError(null);
    setLoading(false);
  }, []);

  // Initial load and interval
  useEffect(() => {
    loadWeather();
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeather]);

  const getColor = (stateCode) => {
    const data = weather[stateCode];
    if (!data) return '#e0e0e0';
    switch (metric) {
      case 'temp':
        return getTempColor(data.temp);
      case 'rain':
        return getRainColor(data.rain24h);
      case 'aqi':
        return getAQIColor(data.aqi || 0);
      default:
        return '#e0e0e0';
    }
  };

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!geoData || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1000,
          center: [82, 23]
        }}
        width={800}
        height={600}
        data-tip=""
      >
        <ZoomableGroup zoom={1} center={[82, 23]}>
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.NAME_1;
                const stateCode = STATE_CODES[stateName] || null;
                return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={stateCode ? getColor(stateCode) : '#e0e0e0'}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', opacity: 0.8, strokeWidth: 1.5, stroke: '#1d3557' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={() => {
                    if (stateCode && weather[stateCode] && onTooltipContent) {
                      onTooltipContent({ stateCode, stateName, data: weather[stateCode] });
                    }
                  }}
                  onMouseLeave={() => {
                    if (onTooltipContent) onTooltipContent(null);
                  }}
                />
              );
            })
          }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </>
  );
};

export default IndiaChoroplethMap;
