import { styled } from '../stitches.config';

export const Card = styled('div', {
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(10px)',
  borderRadius: '$xl',
  border: '1px solid $mistGray',
  boxShadow: '$md',
  padding: '$6',
  transition: 'all $normal',

  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '$lg',
  },

  variants: {
    variant: {
      glass: {
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
      },
      alert: {
        borderLeft: '6px solid $crimsonAlert',
        background: 'linear-gradient(135deg, rgba(231,111,81,0.05), rgba(248,255,254,0.9))',
      },
      stat: {
        padding: '$5',
        textAlign: 'center',
      },
    },
  },
});

export const StatCard = styled(Card, {
  padding: '$5',
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
  borderTop: '4px solid $tealAccent',
});

export const StatValue = styled('div', {
  fontFamily: '$heading',
  fontSize: '$2xl',
  fontWeight: '$bold',
  color: '$azure',
});

export const StatLabel = styled('div', {
  fontSize: '$sm',
  color: '$fogGray',
  fontWeight: '$medium',
});

export const StatChange = styled('div', {
  fontSize: '$sm',
  fontWeight: '$semibold',
  variants: {
    type: {
      up: { color: '$crimsonAlert' },
      down: { color: '$emerald' },
      neutral: { color: '$fogGray' },
    },
  },
});