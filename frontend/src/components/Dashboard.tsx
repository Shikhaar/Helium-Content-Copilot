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
    main: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80',
    secondary: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&auto=format&fit=crop&q=80',
  },
  blissclub: {
    main: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    secondary: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
  },
  souled_store: {
    main: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
    secondary: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&auto=format&fit=crop&q=80',
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
    'Ranking impact',
  ];
  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="label" style={{ marginBottom: 6 }}>Intelligence Engine</div>
        <h2 className="serif-heading" style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>
          Analysing {brandName} Content Opportunities
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
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
  const visibleOtherOpps = showAllOpportunities ? otherOpps : otherOpps.slice(0, 2);


  // Confidence text helper
  const confidence = (score: number) =>
    score >= 88 ? 'High confidence' : score >= 72 ? 'Good confidence' : 'Moderate confidence';
  const confidenceColor = (score: number) =>
    score >= 88 ? 'var(--green)' : score >= 72 ? 'var(--amber)' : 'var(--text-muted)';

  return (
    <div className="page-container">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 className="serif-heading" style={{ fontSize: 32, marginBottom: 6, color: 'var(--text-primary)' }}>
              What should {brandName} post next?
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Based on what has worked, what's selling, and what's relevant right now.
            </p>
          </div>

          {/* Re-analyse button */}
          {analyzeResult && (
            <button
              id="re-analyse-btn"
              className="btn-ghost"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              style={{ fontSize: 13, gap: 6, flexShrink: 0 }}
            >
              <RefreshCw size={13} className={isAnalyzing ? 'spin' : ''} />
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

      {/* ── Contextual Metrics Row (plain, reduced dominance) ─────────── */}
      <div className="metrics-plain-row">
        {[
          { value: prodCount, label: 'Products', sub: 'in catalog' },
          { value: totalPosts, label: 'Posts analysed', sub: 'historical' },
          { value: avgEr, label: 'Avg engagement', sub: 'feed posts' },
          { value: scheduledCount, label: 'Scheduled', sub: 'this week' },
        ].map((m) => (
          <div className="metrics-plain-item" key={m.label}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      {!analyzeResult && !isAnalyzing ? (
        /* Empty State */
        <div style={{ padding: '48px 0' }}>
          <div className="label" style={{ marginBottom: 12 }}>Content Intelligence</div>
          <h2 className="serif-heading" style={{ fontSize: 24, marginBottom: 10, color: '#16120E' }}>
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
                  {/* ── 1. Hero Media Gallery ── */}
                  <div className="hero-media-zone">
                    {/* Primary — dominant hero image */}
                    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-subtle)', height: 244, width: '100%' }}>
                      <img
                        src={images.main}
                        alt={topOpp.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', objectPosition: 'center top' }}
                        onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                      {/* Contact-strip thumbnails — intentional editorial composition, not a second rectangle */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          display: 'flex',
                          gap: 3,
                        }}
                      >
                        {[images.main, images.secondary, images.main].map((src, i) => (
                          <div
                            key={i}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              overflow: 'hidden',
                              border: '1.5px solid rgba(255,255,255,0.9)',
                              opacity: i === 0 ? 1 : i === 1 ? 0.85 : 0.65,
                              boxShadow: '0 1px 3px rgba(33,25,20,0.18)',
                            }}
                          >
                            <img
                              src={src}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                {/* ── 2. Recommendation Content ── */}
                <div className="hero-content-zone">
                  {/* Format metadata + BrandBrew Pick stamp — on same row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {topOpp.objective || 'Product Education'} · {topOpp.platform} {topOpp.format}
                      {topOpp.is_demo && <span className="demo-banner" style={{ marginLeft: 8, fontSize: 9, padding: '2px 6px' }}>Demo</span>}
                    </div>
                    {/* BrandBrew Pick — editorial signature stamp */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--brown-primary)',
                        border: '1px solid var(--accent-border)',
                        borderTop: '2px solid var(--brown-primary)',
                        padding: '3px 8px 3px 6px',
                        borderRadius: '0 0 3px 3px',
                        flexShrink: 0,
                        background: 'rgba(90,56,40,0.04)',
                      }}
                    >
                      <span style={{ width: 4, height: 4, background: 'var(--brown-primary)', borderRadius: '50%', flexShrink: 0 }} />
                      BrandBrew Pick
                    </span>
                  </div>

                  {/* Dominant editorial title */}
                  <h2
                    className="serif-heading"
                    style={{
                      fontSize: 26,
                      fontWeight: 500,
                      color: '#16120E',
                      lineHeight: 1.22,
                      marginBottom: 12,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {topOpp.title}
                  </h2>

                  {/* Why This Opportunity — accent-annotated */}
                  <div style={{ marginBottom: 14, paddingLeft: 10, borderLeft: '2px solid var(--brown-primary)', opacity: 1 }}>
                    <div className="label" style={{ marginBottom: 3, color: 'var(--brown-primary)', opacity: 0.7 }}>Why this opportunity</div>
                    <p style={{ fontSize: 13, color: '#2B231C', lineHeight: 1.62 }}>
                      {topOpp.why}
                    </p>
                  </div>

                  {/* Evidence — open typographic stat strip, not a box */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 0,
                      marginBottom: 14,
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      padding: '10px 0',
                    }}
                  >
                    {[
                      { value: `${heroFormatEr.toFixed(1)}%`, label: 'Historical engagement' },
                      { value: `${heroMultiplier}×`, label: 'vs brand average' },
                      {
                        value: brandKey === 'blissclub' ? '18.2K' : brandKey === 'souled_store' ? '16.4K' : '14.2K',
                        label: 'Catalog views',
                      },
                    ].map((stat, i) => (
                      <div
                        key={stat.label}
                        style={{
                          flex: 1,
                          paddingLeft: i === 0 ? 0 : 16,
                          borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
                          minWidth: 0,
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#16120E', lineHeight: 1, letterSpacing: '-0.02em' }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500, letterSpacing: '0.01em' }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Featured product — tight before CTA */}
                  {topOpp.suggested_product_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, fontSize: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Featured product:
                      </span>
                      <span style={{ fontWeight: 600, color: '#16120E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topOpp.suggested_product_name}
                      </span>
                    </div>
                  )}

                  {/* CTA — natural conclusion of evidence flow */}
                  <button
                    className="btn-primary"
                    onClick={e => { e.stopPropagation(); onViewOpportunity(topOpp.id); }}
                    style={{
                      fontSize: 13,
                      padding: '9px 18px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      alignSelf: 'flex-start',
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

                {/* ── 3. Score Pillar — BrandBrew's judgment, not a KPI ── */}
                <div className="hero-score-pillar">
                  {/* BrandBrew supertitle — contextualises this as a judgment */}
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--brown-primary)',
                      opacity: 0.6,
                      marginBottom: 6,
                    }}
                  >
                    BrandBrew's read
                  </div>

                  {/* Primary judgment — most important semantic */}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#16120E',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      marginBottom: 8,
                    }}
                  >
                    {topOpp.score >= 80 ? 'Strong opportunity' : topOpp.score >= 60 ? 'Moderate opportunity' : 'Emerging opportunity'}
                  </div>

                  {/* Score number — large, confirms the interpretation */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 44,
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 400,
                        color: '#16120E',
                        lineHeight: 1,
                        letterSpacing: '-0.04em',
                      }}
                    >
                      {topOpp.score}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', paddingBottom: 2 }}>
                      /100
                    </span>
                  </div>

                  {/* Confidence — supporting signal */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: topOpp.score >= 80 ? '#15803D' : topOpp.score >= 60 ? '#B45309' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: topOpp.score >= 80 ? '#15803D' : topOpp.score >= 60 ? '#B45309' : 'var(--text-muted)', flexShrink: 0 }} />
                    {confidence(topOpp.score)}
                  </div>

                  {/* Thin editorial rule */}
                  <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 10, opacity: 0.6 }} />

                  {/* Impact score bar — evidence, not a hero metric */}
                  <div style={{ width: '100%' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
                      Impact score
                    </div>
                    <div style={{ height: 2, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', width: '100%' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${topOpp.score}%`,
                          background: topOpp.score >= 80 ? '#15803D' : topOpp.score >= 60 ? '#B45309' : 'var(--border-strong)',
                          borderRadius: 2,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
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
              {/* Left 70%: Other Opportunities — editorial list (Rank 02 to 05, collapsible) */}
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
                  {otherOpps.length > 2 && (
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
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          width: 24,
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
                            fontSize: 14.5,
                            fontWeight: 600,
                            color: '#16120E',
                            letterSpacing: '-0.01em',
                            marginBottom: 4,
                            lineHeight: 1.35,
                          }}
                        >
                          {opp.title}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <span style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {opp.format} · {opp.platform}
                          </span>
                          {opp.suggested_product_name && (
                            <>
                              <span>·</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {opp.suggested_product_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          flexShrink: 0,
                          paddingLeft: 12,
                          paddingTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 500,
                            color: '#16120E',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {opp.score}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', marginRight: 6 }}>/100</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collapsible toggle button below list */}
                {otherOpps.length > 2 && (
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
                      : `View ${otherOpps.length - 2} more opportunities`}
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
