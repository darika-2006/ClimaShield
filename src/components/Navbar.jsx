import { styled, keyframes } from '../stitches.config';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Clock, Waves, Home, Shield, FileText, UserCheck, LogOut, LogIn, Globe, Cpu, Radio } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const pulse = keyframes({
  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
  '50%': { transform: 'scale(1.3)', opacity: 0.6 },
});

const NavHeader = styled('nav', {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  width: '100%',
  background: 'rgba(248, 255, 254, 0.95)',
  backdropFilter: 'blur(16px) saturate(180%)',
  borderBottom: '1px solid #b8e6d5',
  boxShadow: '$sm',
});

const NavContainer = styled('div', {
  maxWidth: '100%',
  margin: '0 auto',
  height: '66px',
  padding: '0 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  '@mobile': { padding: '0 12px' },
});

const Logo = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  flexShrink: 0,
});

const LogoIcon = styled('div', {
  width: '36px',
  height: '36px',
  borderRadius: '$full',
  background: 'linear-gradient(135deg, #2A9D8F, #00BFA6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  boxShadow: '$sm',
  flexShrink: 0,
});

const LogoText = styled('span', {
  fontFamily: '$heading',
  fontWeight: '$bold',
  fontSize: '18px',
  color: '$azure',
  letterSpacing: '-0.3px',
  whiteSpace: 'nowrap',
});

const NavLinks = styled('div', {
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
  flexWrap: 'nowrap',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  '@mobile': { display: 'none' },
});

const NavLink = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 11px',
  borderRadius: '$md',
  fontSize: '13px',
  fontWeight: '$medium',
  color: '$fogGray',
  transition: 'all $fast',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  '&:hover': {
    background: 'rgba(42, 157, 143, 0.08)',
    color: '$tealAccent',
  },
  variants: {
    active: {
      true: {
        background: 'rgba(42, 157, 143, 0.12)',
        color: '$tealAccent',
        fontWeight: '$semibold',
        boxShadow: 'inset 0 -2px 0 #00BFA6',
      },
    },
  },
});

const RightSection = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
});

const LangToggle = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: '#ffffff',
  border: '1px solid #a8dadc',
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '700',
  color: '#2a9d8f',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 6px rgba(42, 157, 143, 0.06)',
  '&:hover': {
    background: '#e8f4f8',
    borderColor: '#2a9d8f',
  },
});

const UserBadge = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(42, 157, 143, 0.08)',
  border: '1px solid #b8e6d5',
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#2c3e50',
  whiteSpace: 'nowrap',
});

const RoleChip = styled('span', {
  background: 'linear-gradient(135deg, #2a9d8f, #00bfa6)',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '800',
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isOfficer } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const publicLinks = [
    { path: '/home', label: t('navHome'), icon: <Home size={16} /> },
    { path: '/', label: t('navLiveMap'), icon: <Map size={16} /> },
    { path: '/timeline', label: t('navTimeline'), icon: <Clock size={16} /> },
    { path: '/alerts', label: t('navAlerts'), icon: <Radio size={16} /> },
    { path: '/architecture', label: t('navArchitecture'), icon: <Cpu size={16} /> },
  ];

  const citizenLinks = [
    { path: '/citizen', label: t('navDashboard'), icon: <UserCheck size={16} /> },
    { path: '/report', label: t('navReport'), icon: <FileText size={16} /> },
  ];

  const adminLinks = [
    { path: '/admin', label: t('navAdmin'), icon: <Shield size={16} /> },
    { path: '/simulator', label: t('navSimulator'), icon: <Waves size={16} /> },
  ];

  let links = [...publicLinks];
  if (isAuthenticated) {
    if (isOfficer) {
      links = [...links, ...adminLinks];
    } else {
      links = [...links, ...citizenLinks];
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <NavHeader>
      <NavContainer>
        <Logo to="/home">
          <LogoIcon>
            <Shield size={20} color="white" />
          </LogoIcon>
          <LogoText>ClimaShield TN</LogoText>
        </Logo>

        <NavLinks>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              active={location.pathname === link.path}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </NavLinks>

        <RightSection>
          {/* Language Switcher */}
          <LangToggle onClick={toggleLanguage} title={language === 'en' ? 'தமிழுக்கு மாறுக' : 'Switch to English'}>
            <Globe size={14} color="#2a9d8f" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </LangToggle>

          {/* Account Indicator */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserBadge>
                <span>{user?.full_name?.split(' ')[0]}</span>
                <RoleChip>
                  {user?.role === 'ADMIN'
                    ? (language === 'ta' ? 'நிர்வாகி' : 'ADMIN')
                    : user?.role === 'DISTRICT_OFFICER'
                    ? (language === 'ta' ? 'அதிகாரி' : 'OFFICER')
                    : (language === 'ta' ? 'குடிமகன்' : 'CITIZEN')}
                </RoleChip>
              </UserBadge>
              <button
                onClick={handleLogout}
                title={t('navSignOut')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #f08080',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#e76f51',
                  boxShadow: '0 2px 6px rgba(231,111,81,0.1)',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(42, 157, 143, 0.3)',
              }}
            >
              <LogIn size={16} /> {t('navSignIn')}
            </Link>
          )}
        </RightSection>
      </NavContainer>
    </NavHeader>
  );
};

export default Navbar;