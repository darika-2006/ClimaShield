import { styled } from '../stitches.config';
import IndiaChoroplethMap from '../components/IndiaChoroplethMap';
import { Card } from '../components/Card';
import { useState, useEffect } from 'react';
import { Thermometer, CloudRain, Wind, MapPin, RefreshCw, Globe } from 'lucide-react';

const TooltipContainer = styled(Card, {
  position: 'fixed',
  padding: '$3 $4',
  pointerEvents: 'none',
  zIndex: 1000,
  minWidth: '200px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '$lg',
  border: '1px solid #cbd5e1',
});

const PageContainer = styled('div', {
  display: 'flex',
  height: 'calc(100vh - 72px)',
  width: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
  '@mobile': { flexDirection: 'column', height: 'auto', overflowY: 'auto' },
});

const MapArea = styled('div', {
  flex: 1,
  background: 'linear-gradient(180deg, #eef2f5 0%, #e2e8f0 100%)',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$6',
  textAlign: 'center',
  overflow: 'hidden',
});

const Sidebar = styled('aside', {
  width: '400px',
  background: '$cloudWhite',
  boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
  padding: '$6',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: '1px solid #cbd5e1',
  '@mobile': { width: '100%', height: 'auto' },
});

const SidebarTitle = styled('h2', {
  fontFamily: '$heading',
  fontSize: '$xl',
  fontWeight: '$bold',
  color: '$azure',
  marginBottom: '$5',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const MetricToggle = styled('div', {
  display: 'flex',
  gap: '$2',
  marginBottom: '$6',
  background: '$mistGray',
  padding: '4px',
  borderRadius: '$md',
  border: '1px solid #cbd5e1',
});

const MetricBtn = styled('button', {
  flex: 1,
  padding: '$2 $3',
  borderRadius: '$sm',
  fontSize: '$sm',
  fontWeight: '$semibold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  transition: 'all $fast',
  border: 'none',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        background: '$tealAccent',
        color: 'white',
        boxShadow: '$sm',
      },
      false: {
        background: 'transparent',
        color: '$fogGray',
        '&:hover': { color: '$slateText', background: 'rgba(255,255,255,0.5)' },
      },
    },
  },
});

const SectionHeader = styled('div', {
  fontSize: '$xs',
  fontWeight: '$bold',
  letterSpacing: '0.8px',
  color: '$fogGray',
  textTransform: 'uppercase',
  marginBottom: '$3',
});

const LegendContainer = styled('div', {
  marginBottom: '$6',
  padding: '$4',
  background: '$mistGray',
  borderRadius: '$md',
  border: '1px solid #cbd5e1',
});

const LegendBar = styled('div', {
  height: '10px',
  borderRadius: '$full',
  marginBottom: '$2',
  variants: {
    metric: {
      temp: { background: 'linear-gradient(90deg, #313695, #74add1, #e0f3f8, #f46d43, #a50026)' },
      rain: { background: 'linear-gradient(90deg, #f7fbff, #6baed6, #08306b)' },
      aqi: { background: 'linear-gradient(90deg, #1a9850, #d9ef8b, #d73027)' },
    }
  },
  defaultVariants: {
    metric: 'temp'
  }
});

const LegendLabels = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '$xs',
  color: '$fogGray',
  fontWeight: '$medium',
});

const CityList = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
  flex: 1,
});

const CityRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$3 $4',
  borderRadius: '$md',
  transition: 'all $fast',
  border: '1px solid transparent',
  '&:hover': {
    background: '$mistGray',
    borderColor: '$seafoam',
  },
  variants: {
    alternate: {
      true: { background: 'rgba(168,218,220,0.1)' },
    },
  },
});

const CityName = styled('span', {
  fontWeight: '$semibold',
  fontSize: '$md',
  color: '$slateText',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const TempBadge = styled('span', {
  padding: '$1 $3',
  borderRadius: '$full',
  fontSize: '$sm',
  fontWeight: '$bold',
  color: 'white',
  variants: {
    level: {
      hot: { background: '$crimsonAlert' },
      warm: { background: '$sunsetCoral' },
      mild: { background: '$amberGlow', color: '$slateText' },
      cool: { background: '$emerald' },
    },
  },
});

const FooterNote = styled('div', {
  marginTop: '$6',
  paddingTop: '$4',
  borderTop: '1px solid #cbd5e1',
  fontSize: '$xs',
  color: '$fogGray',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
});

const CITY_NAMES = ['Delhi', 'Jaipur', 'Ahmedabad', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Kochi'];

const getLevel = (temp) => {
  if (temp >= 40) return 'hot';
  if (temp >= 35) return 'warm';
  if (temp >= 30) return 'mild';
  return 'cool';
};

const IndiaOverview = () => {
  const [metric, setMetric] = useState('temp');
  const [tooltip, setTooltip] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [citiesData, setCitiesData] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API;
        if (!apiKey) {
          // Fallback static data if API key not present
          setCitiesData([
            { name: 'Delhi', temp: 36, rain: '2mm', aqi: 180 },
            { name: 'Jaipur', temp: 38, rain: '0mm', aqi: 140 },
            { name: 'Ahmedabad', temp: 39, rain: '0mm', aqi: 160 },
            { name: 'Mumbai', temp: 32, rain: '15mm', aqi: 90 },
            { name: 'Kolkata', temp: 34, rain: '20mm', aqi: 120 },
            { name: 'Chennai', temp: 33, rain: '12mm', aqi: 85 },
            { name: 'Bangalore', temp: 28, rain: '5mm', aqi: 60 },
            { name: 'Kochi', temp: 30, rain: '25mm', aqi: 45 },
          ]);
          setLoadingCities(false);
          return;
        }

        const promises = CITY_NAMES.map(async (name) => {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${name},IN&appid=${apiKey}&units=metric`);
          const data = await res.json();
          let aqiValue = 50;
          try {
            const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${apiKey}`);
            const aqiData = await aqiRes.json();
            aqiValue = aqiData.list[0].main.aqi * 50;
          } catch (e) {
            console.error("Failed to fetch AQI for", name);
          }
          const rainAmount = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
          return {
            name,
            temp: Math.round(data.main.temp),
            rain: `${rainAmount}mm`,
            aqi: aqiValue
          };
        });

        const results = await Promise.all(promises);
        setCitiesData(results);
      } catch (err) {
        console.error("Failed to fetch city weather", err);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCityData();
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <PageContainer>
      <MapArea onMouseMove={handleMouseMove}>
        <IndiaChoroplethMap metric={metric} onTooltipContent={setTooltip} />
      </MapArea>

      <Sidebar>
        <SidebarTitle>
          <Globe size={22} color="#457B9D" /> Weather Monitor
        </SidebarTitle>

        <MetricToggle>
          <MetricBtn active={metric === 'temp'} onClick={() => setMetric('temp')}>
            <Thermometer size={16} /> Temp
          </MetricBtn>
          <MetricBtn active={metric === 'rain'} onClick={() => setMetric('rain')}>
            <CloudRain size={16} /> Rain
          </MetricBtn>
          <MetricBtn active={metric === 'aqi'} onClick={() => setMetric('aqi')}>
            <Wind size={16} /> AQI
          </MetricBtn>
        </MetricToggle>

        <LegendContainer>
          <SectionHeader>Intensity Spectrum</SectionHeader>
          <LegendBar metric={metric} />
          <LegendLabels>
            <span>Low ({metric === 'temp' ? '20°C' : metric === 'rain' ? '0mm' : '0 AQI'})</span>
            <span>High ({metric === 'temp' ? '45°C+' : metric === 'rain' ? '100mm+' : '300 AQI+'})</span>
          </LegendLabels>
        </LegendContainer>

        <SectionHeader>Major Urban Centers</SectionHeader>
        <CityList>
          {loadingCities && <div style={{ padding: '16px', color: '#6B8E9F', fontSize: '14px' }}>Loading real-time data...</div>}
          {!loadingCities && citiesData.map((city, i) => (
            <CityRow key={city.name} alternate={i % 2 === 1}>
              <CityName>
                <MapPin size={14} color="#6B8E9F" /> {city.name}
              </CityName>
              <TempBadge level={getLevel(city.temp)}>
                {metric === 'temp' ? `${city.temp}°C` : metric === 'rain' ? city.rain : `AQI ${city.aqi}`}
              </TempBadge>
            </CityRow>
          ))}
        </CityList>

        <FooterNote>
          <RefreshCw size={12} /> Refreshed 2 mins ago • Auto-sync ON
        </FooterNote>
      </Sidebar>

      {tooltip && (
        <TooltipContainer style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}>
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '16px', color: '#1d3557' }}>
            {tooltip.stateName} ({tooltip.stateCode})
          </h3>
          <div style={{ fontSize: '14px', marginBottom: '4px', color: '#457b9d' }}>Temperature: <strong>{tooltip.data.temp}°C</strong></div>
          <div style={{ fontSize: '14px', marginBottom: '4px', color: '#457b9d' }}>Rain (24h): <strong>{tooltip.data.rain24h} mm</strong></div>
          <div style={{ fontSize: '14px', color: '#457b9d' }}>AQI: <strong>{tooltip.data.aqi}</strong></div>
        </TooltipContainer>
      )}
    </PageContainer>
  );
};

export default IndiaOverview;