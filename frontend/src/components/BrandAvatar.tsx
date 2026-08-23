'use client';
import React from 'react';

/**
 * Maps known brand IDs or names to their official SVG logo assets in /public/brands/
 */
export function getBrandLogo(brandId?: string, brandName?: string): string | null {
  const key = `${brandId || ''} ${brandName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key.includes('blissclub') || key.includes('bliss')) {
    return '/brands/blissclub.svg';
  }
  if (key.includes('snitch')) {
    return '/brands/snitch.svg';
  }
  if (key.includes('souled') || key.includes('tss') || key.includes('thesouledstore')) {
    return '/brands/souled_store.svg';
  }
  return null;
}

export function getBrandMonogram(name: string): string {
  if (!name) return 'B';
  const clean = name.trim().replace(/^(THE|A)\s+/i, '');
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

interface BrandAvatarProps {
  brandId?: string;
  brandName?: string;
  size?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function BrandAvatar({
  brandId,
  brandName = '',
  size = 30,
  borderRadius,
  style,
  className,
}: BrandAvatarProps) {
  const logoSrc = getBrandLogo(brandId, brandName);
  const [imgError, setImgError] = React.useState(false);
  const radius = borderRadius ?? Math.max(5, Math.round(size * 0.22));

  if (logoSrc && !imgError) {
    return (
      <img
        src={logoSrc}
        alt={`${brandName || brandId} logo`}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          display: 'block',
          ...style,
        }}
        className={className}
      />
    );
  }

  const monogram = getBrandMonogram(brandName || brandId || 'B');

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'var(--brown-dark, #43291D)',
        color: 'var(--surface, #FFFCF7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(9, Math.round(size * 0.38)),
        fontWeight: 800,
        fontFamily: 'var(--font-sans)',
        flexShrink: 0,
        letterSpacing: '-0.02em',
        boxShadow: '0 1px 3px rgba(44, 24, 16, 0.15)',
        ...style,
      }}
      className={className}
    >
      {monogram}
    </div>
  );
}
