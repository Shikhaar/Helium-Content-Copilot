'use client';
import React from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
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

const BRAND_COLLAGE_IMAGES: Record<string, { main: string; top: string; bottom: string }> = {
  snitch: {
    main: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    top: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&auto=format&fit=crop&q=80',
    bottom: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
  },
  blissclub: {
    main: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    top: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop&q=80',
    bottom: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80',
  },
  souled_store: {
    main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
    top: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
    bottom: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&auto=format&fit=crop&q=80',
  },
};

const OTHER_OPP_THUMBNAILS = [
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=100&auto=format&fit=crop&q=80',
];

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
  const [showAllOpportunities, setShowAllOpportunities] = React.useState(false);

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

  // Reset expanded view when brand changes
  React.useEffect(() => {
    setShowAllOpportunities(false);
  }, [brand?.id]);

  // ── Dynamically compute insights & real-time multipliers ─────────────────
  const brandAvgErVal = performance?.brand_avg_engagement_rate ?? 4.8;

  // Dynamic calculations for Hero Opportunity
  const heroFormat = topOpp?.format || 'Reel';
  const heroFormatStat = performance?.by_format?.find(
    f => f.format.toLowerCase() === heroFormat.toLowerCase()
  );
  const heroFormatEr = heroFormatStat?.avg_engagement_rate 
    ?? (heroFormat.toLowerCase() === 'reel' ? 8.8 : heroFormat.toLowerCase() === 'carousel' ? 8.4 : 7.2);
  const heroMultiplier = (heroFormatEr / Math.max(brandAvgErVal, 0.1)).toFixed(1);

  const brandKey = (brand?.id || 'snitch').toLowerCase();
  const collage = BRAND_COLLAGE_IMAGES[brandKey] || BRAND_COLLAGE_IMAGES.snitch;

  const visibleOtherOpps = showAllOpportunities ? otherOpps : otherOpps.slice(0, 3);

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
        /* ── Full Dashboard: Hero Opportunity Banner Top + Other Opportunities Below ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* ── 1. Full-Width Hero Opportunity Card (Exact Reference Design) ── */}
          {topOpp && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div className="label">YOUR NEXT BEST OPPORTUNITY</div>
                <button className="btn-ghost" onClick={onAnalyze} style={{ fontSize: 12, gap: 5, padding: '4px 10px' }}>
                  <RefreshCw size={12} /> Re-analyse
                </button>
              </div>

              {/* Exact Magazine-Editorial Hero Card */}
              <div
                id="hero-opportunity-card"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  padding: '24px 30px',
                  boxShadow: '0 2px 8px rgba(32, 27, 23, 0.04)',
                }}
                onClick={() => onViewOpportunity(topOpp.id)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(32, 27, 23, 0.07)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(32, 27, 23, 0.04)';
                }}
              >
                <div className="hero-card-layout">
                  {/* ── Left: 3-Image Collage (210px x 200px) ── */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.9fr',
                      gap: 6,
                      width: 210,
                      height: 200,
                      borderRadius: 14,
                      overflow: 'hidden',
                      background: 'rgba(238, 231, 220, 0.4)',
                      flexShrink: 0,
                    }}
                  >
                    {/* Main large portrait on left */}
                    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                      <img
                        src={collage.main}
                        alt={`${topOpp.title} main`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Stacked 2 portraits on right */}
                    <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 6, height: '100%' }}>
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                          src={collage.top}
                          alt={`${topOpp.title} angle 1`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                          src={collage.bottom}
                          alt={`${topOpp.title} angle 2`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Center: Title, Badges, Reason, Dynamic Multipliers ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    {/* Title in large warm editorial serif */}
                    <h2
                      className="serif-heading"
                      style={{
                        fontSize: 26,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.25,
                        marginBottom: 10,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {topOpp.title}
                    </h2>

                    {/* Pill tags */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(238, 231, 220, 0.85)',
                          color: 'var(--brown-dark)',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {topOpp.objective || 'Product Education'}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(238, 231, 220, 0.85)',
                          color: 'var(--brown-dark)',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {topOpp.platform} {topOpp.format}
                      </span>
                      {topOpp.is_demo && (
                        <span className="demo-banner" style={{ margin: 0, padding: '3px 8px', fontSize: 10 }}>
                          Demo
                        </span>
                      )}
                    </div>

                    {/* Strategic qualitative reasoning */}
                    <p
                      style={{
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.55,
                        marginBottom: 16,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {topOpp.why}
                    </p>

                    {/* Dynamic Real-Time Multiplier Stats Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--green)', fontSize: 15 }}>↑</span>
                          <span>{heroFormatEr.toFixed(1)}% engagement</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Historical avg
                        </div>
                      </div>

                      <div style={{ width: 1, height: 26, background: 'var(--border)' }} />

                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {heroMultiplier}x
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          vs brand average
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Right Column: Score Pillar & Securely Contained CTA Button ── */}
                  <div
                    style={{
                      borderLeft: '1px solid var(--border)',
                      paddingLeft: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      minWidth: 230,
                      flexShrink: 0,
                    }}
                    className="hero-score-pillar"
                  >
                    <div>
                      {/* Big Serif Score */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span
                          style={{
                            fontSize: 64,
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 500,
                            color: '#343B2A',
                            lineHeight: 1,
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {topOpp.score}
                        </span>
                        <span style={{ fontSize: 18, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
                          /100
                        </span>
                      </div>

                      {/* Confidence Badge */}
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: topOpp.score >= 90 ? 'var(--green)' : topOpp.score >= 75 ? 'var(--amber)' : 'var(--text-muted)',
                          marginTop: 6,
                        }}
                      >
                        {topOpp.score >= 90 ? 'High confidence' : topOpp.score >= 75 ? 'Good confidence' : 'Moderate'}
                      </div>
                    </div>

                    {/* CTA Button — safely contained without any vertical overflow */}
                    <button
                      className="btn-primary"
                      onClick={e => {
                        e.stopPropagation();
                        onViewOpportunity(topOpp.id);
                      }}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 8,
                        padding: '11px 18px',
                        background: '#3A382C',
                        color: '#FAF8F5',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'background 0.15s ease',
                        marginTop: 16,
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#2B2A20')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#3A382C')}
                    >
                      <span>See why this is recommended</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. Lower Section: 70/30 side-by-side grid ── */}
          {otherOpps.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 0.42fr',
                gap: 20,
                alignItems: 'stretch',
              }}
            >
              {/* ── Left 70%: Other Opportunities ── */}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div className="label">OTHER OPPORTUNITIES ({otherOpps.length})</div>
                  {otherOpps.length > 3 && (
                    <button
                      onClick={() => setShowAllOpportunities(!showAllOpportunities)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brown-primary)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      {showAllOpportunities ? 'Show 3' : `View all ${otherOpps.length}`}
                      {showAllOpportunities ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden', flex: 1 }}>
                  {visibleOtherOpps.map((opp, i) => {
                    const thumbUrl = OTHER_OPP_THUMBNAILS[i % OTHER_OPP_THUMBNAILS.length];
                    const isLast = i === visibleOtherOpps.length - 1 && (!otherOpps.length || otherOpps.length <= 3 || showAllOpportunities);
                    return (
                      <div
                        key={opp.id}
                        id={`opportunity-row-${i + 2}`}
                        onClick={() => onViewOpportunity(opp.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '14px 20px',
                          borderBottom: isLast ? 'none' : '1px solid var(--border)',
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
                            width: 22,
                            flexShrink: 0,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {String(i + 2).padStart(2, '0')}
                        </div>

                        {/* 36x36px Product thumbnail */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            overflow: 'hidden',
                            background: 'rgba(238, 231, 220, 0.6)',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={thumbUrl}
                            alt={opp.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              marginBottom: 4,
                              letterSpacing: '-0.01em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {opp.title}
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <span className="badge badge-neutral" style={{ fontSize: 10 }}>{opp.format.toUpperCase()}</span>
                            <span className="badge badge-neutral" style={{ fontSize: 10 }}>{opp.platform.toUpperCase()}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                              {opp.score}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 1 }}>/100</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>→</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* View More Button */}
                  {otherOpps.length > 3 && (
                    <button
                      onClick={() => setShowAllOpportunities(!showAllOpportunities)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 252, 247, 0.75)',
                        borderTop: '1px solid var(--border)',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        color: 'var(--brown-primary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255, 252, 247, 0.75)')}
                    >
                      <span>
                        {showAllOpportunities
                          ? 'Show fewer opportunities ↑'
                          : `View ${otherOpps.length - 3} more opportunities (${otherOpps.length} total) ↓`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Right 30%: Instagram Connect Panel ── */}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Spacer to align with opportunities label row */}
                <div style={{ height: 28, marginBottom: 12 }} />

                <div
                  style={{
                    flex: 1,
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--surface)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Subtle warm gradient top accent */}
                  <div
                    style={{
                      height: 3,
                      background: 'linear-gradient(90deg, rgba(181,154,110,0.5) 0%, rgba(197,170,125,0.35) 60%, transparent 100%)',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Instagram gradient icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #f9a825 0%, #e91e8c 50%, #9c27b0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        flexShrink: 0,
                        opacity: 0.9,
                      }}
                    >
                      <InstagramIcon size={20} color="white" />
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.3,
                        marginBottom: 8,
                      }}
                    >
                      Unlock deeper insights
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        flex: 1,
                        marginBottom: 20,
                      }}
                    >
                      Connect your Instagram account to get live account metrics, real-time audience affinity, and personalised content recommendations.
                    </div>

                    {/* Coming soon pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: 'rgba(238, 231, 220, 0.8)',
                        border: '1px solid rgba(181, 154, 110, 0.3)',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--brown-dark)',
                        letterSpacing: '0.03em',
                        marginBottom: 14,
                        width: 'fit-content',
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />
                      COMING SOON
                    </div>

                    <button
                      onClick={handleConnectInstagram}
                      style={{
                        width: '100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        padding: '9px 14px',
                        background: isInstagramClicked
                          ? 'linear-gradient(135deg, #f9a825 0%, #e91e8c 50%, #9c27b0 100%)'
                          : '#3A382C',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#FAF8F5',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isInstagramClicked
                          ? '0 4px 12px rgba(233, 30, 140, 0.25)'
                          : '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={e => {
                        if (!isInstagramClicked) {
                          (e.currentTarget as HTMLElement).style.background = '#2B2A20';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isInstagramClicked) {
                          (e.currentTarget as HTMLElement).style.background = '#3A382C';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }
                      }}
                    >
                      <InstagramIcon size={13} color="white" />
                      <span>{isInstagramClicked ? 'Coming Soon!' : 'Connect Instagram'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
