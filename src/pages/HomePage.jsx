import { styled, keyframes } from '../stitches.config';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Map, Clock, Waves, Bell, ArrowRight, Shield, Thermometer, CloudRain, AlertTriangle, Users, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const float = keyframes({
  '0%, 100%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-16px)' },
});

const waveMove = keyframes({
  '0%': { transform: 'translateX(0)' },
  '100%': { transform: 'translateX(-50%)' },
});

const HeroSection = styled('section', {
  minHeight: '75vh',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$8 $6',
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #E8F4F8 0%, #B8E6D5 40%, #D4F1F4 100%)',
  boxSizing: 'border-box',
  '@mobile': { padding: '$6 $4' },
});

const HeroContainer = styled('div', {
  maxWidth: '1400px',
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$8',
  zIndex: 2,
  '@mobile': {
    flexDirection: 'column-reverse',
    textAlign: 'center',
    gap: '$6',
  },
});

const HeroContent = styled('div', {
  flex: 1,
  maxWidth: '720px',
});

const BadgeTag = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '$2',
  padding: '$2 $4',
  borderRadius: '$full',
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(10px)',
  fontSize: '$sm',
  fontWeight: '$semibold',
  color: '$tealAccent',
  marginBottom: '$4',
  border: '1px solid #cbd5e1',
  boxShadow: '$sm',
});

const HeroTitle = styled('h1', {
  fontFamily: '$heading',
  fontSize: '$4xl',
  fontWeight: '$bold',
  color: '$azure',
  lineHeight: 1.15,
  marginBottom: '$5',
  letterSpacing: '-1px',
  '@mobile': { fontSize: '$2xl' },
});

const HeroSubtitle = styled('p', {
  fontSize: '$lg',
  color: '$slateText',
  opacity: 0.85,
  lineHeight: 1.6,
  marginBottom: '$7',
  maxWidth: '620px',
});

const HeroButtons = styled('div', {
  display: 'flex',
  gap: '$4',
  '@mobile': { justifyContent: 'center' },
});

const GlobeContainer = styled('div', {
  width: '280px',
  height: '280px',
  borderRadius: '$full',
  background: 'linear-gradient(135deg, #2A9D8F, #457B9D)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 24px 64px rgba(42,157,143,0.3)',
  border: '6px solid rgba(255, 255, 255, 0.8)',
  animation: `${float} 4s ease-in-out infinite`,
  flexShrink: 0,
  '@mobile': { width: '180px', height: '180px' },
});

const WaveOverlay = styled('div', {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '200%',
  height: '80px',
  background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.15) 40px, rgba(255,255,255,0.15) 80px)',
  animation: `${waveMove} 8s linear infinite`,
  pointerEvents: 'none',
});

const CardsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '$6',
  padding: '$8 $6',
  maxWidth: '1400px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  '@tablet': { gridTemplateColumns: 'repeat(2, 1fr)' },
  '@mobile': { gridTemplateColumns: '1fr', padding: '$6 $4' },
});

const FeatureCard = styled(Card, {
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: '$7 $6',
  cursor: 'pointer',
  border: '1px solid #cbd5e1',
});

const CardIcon = styled('div', {
  width: '56px',
  height: '56px',
  borderRadius: '$lg',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$5',
  color: 'white',
  boxShadow: '$sm',
});

const CardTitle = styled('h3', {
  fontFamily: '$heading',
  fontSize: '$xl',
  fontWeight: '$bold',
  color: '$slateText',
  marginBottom: '$3',
});

const CardDesc = styled('p', {
  fontSize: '$md',
  color: '$fogGray',
  lineHeight: 1.5,
  flex: 1,
});

const CardFooter = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  marginTop: '$5',
  fontSize: '$sm',
  fontWeight: '$bold',
  color: '$tealAccent',
});

const StatsTicker = styled('div', {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderTop: '1px solid #cbd5e1',
  borderBottom: '1px solid #cbd5e1',
  padding: '$4 $6',
  display: 'flex',
  justifyContent: 'center',
  gap: '$8',
  flexWrap: 'wrap',
  fontFamily: '$mono',
  fontSize: '$md',
  color: '$azure',
  fontWeight: '$medium',
  width: '100%',
  boxSizing: 'border-box',
});

const TickerItem = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  padding: '$1 $3',
  background: '$mistGray',
  borderRadius: '$full',
  border: '1px solid #cbd5e1',
});

const HomePage = () => {
  const { t } = useLanguage();

  const cards = [
    {
      icon: <Map size={26} />,
      color: '$tealAccent',
      title: t('featureLiveMapTitle'),
      desc: t('featureLiveMapDesc'),
      link: '/',
    },
    {
      icon: <Clock size={26} />,
      color: '$azure',
      title: t('featureTimelineTitle'),
      desc: t('featureTimelineDesc'),
      link: '/timeline',
    },
    {
      icon: <Waves size={26} />,
      color: '$sunsetCoral',
      title: t('featureSimulatorTitle'),
      desc: t('featureSimulatorDesc'),
      link: '/simulator',
    },
    {
      icon: <Bell size={26} />,
      color: '$amberGlow',
      title: t('featureAlertsTitle'),
      desc: t('featureAlertsDesc'),
      link: '/alerts',
    },
  ];

  return (
    <>
      <HeroSection>
        <HeroContainer>
          <HeroContent>
            <BadgeTag>
              <Shield size={16} color="#00BFA6" /> {t('heroBadge')}
            </BadgeTag>
            <HeroTitle>
              {t('heroTitle')}
            </HeroTitle>
            <HeroSubtitle>
              {t('heroSubtitle')}
            </HeroSubtitle>
            <HeroButtons>
              <Button as={Link} to="/" variant="primary" size="lg">
                {t('exploreGisMap')}
              </Button>
              <Button as={Link} to="/simulator" variant="secondary" size="lg">
                {t('runSimulator')}
              </Button>
            </HeroButtons>
          </HeroContent>
          <GlobeContainer>
            <Globe size={130} color="white" />
          </GlobeContainer>
        </HeroContainer>
        <WaveOverlay />
      </HeroSection>

      <CardsGrid>
        {cards.map((card, i) => (
          <FeatureCard key={i} as={Link} to={card.link}>
            <CardIcon css={{ background: card.color }}>
              {card.icon}
            </CardIcon>
            <CardTitle>{card.title}</CardTitle>
            <CardDesc>{card.desc}</CardDesc>
            <CardFooter>
              {t('exploreModule')} <ArrowRight size={16} />
            </CardFooter>
          </FeatureCard>
        ))}
      </CardsGrid>

      <StatsTicker>
        <TickerItem><Thermometer size={16} color="#2A9D8F" /> {t('avgTempLabel')} <strong>31.2°C</strong></TickerItem>
        <TickerItem><CloudRain size={16} color="#2A9D8F" /> {t('rainfallTicker')} <strong>145mm</strong></TickerItem>
        <TickerItem><AlertTriangle size={16} color="#E76F51" /> {t('activeAlertsTicker')} <strong style={{ color: '#E76F51' }}>{t('criticalAlertsCount')}</strong></TickerItem>
        <TickerItem><Users size={16} color="#457B9D" /> {t('monitoringTicker')} <strong>{t('districtsActiveTicker')}</strong></TickerItem>
      </StatsTicker>
    </>
  );
};

export default HomePage;