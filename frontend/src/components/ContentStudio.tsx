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
} from 'lucide-react';
import type { CarouselSlide, ContentDraft, Opportunity, ScheduleRequest } from '../lib/types';

interface ContentStudioProps {
  draft: ContentDraft | null;
  opportunity: Opportunity | null;
  isGenerating: boolean;
  onBack: () => void;
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

const REEL_SCENE_NAMES = ['HOOK', 'THE PRODUCT', 'STYLING', 'CTA'];
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
    <div className="page-container">
      <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 28 }} />
      <div className="skeleton" style={{ width: 320, height: 32, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: '100%', height: 420, borderRadius: 10 }} />
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
        maxWidth: 330,
        aspectRatio: '4/5',
        background: '#191512',
        borderRadius: 12,
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(33, 25, 20, 0.08)',
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
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(0deg, rgba(17,14,12,0.92) 0%, rgba(17,14,12,0.6) 45%, rgba(0,0,0,0) 100%)',
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
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
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
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
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
              textShadow: '0 1px 4px rgba(0,0,0,0.7)',
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
              background: 'var(--brown-primary)',
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
        maxWidth: 330,
        aspectRatio: '9/16',
        background: '#191512',
        borderRadius: 12,
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(33, 25, 20, 0.08)',
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
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
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
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
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
              background: 'var(--brown-primary)',
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
  isGenerating,
  onBack,
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
  const [saveToast, setSaveToast] = React.useState(false);

  const [showAllCtas, setShowAllCtas] = React.useState(false);

  // Local slides state for immediate responsive edits
  const [slides, setSlides] = React.useState<CarouselSlide[]>([]);

  // Detect format accurately
  const isCarousel = (draft?.format || opportunity?.format || '').toLowerCase().includes('carousel');
  const contextualCtas = getContextualCtas(opportunity?.content_angle || '', draft?.format || '');

  React.useEffect(() => {
    if (draft) {
      setCaption(draft.caption || '');
      setCta(draft.cta || (isCarousel ? 'Discover your style' : 'Shop the look'));
      setHashtags(draft.hashtags || ['SNITCH', 'SummerStyle', 'LinenShirt', 'Menswear']);
      setSlides(draft.slides || []);
      setActiveSlide(0);
    }
  }, [draft?.id, draft?.format, isCarousel]);

  if (isGenerating) return <Skeleton />;
  if (!draft) {
    return (
      <div className="page-container fade-up" style={{ maxWidth: 940, textAlign: 'center', padding: '60px 20px' }}>
        <div className="card" style={{ padding: 40, maxWidth: 500, margin: '0 auto', background: 'var(--surface)' }}>
          <div className="label" style={{ marginBottom: 8 }}>Content Studio</div>
          <h2 className="serif-heading" style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 12 }}>
            No Active Content Draft
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            Content Studio generates and refines social posts based on strategic opportunities. Select an opportunity from the dashboard to start crafting.
          </p>
          <button className="btn-primary" onClick={onBack} style={{ margin: '0 auto' }}>
            <ArrowLeft size={14} /> Back to opportunities
          </button>
        </div>
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

  const handleSaveDraft = () => {
    if (onUpdateDraft) {
      onUpdateDraft({ slides: currentSlidesList, caption, cta, hashtags });
    } else if (onUpdateCaption) {
      onUpdateCaption(caption);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  };

  const handleSelectCta = (option: string) => {
    // If clicking already selected option, unselect it (toggle off)
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

  const handleScheduleConfirm = () => {
    if (!schedDate || !schedTime) return;
    onSchedule({ scheduled_date: schedDate, scheduled_time: schedTime, platform: 'Instagram' });
    setShowScheduler(false);
  };

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev < totalSlidesCount - 1 ? prev + 1 : prev));
  };

  const currentTitle = opportunity?.title || draft.opportunity_id || 'Content Draft';

  return (
    <div className="page-container fade-up" style={{ maxWidth: 940 }}>
      {/* ── A. HEADER ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <button
          className="btn-ghost"
          onClick={onBack}
          style={{ padding: '4px 0', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to opportunities
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>Content Studio</div>
            <h1
              className="serif-heading"
              style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 4 }}
            >
              {currentTitle}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{isCarousel ? 'Instagram Carousel' : 'Instagram Reel'}</span>
              <span>·</span>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>High confidence recommendation</span>
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
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={14} /> Saved
              </span>
            )}
            <button className="btn-secondary" onClick={handleSaveDraft} style={{ fontSize: 12, padding: '7px 14px' }}>
              Save draft
            </button>
            {!isApproved && (
              <button id="approve-btn" className="btn-primary" onClick={onApprove} style={{ fontSize: 12, padding: '7px 16px' }}>
                <Check size={14} /> Approve & schedule
              </button>
            )}
            {isApproved && !isScheduled && (
              <button id="schedule-btn" className="btn-primary" onClick={() => setShowScheduler(s => !s)} style={{ fontSize: 12, padding: '7px 16px' }}>
                <CalendarClock size={14} /> Schedule
              </button>
            )}
            {isScheduled && (
              <span className="badge badge-accent" style={{ fontSize: 12, padding: '5px 10px' }}>
                Scheduled for {draft.scheduled_date}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── B. MAIN CONTENT WORKSPACE (Two-Column Layout) ───────────── */}
      <div className="studio-grid" style={{ marginBottom: 28, alignItems: 'start' }}>

        {/* LEFT COLUMN: Format-Aware Preview with Tap Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

        {/* RIGHT COLUMN: Format-Aware Content Editor Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 22, background: 'var(--surface)' }}>

            {/* Metadata Bar */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>CONTENT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Format: <strong style={{ color: 'var(--text-primary)' }}>{isCarousel ? 'Instagram Carousel' : 'Instagram Reel'}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Content angle: <strong style={{ color: 'var(--text-primary)' }}>{opportunity?.content_angle || 'Product styling'}</strong>
                </div>
              </div>
            </div>

            {/* Slide / Scene Details */}
            {isCarousel ? (
              /* CAROUSEL EDITOR FIELDS */
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label">SLIDE TITLE</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Slide {activeSlide + 1} of {totalSlidesCount}</span>
                  </div>
                  <input
                    type="text"
                    value={currentSlide.headline || ''}
                    onChange={e => handleUpdateCurrentSlide('headline', e.target.value)}
                    placeholder="e.g. 5 Ways to Style the Cuban Collar Shirt"
                    className="input-field"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label">SLIDE COPY</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(currentSlide.body || '').length} characters</span>
                  </div>
                  <textarea
                    value={currentSlide.body || ''}
                    onChange={e => handleUpdateCurrentSlide('body', e.target.value)}
                    className="input-field"
                    style={{ minHeight: 70, lineHeight: 1.55, resize: 'vertical' }}
                    placeholder="Pair with shorts and sandals for a relaxed summer look..."
                  />
                </div>
              </>
            ) : (
              /* REEL EDITOR FIELDS */
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label">{activeSlide === 0 ? 'HOOK' : `SCENE ${activeSlide + 1} HEADLINE`}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(currentSlide.headline || '').length} characters</span>
                  </div>
                  <input
                    type="text"
                    value={currentSlide.headline || ''}
                    onChange={e => handleUpdateCurrentSlide('headline', e.target.value)}
                    placeholder="One linen shirt. Three ways to wear it this summer."
                    className="input-field"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="label">VOICEOVER / SCRIPT</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(currentSlide.body || '').length} characters</span>
                  </div>
                  <textarea
                    value={currentSlide.body || ''}
                    onChange={e => handleUpdateCurrentSlide('body', e.target.value)}
                    className="input-field"
                    style={{ minHeight: 70, lineHeight: 1.55, resize: 'vertical' }}
                    placeholder="Voiceover narration or dialogue..."
                  />
                </div>
              </>
            )}

            {/* Caption Section */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div className="label">CAPTION</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{caption.length} characters</span>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="input-field"
                style={{ minHeight: 90, lineHeight: 1.6, resize: 'vertical' }}
                placeholder="Write your post caption..."
              />
            </div>

            {/* Call To Action Selector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="label">CALL TO ACTION</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {showAllCtas ? 'All 8 options' : 'Recommended for this angle'}
                </span>
              </div>

              {/* Contextual CTA Options */}
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
                        border: isSelected ? '1px solid var(--brown-primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--brown-primary)' : 'var(--surface)',
                        color: isSelected ? '#FFFCF7' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                        }
                      }}
                      title={isSelected ? 'Click to deselect CTA' : `Select "${option}"`}
                    >
                      {option}
                      {isSelected && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.8 }}>✕</span>}
                    </button>
                  );
                })}
              </div>

              {/* Show More Toggle and Preview Feedback */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <strong style={{ color: 'var(--brown-primary)' }}>{cta} →</strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None (no CTA button overlay)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Hashtags Section */}
            <div style={{ marginBottom: 20 }}>
              <div className="label" style={{ marginBottom: 8 }}>HASHTAGS ({hashtags.length})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="badge badge-accent"
                    style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>#{tag.replace(/^#/, '')}</span>
                    <button
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
                        width: 75,
                        padding: '2px 6px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
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
                    style={{ fontSize: 11, padding: '3px 8px', border: '1px dashed var(--border)', borderRadius: 4, gap: 3 }}
                  >
                    <Plus size={11} /> Add tag
                  </button>
                )}
              </div>
            </div>

            {/* Why This Works (Content Intelligence) */}
            <div
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '14px 16px',
              }}
            >
              <div className="label-accent" style={{ marginBottom: 4 }}>WHY THIS WORKS</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.45 }}>
                {isCarousel
                  ? "Carousels are currently SNITCH's highest-saving format for styling and discovery."
                  : "Reels are currently SNITCH's strongest format for top-of-funnel reach."}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {isCarousel ? '8.4%' : '8.8%'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    avg {isCarousel ? 'Carousel' : 'Reel'} ER
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>14.2K</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>product views</div>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>1,050</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>product sales</div>
                </div>
              </div>
            </div>

          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={onRegenerate} style={{ fontSize: 12, gap: 5 }}>
              <RefreshCw size={12} /> Regenerate content
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={handleSaveDraft} style={{ fontSize: 12 }}>
                Save draft
              </button>
              {!isApproved ? (
                <button id="bottom-approve-btn" className="btn-primary" onClick={onApprove} style={{ fontSize: 12 }}>
                  <Check size={13} /> Approve
                </button>
              ) : (
                <button id="bottom-schedule-btn" className="btn-primary" onClick={() => setShowScheduler(s => !s)} style={{ fontSize: 12 }}>
                  <CalendarClock size={13} /> Schedule post
                </button>
              )}
            </div>
          </div>

          {/* Inline Scheduler Box */}
          {showScheduler && (
            <div className="card" style={{ padding: 18, background: 'var(--surface)' }}>
              <div className="label" style={{ marginBottom: 12 }}>Schedule post</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Time (IST)</label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={e => setSchedTime(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={handleScheduleConfirm} disabled={!schedDate} style={{ fontSize: 12 }}>
                  Confirm Schedule
                </button>
                <button className="btn-secondary" onClick={() => setShowScheduler(false)} style={{ fontSize: 12 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── C. STORYBOARD (Format-Aware Timeline / Slides) ─────────── */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="label">
            {isCarousel ? `STORYBOARD (${totalSlidesCount} SLIDES)` : 'STORYBOARD (0:00 – 0:15)'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {isCarousel ? 'Click slide to preview' : 'Click scene to preview'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(170px, 1fr))`,
            gap: 12,
          }}
        >
          {currentSlidesList.map((slide, i) => {
            const isSelected = i === activeSlide;
            const sceneThumb = getSlideImage(i + 1);

            // Role label depending on Carousel vs Reel
            let roleName = `SLIDE 0${i + 1}`;
            let timingText = '';

            if (isCarousel) {
              if (i === 0) roleName = '01 COVER';
              else if (i === totalSlidesCount - 1) roleName = `0${i + 1} CTA`;
              else roleName = `0${i + 1} SLIDE`;
            } else {
              roleName = `0${i + 1} ${REEL_SCENE_NAMES[i] || 'BEAT'}`;
              timingText = REEL_SCENE_TIMINGS[i] || '';
            }

            return (
              <div
                key={slide.slide_number || i}
                id={`storyboard-item-${i + 1}`}
                onClick={() => setActiveSlide(i)}
                style={{
                  border: isSelected ? '1px solid var(--brown-primary)' : '1px solid var(--border)',
                  borderRadius: 8,
                  background: isSelected ? 'var(--surface-subtle)' : 'var(--surface)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Top label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isSelected ? 'var(--brown-primary)' : 'var(--text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {roleName}
                  </span>
                  {timingText && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timingText}</span>}
                </div>

                {/* Thumbnail image */}
                <div
                  style={{
                    width: '100%',
                    height: 60,
                    borderRadius: 5,
                    overflow: 'hidden',
                    marginBottom: 8,
                    background: '#110F0E',
                  }}
                >
                  <img
                    src={sceneThumb}
                    alt={roleName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: isSelected ? 'brightness(1)' : 'brightness(0.75)',
                      transition: 'filter 0.2s ease',
                    }}
                  />
                </div>

                {/* Headline Snippet */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}
                  title={slide.headline}
                >
                  {slide.headline || `Slide ${i + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
