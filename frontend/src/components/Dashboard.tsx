'use client';
import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
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
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginTop: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function ScoreDisplay({ score }: { score: number }) {
  const conf = score >= 90 ? 'High confidence' : score >= 75 ? 'Good confidence' : 'Moderate confidence';
  const confColor = score >= 90 ? 'var(--green)' : score >= 75 ? 'var(--amber)' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 3 }}>/100</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: confColor, letterSpacing: '0.02em' }}>{conf}</div>
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
          Calculated from {25} historical posts and {8} catalog products
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

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          What should {brandName} post next?
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Your strongest content opportunities based on performance, product demand, audience fit, and campaign context.
        </p>
      </div>

      {/* Metrics Strip */}
      <div className="metrics-strip">
        <MetricItem
          value={productsCount ?? 8}
          label="Products"
          sub="In catalog"
        />
        <MetricItem
          value={performance?.total_posts ?? 25}
          label="Historical Posts"
          sub="Analysed"
        />
        <MetricItem
          value={performance ? `${performance.brand_avg_engagement_rate.toFixed(1)}%` : '4.8%'}
          label="Avg Engagement"
          sub="Feed posts"
        />
        <MetricItem
          value={scheduledCount}
          label="Scheduled"
          sub="This week"
        />
      </div>

      {/* Demo mode badge */}
      {analyzeResult?.is_demo && (
        <div style={{ marginBottom: 20 }}>
          <span className="demo-banner">Demo mode · No API key configured</span>
        </div>
      )}

      {/* Main Content Area */}
      {!analyzeResult && !isAnalyzing ? (
        /* Empty state — CTA to analyse */
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '40px 36px',
          background: 'var(--bg-card)',
        }}>
          <div className="label" style={{ marginBottom: 12 }}>Content Intelligence</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Find your next best opportunity
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 480, marginBottom: 28 }}>
            We'll analyse your products, historical post performance, audience signals, and campaign context to surface the
            strongest content opportunities — ranked by their calculated impact score.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button id="find-opportunities-btn" className="btn-primary" onClick={onAnalyze} style={{ fontSize: 13, padding: '10px 22px' }}>
              Find Content Opportunities
            </button>
            <button className="btn-secondary" onClick={onViewCalendar}>
              View Calendar
            </button>
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Calculated from {performance?.total_posts ?? 25} historical posts · {productsCount ?? 8} catalog products
          </div>
        </div>
      ) : isAnalyzing ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '32px 36px', background: 'var(--bg-card)' }}>
          <AnalyzingState brandName={brandName} step={loadingStep} />
        </div>
      ) : (
        <>
          {/* Hero Opportunity */}
          {topOpp && (
            <div style={{ marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 14 }}>Your Next Best Opportunity</div>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '28px 28px 24px',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => onViewOpportunity(topOpp.id)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(24,23,20,0.06)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
                id="hero-opportunity-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {/* Format pills */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span className="badge badge-neutral">{topOpp.format}</span>
                      <span className="badge badge-neutral">{topOpp.platform}</span>
                    </div>
                    <h2
                      className="serif-heading"
                      style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12, maxWidth: 480 }}
                    >
                      {topOpp.title}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20, maxWidth: 440 }}>
                      {topOpp.why}
                    </p>
                    {/* Key stats */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
                      {topOpp.score_breakdown && (
                        <>
                          <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Historical signal</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                              {topOpp.score_breakdown.historical}/{25} pts
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Product signal</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                              {topOpp.score_breakdown.product}/{25} pts
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Audience fit</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {topOpp.score_breakdown.audience}/{20} pts
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      className="btn-primary"
                      onClick={e => { e.stopPropagation(); onViewOpportunity(topOpp.id); }}
                      style={{ fontSize: 13, padding: '9px 20px' }}
                    >
                      See why this is recommended
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <ScoreDisplay score={topOpp.score} />
                </div>
              </div>
            </div>
          )}

          {/* Other Opportunities */}
          {otherOpps.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="label">Other Opportunities</div>
                <button className="btn-ghost" onClick={onAnalyze} style={{ fontSize: 12, gap: 4 }}>
                  <RefreshCw size={12} /> Re-analyse
                </button>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', overflow: 'hidden' }}>
                {otherOpps.map((opp, i) => (
                  <div
                    key={opp.id}
                    id={`opportunity-row-${i + 2}`}
                    onClick={() => onViewOpportunity(opp.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '14px 20px',
                      borderBottom: i < otherOpps.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Rank */}
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                      width: 24, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                    }}>
                      {String(i + 2).padStart(2, '0')}
                    </div>
                    {/* Title + tags */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.01em' }}>
                        {opp.title}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{opp.format}</span>
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{opp.platform}</span>
                      </div>
                    </div>
                    {/* Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                          {opp.score}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>/100</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>View →</div>
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
