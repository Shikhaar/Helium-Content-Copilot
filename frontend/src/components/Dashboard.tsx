'use client';
import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { AnalyzeResponse, Brand, PerformanceSummary } from '../lib/types';

interface DashboardProps {
  brand: Brand | null;
  productsCount?: number;
  performance: PerformanceSummary | null;
  analyzeResult: AnalyzeResponse | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onViewOpportunity: (id: string) => void;
  onViewCalendar: () => void;
  scheduledCount: number;
}

function MetricItem({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <div className="metrics-strip-item">
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function AnalyzingState({ brandName, step }: { brandName: string; step: number }) {
  const steps = [
    'Reviewing brand context',
    'Analysing content performance',
    'Identifying opportunities',
    'Scoring recommendations',
    'Finalising results',
  ];
  return (
    <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Analysing {brandName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Calculated from 25 historical posts and 8 catalog products
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: i < step ? 'var(--green)' : i === step ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${i < step ? 'var(--green)' : i === step ? 'var(--accent-border)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              {i < step && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
              {i === step && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
            </div>
            <span style={{
              fontSize: 13, color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: i === step ? 500 : 400, transition: 'color 0.3s ease',
            }}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({
  brand, productsCount, performance, analyzeResult, isAnalyzing, onAnalyze, onViewOpportunity, onViewCalendar, scheduledCount,
}: DashboardProps) {
  const [loadingStep, setLoadingStep] = React.useState(0);

  React.useEffect(() => {
    if (!isAnalyzing) { setLoadingStep(0); return; }
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step < 4) setLoadingStep(step);
      else clearInterval(iv);
    }, 750);
    return () => clearInterval(iv);
  }, [isAnalyzing]);

  const brandName = brand?.name || 'SNITCH';
  const topOpp = analyzeResult?.opportunities[0];
  const otherOpps = analyzeResult?.opportunities.slice(1) || [];
  const totalPosts = performance?.total_posts ?? 25;
  const prodCount  = productsCount ?? 8;
  const avgEr      = performance ? `${performance.brand_avg_engagement_rate.toFixed(1)}%` : '4.8%';

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          What should {brandName} post next?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          The strongest opportunities based on what has worked, what's selling, and what's relevant now.
        </p>
      </div>

      {/* Metrics Strip — single information band, light borders */}
      <div className="metrics-strip" style={{ marginBottom: 24 }}>
        <MetricItem value={prodCount}    label="Products"      sub="In catalog" />
        <MetricItem value={totalPosts}   label="Posts analysed" sub="Historical" />
        <MetricItem value={avgEr}        label="Avg engagement" sub="Feed posts" />
        <MetricItem value={scheduledCount} label="Scheduled"   sub="This week" />
      </div>

      {/* Demo mode */}
      {analyzeResult?.is_demo && (
        <div style={{ marginBottom: 20 }}>
          <span className="demo-banner">Demo mode · No API key configured</span>
        </div>
      )}

      {/* Main Content Area */}
      {!analyzeResult && !isAnalyzing ? (
        /* Empty state */
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '40px 36px', background: 'var(--bg-card)' }}>
          <div className="label" style={{ marginBottom: 12 }}>Content Intelligence</div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Find your next best opportunity
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 480, marginBottom: 28 }}>
            Analyses {totalPosts} historical posts and {prodCount} products to surface the strongest content
            opportunities — ranked by calculated impact score.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button id="find-opportunities-btn" className="btn-primary" onClick={onAnalyze} style={{ fontSize: 13, padding: '10px 22px' }}>
              Find Content Opportunities
            </button>
            <button className="btn-secondary" onClick={onViewCalendar}>
              View Calendar
            </button>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '32px 36px', background: 'var(--bg-card)' }}>
          <AnalyzingState brandName={brandName} step={loadingStep} />
        </div>
      ) : (
        <>
          {/* ── HERO OPPORTUNITY — full-width decision brief ─────────── */}
          {topOpp && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="label">Your next best opportunity</div>
                <button className="btn-ghost" onClick={onAnalyze} style={{ fontSize: 11, gap: 4 }}>
                  <RefreshCw size={11} /> Re-analyse
                </button>
              </div>

              <div
                id="hero-opportunity-card"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                  overflow: 'hidden',
                }}
                onClick={() => onViewOpportunity(topOpp.id)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                {/* Card top: format pills + score */}
                <div style={{ padding: '22px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">{topOpp.format}</span>
                    <span className="badge badge-neutral">{topOpp.platform}</span>
                    {topOpp.is_demo && <span className="demo-banner">Demo</span>}
                  </div>
                  {/* Score — anchored top-right, labelled */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                      Recommendation score
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {topOpp.score}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/100</span>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 600, marginTop: 2, letterSpacing: '0.03em',
                      color: topOpp.score >= 90 ? 'var(--green)' : topOpp.score >= 75 ? 'var(--amber)' : 'var(--text-muted)',
                    }}>
                      {topOpp.score >= 90 ? 'High confidence' : topOpp.score >= 75 ? 'Good confidence' : 'Moderate'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                      Based on {totalPosts} posts · {prodCount} products
                    </div>
                  </div>
                </div>

                {/* Title — serif */}
                <div style={{ padding: '14px 24px 0' }}>
                  <h2
                    className="serif-heading"
                    style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 10, maxWidth: 520, lineHeight: 1.3 }}
                  >
                    {topOpp.title}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 540, marginBottom: 0 }}>
                    {topOpp.why}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border)', margin: '18px 0 0' }} />

                {/* Evidence row — 4 signal scores */}
                {topOpp.score_breakdown && (
                  <div className="evidence-grid">
                    {[
                      { main: '8.8%', sub: `${topOpp.format} engagement`, label: 'Historical', score: topOpp.score_breakdown.historical, max: 25 },
                      { main: '14.2K', sub: 'Product views', label: 'Product', score: topOpp.score_breakdown.product, max: 25 },
                      { main: '1,050', sub: 'Product sales', label: 'Demand', score: topOpp.score_breakdown.product, max: 25 },
                      { main: brand?.campaign || 'Summer 2026', sub: 'Campaign focus', label: 'Seasonal', score: topOpp.score_breakdown.seasonal, max: 15 },
                    ].map(s => (
                      <div key={s.label} className="evidence-item">
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                          {s.main}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.3 }}>
                          {s.sub}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {s.label} · {s.score}/{s.max}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA row */}
                <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-primary"
                    onClick={e => { e.stopPropagation(); onViewOpportunity(topOpp.id); }}
                    style={{ fontSize: 13, borderRadius: 6 }}
                  >
                    See why this is recommended →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── OTHER OPPORTUNITIES ─────────────────────────────────── */}
          {otherOpps.length > 0 && (
            <div>
              <div className="label" style={{ marginBottom: 12 }}>Other Opportunities</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', overflow: 'hidden' }}>
                {otherOpps.map((opp, i) => (
                  <div
                    key={opp.id}
                    id={`opportunity-row-${i + 2}`}
                    onClick={() => onViewOpportunity(opp.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 20px',
                      borderBottom: i < otherOpps.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                      width: 24, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                    }}>
                      {String(i + 2).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.01em' }}>
                        {opp.title}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{opp.format.toUpperCase()}</span>
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{opp.platform.toUpperCase()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                          {opp.score}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 1 }}>/100</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-primary)' }}>→</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
