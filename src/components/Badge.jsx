import { styled } from '../stitches.config';

export const SeverityBadge = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '$1 $3',
  borderRadius: '$full',
  fontSize: '$xs',
  fontWeight: '$bold',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',

  variants: {
    level: {
      critical: {
        background: 'rgba(231,111,81,0.15)',
        color: '$crimsonAlert',
        border: '1px solid rgba(231,111,81,0.3)',
      },
      high: {
        background: 'rgba(240,128,128,0.15)',
        color: '$roseWarning',
        border: '1px solid rgba(240,128,128,0.3)',
      },
      moderate: {
        background: 'rgba(244,162,97,0.15)',
        color: '$sunsetCoral',
        border: '1px solid rgba(244,162,97,0.3)',
      },
      low: {
        background: 'rgba(0,191,166,0.12)',
        color: '$emerald',
        border: '1px solid rgba(0,191,166,0.3)',
      },
    },
  },
});