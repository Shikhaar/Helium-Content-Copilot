'use client';
import React from 'react';
import { ArrowLeft, Wand2, BarChart2, Users, Calendar, Target, TrendingUp } from 'lucide-react';
import type { Opportunity, Product } from '@/lib/types';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  product: Product | null;
  onBack: () => void;
  onGenerate: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#22c55e' : score >= 75 ? '#f59e0b' : '#6c63ff';
  const label = score >= 90 ? 'HIGH OPPORTUNITY' : score >= 75 ? 'GOOD OPPORTUNITY' : 'MODERATE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="55" cy="55" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>/100</div>
        </div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: score >= 90 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
        border: `1px solid ${score >= 90 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
        borderRadius: 6, padding: '4px 10px',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em' }}>{label}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', width: 80, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: color,
          width: `${(score / max) * 100}%`,
          transition: 'width 0.8s ease',
        }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: 40, textAlign: 'right' }}>
        {score}/{max}
      </div>
    </div>
  );
}

function SignalCard({ icon: Icon, title, body, color }: {
  icon: React.ElementType; title: string; body: string; color: string;
}) {
  return (
    <div className="signal-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={color} strokeWidth={2} />
        <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{body}</p>
    </div>
  );
}

export default function OpportunityDetail({ opportunity, product, onBack, onGenerate }: OpportunityDetailProps) {
  const { score_breakdown: bd } = opportunity;

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} />
          Back
        </button>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Content Opportunity</span>
      </div>

      {/* Hero Section */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Left: Score Ring */}
          <div style={{ flexShrink: 0 }} className="score-animate">
            <ScoreRing score={opportunity.score} />
          </div>

          {/* Right: Details */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {opportunity.platform} · {opportunity.format}
              </span>
              {opportunity.is_demo && (
                <div className="demo-banner" style={{ fontSize: 10, padding: '2px 7px' }}>DEMO</div>
              )}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 14 }}>
              {opportunity.title}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {[opportunity.audience, opportunity.objective, opportunity.format].map(tag => (
                <span key={tag} style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 6,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Confidence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: opportunity.confidence === 'High' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                color: opportunity.confidence === 'High' ? '#22c55e' : '#f59e0b',
                border: `1px solid ${opportunity.confidence === 'High' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }}>
                {opportunity.confidence} Confidence
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opportunity.confidence_reason}</span>
            </div>

            <button id="generate-content-btn" className="btn-primary" onClick={onGenerate} style={{ fontSize: 14, padding: '11px 24px' }}>
              <Wand2 size={15} />
              Generate Content
            </button>
          </div>
        </div>
      </div>

      {/* Why This Recommendation */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Why this recommendation?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
          {opportunity.why}
        </p>

        {/* 5 signals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SignalCard icon={BarChart2} title="Historical Signal" body={opportunity.historical_signal} color="var(--accent-light)" />
          <SignalCard icon={TrendingUp} title="Product Signal" body={opportunity.product_signal} color="#22c55e" />
          <SignalCard icon={Users} title="Audience Signal" body={opportunity.audience_signal} color="#f59e0b" />
          <SignalCard icon={Calendar} title="Seasonal Signal" body={opportunity.seasonal_signal} color="#e879f9" />
          <SignalCard icon={Target} title="Business Signal" body={opportunity.business_signal} color="#38bdf8" />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
          Score Breakdown
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BreakdownBar label="Historical" score={bd.historical} max={25} color="var(--accent)" />
          <BreakdownBar label="Product" score={bd.product} max={25} color="#22c55e" />
          <BreakdownBar label="Audience" score={bd.audience} max={20} color="#f59e0b" />
          <BreakdownBar label="Seasonal" score={bd.seasonal} max={15} color="#e879f9" />
          <BreakdownBar label="Objective" score={bd.objective} max={15} color="#38bdf8" />
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-light)' }}>
              {opportunity.score} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Product */}
      {product && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Suggested Product</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {product.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                {product.description}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.features.map(f => (
                  <span key={f} style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 4,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{product.price_inr.toLocaleString()}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 4,
                color: product.inventory_status === 'In Stock' ? '#22c55e' : product.inventory_status === 'Low Stock' ? '#f59e0b' : '#ef4444',
              }}>
                {product.inventory_status}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                {product.views.toLocaleString()} views · {product.sales.toLocaleString()} sales
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 40 }} />
      <button className="btn-primary" onClick={onGenerate} style={{ fontSize: 15, padding: '13px 32px' }}>
        <Wand2 size={16} />
        Generate Content for This Opportunity
      </button>
    </div>
  );
}
