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

// ─── Placeholder image sets per brand ──────────────────────────────────────
const BRAND_IMAGES: Record<string, { main: string; secondary: string }> = {
  snitch: {
    main: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=480&auto=format&fit=crop&q=80',
    secondary: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=480&auto=format&fit=crop&q=80',
  },
  blissclub: {
    main: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=480&auto=format&fit=crop&q=80',
    secondary: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=480&auto=format&fit=crop&q=80',
  },
  souled_store: {
    main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=480&auto=format&fit=crop&q=80',
    secondary: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=480&auto=format&fit=crop&q=80',
  },
};

function InstagramIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function AnalyzingState({ brandName, step }: { brandName: string; step: number }) {
  const steps = [
    'Reviewing brand context',
    'Analysing historical posts',
    'Identifying opportunities',
    'Scoring recommendations',
    'Finalising results',
  ];
  return (
    <div style={{ padding: '52px 0', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>
          Analysing {brandName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Reviewing historical posts, catalog, and performance signals
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: i < step ? 'var(--green)' : i === step ? 'var(--surface-subtle)' : 'transparent',
              border: `1px solid ${i < step ? 'var(--green)' : i === step ? 'var(--border-strong)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              {i < step && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
              {i === step && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)' }} />}
            </div>
            <span style={{
              fontSize: 13,
              color: i < step ? 'var(--text-muted)' : i === step ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: i === step ? 500 : 400,
              transition: 'color 0.3s ease',
              textDecoration: i < step ? 'line-through' : 'none',
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

  React.useEffect(() => {
    if (!isAnalyzing) { setLoadingStep(0); return; }
    let s = 0;
    const iv = setInterval(() => { s++; if (s < 5) setLoadingStep(s); else clearInterval(iv); }, 750);
    return () => clearInterval(iv);
  }, [isAnalyzing]);

  React.useEffect(() => { setShowAllOpportunities(false); }, [brand?.id]);

  const brandName = brand?.name || 'SNITCH';
  const topOpp = analyzeResult?.opportunities[0];
  const otherOpps = analyzeResult?.opportunities.slice(1) || [];
  const totalPosts = performance?.total_posts ?? 25;
  const prodCount = productsCount ?? 8;
  const avgEr = performance ? `${performance.brand_avg_engagement_rate.toFixed(1)}%` : '–';
  const brandAvgErVal = performance?.brand_avg_engagement_rate ?? 4.8;
  const heroFormat = topOpp?.format || 'Reel';
  const heroFormatStat = performance?.by_format?.find(f => f.format.toLowerCase() === heroFormat.toLowerCase());
  const heroFormatEr = heroFormatStat?.avg_engagement_rate
    ?? (heroFormat.toLowerCase() === 'reel' ? 8.8 : heroFormat.toLowerCase() === 'carousel' ? 8.4 : 7.2);
  const heroMultiplier = (heroFormatEr / Math.max(brandAvgErVal, 0.1)).toFixed(1);
  const brandKey = (brand?.id || 'snitch').toLowerCase();
  const images = BRAND_IMAGES[brandKey] || BRAND_IMAGES.snitch;
  const visibleOtherOpps = showAllOpportunities ? otherOpps : otherOpps.slice(0, 3);

  // Confidence text helper
  const confidence = (score: number) =>
    score >= 88 ? 'High confidence' : score >= 72 ? 'Good confidence' : 'Moderate confidence';
  const confidenceColor = (score: number) =>
    score >= 88 ? 'var(--green)' : score >= 72 ? 'var(--amber)' : 'var(--text-muted)';

  return (
    <div className="page-container">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              className="serif-heading"
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: 6,
                letterSpacing: '-0.02em',
              }}
            >
              What should {brandName} post next?
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 520 }}>
              Based on what has worked, what's selling, and what's relevant right now.
            </p>
          </div>

          {/* Re-analyse — visually secondary */}
          {analyzeResult && (
            <button
              className="btn-ghost"
              onClick={onAnalyze}
              style={{ fontSize: 12, padding: '6px 10px', marginTop: 4, flexShrink: 0, gap: 5 }}
            >
              <RefreshCw size={11} strokeWidth={1.8} />
              Re-analyse
            </button>
          )}
        </div>

        {/* Demo banner */}
        {analyzeResult?.is_demo && (
          <div style={{ marginTop: 10 }}>
            <span className="demo-banner">Demo mode · No API key configured</span>
          </div>
        )}
      </div>

      {/* ── Contextual Metrics Row (plain, no cards) ────────────────────── */}
      <div className="metrics-plain-row">
        {[
          { value: prodCount, label: 'Products', sub: 'in catalog' },
          { value: totalPosts, label: 'Posts analysed', sub: 'historical' },
          { value: avgEr, label: 'Avg engagement', sub: 'feed posts' },
          { value: scheduledCount, label: 'Scheduled', sub: 'this week' },
        ].map((m) => (
          <div className="metrics-plain-item" key={m.label}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      {!analyzeResult && !isAnalyzing ? (
        /* Empty State */
        <div style={{ padding: '48px 0' }}>
          <div className="label" style={{ marginBottom: 12 }}>Content Intelligence</div>
          <h2 className="serif-heading" style={{ fontSize: 24, marginBottom: 10, color: 'var(--text-primary)' }}>
            Find your next best opportunity
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 420, marginBottom: 28 }}>
            Analyses {totalPosts} historical posts and {prodCount} products to surface the
            strongest content opportunities — ranked by calculated impact score.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button id="find-opportunities-btn" className="btn-primary" onClick={onAnalyze} style={{ fontSize: 13 }}>
              Find Content Opportunities
            </button>
            <button className="btn-secondary" onClick={onViewCalendar}>
              View Calendar
            </button>
          </div>
        </div>
      ) : isAnalyzing ? (
        <AnalyzingState brandName={brandName} step={loadingStep} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          {/* ── Hero Recommendation ───────────────────────────────────── */}
          {topOpp && (
            <div>
              <div className="label" style={{ marginBottom: 16 }}>Your next best opportunity</div>

              {/* Opportunity Card — editorial layout, no heavy border */}
              <div
                id="hero-opportunity-card"
                onClick={() => onViewOpportunity(topOpp.id)}
                style={{
                  borderTop: '2px solid var(--text-primary)',
                  paddingTop: 24,
                  cursor: 'pointer',
                }}
              >
                <div className="hero-card-layout">
                  {/* ── Image Area ── */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      width: 220,
                      flexShrink: 0,
                    }}
                  >
                    {/* Dominant image — 2:3 portrait */}
                    <div
                      style={{
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: 'var(--surface-subtle)',
                        aspectRatio: '3 / 4',
                        width: '100%',
                      }}
                    >
                      <img
                        src={images.main}
                        alt={topOpp.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                    {/* Supporting image — landscape */}
                    <div
                      style={{
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: 'var(--surface-subtle)',
                        aspectRatio: '3 / 1.5',
                        width: '100%',
                      }}
                    >
                      <img
                        src={images.secondary}
                        alt={`${topOpp.title} supporting`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>

                  {/* ── Recommendation Content ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, gap: 20 }}>
                    <div>
                      {/* Quiet format metadata */}
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          letterSpacing: '0.02em',
                          fontWeight: 500,
                          marginBottom: 10,
                          textTransform: 'uppercase',
                        }}
                      >
                        {topOpp.objective || 'Product Education'} · {topOpp.platform} {topOpp.format}
                        {topOpp.is_demo && <span className="demo-banner" style={{ marginLeft: 8, fontSize: 9, padding: '2px 6px' }}>Demo</span>}
                      </div>

                      {/* Big editorial title */}
                      <h2
                        className="serif-heading"
                        style={{
                          fontSize: 28,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          lineHeight: 1.2,
                          marginBottom: 20,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {topOpp.title}
                      </h2>

                      {/* Why This Opportunity */}
                      <div style={{ marginBottom: 16 }}>
                        <div className="label" style={{ marginBottom: 6 }}>Why this opportunity</div>
                        <p style={{
                          fontSize: 14,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.65,
                        }}>
                          {topOpp.why}
                        </p>
                      </div>

                      {/* Evidence inline row */}
                      <div className="evidence-inline-row" style={{ marginBottom: 20 }}>
                        <div>
                          <div className="evidence-stat">↑ {heroFormatEr.toFixed(1)}% engagement</div>
                          <div className="evidence-label">Historical avg</div>
                        </div>
                        <div className="evidence-sep" />
                        <div>
                          <div className="evidence-stat">{heroMultiplier}× brand average</div>
                          <div className="evidence-label">Format multiplier</div>
                        </div>
                        {topOpp.suggested_product_name && (
                          <>
                            <div className="evidence-sep" />
                            <div>
                              <div className="evidence-stat" style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {topOpp.suggested_product_name}
                              </div>
                              <div className="evidence-label">Featured product</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div>
                      <button
                        className="btn-primary"
                        onClick={e => { e.stopPropagation(); onViewOpportunity(topOpp.id); }}
                        style={{
                          fontSize: 13,
                          padding: '10px 20px',
                          borderRadius: 7,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).querySelector('.cta-arrow')?.setAttribute('style', 'transform: translateX(3px); transition: transform 0.15s ease;');
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).querySelector('.cta-arrow')?.setAttribute('style', 'transform: translateX(0); transition: transform 0.15s ease;');
                        }}
                      >
                        See why this is recommended
                        <span className="cta-arrow" style={{ transition: 'transform 0.15s ease' }}>→</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Score Pillar (secondary visual weight) ── */}
                  <div
                    className="hero-score-pillar"
                    style={{
                      borderLeft: '1px solid var(--border)',
                      paddingLeft: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 4,
                      minWidth: 140,
                      flexShrink: 0,
                    }}
                  >
                    {/* Score — secondary, not the first thing you see */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 52,
                          fontFamily: 'var(--font-serif)',
                          fontWeight: 400,
                          color: 'var(--text-primary)',
                          lineHeight: 1,
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {topOpp.score}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
                        /100
                      </span>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 500, color: confidenceColor(topOpp.score) }}>
                      {confidence(topOpp.score)}
                    </div>

                    {/* Score breakdown bar — quiet visual */}
                    <div style={{ marginTop: 16, width: '100%' }}>
                      <div
                        style={{
                          height: 3,
                          borderRadius: 2,
                          background: 'var(--border)',
                          overflow: 'hidden',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${topOpp.score}%`,
                            background: topOpp.score >= 80 ? 'var(--green)' : topOpp.score >= 60 ? 'var(--amber)' : 'var(--border-strong)',
                            borderRadius: 2,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Impact score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Other Opportunities + Instagram Panel ─────────────────── */}
          {otherOpps.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 0.42fr',
                gap: 40,
                alignItems: 'start',
              }}
            >
              {/* Left 70%: Other Opportunities — editorial list */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="label">Other Opportunities</div>
                  {otherOpps.length > 3 && (
                    <button
                      onClick={() => setShowAllOpportunities(!showAllOpportunities)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: 0,
                      }}
                    >
                      {showAllOpportunities ? 'Show fewer' : `View all ${otherOpps.length}`}
                      {showAllOpportunities ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>

                <div>
                  {visibleOtherOpps.map((opp, i) => (
                    <div
                      key={opp.id}
                      id={`opportunity-row-${i + 2}`}
                      className="opp-list-row"
                      onClick={() => onViewOpportunity(opp.id)}
                    >
                      {/* Rank number */}
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          width: 20,
                          flexShrink: 0,
                          paddingTop: 2,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {String(i + 2).padStart(2, '0')}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            marginBottom: 4,
                            lineHeight: 1.3,
                          }}
                        >
                          {opp.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            textTransform: 'uppercase',
                            marginBottom: 6,
                          }}
                        >
                          {opp.format} · {opp.platform}
                        </div>
                        {opp.why && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {opp.why}
                          </div>
                        )}
                      </div>

                      {/* Score + arrow */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          flexShrink: 0,
                          paddingTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 400,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {opp.score}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 1, marginRight: 10 }}>/100</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 400 }}>→</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More/Fewer toggle at bottom */}
                {otherOpps.length > 3 && (
                  <button
                    onClick={() => setShowAllOpportunities(!showAllOpportunities)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '12px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {showAllOpportunities
                      ? 'Show fewer opportunities'
                      : `View ${otherOpps.length - 3} more opportunities`}
                    {showAllOpportunities ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
              </div>

              {/* Right 30%: Data Connection Panel */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 4,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="label">Connect your Instagram</div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  Get live performance signals and audience insights to make BrandBrew's recommendations more precise.
                </p>

                {/* Coming soon indicator */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--amber)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                  Coming soon
                </div>

                <button
                  onClick={() => setIsInstagramClicked(v => !v)}
                  className="btn-secondary"
                  style={{
                    fontSize: 12,
                    padding: '8px 14px',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <InstagramIcon size={13} />
                  {isInstagramClicked ? 'Coming soon' : 'Connect Instagram'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
