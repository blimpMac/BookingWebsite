import React from 'react';
export default function Brand({ size = 40, light = false }) {
  return (
    <div className={'public-brand ' + (light ? 'on-dark' : '')}>
      <img src="/brand.svg" alt="Greenlight Booking logo" width={size} height={size} />
      <span><strong>greenlight</strong><small>BOOKING PORTAL</small></span>
    </div>
  );
}
