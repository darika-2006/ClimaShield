import { scaleSequential } from 'd3-scale';
import { interpolateRdYlBu, interpolateBlues, interpolateRdYlGn } from 'd3-scale-chromatic';

// Temperature: blue (cold) to red (hot)
export const getTempColor = (temp) => {
  // Expected temp range -10°C to 50°C
  const clamped = Math.max(-10, Math.min(50, temp));
  const color = scaleSequential(interpolateRdYlBu).domain([50, -10])(clamped);
  return color;
};

// Rainfall (mm) over 24h: light blue (dry) to dark blue (wet)
export const getRainColor = (rain) => {
  const clamped = Math.max(0, Math.min(200, rain)); // clamp to 200mm
  const color = scaleSequential(interpolateBlues).domain([0, 200])(clamped);
  return color;
};

export const getAQIColor = (aqi) => {
  const clamped = Math.max(0, Math.min(500, aqi));
  const color = scaleSequential(interpolateRdYlGn).domain([500, 0])(clamped);
  return color;
};
