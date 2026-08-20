'use client';
import React from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Check,
  CalendarClock,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music,
  Film,
  Layers,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import type { CarouselSlide, ContentDraft, Opportunity, ScheduleRequest } from '../lib/types';

interface ContentStudioProps {
  draft: ContentDraft | null;
  opportunity: Opportunity | null;
  opportunities?: Opportunity[];
  isGenerating: boolean;
  onBack: () => void;
  onSelectOpportunity?: (opp: Opportunity) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onSchedule: (req: ScheduleRequest) => void;
  onUpdateCaption?: (caption: string) => void;
  onUpdateDraft?: (updates: { slides?: CarouselSlide[]; caption?: string; cta?: string; hashtags?: string[] }) => void;
}

// Curated high-aesthetic fashion & lifestyle photography for DTC preview
const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=85', // Streetwear Linen model
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=700&auto=format&fit=crop&q=85', // Fabric / Texture detail
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&auto=format&fit=crop&q=85', // Silhouette movement
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=85', // Lookbook / Flatlay & CTA
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=85', // Lifestyle portrait
];

function getSlideImage(slideNum: number) {
  return SLIDE_IMAGES[(slideNum - 1) % SLIDE_IMAGES.length];
}

const REEL_SCENE_NAMES = ['HOOK', 'PRODUCT', 'STYLING', 'CTA'];
const REEL_SCENE_TIMINGS = ['0:00 - 0:03', '0:03 - 0:07', '0:07 - 0:11', '0:11 - 0:15'];

const ALL_D2C_CTAS = [
  'Discover your style',
  'Shop the look',
  'View collection',
  'Shop now',
  'Learn more',
  'Save this post',
  'Explore the product',
  'See all styles',
];

function getContextualCtas(angle: string = '', format: string = ''): string[] {
  const text = `${angle} ${format}`.toLowerCase();
  
  let prioritized: string[] = [];
  if (text.includes('style') || text.includes('styling') || text.includes('inspiration') || text.includes('outfit') || text.includes('layering')) {
    prioritized = ['Discover your style', 'Shop the look', 'Save this post', 'See all styles'];
  } else if (text.includes('product') || text.includes('review') || text.includes('fit') || text.includes('cargo') || text.includes('shirt')) {
    prioritized = ['Shop now', 'Explore the product', 'View collection', 'Learn more'];
  } else if (text.includes('collection') || text.includes('campaign') || text.includes('summer') || text.includes('drop')) {
    prioritized = ['View collection', 'Shop now', 'Discover your style', 'Explore the product'];
  } else {
    prioritized = ['Discover your style', 'Shop the look', 'Shop now', 'View collection'];
  }

  const remaining = ALL_D2C_CTAS.filter(c => !prioritized.includes(c));
  return [...prioritized, ...remaining];
}

function Skeleton() {
  return (
    <div className="page-container" style={{ maxWidth: 980 }}>
      <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 24 }} />
      <div className="skeleton" style={{ width: 340, height: 32, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: '100%', height: 440, borderRadius: 10 }} />
    </div>
  );
}

/* ==========================================================================
   1. PREVIEWS: CAROUSEL VS REEL
   ========================================================================== */

function CarouselPreview({
  slide,
  slideIndex,
  totalSlides,
  cta,
  brandName = 'SNITCH',
  onPrev,
  onNext,
}: {
  slide: CarouselSlide;
  slideIndex: number;
  totalSlides: number;
  cta: string;
  brandName?: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const bgImg = getSlideImage(slideIndex + 1);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 340,
        aspectRatio: '4/5',
        background: '#191512',
        borderRadius: 12,
        border: '1px solid #DDD3C5',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 12px 32px rgba(33, 25, 20, 0.12)',
        userSelect: 'none',
      }}
    >
      {/* Background High-res Asset Image */}
      <img
        src={bgImg}
        alt={`Slide ${slideIndex + 1}`}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Left Tap Zone (Previous Slide) */}
      <div
        onClick={onPrev}
        title={slideIndex > 0 ? "Click left for previous slide" : undefined}
        style={{
          position: 'absolute',
          left: 0,
          top: 44,
          bottom: 60,
          width: '50%',
          zIndex: 4,
          cursor: slideIndex > 0 ? 'pointer' : 'default',
        }}
      />

      {/* Right Tap Zone (Next Slide) */}
      <div
        onClick={onNext}
        title={slideIndex < totalSlides - 1 ? "Click right for next slide" : undefined}
        style={{
          position: 'absolute',
          right: 0,
          top: 44,
          bottom: 60,
          width: '50%',
          zIndex: 4,
          cursor: slideIndex < totalSlides - 1 ? 'pointer' : 'default',
        }}
      />

      {/* Top & Bottom Scrim Gradients for rich legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '28%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0, height: '62%',
          background: 'linear-gradient(0deg, rgba(17,14,12,0.94) 0%, rgba(17,14,12,0.65) 50%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar inside Instagram Carousel Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {brandName}
          </span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#49634A', display: 'inline-block' }} />
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'rgba(0,0,0,0.45)',
            borderRadius: 4,
            padding: '2px 7px',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Layers size={10} />
          <span>Slide {slideIndex + 1}/{totalSlides}</span>
        </div>
      </div>

      {/* Center Slide Headline Overlay */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 20px', textAlign: 'center' }}>
        <div
          className="serif-heading"
          style={{
            fontSize: 19,
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0,0,0,0.85)',
            marginBottom: 6,
          }}
        >
          {slide.headline}
        </div>
        {slide.body && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.45,
              textShadow: '0 1px 4px rgba(0,0,0,0.75)',
              maxWidth: 240,
              margin: '0 auto',
            }}
          >
            {slide.body}
          </div>
        )}
      </div>

      {/* Right Action Bar (Instagram Interaction icons) */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 54,
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>2.4k</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>98</span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={13} color="#FFFFFF" />
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bookmark size={13} color="#FFFFFF" />
        </div>
      </div>

      {/* Bottom Preview Overlay (Carousel Pagination Dots & CTA) */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 16px 14px', paddingRight: 48 }}>
        {/* Discrete Carousel Pagination Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slideIndex ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === slideIndex ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* CTA Preview pill (renders only when selected) */}
        {cta ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#5A3828',
              color: '#FFFCF7',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span>{cta}</span>
            <span>→</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReelPreview({
  slide,
  slideIndex,
  totalSlides,
  cta,
  brandName = 'SNITCH',
  onPrev,
  onNext,
}: {
  slide: CarouselSlide;
  slideIndex: number;
  totalSlides: number;
  cta: string;
  brandName?: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const bgImg = getSlideImage(slideIndex + 1);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 320,
        aspectRatio: '9/16',
        background: '#191512',
        borderRadius: 12,
        border: '1px solid #DDD3C5',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 12px 32px rgba(33, 25, 20, 0.12)',
        userSelect: 'none',
      }}
    >
      {/* Background High-res Asset Image */}
      <img
        src={bgImg}
        alt="Reel scene preview"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Left Tap Zone (Previous Scene) */}
      <div
        onClick={onPrev}
        title={slideIndex > 0 ? "Click left for previous scene" : undefined}
        style={{
          position: 'absolute',
          left: 0,
          top: 44,
          bottom: 70,
          width: '50%',
          zIndex: 4,
          cursor: slideIndex > 0 ? 'pointer' : 'default',
        }}
      />

      {/* Right Tap Zone (Next Scene) */}
      <div
        onClick={onNext}
        title={slideIndex < totalSlides - 1 ? "Click right for next scene" : undefined}
        style={{
          position: 'absolute',
          right: 0,
          top: 44,
          bottom: 70,
          width: '50%',
          zIndex: 4,
          cursor: slideIndex < totalSlides - 1 ? 'pointer' : 'default',
        }}
      />

      {/* Top & Bottom Scrim Gradients for rich legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0, height: '65%',
          background: 'linear-gradient(0deg, rgba(17,14,12,0.95) 0%, rgba(17,14,12,0.7) 45%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Scene Progress Segments (4 discrete scene bars) */}
      <div style={{ position: 'relative', zIndex: 5, padding: '12px 14px 0', display: 'flex', gap: 4 }}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2.5,
              borderRadius: 2,
              background: i <= slideIndex ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>

      {/* Top Bar inside Instagram Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {brandName}
          </span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#49634A', display: 'inline-block' }} />
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'rgba(0,0,0,0.45)',
            borderRadius: 4,
            padding: '2px 7px',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Film size={10} />
          <span>Reel · {slideIndex + 1}/{totalSlides}</span>
        </div>
      </div>

      {/* Middle On-Screen Headline / Hook Overlay */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 20px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0,0,0,0.85)',
            marginBottom: 8,
          }}
        >
          {slide.headline}
        </div>
        {slide.visual_cue && (
          <div
            style={{
              display: 'inline-block',
              fontSize: 10,
              color: 'rgba(255,255,255,0.8)',
              background: 'rgba(0,0,0,0.4)',
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            📷 {slide.visual_cue}
          </div>
        )}
      </div>

      {/* Right Action Bar (Instagram Interaction icons) */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 95,
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>2.8k</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>142</span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={13} color="#FFFFFF" />
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bookmark size={13} color="#FFFFFF" />
        </div>
      </div>

      {/* Bottom Preview Overlay (Narration, Audio & CTA) */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 16px 14px', paddingRight: 48 }}>
        {/* Narration script */}
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.4,
            marginBottom: 8,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            maxHeight: 44,
            overflow: 'hidden',
          }}
        >
          {slide.body}
        </div>

        {/* Audio Cue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
          <Music size={10} />
          <span>Trending Audio · Lo-Fi Beats</span>
        </div>

        {/* CTA Preview pill (renders only when selected) */}
        {cta ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#5A3828',
              color: '#FFFCF7',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span>{cta}</span>
            <span>→</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ==========================================================================
   2. MAIN CONTENT STUDIO COMPONENT
   ========================================================================== */

export default function ContentStudio({
  draft,
  opportunity,
  opportunities = [],
  isGenerating,
  onBack,
  onSelectOpportunity,
  onRegenerate,
  onApprove,
  onSchedule,
  onUpdateCaption,
  onUpdateDraft,
}: ContentStudioProps) {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [caption, setCaption] = React.useState('');
  const [cta, setCta] = React.useState('');
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [newTagInput, setNewTagInput] = React.useState('');
  const [isAddingTag, setIsAddingTag] = React.useState(false);
  const [showScheduler, setShowScheduler] = React.useState(false);
  const [schedDate, setSchedDate] = React.useState('');
  const [schedTime, setSchedTime] = React.useState('19:00');
  const [saveToast, setSaveToast] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const lastSavedSignatureRef = React.useRef<string>('');

  const [showAllCtas, setShowAllCtas] = React.useState(false);

  // Local slides state for immediate responsive edits
  const [slides, setSlides] = React.useState<CarouselSlide[]>([]);

  // Detect format accurately
  const isCarousel = (draft?.format || opportunity?.format || '').toLowerCase().includes('carousel');
  const contextualCtas = getContextualCtas(opportunity?.content_angle || '', draft?.format || '');

  React.useEffect(() => {
    if (draft) {
      const initialCaption = draft.caption || '';
      const initialCta = draft.cta || (isCarousel ? 'Discover your style' : 'Shop the look');
      const initialTags = draft.hashtags || ['SNITCH', 'SummerStyle', 'LinenShirt', 'Menswear'];
      const initialSlides = draft.slides || [];
      setCaption(initialCaption);
      setCta(initialCta);
      setHashtags(initialTags);
      setSlides(initialSlides);
      setActiveSlide(0);
      lastSavedSignatureRef.current = JSON.stringify({
        slides: initialSlides,
        caption: initialCaption,
        cta: initialCta,
        hashtags: initialTags,
      });
    }
  }, [draft?.id, draft?.format, isCarousel]);

  if (isGenerating) return <Skeleton />;

  if (!draft) {
    return (
      <div className="page-container fade-up" style={{ maxWidth: 980 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn-ghost"
            onClick={onBack}
            style={{ padding: '4px 0', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back to opportunities
          </button>
          <div className="label" style={{ marginBottom: 4, letterSpacing: '0.09em' }}>CONTENT STUDIO</div>
          <h1 className="serif-heading" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 4 }}>
            Select an Opportunity to Craft
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Choose a high-confidence recommendation to generate format-tailored social content (Instagram Reels & Carousels).
          </div>
        </div>

        {/* Opportunities List for 1-click Studio launch */}
        {opportunities.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {opportunities.map(opp => (
              <div
                key={opp.id}
                className="card card-interactive"
                onClick={() => onSelectOpportunity && onSelectOpportunity(opp)}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="badge badge-accent" style={{ fontSize: 11 }}>
                      {opp.format} · {opp.platform}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Score: <strong style={{ color: 'var(--brown-primary)' }}>{opp.score}</strong>/100
                    </span>
                  </div>
                  <div className="serif-heading" style={{ fontSize: 17, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {opp.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {opp.why || opp.content_angle}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '8px 16px', whiteSpace: 'nowrap' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectOpportunity) onSelectOpportunity(opp);
                  }}
                >
                  Craft in Studio →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--surface)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              No opportunities loaded yet. Analyze performance to discover new content opportunities.
            </p>
            <button className="btn-primary" onClick={onBack}>
              <ArrowLeft size={14} /> Back to dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

  const isApproved = draft.status === 'approved' || draft.status === 'scheduled';
  const isScheduled = draft.status === 'scheduled';
  const currentSlidesList = slides.length > 0 ? slides : draft.slides;
  const totalSlidesCount = currentSlidesList.length || 1;
  const currentSlide = currentSlidesList[activeSlide] || currentSlidesList[0] || {
    slide_number: 1,
    headline: 'Summer Layering with Linen',
    body: 'Lightweight, versatile, and easy to style.',
    visual_cue: 'Model wearing relaxed fit linen shirt.',
  };

  const handleUpdateCurrentSlide = (field: keyof CarouselSlide, val: string) => {
    const updated = [...currentSlidesList];
    if (updated[activeSlide]) {
      updated[activeSlide] = {
        ...updated[activeSlide],
        [field]: val,
      };
      setSlides(updated);
    }
  };

  const handleSaveDraft = async (showFeedback = true) => {
    const currentSignature = JSON.stringify({
      slides: currentSlidesList,
      caption,
      cta,
      hashtags,
    });

    // If no changes were made since the last save, notify 'Already saved'
    if (currentSignature === lastSavedSignatureRef.current) {
      if (showFeedback) {
        setSaveToast('Already saved');
        setTimeout(() => setSaveToast(null), 2200);
      }
      return;
    }

    setIsSaving(true);
    try {
      if (onUpdateDraft) {
        await onUpdateDraft({ slides: currentSlidesList, caption, cta, hashtags });
      } else if (onUpdateCaption) {
        await onUpdateCaption(caption);
      }
      lastSavedSignatureRef.current = currentSignature;
      if (showFeedback) {
        setSaveToast('Saved to draft');
        setTimeout(() => setSaveToast(null), 2400);
      }
    } catch (err) {
      console.error('Save draft failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAndOpenSchedule = async () => {
    try {
      // 1. Auto-save any local edits
      await handleSaveDraft(false);
      // 2. Approve draft in backend
      await onApprove();
      // 3. Set default date to tomorrow if not set
      if (!schedDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSchedDate(tomorrow.toISOString().split('T')[0]);
      }
      // 4. Open scheduler for seamless 1-step scheduling
      setShowScheduler(true);
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleSelectCta = (option: string) => {
    const nextCta = cta === option ? '' : option;
    setCta(nextCta);
    if (onUpdateDraft) {
      onUpdateDraft({ cta: nextCta });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = hashtags.filter(t => t !== tagToRemove);
    setHashtags(updated);
    if (onUpdateDraft) {
      onUpdateDraft({ hashtags: updated });
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().replace(/^#+/, '');
    if (cleanTag && !hashtags.includes(cleanTag)) {
      const updated = [...hashtags, cleanTag];
      setHashtags(updated);
      if (onUpdateDraft) {
        onUpdateDraft({ hashtags: updated });
      }
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleScheduleConfirm = async () => {
    if (!schedDate || !schedTime) return;
    await handleSaveDraft(false);
    await onSchedule({ scheduled_date: schedDate, scheduled_time: schedTime, platform: 'Instagram' });
    setShowScheduler(false);
  };

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev < totalSlidesCount - 1 ? prev + 1 : prev));
  };

  const effectiveAudience = opportunity?.audience || draft.audience || 'Gen-Z';
  const currentTitle =
    opportunity?.title ||
    draft.slides?.[0]?.headline ||
    (isCarousel ? '5 Ways to Style the Cuban Collar Shirt' : 'Summer Layering with Oversized Linen Shirt');

  return (
    <div className="page-container fade-up" style={{ maxWidth: 980, boxSizing: 'border-box' }}>
      {/* ── A. EDITORIAL HEADER ────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <button
          className="btn-ghost"
          onClick={onBack}
          style={{
            padding: '4px 0',
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeft size={14} /> Back to opportunities
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="label" style={{ marginBottom: 4, letterSpacing: '0.09em' }}>CONTENT STUDIO</div>
            <h1
              className="serif-heading"
              style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 6 }}
            >
              {currentTitle}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {isCarousel ? 'Instagram Carousel' : 'Instagram Reel'}
              </span>
              <span>·</span>
              <span style={{ color: '#49634A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#49634A' }} />
                High confidence recommendation
              </span>
              <span>·</span>
              <span>Target: <strong>{effectiveAudience}</strong></span>
              {draft.is_demo && (
                <>
                  <span>·</span>
                  <span className="demo-banner" style={{ padding: '1px 6px', fontSize: 10 }}>Demo</span>
                </>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {saveToast && (
              <span
                style={{
                  fontSize: 12,
                  color: '#49634A',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  background: '#E7EFE8',
                  borderRadius: 6,
                }}
              >
                <Check size={14} /> {saveToast}
              </span>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleSaveDraft(true)}
              disabled={isSaving}
              style={{ fontSize: 12, padding: '7px 15px', minWidth: 88, background: '#FFFCF7' }}
            >
              {isSaving ? 'Saving...' : 'Save draft'}
            </button>

            {!isApproved && (
              <button
                type="button"
                id="approve-btn"
                className="btn-primary"
                onClick={handleApproveAndOpenSchedule}
                style={{ fontSize: 12, padding: '7px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} /> Approve & schedule
              </button>
            )}

            {isApproved && !isScheduled && (
              <button
                type="button"
                id="schedule-btn"
                className="btn-primary"
                onClick={() => setShowScheduler(true)}
                style={{ fontSize: 12, padding: '7px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <CalendarClock size={14} /> Schedule post
              </button>
            )}

            {isScheduled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className="badge badge-accent"
                  style={{ fontSize: 12, padding: '6px 12px', background: '#E8D9C8', color: '#5A3828' }}
                >
                  Scheduled for {draft.scheduled_date}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowScheduler(true)}
                  style={{ fontSize: 11, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <CalendarClock size={12} /> Reschedule
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── B. BALANCED TWO-COLUMN WORKSPACE ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 360px) 1fr',
          gap: 28,
          alignItems: 'start',
          marginBottom: 32,
        }}
      >
        {/* ── LEFT COLUMN: CREATIVE PREVIEW + STORYBOARD STRIP ──────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Creative Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {isCarousel ? (
              <CarouselPreview
                slide={currentSlide}
                slideIndex={activeSlide}
                totalSlides={totalSlidesCount}
                cta={cta}
                brandName="SNITCH"
                onPrev={handlePrevSlide}
                onNext={handleNextSlide}
              />
            ) : (
              <ReelPreview
                slide={currentSlide}
                slideIndex={activeSlide}
                totalSlides={totalSlidesCount}
                cta={cta}
                brandName="SNITCH"
                onPrev={handlePrevSlide}
                onNext={handleNextSlide}
              />
            )}
          </div>

          {/* Storyboard Frame Navigation Strip */}
          <div
            className="card"
            style={{
              padding: '16px 16px 18px',
              background: '#FFFCF7',
              border: '1px solid #DDD3C5',
              borderRadius: 10,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label" style={{ letterSpacing: '0.08em' }}>
                {isCarousel ? `STORYBOARD (${totalSlidesCount} SLIDES)` : `TIMELINE (${totalSlidesCount} SCENES)`}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Click to inspect frame
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${totalSlidesCount}, minmax(0, 1fr))`,
                gap: 8,
                width: '100%',
              }}
            >
              {currentSlidesList.map((slide, i) => {
                const isSelected = i === activeSlide;
                const sceneThumb = getSlideImage(i + 1);

                let roleName = `0${i + 1}`;
                if (isCarousel) {
                  if (i === 0) roleName = '01 Hook';
                  else if (i === totalSlidesCount - 1) roleName = `0${i + 1} CTA`;
                  else roleName = `0${i + 1} Slide`;
                } else {
                  roleName = `0${i + 1} ${REEL_SCENE_NAMES[i] || 'Beat'}`;
                }

                return (
                  <div
                    key={slide.slide_number || i}
                    onClick={() => setActiveSlide(i)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    {/* Thumbnail Frame */}
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: isCarousel ? '4/5' : '9/16',
                        borderRadius: 6,
                        overflow: 'hidden',
                        position: 'relative',
                        border: isSelected ? '2px solid #5A3021' : '1px solid #DDD3C5',
                        boxShadow: isSelected ? '0 0 0 2px rgba(90, 48, 33, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img
                        src={sceneThumb}
                        alt={roleName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: isSelected ? 'brightness(1)' : 'brightness(0.7)',
                          transition: 'filter 0.2s ease',
                        }}
                      />
                    </div>

                    {/* Frame Index / Role Label */}
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#5A3021' : '#8F8275',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}
                      title={slide.headline}
                    >
                      {roleName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: EDITORIAL CONTENT EDITOR ────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="card"
            style={{
              padding: '24px 26px',
              background: '#FFFCF7',
              border: '1px solid #DDD3C5',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(33, 25, 20, 0.02)',
            }}
          >
            {/* 1. FORMAT & STRATEGIC ANGLE */}
            <div style={{ marginBottom: 20, borderBottom: '1px solid #DDD3C5', paddingBottom: 16 }}>
              <div className="label" style={{ marginBottom: 8, letterSpacing: '0.08em' }}>CONTENT STRATEGY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Format: <strong style={{ color: 'var(--text-primary)' }}>{isCarousel ? 'Instagram Carousel' : 'Instagram Reel'}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Angle: <strong style={{ color: 'var(--text-primary)' }}>{opportunity?.content_angle || 'Product styling'}</strong>
                </div>
              </div>
            </div>

            {/* 2. ACTIVE SLIDE / SCENE COPY */}
            {isCarousel ? (
              /* CAROUSEL FIELDS */
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label" style={{ letterSpacing: '0.08em' }}>SLIDE {activeSlide + 1} TITLE</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Slide {activeSlide + 1} of {totalSlidesCount}</span>
                  </div>
                  <input
                    type="text"
                    value={currentSlide.headline || ''}
                    onChange={e => handleUpdateCurrentSlide('headline', e.target.value)}
                    placeholder="e.g. 5 Ways to Style the Cuban Collar Shirt"
                    className="input-field"
                    style={{ fontSize: 13, fontWeight: 600, width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label" style={{ letterSpacing: '0.08em' }}>SLIDE COPY</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(currentSlide.body || '').length} characters</span>
                  </div>
                  <textarea
                    value={currentSlide.body || ''}
                    onChange={e => handleUpdateCurrentSlide('body', e.target.value)}
                    className="input-field"
                    style={{ minHeight: 74, lineHeight: 1.55, resize: 'vertical', width: '100%' }}
                    placeholder="Pair with shorts and sandals for a relaxed summer look..."
                  />
                </div>
              </>
            ) : (
              /* REEL FIELDS */
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label" style={{ letterSpacing: '0.08em' }}>{activeSlide === 0 ? 'HOOK / HEADLINE' : `SCENE ${activeSlide + 1} HEADLINE`}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(currentSlide.headline || '').length} characters</span>
                  </div>
                  <input
                    type="text"
                    value={currentSlide.headline || ''}
                    onChange={e => handleUpdateCurrentSlide('headline', e.target.value)}
                    placeholder="One linen shirt. Three ways to wear it this summer."
                    className="input-field"
                    style={{ fontSize: 13, fontWeight: 600, width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label" style={{ letterSpacing: '0.08em' }}>VOICEOVER / SCRIPT</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(currentSlide.body || '').length} characters</span>
                  </div>
                  <textarea
                    value={currentSlide.body || ''}
                    onChange={e => handleUpdateCurrentSlide('body', e.target.value)}
                    className="input-field"
                    style={{ minHeight: 74, lineHeight: 1.55, resize: 'vertical', width: '100%' }}
                    placeholder="Voiceover narration or dialogue..."
                  />
                </div>
              </>
            )}

            {/* Visual Direction Cue */}
            {currentSlide.visual_cue && (
              <div
                style={{
                  background: 'var(--surface-subtle, #E8D9C8)',
                  border: '1px solid #DDD3C5',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 18,
                  fontSize: 11,
                  color: 'var(--text-secondary, #735F52)',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--brown-primary, #5A3021)', flexShrink: 0 }}>ART DIRECTION:</span>
                <span>{currentSlide.visual_cue}</span>
              </div>
            )}

            {/* 3. CAPTION SECTION */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div className="label" style={{ letterSpacing: '0.08em' }}>CAPTION</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{caption.length} characters</span>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="input-field"
                style={{ minHeight: 90, lineHeight: 1.6, resize: 'vertical', width: '100%' }}
                placeholder="Write your post caption..."
              />
            </div>

            {/* 4. CALL TO ACTION (CTA) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="label" style={{ letterSpacing: '0.08em' }}>CALL TO ACTION</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {showAllCtas ? 'All 8 options' : 'Recommended for this angle'}
                </span>
              </div>

              {/* Contextual CTA Pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {(showAllCtas ? contextualCtas : contextualCtas.slice(0, 4)).map(option => {
                  const isSelected = cta === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectCta(option)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: isSelected ? '1px solid #5A3021' : '1px solid #DDD3C5',
                        background: isSelected ? '#5A3021' : '#FFFCF7',
                        color: isSelected ? '#FFFCF7' : '#735F52',
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={isSelected ? 'Click to deselect CTA' : `Select "${option}"`}
                    >
                      {option}
                      {isSelected && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.8 }}>✕</span>}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowAllCtas(s => !s)}
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '2px 6px', color: 'var(--text-muted)' }}
                >
                  {showAllCtas ? '▴ Show fewer' : '▾ More CTA options (8)'}
                </button>

                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Preview: {cta ? (
                    <strong style={{ color: '#5A3021' }}>"{cta} — link in bio 🔗 →"</strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                  )}
                </span>
              </div>
            </div>

            {/* 5. HASHTAGS SECTION */}
            <div style={{ marginBottom: 22 }}>
              <div className="label" style={{ marginBottom: 8, letterSpacing: '0.08em' }}>HASHTAGS ({hashtags.length})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="badge badge-accent"
                    style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, background: '#E8D9C8', color: '#5A3828' }}
                  >
                    <span>#{tag.replace(/^#/, '')}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                      title="Remove hashtag"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}

                {isAddingTag ? (
                  <form onSubmit={handleAddTag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      placeholder="tag"
                      autoFocus
                      style={{
                        width: 80,
                        padding: '3px 6px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid #DDD3C5',
                        background: '#FFFCF7',
                        outline: 'none',
                      }}
                    />
                    <button type="submit" className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }}>Add</button>
                    <button type="button" className="btn-ghost" onClick={() => setIsAddingTag(false)} style={{ padding: '2px' }}>
                      <X size={12} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '4px 8px', border: '1px dashed #DDD3C5', borderRadius: 4, gap: 3 }}
                  >
                    <Plus size={11} /> Add tag
                  </button>
                )}
              </div>
            </div>

            {/* 6. CONTENT STRATEGY / WHY THIS IS RECOMMENDED */}
            <div
              style={{
                background: '#F9F5EE',
                border: '1px solid #DDD3C5',
                borderRadius: 8,
                padding: '14px 16px',
              }}
            >
              <div className="label-accent" style={{ marginBottom: 8, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> WHY THIS IS RECOMMENDED
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#49634A', fontWeight: 700 }}>✓</span>
                  <span>Strongest-performing format historically ({isCarousel ? '8.4%' : '8.8%'} avg. engagement).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#49634A', fontWeight: 700 }}>✓</span>
                  <span>High-demand product with 14.2K views & 1,050 recent sales.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#49634A', fontWeight: 700 }}>✓</span>
                  <span>Optimized for {effectiveAudience} audience tone and styling behavior.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. FOOTER ACTION BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '0 4px' }}>
            <button type="button" className="btn-ghost" onClick={onRegenerate} style={{ fontSize: 12, gap: 5 }}>
              <RefreshCw size={12} /> Regenerate copy
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isApproved ? (
                <button
                  type="button"
                  id="bottom-approve-btn"
                  className="btn-primary"
                  onClick={handleApproveAndOpenSchedule}
                  style={{ fontSize: 12, padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={13} /> Approve & schedule →
                </button>
              ) : !isScheduled ? (
                <button
                  type="button"
                  id="bottom-schedule-btn"
                  className="btn-primary"
                  onClick={() => setShowScheduler(true)}
                  style={{ fontSize: 12, padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <CalendarClock size={13} /> Schedule post →
                </button>
              ) : (
                <button
                  type="button"
                  id="bottom-reschedule-btn"
                  className="btn-secondary"
                  onClick={() => setShowScheduler(true)}
                  style={{ fontSize: 12, padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFCF7' }}
                >
                  <CalendarClock size={13} /> Reschedule post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── D. SCHEDULE MODAL DIALOG (Centered with Backdrop Blur) ─── */}
      {showScheduler && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(23, 21, 19, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowScheduler(false)}
        >
          <div
            className="card fade-up"
            style={{
              maxWidth: 440,
              width: '100%',
              background: '#FFFCF7',
              padding: '26px 28px',
              borderRadius: 12,
              border: '1px solid #DDD3C5',
              boxShadow: '0 24px 48px rgba(33, 25, 20, 0.22)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="label" style={{ marginBottom: 4, letterSpacing: '0.08em' }}>
                  {isScheduled ? 'RESCHEDULE PUBLICATION' : 'SCHEDULE PUBLICATION'}
                </div>
                <h3 className="serif-heading" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
                  Choose Publication Time
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowScheduler(false)}
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.45 }}>
              Set when this {isCarousel ? 'Instagram Carousel' : 'Instagram Reel'} should be scheduled to your content calendar.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleScheduleConfirm();
              }}
            >
              {/* Date Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Publication Date
                </label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Peak D2C Posting Time Presets */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Optimal D2C Posting Times
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Morning Drop', time: '09:00' },
                    { label: 'Lunch Break', time: '13:00' },
                    { label: 'Peak Evening', time: '19:00' },
                    { label: 'Late Night', time: '21:00' },
                  ].map(preset => {
                    const isSelected = schedTime === preset.time;
                    return (
                      <button
                        type="button"
                        key={preset.time}
                        onClick={() => setSchedTime(preset.time)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: isSelected ? '1px solid #5A3021' : '1px solid #DDD3C5',
                          background: isSelected ? '#5A3021' : '#E8DCCB',
                          color: isSelected ? '#FFFCF7' : '#171513',
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{preset.label}</span>
                        <span style={{ opacity: isSelected ? 0.9 : 0.6 }}>{preset.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Time */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Custom Time (IST)
                </label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowScheduler(false)}
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!schedDate || !schedTime}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '8px 18px' }}
                >
                  {isScheduled ? 'Confirm Reschedule' : 'Confirm & Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
