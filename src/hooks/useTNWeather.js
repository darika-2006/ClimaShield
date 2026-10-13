import { useState, useEffect, useCallback } from "react";
import { TN_DISTRICTS } from "../data/tnDistricts";

const CACHE_KEY = "climashield_tn_live_v1";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins cache freshness

export function calculateRisk(metrics, isFloodProne = false) {
  const { temp = 30, rain = 0, wind = 10, humidity = 60 } = metrics;

  let riskLevel = "NORMAL";
  let riskColor = "#10b981"; // Emerald green
  let hazard = "Normal Seasonal Weather";
  let score = 10;

  // 1. Extreme Heatwave Rule
  if (temp >= 40) {
    riskLevel = "CRITICAL WARNING";
    riskColor = "#ef4444";
    hazard = "Extreme Heatwave Warning";
    score = 90;
  } else if (temp >= 37) {
    riskLevel = "ALERT";
    riskColor = "#f59e0b";
    hazard = "Moderate Heatwave Warning";
    score = 65;
  }

  // 2. Wind & Gale Force Rule
  if (wind >= 60) {
    riskLevel = "CRITICAL WARNING";
    riskColor = "#ef4444";
    hazard = "Severe Gale / Cyclone Storm";
    score = Math.max(score, 95);
  } else if (wind >= 35) {
    if (riskLevel !== "CRITICAL WARNING") {
      riskLevel = "ALERT";
      riskColor = "#f59e0b";
    }
    hazard = "High Wind / Squall Alert";
    score = Math.max(score, 60);
  }

  // 3. Precipitation Accumulation Rule
  if (rain >= 50) {
    riskLevel = "CRITICAL WARNING";
    riskColor = "#ef4444";
    hazard = "Torrential Downpour / Flash Flood Hazard";
    score = Math.max(score, 90);
  } else if (rain >= 15) {
    if (riskLevel === "NORMAL") {
      riskLevel = "ALERT";
      riskColor = "#f59e0b";
    }
    hazard = "Heavy Rain Accumulation";
    score = Math.max(score, 55);
  } else if (rain > 2) {
    if (riskLevel === "NORMAL") {
      riskLevel = "WATCH";
      riskColor = "#3b82f6";
    }
    hazard = "Light Rain / Overcast Watch";
    score = Math.max(score, 35);
  }

  // 4. Compound Risk Multiplier (Coastal / Low-Lying Delta + Rain)
  if (isFloodProne && rain > 20) {
    riskLevel = "CRITICAL WARNING";
    riskColor = "#ef4444";
    hazard = "Coastal Inundation & Delta Surge Alert";
    score = Math.min(100, score + 25);
  } else if (isFloodProne && rain > 5 && riskLevel === "WATCH") {
    riskLevel = "ALERT";
    riskColor = "#f59e0b";
    hazard = "Coastal Flood Watch";
    score = Math.min(100, score + 15);
  }

  return { riskLevel, riskColor, hazard, score };
}

function generateFallbackData() {
  const fallback = {};
  const districtKeys = Object.keys(TN_DISTRICTS);

  districtKeys.forEach((key) => {
    const meta = TN_DISTRICTS[key];
    let temp = 31.5;
    let rain = 4.2;
    let wind = 14.0;
    let humidity = 68;

    if (meta.floodProne) {
      rain = 18.5;
      wind = 22.0;
      humidity = 82;
    }
    if (key === "Chennai") {
      temp = 34.0;
      rain = 24.0;
      wind = 28.0;
    } else if (key === "Nilgiris") {
      temp = 18.2;
      rain = 12.0;
      wind = 16.0;
      humidity = 90;
    } else if (key === "Madurai" || key === "Virudhunagar") {
      temp = 37.8;
      rain = 0.5;
      wind = 12.0;
    }

    const { riskLevel, riskColor, hazard, score } = calculateRisk(
      { temp, rain, wind, humidity },
      meta.floodProne
    );

    fallback[key] = {
      ...meta,
      temp,
      rain,
      wind,
      humidity,
      weatherCode: 61,
      riskLevel,
      riskColor,
      hazard,
      score,
      isFallback: true
    };
  });

  return fallback;
}

export function useTNWeather() {
  const [districtData, setDistrictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeatherData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    if (!forceRefresh) {
      try {
        const cachedRaw = sessionStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          const age = Date.now() - parsed.timestamp;
          if (age < CACHE_TTL_MS && parsed.data) {
            setDistrictData(parsed.data);
            setIsCached(true);
            setLastUpdated(new Date(parsed.timestamp));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("SessionStorage read error:", e);
      }
    }

    const districtKeys = Object.keys(TN_DISTRICTS);
    const lats = districtKeys.map((k) => TN_DISTRICTS[k].lat).join(",");
    const lons = districtKeys.map((k) => TN_DISTRICTS[k].lon).join(",");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=kmh`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const results = {};
      const resArray = Array.isArray(json) ? json : [json];

      districtKeys.forEach((key, idx) => {
        const meta = TN_DISTRICTS[key];
        const item = resArray[idx] || resArray[0];
        const current = item?.current || {};

        const temp = current.temperature_2m ?? 30.0;
        const rain = current.precipitation ?? 0.0;
        const wind = current.wind_speed_10m ?? 12.0;
        const humidity = current.relative_humidity_2m ?? 65;
        const weatherCode = current.weather_code ?? 0;

        const { riskLevel, riskColor, hazard, score } = calculateRisk(
          { temp, rain, wind, humidity },
          meta.floodProne
        );

        results[key] = {
          ...meta,
          temp: Number(temp.toFixed(1)),
          rain: Number(rain.toFixed(1)),
          wind: Number(wind.toFixed(1)),
          humidity: Math.round(humidity),
          weatherCode,
          riskLevel,
          riskColor,
          hazard,
          score,
          isFallback: false
        };
      });

      setDistrictData(results);
      setIsCached(false);
      setLastUpdated(new Date());

      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data: results })
      );
    } catch (err) {
      console.error("Open-Meteo Fetch Error:", err);
      setError("Satellite telemetry unavailable. Operating in offline fail-safe mode.");
      const fallback = generateFallbackData();
      setDistrictData(fallback);
      setIsCached(true);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    districtData,
    loading,
    isCached,
    error,
    lastUpdated,
    refetch: () => fetchWeatherData(true)
  };
}