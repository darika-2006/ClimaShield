// src/components/StateDetailPanel.jsx
import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { X } from 'lucide-react';
import { styled } from '../stitches.config';
import { fetchWeatherData } from '../services/weatherService';

// Simple overlay styling
const PanelOverlay = styled('div', {
  position: 'fixed',
  top: '0',
  right: '0',
  width: '320px',
  height: '100vh',
  background: 'rgba(255,255,255,0.94)',
  backdropFilter: 'blur(10px)',
  padding: '$6',
  boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
  zIndex: 1000,
});

const CloseBtn = styled('button', {
  position: 'absolute',
  top: '$2',
  right: '$2',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
});

const DetailItem = styled('div', {
  marginBottom: '$3',
  fontSize: '$sm',
});

export const StateDetailPanel = ({ stateCode, metric, onClose }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWeatherData();
        setWeather(data);
        setError(null);
      } catch (e) {
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!stateCode) return null;

  const stateData = weather?.[stateCode];

  return (
    <PanelOverlay>
      <CloseBtn onClick={onClose} aria-label="Close">
        <X size={20} />
      </CloseBtn>
      <Card css={{ padding: '$4' }}>
        <h2>State: {stateCode}</h2>
        {loading && <p>Loading data...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {stateData && (
          <>
            <DetailItem>Temperature: {stateData.temp}°C</DetailItem>
            <DetailItem>Rain (24h): {stateData.rain24h} mm</DetailItem>
            <DetailItem>AQI: {stateData.aqi}</DetailItem>
            <DetailItem>Current Metric ({metric}): {
              metric === 'temp' ? `${stateData.temp}°C` :
              metric === 'rain' ? `${stateData.rain24h} mm` :
              `${stateData.aqi}`
            }</DetailItem>
          </>
        )}
      </Card>
    </PanelOverlay>
  );
};

export default StateDetailPanel;
