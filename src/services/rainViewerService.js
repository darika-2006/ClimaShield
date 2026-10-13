/**
 * RainViewer API Service
 * Fetches live Doppler radar precipitation & weather map tile URLs from RainViewer API
 * Free open API — no API keys required.
 */
export async function getLiveRadarTileUrl() {
  try {
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!response.ok) {
      throw new Error(`RainViewer API error status ${response.status}`);
    }
    const data = await response.json();
    
    if (data.radar && data.radar.past && data.radar.past.length > 0) {
      const latestFrame = data.radar.past[data.radar.past.length - 1];
      const host = data.host || 'https://tilecache.rainviewer.com';
      // Leaflet TileLayer format: {host}{path}/256/{z}/{x}/{y}/2/1_1.png
      return `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    }
    throw new Error('No radar frames available in RainViewer response');
  } catch (error) {
    console.warn('RainViewer service fallback:', error);
    return null;
  }
}
