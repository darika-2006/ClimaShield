import { styled, keyframes } from '../stitches.config';

const shimmer = keyframes({
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

export const Button = styled('button', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  padding: '$3 $5',
  borderRadius: '$md',
  fontSize: '$md',
  fontWeight: '$semibold',
  transition: 'all $fast',
  border: 'none',
  cursor: 'pointer',

  variants: {
    variant: {
      primary: {
        gradient: '135deg, $emerald, $tealAccent',
        color: 'white',
        boxShadow: '$glow',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 32px rgba(42,157,143,0.5)',
        },
        '&:active': { transform: 'scale(0.98)' },
      },
      secondary: {
        background: 'transparent',
        color: '$tealAccent',
        border: '2px solid $tealAccent',
        '&:hover': {
          background: 'rgba(42,157,143,0.08)',
        },
      },
      danger: {
        background: '$crimsonAlert',
        color: 'white',
        '&:hover': { opacity: 0.9 },
      },
      ghost: {
        background: 'transparent',
        color: '$tealAccent',
        '&:hover': {
          background: 'rgba(42,157,143,0.06)',
          textDecoration: 'underline',
        },
      },
    },
    size: {
      sm: { padding: '$2 $3', fontSize: '$sm' },
      md: { padding: '$3 $5', fontSize: '$md' },
      lg: { padding: '$4 $7', fontSize: '$lg', borderRadius: '$lg' },
    },
    fullWidth: {
      true: { width: '100%' },
    },
    loading: {
      true: {
        opacity: 0.8,
        pointerEvents: 'none',
        background: 'linear-gradient(90deg, $tealAccent 25%, $emerald 50%, $tealAccent 75%)',
        backgroundSize: '200% 100%',
        animation: `${shimmer} 1.5s infinite`,
      },
    },
  },

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});