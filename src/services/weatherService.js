// src/services/weatherService.js
// Simple mock service returning static weather data for each Indian state.
// In a real implementation this would call an API. Here we use a small hard‑coded map.

const mockWeather = {
  // state code (first two letters of state name, uppercase) -> data
  // Example values for a few states; you can extend as needed.
  AP: { temp: 32, rain24h: 12, aqi: 78 }, // Andhra Pradesh
  BR: { temp: 28, rain24h: 5, aqi: 45 }, // Bihar (example)
  DL: { temp: 42, rain24h: 0, aqi: 180 }, // Delhi
  GJ: { temp: 38, rain24h: 2, aqi: 120 }, // Gujarat
  MH: { temp: 34, rain24h: 45, aqi: 85 }, // Maharashtra
  KA: { temp: 31, rain24h: 65, aqi: 62 }, // Karnataka
  TN: { temp: 33, rain24h: 70, aqi: 55 }, // Tamil Nadu
  // Add more as needed
};

export const fetchWeatherData = async () => {
  // Simulate async fetch
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWeather), 200);
  });
};
