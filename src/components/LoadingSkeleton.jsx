// src/components/LoadingSkeleton.jsx
// A simple shimmer loading skeleton used while the map data is being fetched.
// It matches the size of the map container to avoid layout shifts.

import { styled, keyframes } from '../stitches.config';

const shimmer = keyframes({
  '0%': { backgroundPosition: ' -200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

const SkeletonBox = styled('div', {
  width: '100%',
  height: '400px', // same height as the map component
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite ease-in-out`,
  borderRadius: '$md',
});

export const LoadingSkeleton = () => <SkeletonBox />;

export default LoadingSkeleton;
