'use client';
import { TrendingUp, FileText, BarChart2, Calendar } from 'lucide-react';
import type { AnalyzeResponse, Brand, PerformanceSummary } from '@/lib/types';

interface DashboardProps {
  brand: Brand | null;
  performance: PerformanceSummary | null;
  analyzeResult: AnalyzeResponse | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onViewOpportunity: (id: string) => void;
  onViewCalendar: () => void;
  scheduledCount: number;
}

function MetricCard({ label, value, icon: Icon, subtitle }: {
  label: string; value: string | number; icon: React.ElementType; subtitle?: string;
}) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color="var(--accent-light)" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 75 ? '#f59e0b' : '#9090b0';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: score >= 90 ? 'rgba(34,197,94,0.1)' : score >= 75 ? 'rgba(245,158,11,0.1)' : 'rgba(144,144,176,0.1)',
      border: `1px solid ${score >= 90 ? 'rgba(34,197,94,0.25)' : score >= 75 ? 'rgba(245,158,11,0.25)' : 'rgba(144,144,176,0.25)'}`,
      borderRadius: 999, padding: '3px 10px',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/100</span>
    </div>
  );
}

function LoadingStep({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: i < currentStep ? 'var(--accent)' : i === currentStep ? 'var(--accent-subtle)' : 'var(--border)',
            border: i === currentStep ? '2px solid var(--accent)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}>
            {i < currentStep && <span style={{ fontSize: 10, color: '#fff' }}>✓</span>}
            {i === currentStep && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
            )}
          </div>
          <span style={{
            fontSize: 13,
            color: i <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: i === currentStep ? 500 : 400,
            transition: 'color 0.3s ease',
          }}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

const LOADING_STEPS = [
  'Reviewing brand context...',
  'Analysing recent content performance...',
  'Identifying content opportunities...',
  'Scoring opportunities...',
  'Building your recommendations...',
];

export default function Dashboard({
  brand, performance, analyzeResult, isAnalyzing, onAnalyze, onViewOpportunity, onViewCalendar, scheduledCount,
}: DashboardProps) {
  const [loadingStep, setLoadingStep] = React.useState(0);

  React.useEffect(() => {
    if (!isAnalyzing) { setLoadingStep(0); return; }
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length - 1) setLoadingStep(step);
      else clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 22 ? 'Good evening' : 'Good night';

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {greeting}, Shikhar. <span className="waving-hand">👋</span>
          </h1>
          {analyzeResult?.is_demo && (
            <div className="demo-banner">
              <span style={{ fontSize: 10 }}>●</span>
              Demo mode · No API key configured
            </div>
          )}
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Here's what your AI Content Copilot recommends for this week.
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        <MetricCard label="Products" value={8} icon={TrendingUp} subtitle="In catalog" />
        <MetricCard label="Historical Posts" value={25} icon={FileText} subtitle="Analysed" />
        <MetricCard
          label="Avg Engagement"
          value={performance ? `${performance.brand_avg_engagement_rate.toFixed(1)}%` : '4.8%'}
          icon={BarChart2}
          subtitle="Feed posts"
        />
        <MetricCard label="Scheduled" value={scheduledCount} icon={Calendar} subtitle="This week" />
      </div>

      {/* Main CTA */}
      <div className="card" style={{ padding: 36, marginBottom: 36 }}>
        {!analyzeResult && !isAnalyzing ? (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
              What should {brand?.name || 'SNITCH'} post next?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6, maxWidth: 520 }}>
              We've analysed your products, audience, and recent content performance.
              Click below to see your top content opportunities — ranked by potential impact.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button id="find-opportunities-btn" className="btn-primary" onClick={onAnalyze} style={{ fontSize: 15, padding: '12px 28px' }}>
                Find Content Opportunities
              </button>
              <button className="btn-secondary" onClick={onViewCalendar}>
                <Calendar size={15} />
                View Calendar
              </button>
            </div>
          </div>
        ) : isAnalyzing ? (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>
              Analysing {brand?.name || 'SNITCH'}...
            </h2>
            <LoadingStep steps={LOADING_STEPS} currentStep={loadingStep} />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Your Top Content Opportunities
              </h2>
              <button className="btn-ghost" onClick={onAnalyze} style={{ fontSize: 12 }}>
                Refresh ↺
              </button>
            </div>
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analyzeResult?.opportunities.map((opp, i) => (
                <div
                  key={opp.id}
                  id={`opportunity-card-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 18px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => onViewOpportunity(opp.id)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'var(--accent-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {opp.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {opp.platform} · {opp.format} · {opp.audience}
                    </div>
                  </div>
                  <ScorePill score={opp.score} />
                  <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>›</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Needed for useEffect and useState
import React from 'react';
