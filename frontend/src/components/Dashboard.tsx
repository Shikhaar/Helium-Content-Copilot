'use client';
import React from 'react';
import { RefreshCw, TrendingUp, Shirt, Users, Calendar } from 'lucide-react';
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

function InstagramIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
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
  brand,
  productsCount,
  performance,
  analyzeResult,
  isAnalyzing,
  onAnalyze,
  onViewOpportunity,
  onViewCalendar,
  scheduledCount,
}: DashboardProps) {
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [isInstagramClicked, setIsInstagramClicked] = React.useState(false);

  const handleConnectInstagram = () => {
    setIsInstagramClicked(true);
    setTimeout(() => {
      setIsInstagramClicked(false);
    }, 2800);
  };

  React.useEffect(() => {
    if (!isAnalyzing) {
      setLoadingStep(0);
      return;
    }
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
  const prodCount = productsCount ?? 8;
  const avgEr = performance ? `${performance.brand_avg_engagement_rate.toFixed(1)}%` : '4.8%';

  // ── Dynamically compute insights from active performance & brand data ─────
  const brandAvgErVal = performance?.brand_avg_engagement_rate ?? 4.8;
  const topFormat = performance?.top_performing_format || 'Reel';
  const formatStats = performance?.by_format?.find(f => f.format === topFormat);
  const topFormatEr = formatStats?.avg_engagement_rate ?? (topFormat === 'Reel' ? 8.8 : 7.2);
  const formatMultiplier = (topFormatEr / Math.max(brandAvgErVal, 0.1)).toFixed(1);

  const topAudience = performance?.top_performing_audience || brand?.audience?.interests?.[0] || 'Young Millennial';
  const audienceStats = performance?.by_audience?.find(a => a.audience === topAudience);
  const audienceEr = audienceStats?.avg_engagement_rate ? `${audienceStats.avg_engagement_rate.toFixed(1)}%` : '5.8%';

  const activeCampaign = brand?.campaign || 'Summer 2026';

  const dynamicInsights = [
    {
      id: 'format-winner',
      icon: TrendingUp,
      title: `${topFormat}s are winning`,
      description: `${topFormat} posts get ${formatMultiplier}× more engagement (${topFormatEr.toFixed(1)}%) than brand avg (${brandAvgErVal.toFixed(1)}%).`,
    },
    {
      id: 'campaign-momentum',
      icon: Shirt,
      title: `${activeCampaign} momentum`,
      description: `High seasonal demand and catalog velocity for active ${activeCampaign} collection.`,
    },
    {
      id: 'audience-affinity',
      icon: Users,
      title: `${topAudience} affinity`,
      description: `Target segment drives ${audienceEr} average interaction across recent feed posts.`,
    },
    {
      id: 'publishing-cadence',
      icon: Calendar,
      title: scheduledCount > 0 ? `${scheduledCount} posts scheduled` : 'Best days to post',
      description: scheduledCount > 0
        ? `Publishing target on track. Recommended posting windows: Wed, Thu, Sat.`
        : `Wed, Thu, Sat show 20–30% higher engagement historically.`,
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          What should {brandName} post next?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          The strongest opportunities based on what has worked, what's selling, and what's relevant now.
        </p>
      </div>

      {/* Metrics Strip — full width top bar */}
      <div className="metrics-strip" style={{ marginBottom: 24 }}>
        <MetricItem value={prodCount} label="Products" sub="In catalog" />
        <MetricItem value={totalPosts} label="Posts analysed" sub="Historical" />
        <MetricItem value={avgEr} label="Avg engagement" sub="Feed posts" />
        <MetricItem value={scheduledCount} label="Scheduled" sub="This week" />
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
        /* ── 2-Column Dashboard Grid: Opportunities on Left, Insights & Instagram on Right ── */
        <div className="dashboard-grid-layout">
          {/* ── Left Column: Opportunities ────────────────────────────────────────── */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* HERO OPPORTUNITY */}
            {topOpp && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 28,
                    marginBottom: 10,
                  }}
                >
                  <div className="label">YOUR NEXT BEST OPPORTUNITY</div>
                  <button className="btn-ghost" onClick={onAnalyze} style={{ fontSize: 11, gap: 4, padding: '4px 8px' }}>
                    <RefreshCw size={11} /> Re-analyse
                  </button>
                </div>

                <div
                  id="hero-opportunity-card"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                    overflow: 'hidden',
                  }}
                  onClick={() => onViewOpportunity(topOpp.id)}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                >
                  {/* Card top: format pills + score */}
                  <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-neutral">{topOpp.format}</span>
                      <span className="badge badge-neutral">{topOpp.platform}</span>
                      {topOpp.is_demo && <span className="demo-banner">Demo</span>}
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Recommendation score
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--brown-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                          {topOpp.score}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/100</span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          marginTop: 2,
                          letterSpacing: '0.03em',
                          color: topOpp.score >= 90 ? 'var(--green)' : topOpp.score >= 75 ? 'var(--amber)' : 'var(--text-muted)',
                        }}
                      >
                        {topOpp.score >= 90 ? 'High confidence' : topOpp.score >= 75 ? 'Good confidence' : 'Moderate'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                        Based on {totalPosts} posts · {prodCount} products
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ padding: '8px 24px 0' }}>
                    <h2
                      className="serif-heading"
                      style={{ fontSize: 23, color: 'var(--text-primary)', marginBottom: 8, maxWidth: 520, lineHeight: 1.3 }}
                    >
                      {topOpp.title}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 540, marginBottom: 0 }}>
                      {topOpp.why}
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)', margin: '18px 0 0' }} />

                  {/* Evidence row */}
                  {topOpp.score_breakdown && (
                    <div className="evidence-grid">
                      {[
                        { main: '8.8%', sub: 'Reel engagement', label: 'Historical', score: topOpp.score_breakdown.historical, max: 25 },
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
                  <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', background: 'rgba(238, 231, 220, 0.25)', borderTop: '1px solid var(--border)' }}>
                    <button
                      className="btn-primary"
                      onClick={e => {
                        e.stopPropagation();
                        onViewOpportunity(topOpp.id);
                      }}
                      style={{ fontSize: 13, borderRadius: 6, padding: '7px 16px' }}
                    >
                      See why this is recommended →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OTHER OPPORTUNITIES */}
            {otherOpps.length > 0 && (
              <div>
                <div className="label" style={{ marginBottom: 10 }}>OTHER OPPORTUNITIES</div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
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
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          width: 24,
                          flexShrink: 0,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
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
          </div>

          {/* ── Right Column: Insights & Instagram Connect Card ─────────────────── */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header sitting on identical horizontal baseline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 28,
                marginBottom: 10,
              }}
            >
              <div className="label">THIS WEEK'S INSIGHTS</div>
            </div>

            {/* THIS WEEK'S INSIGHTS CARD */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'var(--surface)',
                padding: '20px 20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {dynamicInsights.map(insight => {
                  const Icon = insight.icon;
                  return (
                    <div key={insight.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: 'rgba(238, 231, 220, 0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'var(--brown-dark)',
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {insight.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {insight.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONNECT INSTAGRAM PROMPT CARD (Bottom of Right Rail) */}
            <div
              style={{
                padding: '16px 18px',
                background: 'rgba(238, 231, 220, 0.55)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  marginBottom: 3,
                  letterSpacing: '-0.01em',
                }}
              >
                Want more personalised insights?
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  marginBottom: 12,
                }}
              >
                Connect your Instagram account
              </div>
              <button
                onClick={handleConnectInstagram}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '7px 12px',
                  background: isInstagramClicked ? 'var(--brown-soft)' : 'var(--surface)',
                  border: `1px solid ${isInstagramClicked ? 'var(--brown-primary)' : 'var(--border)'}`,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: isInstagramClicked ? 'var(--brown-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={e => {
                  if (!isInstagramClicked) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isInstagramClicked) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  }
                }}
              >
                <InstagramIcon size={14} color={isInstagramClicked ? 'var(--brown-primary)' : 'var(--text-primary)'} />
                <span>{isInstagramClicked ? 'Coming Soon' : 'Connect Instagram'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
