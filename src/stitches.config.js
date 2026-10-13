import { createStitches } from '@stitches/react';

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      // Primary Pastels
      oceanMist: '#A8DADC',
      seafoam: '#B8E6D5',
      sageGreen: '#C5E8D0',
      skyBlue: '#D4F1F4',

      // Accents
      tealAccent: '#2A9D8F',
      emerald: '#00BFA6',
      azure: '#457B9D',

      // Alerts
      sunsetCoral: '#F4A261',
      amberGlow: '#FFD97D',
      roseWarning: '#F08080',
      crimsonAlert: '#E76F51',

      // Neutrals
      cloudWhite: '#F8FFFE',
      mistGray: '#E8F4F8',
      slateText: '#2C3E50',
      fogGray: '#6B8E9F',
      lightBg: '#F0F7F4',
    },

    space: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '24px',
      6: '32px',
      7: '48px',
      8: '64px',
      9: '96px',
    },

    fontSizes: {
      xs: '11px',
      sm: '13px',
      md: '15px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '48px',
      '4xl': '64px',
    },

    fonts: {
      heading: '"Poppins", system-ui, sans-serif',
      body: '"Inter", system-ui, sans-serif',
      mono: '"Fira Code", monospace',
    },

    fontWeights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    radii: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },

    shadows: {
      sm: '0 2px 8px rgba(0,0,0,0.04)',
      md: '0 4px 16px rgba(0,0,0,0.08)',
      lg: '0 8px 32px rgba(0,0,0,0.12)',
      glow: '0 4px 24px rgba(42,157,143,0.35)',
      alertGlow: '0 4px 24px rgba(231,111,81,0.2)',
    },

    transitions: {
      fast: '150ms ease',
      normal: '250ms ease',
      slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  media: {
    mobile: '(max-width: 768px)',
    tablet: '(min-width: 769px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)',
  },

  utils: {
    gradient: (value) => ({
      background: `linear-gradient(${value})`,
    }),
    size: (value) => ({
      width: value,
      height: value,
    }),
  },
});

// Global Styles
export const globalStyles = globalCss({
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  html: {
    scrollBehavior: 'smooth',
  },
  body: {
    fontFamily: '$body',
    color: '$slateText',
    backgroundColor: '$lightBg',
    WebkitFontSmoothing: 'antialiased',
  },
  'h1, h2, h3, h4, h5, h6': {
    fontFamily: '$heading',
  },
  a: {
    textDecoration: 'none',
    color: 'inherit',
  },
  button: {
    cursor: 'pointer',
    border: 'none',
    fontFamily: '$body',
  },
});