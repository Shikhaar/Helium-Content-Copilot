'use client';
import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Users,
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import type { Opportunity, Product } from '../lib/types';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  product: Product | null;
  onBack: () => void;
  onGenerate: () => void;
}

/** Helper to highlight metrics (e.g., 2.1x, 9.3%, 18.2K, 1:5, #1, ₹2,499) in signal texts */
function HighlightedText({ text }: { text: string }) {
  if (!text) return null;
  // Match key metrics like 2.1x, 9.3%, 18.2K, 3.8K, 1:5, #1, ₹2,499
  const parts = text.split(/(\b\d+(?:\.\d+)?[xX%]\b|\b\d+(?:\.\d+)?[kK]\b|\b\d+:\d+\b|#\d+\b|₹\d+(?:,\d+)?)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^(\d+(?:\.\d+)?[xX%]$|\d+(?:\.\d+)?[kK]$|\d+:\d+$|#\d+$|₹\d+(?:,\d+)?$)/i.test(part)) {
          return (
            <span
              key={i}
              style={{
                fontWeight: 700,
                color: '#5A3828',
                background: '#E8D9C8',
                padding: '1px 6px',
                borderRadius: 4,
                display: 'inline-block',
                margin: '0 2px',
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

function ScoreRow({
  label,
  score,
  max,
  tag,
  icon: Icon,
}: {
  label: string;
  score: number;
  max: number;
  tag: string;
  icon: React.ElementType;
}) {
  const pct = (score / max) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 0',
        borderBottom: '1px solid #E8DED0',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon & Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px', minWidth: 180 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#E8DED0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5A3828',
            flexShrink: 0,
          }}
        >
          <Icon size={15} />
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary, #211914)', fontWeight: 600 }}>{label}</div>
        </div>
      </div>

      {/* Strength Tag */}
      <div style={{ flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '3px 8px',
            borderRadius: 4,
            background: '#E8D9C8',
            color: '#5A3828',
            display: 'inline-block',
          }}
        >
          {tag}
        </span>
      </div>

      {/* Visual Bar Gauge */}
      <div style={{ width: 140, height: 6, background: '#E8DED0', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #5A3828 0%, #7D4E38 100%)',
            width: `${pct}%`,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Numeric Score */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-primary, #211914)',
          width: 60,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {score} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted, #9A8778)' }}>/ {max}</span>
      </div>
    </div>
  );
}

function SignalCard({
  title,
  body,
  icon: Icon,
  badgeText,
}: {
  title: string;
  body: string;
  icon: React.ElementType;
  badgeText?: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '18px 20px',
        background: '#FFFCF7',
        border: '1px solid #D8C9B8',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: '#E8DED0',
                color: '#5A3828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={14} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-primary, #211914)' }}>
              {title}
            </span>
          </div>

          {badgeText && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#5A3828',
                background: '#E8D9C8',
                padding: '2px 7px',
                borderRadius: 4,
                border: '1px solid #D8C9B8',
              }}
            >
              {badgeText}
            </span>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary, #735F52)', lineHeight: 1.6, margin: 0 }}>
          <HighlightedText text={body} />
        </p>
      </div>
    </div>
  );
}

export default function OpportunityDetail({ opportunity, product, onBack, onGenerate }: OpportunityDetailProps) {
  const { score_breakdown: bd } = opportunity;
  const isTopScore = opportunity.score >= 90;
  const confText = isTopScore
    ? 'HIGH-CONFIDENCE OPPORTUNITY (TOP 5% RECOMMENDATION)'
    : opportunity.score >= 75
    ? 'STRONG-CONFIDENCE OPPORTUNITY'
    : 'MODERATE OPPORTUNITY';

  return (
    <div className="page-container fade-up" style={{ maxWidth: 980, boxSizing: 'border-box', paddingBottom: 48 }}>
      {/* ── 1. Top Navigation ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          className="btn-ghost"
          onClick={onBack}
          style={{ padding: '6px 10px', gap: 6, fontSize: 13, color: 'var(--text-secondary, #735F52)', display: 'inline-flex', alignItems: 'center' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Opportunities</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-neutral" style={{ fontSize: 11, background: '#E8DED0', color: '#43291D' }}>
            {opportunity.platform} · {opportunity.format}
          </span>
        </div>
      </div>

      {/* ── 2. Hero Opportunity Banner ──────────────────────────────── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #FFFCF7 0%, #F9F3EA 100%)',
          border: '1px solid #D8C9B8',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 4px 20px rgba(33, 25, 20, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px', minWidth: 280 }}>
            {/* Super Header Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: '#E8D9C8',
                  color: '#5A3828',
                  padding: '3px 10px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Sparkles size={12} />
                {confText}
              </span>
            </div>

            {/* Opportunity Title */}
            <h1
              className="serif-heading"
              style={{
                fontSize: 28,
                color: 'var(--text-primary, #211914)',
                lineHeight: 1.25,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              {opportunity.title}
            </h1>

            {/* Audience & Content Angle */}
            <p style={{ fontSize: 14, color: 'var(--text-secondary, #735F52)', lineHeight: 1.6, marginBottom: 16 }}>
              {opportunity.content_angle}
            </p>

            {/* Opportunity Metadata Tags (clean without emojis) */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-accent" style={{ fontSize: 11, background: '#E8D9C8', color: '#5A3828' }}>
                {opportunity.audience}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: 11, background: '#E8DED0', color: '#43291D' }}>
                {opportunity.objective}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: 11, background: '#E8DED0', color: '#43291D' }}>
                {opportunity.format} on {opportunity.platform}
              </span>
              {opportunity.is_demo && <span className="demo-banner">Demo Mode</span>}
            </div>
          </div>

          {/* Large Hero Score Card */}
          <div
            style={{
              flexShrink: 0,
              background: '#FFFCF7',
              border: '1px solid #D8C9B8',
              borderRadius: 10,
              padding: '20px 24px',
              textAlign: 'center',
              minWidth: 170,
              boxShadow: '0 8px 24px rgba(90, 56, 40, 0.06)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted, #9A8778)', textTransform: 'uppercase', marginBottom: 4 }}>
              TOTAL SCORE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <span
                className="score-number score-animate"
                style={{ fontSize: 44, fontWeight: 800, color: '#5A3828' }}
              >
                {opportunity.score}
              </span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted, #9A8778)' }}>/100</span>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#5A3828',
                letterSpacing: '0.04em',
              }}
            >
              High Confidence
            </div>
          </div>
        </div>

        {/* ── Why we gave it this high score (Executive Highlights - All Beige Theme) ─── */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #E8DED0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#E8D9C8',
                color: '#5A3828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <CheckCircle2 size={13} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #211914)', marginBottom: 2 }}>
                Perfect Historical Signal (25/25)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #735F52)', lineHeight: 1.4 }}>
                Feature demo reels exceed brand baseline by <strong style={{ color: '#5A3828' }}>2.1x</strong> engagement.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#E8D9C8',
                color: '#5A3828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <CheckCircle2 size={13} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #211914)', marginBottom: 2 }}>
                #1 Catalog Product Relevance (25/25)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #735F52)', lineHeight: 1.4 }}>
                Directly matches top seller with high demand (<strong style={{ color: '#5A3828' }}>18.2K views</strong>).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#E8D9C8',
                color: '#5A3828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <CheckCircle2 size={13} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #211914)', marginBottom: 2 }}>
                High Audience Conversion (18/20)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #735F52)', lineHeight: 1.4 }}>
                {opportunity.audience} delivers top <strong style={{ color: '#5A3828' }}>1:5 save-to-like</strong> ratio.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Strategic Rationale Callout Card ──────────────────────── */}
      <div
        className="card"
        style={{
          background: '#FFFCF7',
          border: '1px solid #D8C9B8',
          borderLeft: '4px solid #5A3828',
          borderRadius: 8,
          padding: '22px 24px',
          marginBottom: 32,
          boxShadow: '0 2px 12px rgba(90, 56, 40, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Flame size={16} color="#5A3828" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A3828' }}>
            STRATEGIC RATIONALE & WHY THIS WINS
          </span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-primary, #211914)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
          <HighlightedText text={opportunity.why} />
        </p>
      </div>

      {/* ── 4. Detailed Score Breakdown ──────────────────────────────── */}
      <div
        className="card"
        style={{
          background: '#FFFCF7',
          border: '1px solid #D8C9B8',
          borderRadius: 10,
          padding: '24px 28px',
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div className="label" style={{ marginBottom: 4, letterSpacing: '0.08em' }}>
              RECOMMENDATION ENGINE SCORING
            </div>
            <h2 className="serif-heading" style={{ fontSize: 20, color: 'var(--text-primary, #211914)', margin: 0 }}>
              Multi-Factor Score Breakdown
            </h2>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#5A3828',
              background: '#E8D9C8',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            {opportunity.score} / 100 Overall Fit
          </span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted, #9A8778)', marginBottom: 16 }}>
          Evaluated across 5 deterministic weights based on 25 historical posts, 8 catalog items, and active campaign goals.
        </p>

        <div>
          <ScoreRow
            label="Historical Performance"
            score={bd.historical}
            max={25}
            tag="2.1x Baseline Alpha"
            icon={TrendingUp}
          />
          <ScoreRow
            label="Product Demand & Inventory"
            score={bd.product}
            max={25}
            tag="#1 In-Stock Seller"
            icon={ShoppingBag}
          />
          <ScoreRow
            label="Audience Affinity"
            score={bd.audience}
            max={20}
            tag="High Save-to-Like"
            icon={Users}
          />
          <ScoreRow
            label="Seasonal / Campaign Alignment"
            score={bd.seasonal}
            max={15}
            tag="Move in Freedom"
            icon={Calendar}
          />
          <ScoreRow
            label="Business Objective Fit"
            score={bd.objective}
            max={15}
            tag="Direct Acquisition"
            icon={Target}
          />

          {/* Total Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0 4px',
              borderTop: '2px solid #E8DED0',
              marginTop: 4,
            }}
          >
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #211914)' }}>
                Total Confidence Score
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted, #9A8778)', marginLeft: 8 }}>
                (Ranked #1 Opportunity)
              </span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: '#5A3828' }}>
              {opportunity.score} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted, #9A8778)' }}>/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Supporting Signals (5 Qualitative Pillars) ─────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 14 }}>
          <div className="label" style={{ marginBottom: 4, letterSpacing: '0.08em' }}>
            SIGNAL EVIDENCE MATRIX
          </div>
          <h2 className="serif-heading" style={{ fontSize: 20, color: 'var(--text-primary, #211914)', margin: 0 }}>
            Why The AI Selected This Format & Product
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <SignalCard
            title="Historical Signal"
            body={opportunity.historical_signal}
            icon={TrendingUp}
            badgeText="2.1x Reel Lift"
          />
          <SignalCard
            title="Product Demand"
            body={opportunity.product_signal}
            icon={ShoppingBag}
            badgeText="Top Seller"
          />
          <SignalCard
            title="Audience Fit"
            body={opportunity.audience_signal}
            icon={Users}
            badgeText="1:5 Ratio"
          />
          <SignalCard
            title="Seasonal Alignment"
            body={opportunity.seasonal_signal}
            icon={Calendar}
            badgeText="Active Campaign"
          />
          <SignalCard
            title="Business Objective"
            body={opportunity.business_signal}
            icon={Target}
            badgeText="Acquisition"
          />
        </div>
      </div>

      {/* ── 6. Suggested Product Card ────────────────────────────────── */}
      {product && (
        <div
          className="card"
          style={{
            border: '1px solid #D8C9B8',
            borderRadius: 10,
            background: '#FFFCF7',
            padding: '24px 28px',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="label" style={{ letterSpacing: '0.08em' }}>FEATURED CATALOG PRODUCT</div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#5A3828',
                background: '#E8D9C8',
                padding: '3px 8px',
                borderRadius: 4,
              }}
            >
              {product.inventory_status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #211914)', marginBottom: 6 }}>
                {product.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #735F52)', marginBottom: 14, lineHeight: 1.6 }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.features.map(f => (
                  <span
                    key={f}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#43291D',
                      background: '#E8DED0',
                      padding: '4px 9px',
                      borderRadius: 4,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing & Performance summary */}
            <div
              style={{
                textAlign: 'right',
                background: '#F9F3EA',
                border: '1px solid #D8C9B8',
                borderRadius: 8,
                padding: '16px 20px',
                flexShrink: 0,
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary, #211914)', letterSpacing: '-0.02em' }}>
                ₹{product.price_inr.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-primary, #5A3828)', marginTop: 4 }}>
                {product.category}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #9A8778)', marginTop: 6 }}>
                {product.views.toLocaleString()} views · {product.sales.toLocaleString()} sales
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Primary Action Bar ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          background: '#43291D',
          borderRadius: 10,
          padding: '18px 24px',
          color: '#FFFCF7',
          flexWrap: 'wrap',
          boxShadow: '0 8px 24px rgba(67, 41, 29, 0.16)',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, letterSpacing: '0.01em' }}>
            Ready to craft content for this opportunity?
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255, 252, 247, 0.8)' }}>
            AI will generate format-tailored copy, visual cues, scene scripts, and CTA in Content Studio.
          </div>
        </div>

        <button
          id="generate-content-btn"
          className="btn-primary"
          onClick={onGenerate}
          style={{
            fontSize: 13,
            padding: '11px 22px',
            background: '#FFFCF7',
            color: '#43291D',
            fontWeight: 700,
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <span>Craft in Content Studio</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
