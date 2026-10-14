import { styled, keyframes } from '../stitches.config';
import { useState } from 'react';
import { Card } from '../components/Card';
import { SeverityBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Bell, MapPin, Clock, Radio, PhoneCall, CheckSquare, Map, FileText, Save, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const pulseDot = keyframes({
  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
  '50%': { opacity: 0.4, transform: 'scale(1.2)' },
});

const MainWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 72px)',
  width: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
  '@mobile': { height: 'auto', overflowY: 'auto' },
});

const StatusBar = styled('div', {
  background: 'rgba(168, 218, 220, 0.3)',
  borderBottom: '1px solid #cbd5e1',
  padding: '$3 $6',
  display: 'flex',
  alignItems: 'center',
  gap: '$3',
  fontSize: '$sm',
  fontWeight: '$semibold',
  color: '$tealAccent',
  flexShrink: 0,
});

const LiveDot = styled('div', {
  width: '10px',
  height: '10px',
  borderRadius: '$full',
  background: '$emerald',
  animation: `${pulseDot} 1.5s infinite`,
});

const Container = styled('div', {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
  '@mobile': { flexDirection: 'column', overflow: 'visible' },
});

const AlertFeed = styled('div', {
  flex: 1,
  padding: '$6 $8',
  overflowY: 'auto',
  boxSizing: 'border-box',
  '@mobile': { padding: '$6 $4' },
});

const FeedHeader = styled('h2', {
  fontFamily: '$heading',
  fontSize: '$2xl',
  fontWeight: '$bold',
  color: '$azure',
  marginBottom: '$6',
  display: 'flex',
  alignItems: 'center',
  gap: '$3',
});

const SidePanel = styled('aside', {
  width: '400px',
  background: '$cloudWhite',
  boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
  padding: '$6',
  overflowY: 'auto',
  borderLeft: '1px solid #cbd5e1',
  display: 'flex',
  flexDirection: 'column',
  gap: '$6',
  flexShrink: 0,
  '@mobile': { width: '100%' },
});

const PanelTitle = styled('h3', {
  fontFamily: '$heading',
  fontSize: '$xl',
  fontWeight: '$bold',
  color: '$azure',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const AlertCard = styled(Card, {
  marginBottom: '$5',
  padding: '$6',
  transition: 'all $fast',
  border: '1px solid #cbd5e1',
  variants: {
    severity: {
      critical: {
        borderLeft: '6px solid $crimsonAlert',
        background: 'linear-gradient(135deg, rgba(231,111,81,0.08), $cloudWhite)',
      },
      high: {
        borderLeft: '6px solid $roseWarning',
        background: 'linear-gradient(135deg, rgba(240,128,128,0.08), $cloudWhite)',
      },
      moderate: {
        borderLeft: '6px solid $sunsetCoral',
        background: 'linear-gradient(135deg, rgba(244,162,97,0.08), $cloudWhite)',
      },
    },
  },
});

const AlertTopRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '$3',
  marginBottom: '$2',
});

const AlertTitle = styled('h3', {
  fontFamily: '$heading',
  fontSize: '$xl',
  fontWeight: '$bold',
  color: '$slateText',
});

const DistrictLocation = styled('div', {
  color: '$tealAccent',
  fontWeight: '$semibold',
  fontSize: '$sm',
  display: 'flex',
  alignItems: 'center',
  gap: '$1',
  marginBottom: '$3',
});

const AlertMessage = styled('p', {
  fontSize: '$md',
  color: '$slateText',
  lineHeight: 1.6,
  marginBottom: '$5',
});

const ActionGroup = styled('div', {
  display: 'flex',
  gap: '$3',
  marginBottom: '$4',
});

const AlertMeta = styled('div', {
  fontSize: '$xs',
  color: '$fogGray',
  paddingTop: '$3',
  borderTop: '1px solid #cbd5e1',
  display: 'flex',
  alignItems: 'center',
  gap: '$4',
});

const SectionLabel = styled('div', {
  fontSize: '$xs',
  fontWeight: '$bold',
  letterSpacing: '0.8px',
  color: '$fogGray',
  textTransform: 'uppercase',
  marginBottom: '$3',
});

const CheckboxList = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
});

const CheckboxRow = styled('label', {
  display: 'flex',
  alignItems: 'center',
  gap: '$3',
  padding: '$2 $3',
  borderRadius: '$md',
  fontSize: '$md',
  fontWeight: '$medium',
  color: '$slateText',
  cursor: 'pointer',
  transition: 'background $fast',
  '&:hover': { background: '$mistGray', color: '$tealAccent' },
});

const EmergencyBox = styled('div', {
  padding: '$5',
  background: 'rgba(231,111,81,0.08)',
  borderRadius: '$lg',
  border: '1px solid rgba(231,111,81,0.2)',
});

const EmergencyTitle = styled('div', {
  fontWeight: '$bold',
  marginBottom: '$3',
  fontSize: '$md',
  color: '$crimsonAlert',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const EmergencyList = styled('div', {
  fontSize: '$sm',
  lineHeight: 2,
  color: '$slateText',
});

const LiveAlerts = () => {
  const { t, tDistrict } = useLanguage();

  const alerts = [
    {
      severity: 'critical',
      type: t('alertFloodTitle'),
      district: t('alertFloodDistrict'),
      message: t('alertFloodMsg'),
      time: `2 ${t('minsAgo')}`,
      source: t('alertFloodSource'),
    },
    {
      severity: 'high',
      type: t('alertHeatTitle'),
      district: t('alertHeatDistrict'),
      message: t('alertHeatMsg'),
      time: `1 ${t('hourAgo')}`,
      source: t('alertHeatSource'),
    },
    {
      severity: 'moderate',
      type: t('alertRainTitle'),
      district: t('alertRainDistrict'),
      message: t('alertRainMsg'),
      time: `3 ${t('hoursAgo')}`,
      source: t('alertRainSource'),
    },
  ];

  return (
    <MainWrapper>
      <StatusBar>
        <LiveDot />
        <Radio size={16} /> {t('liveDisasterFeedActive')}
      </StatusBar>

      <Container>
        <AlertFeed>
          <FeedHeader>
            <Bell size={28} color="#E76F51" /> {t('activeEmergencyAlerts')}
          </FeedHeader>

          {alerts.map((alert, i) => (
            <AlertCard key={i} severity={alert.severity}>
              <AlertTopRow>
                <AlertTitle>{alert.type}</AlertTitle>
                <SeverityBadge level={alert.severity}>
                  [{alert.severity.toUpperCase()}]
                </SeverityBadge>
              </AlertTopRow>

              <DistrictLocation>
                <MapPin size={16} /> {alert.district}
              </DistrictLocation>

              <AlertMessage>{alert.message}</AlertMessage>

              <ActionGroup>
                <Button variant="secondary" size="sm">
                  <Map size={14} /> {t('viewRiskMap')}
                </Button>
                <Button variant="ghost" size="sm">
                  <FileText size={14} /> {t('evacuationGuide')}
                </Button>
              </ActionGroup>

              <AlertMeta>
                <span><Clock size={12} style={{ verticalAlign: 'middle' }} /> {alert.time}</span>
                <span>{t('source')} <strong>{alert.source}</strong></span>
              </AlertMeta>
            </AlertCard>
          ))}
        </AlertFeed>

        <SidePanel>
          <div>
            <PanelTitle>
              <Bell size={20} color="#2A9D8F" /> {t('alertPreferences')}
            </PanelTitle>
            <p style={{ fontSize: '14px', color: '#6B8E9F', marginTop: '4px' }}>
              {t('subscribeNotifications')}
            </p>
          </div>

          <div>
            <SectionLabel>{t('selectTargetDistricts')}</SectionLabel>
            <CheckboxList>
              {['Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Cuddalore'].map((d, i) => (
                <CheckboxRow key={d}>
                  <input
                    type="checkbox"
                    defaultChecked={i < 2}
                    style={{ accentColor: '#2A9D8F', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {tDistrict(d)} {t('districtSuffix')}
                </CheckboxRow>
              ))}
            </CheckboxList>
          </div>

          <Button fullWidth variant="primary" size="md">
            <Save size={16} /> {t('saveNotificationSettings')}
          </Button>

          <EmergencyBox>
            <EmergencyTitle>
              <PhoneCall size={18} /> {t('emergencyHelplines')}
            </EmergencyTitle>
            <EmergencyList>
              {t('stateDisasterControl')}: <strong>1070</strong><br />
              {t('districtHelpline')}: <strong>1077</strong><br />
              {t('ambulance')}: <strong>108</strong><br />
              {t('fireRescue')}: <strong>101</strong>
            </EmergencyList>
          </EmergencyBox>
        </SidePanel>
      </Container>
    </MainWrapper>
  );
};

export default LiveAlerts;