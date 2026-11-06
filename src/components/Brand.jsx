import React from 'react';

/** Shared brand asset; reused from the Greenlight Power RFP project's branding. */
export default function Brand({ size = 40, light = false }) {
  const width = Math.round(size * 4.3);
  return <div className={'public-brand ' + (light ? 'on-dark' : '')}>
    <img src="/greenlight-power.png" alt="Greenlight Power" width={width} height={Math.round(size * .8)} style={{objectFit:'contain',height:'auto',maxWidth:'100%'}}/>
  </div>;
}
