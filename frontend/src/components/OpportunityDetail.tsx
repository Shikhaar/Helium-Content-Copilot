'use client';
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Opportunity, Product } from '../lib/types';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  product: Product | null;
  onBack: () => void;
  onGenerate: () => void;
}

function ScoreRow({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
      <div style={{ width: 120, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: pct >= 90 ? 'var(--green)' : pct >= 70 ? 'var(--accent)' : 'var(--border-focus)',
          width: `${pct}%`,
          transition: 'width 0.7s ease',
        }} />
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
        width: 50, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
      }}>
        {score} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/ {max}</span>
      </div>
    </div>
  );
}

function SignalRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="signal-card">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
        {title}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

export default function OpportunityDetail({ opportunity, product, onBack, onGenerate }: OpportunityDetailProps) {
  const { score_breakdown: bd } = opportunity;
  const conf     = opportunity.score >= 90 ? 'HIGH-CONFIDENCE OPPORTUNITY' : opportunity.score >= 75 ? 'GOOD-CONFIDENCE OPPORTUNITY' : 'MODERATE OPPORTUNITY';
  const confColor = opportunity.score >= 90 ? 'var(--green)' : opportunity.score >= 75 ? 'var(--amber)' : 'var(--text-muted)';

  return (
    <div className="page-container fade-up">
      {/* Back nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding: '5px 8px', gap: 5 }}>
          <ArrowLeft size={14} />
          Opportunities
        </button>
      </div>

      {/* Header section */}
      <div style={{ marginBottom: 36 }}>
        <div className="label" style={{ marginBottom: 12 }}>Why This Opportunity?</div>

        <h1
          className="serif-heading"
          style={{ fontSize: 32, maxWidth: 560, marginBottom: 16, color: 'var(--text-primary)' }}
        >
          {opportunity.title}
        </h1>

        {/* Score block */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <span className="score-number score-animate">{opportunity.score}</span>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 400 }}>/ 100</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: confColor, marginBottom: 16 }}>
          {conf}
        </div>

        {/* Context */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 500 }}>
          Calculated from {25} historical posts, {8} catalog products, and campaign context for {opportunity.audience}.
        </p>

        {/* Format tags */}
        <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">{opportunity.format}</span>
          <span className="badge badge-neutral">{opportunity.platform}</span>
          <span className="badge badge-neutral">{opportunity.audience}</span>
          {opportunity.is_demo && <span className="demo-banner">Demo</span>}
        </div>
      </div>

      <div className="divider" style={{ marginBottom: 36 }} />

      {/* Score breakdown */}
      <div style={{ marginBottom: 36 }}>
        <div className="label" style={{ marginBottom: 0 }}>Recommendation Score</div>
        <div style={{ marginTop: 0 }}>
          <ScoreRow label="Historical Performance" score={bd.historical} max={25} />
          <ScoreRow label="Product Relevance"      score={bd.product}    max={25} />
          <ScoreRow label="Audience Fit"           score={bd.audience}   max={20} />
          <ScoreRow label="Seasonal Alignment"     score={bd.seasonal}   max={15} />
          <ScoreRow label="Business Objective"     score={bd.objective}  max={15} />
          {/* Total row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0' }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Total</div>
            <div style={{ width: 120, flexShrink: 0 }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', width: 50, textAlign: 'right', letterSpacing: '-0.02em' }}>
              {opportunity.score} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" style={{ marginBottom: 36 }} />

      {/* Supporting signals (qualitative) */}
      <div style={{ marginBottom: 36 }}>
        <div className="label" style={{ marginBottom: 14 }}>Supporting Signals</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', overflow: 'hidden' }}>
          <SignalRow title="Historical Performance" body={opportunity.historical_signal} />
          <SignalRow title="Product Demand"         body={opportunity.product_signal} />
          <SignalRow title="Audience Fit"           body={opportunity.audience_signal} />
          <SignalRow title="Seasonal Alignment"     body={opportunity.seasonal_signal} />
          <SignalRow title="Business Objective"     body={opportunity.business_signal} />
        </div>
      </div>

      {/* Why summary */}
      <div style={{
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
        borderRadius: 8, padding: '20px 22px', marginBottom: 36,
      }}>
        <div className="label-olive" style={{ marginBottom: 8 }}>Strategic Rationale</div>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
          {opportunity.why}
        </p>
      </div>

      {/* Suggested product */}
      {product && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', padding: '20px 22px', marginBottom: 36 }}>
          <div className="label" style={{ marginBottom: 10 }}>Suggested Product</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                {product.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                {product.description}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.features.map(f => (
                  <span key={f} className="badge badge-neutral" style={{ fontSize: 11 }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                ₹{product.price_inr.toLocaleString()}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 4, letterSpacing: '0.02em',
                color: product.inventory_status === 'In Stock' ? 'var(--green)'
                  : product.inventory_status === 'Low Stock' ? 'var(--amber)' : 'var(--red)',
              }}>
                {product.inventory_status}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                {product.views.toLocaleString()} views · {product.sales.toLocaleString()} sales
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary CTA */}
      <button
        id="generate-content-btn"
        className="btn-primary"
        onClick={onGenerate}
        style={{ fontSize: 14, padding: '12px 28px' }}
      >
        Generate content
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
