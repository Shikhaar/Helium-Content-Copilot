'use client';
import React from 'react';
import type { Brand, PerformanceSummary, Product } from '@/lib/types';

interface BrandViewProps {
  brand: Brand | null;
  products: Product[];
  performance: PerformanceSummary | null;
}

export default function BrandView({ brand, products, performance }: BrandViewProps) {
  if (!brand) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 40 }} />
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Brand Context
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          The seed data that powers your content recommendations.
        </p>
        <div className="demo-banner" style={{ marginTop: 10 }}>
          SNITCH-inspired synthetic demo data · Not affiliated with SNITCH™
        </div>
      </div>

      {/* Brand */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{brand.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Active campaign: {brand.campaign}</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
          {brand.description}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {brand.tone.map(t => (
            <span key={t} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 6,
              background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
              color: 'var(--accent-light)',
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="signal-card">
            <div className="label" style={{ marginBottom: 6 }}>Target Audience</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {brand.audience.age_range} · {brand.audience.location}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {brand.audience.interests.map(i => (
                <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 7px', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border)' }}>{i}</span>
              ))}
            </div>
          </div>
          {performance && (
            <div className="signal-card">
              <div className="label" style={{ marginBottom: 6 }}>Top Performing Format</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 3 }}>
                {performance.top_performing_format}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Top audience: {performance.top_performing_audience}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance table */}
      {performance && (
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Synthetic Post Performance
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {performance.total_posts} posts · Brand avg {performance.brand_avg_engagement_rate.toFixed(1)}% ER
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {performance.by_format.map(f => (
              <div key={f.format} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', width: 100, flexShrink: 0 }}>{f.format}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: 'var(--accent)',
                    width: `${(f.avg_engagement_rate / 12) * 100}%`,
                  }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', width: 60, textAlign: 'right' }}>
                  {f.avg_engagement_rate.toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 55 }}>
                  ({f.post_count} posts)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
          Product Catalog ({products.length} items)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{
              padding: '14px 16px', border: '1px solid var(--border)',
              borderRadius: 8, background: 'var(--bg-secondary)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {p.name}
                </div>
                <div style={{
                  fontSize: 11, color: p.inventory_status === 'In Stock' ? '#22c55e' : p.inventory_status === 'Low Stock' ? '#f59e0b' : '#ef4444',
                  fontWeight: 600, flexShrink: 0, marginLeft: 8,
                }}>
                  {p.inventory_status}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {p.category} · ₹{p.price_inr.toLocaleString()} · {p.season}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>👁 {p.views.toLocaleString()}</span>
                <span>🛒 {p.sales.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
