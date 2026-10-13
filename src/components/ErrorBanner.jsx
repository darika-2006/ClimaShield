// src/components/ErrorBanner.jsx
import React from 'react';
import { styled } from '../stitches.config';
import { X } from 'lucide-react';

const Banner = styled('div', {
  background: '$crimsonAlert',
  color: 'white',
  padding: '$4',
  borderRadius: '$md',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '$4',
});

export const ErrorBanner = ({ message, onClose }) => (
  <Banner>
    <span>{message}</span>
    {onClose && (
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} aria-label="Close">
        <X size={16} />
      </button>
    )}
  </Banner>
);

export default ErrorBanner;
