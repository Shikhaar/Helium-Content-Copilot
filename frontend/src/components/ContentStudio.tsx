'use client';
import React from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Check,
  CalendarClock,
  Edit3,
  Hash,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music,
  Film,
  Sparkles,
  Clock,
  TrendingUp,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ContentDraft, Opportunity, ScheduleRequest } from '../lib/types';

interface ContentStudioProps {
  draft: ContentDraft | null;
  opportunity: Opportunity | null;
  isGenerating: boolean;
  onBack: () => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onSchedule: (req: ScheduleRequest) => void;
  onUpdateCaption?: (caption: string) => void;
  onUpdateDraft?: (updates: { slides?: any[]; caption?: string; cta?: string; hashtags?: string[] }) => void;
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

const SCENE_ROLES = [
  'The Hook (0:00 - 0:03)',
  'Fabric & Story (0:03 - 0:07)',
  'Styling & Fit (0:07 - 0:11)',
  'Call to Action (0:11 - 0:15)',
];

function getOptimalSchedule(
  platform: string = 'Instagram',
  audience: string = 'Young Millennial',
  format: string = 'Reel',
  scheduledDate?: string | null,
  scheduledTime?: string | null
) {
  if (scheduledDate && scheduledTime) {
    return {
      timeText: `${scheduledDate} at ${scheduledTime}`,
      reason: 'Confirmed on calendar',
    };
  }

  const audLower = (audience || '').toLowerCase();
  const platLower = (platform || '').toLowerCase();

  if (platLower.includes('linkedin')) {
    return {
      timeText: 'Tomorrow 9:00 AM IST',
      reason: 'Peak morning commute / professional feed activity',
    };
  }

  if (audLower.includes('gen-z') || audLower.includes('college') || audLower.includes('streetwear')) {
    return {
      timeText: 'Tonight 8:30 PM IST',
      reason: 'Peak Gen-Z evening scroll & lifestyle discovery',
    };
  }

  if (audLower.includes('millennial') || audLower.includes('young')) {
    return {
      timeText: 'Today 7:30 PM IST',
      reason: 'Peak post-work browsing & high checkout intent',
    };
  }

  return {
    timeText: 'Tomorrow 6:45 PM IST',
    reason: 'High discovery & explore page velocity slot',
  };
}

function SlidePreview({
  slide,
  isActive,
  onClick,
}: {
  slide: { slide_number: number; headline: string; body: string; visual_cue: string };
  isActive: boolean;
  onClick: () => void;
}) {
  const bgImg = getSlideImage(slide.slide_number);
  return (
    <div
      onClick={onClick}
      style={{
        width: 74,
        height: 74,
        borderRadius: 10,
        flexShrink: 0,
        border: isActive ? '2px solid var(--accent)' : '2px solid var(--border)',
        boxShadow: isActive ? '0 0 14px rgba(99,102,241,0.35)' : 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Background thumbnail */}
      <img
        src={bgImg}
        alt={`Slide ${slide.slide_number}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.65)',
        }}
      />
      {/* Slide number pill */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          fontSize: 9,
          fontWeight: 800,
          color: '#fff',
          background: isActive ? 'var(--accent)' : 'rgba(0,0,0,0.6)',
          borderRadius: 4,
          padding: '1px 5px',
        }}
      >
        {slide.slide_number}
      </div>
      {/* Mini headline snippet */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '3px 4px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          fontSize: 8,
          color: '#fff',
          fontWeight: 600,
          lineHeight: 1.2,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {slide.headline}
      </div>
    </div>
  );
}

function BigSlideCard({
  slide,
  totalSlides = 4,
  brandName = 'SNITCH',
  format = 'Reel',
}: {
  slide: { slide_number: number; headline: string; body: string; visual_cue: string };
  totalSlides?: number;
  brandName?: string;
  format?: string;
}) {
  const bgImg = getSlideImage(slide.slide_number);
  const isVideo = format.toLowerCase().includes('reel') || format.toLowerCase().includes('video');

  return (
    <div
      className="ig-card"
      style={{
        width: 320,
        aspectRatio: '4/5',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 14,
        boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* High-res Background Image */}
      <img
        src={bgImg}
        alt={slide.headline}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.4s ease',
        }}
      />

      {/* Top Scrim Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom Scrim Gradient for Rich Text Legibility */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '75%',
          background:
            'linear-gradient(0deg, rgba(8,8,18,0.98) 0%, rgba(8,8,18,0.85) 45%, rgba(8,8,18,0.3) 80%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar inside Instagram Frame */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand & Verified Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.06em',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
            }}
          >
            {brandName.toUpperCase()}
          </span>
          <ShieldCheck size={14} color="#38bdf8" />
        </div>

        {/* Slide Counter & Format Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              borderRadius: 20,
              padding: '3px 8px',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isVideo ? <Film size={10} /> : null}
            {slide.slide_number}/{totalSlides}
          </div>
        </div>
      </div>

      {/* Right Floating Instagram Action Strip */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Heart size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>2.8k</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <MessageCircle size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>142</span>
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Send size={14} color="#fff" />
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Bookmark size={14} color="#fff" />
        </div>
      </div>

      {/* Bottom Content Area */}
      <div style={{ position: 'relative', padding: '0 18px 18px', zIndex: 4, paddingRight: 56 }}>
        {/* On-screen text overlay / Headline */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.25,
            marginBottom: 8,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
          }}
        >
          {slide.headline}
        </div>

        {/* Body Script / VO Narration */}
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
            marginBottom: 10,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          {slide.body}
        </div>

        {/* Visual Cue Pill */}
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.65)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(6px)',
            borderRadius: 6,
            padding: '5px 8px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 6,
            lineHeight: 1.4,
          }}
        >
          📷 {slide.visual_cue}
        </div>

        {/* Audio / Music Cue */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            color: 'var(--accent-light)',
            fontWeight: 600,
          }}
        >
          <Music size={11} />
          <span>Trending Audio · Lo-Fi Beats (0:00 - 0:03)</span>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 32 }} />
      <div className="skeleton" style={{ width: 300, height: 28, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '100%', height: 400, borderRadius: 12 }} />
    </div>
  );
}

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
  const [editingCaption, setEditingCaption] = React.useState(false);
  const [caption, setCaption] = React.useState('');
  const [cta, setCta] = React.useState('');
  const [editingHashtags, setEditingHashtags] = React.useState(false);
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [hashtagsInput, setHashtagsInput] = React.useState('');
  const [showScheduler, setShowScheduler] = React.useState(false);
  const [schedDate, setSchedDate] = React.useState('');
  const [schedTime, setSchedTime] = React.useState('19:00');

  // Slide scene editing
  const [isEditingSlide, setIsEditingSlide] = React.useState(false);
  const [slideHeadline, setSlideHeadline] = React.useState('');
  const [slideBody, setSlideBody] = React.useState('');
  const [slideVisualCue, setSlideVisualCue] = React.useState('');

  React.useEffect(() => {
    if (draft) {
      setCaption(draft.caption);
      setCta(draft.cta);
      setHashtags(draft.hashtags);
      setHashtagsInput(draft.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' '));
      if (draft.slides[activeSlide]) {
        setSlideHeadline(draft.slides[activeSlide].headline);
        setSlideBody(draft.slides[activeSlide].body);
        setSlideVisualCue(draft.slides[activeSlide].visual_cue);
      }
    }
  }, [draft, activeSlide]);

  if (isGenerating) return <Skeleton />;
  if (!draft) return null;

  const isApproved = draft.status === 'approved' || draft.status === 'scheduled';
  const isScheduled = draft.status === 'scheduled';

  const handleSaveCaption = () => {
    if (editingCaption) {
      if (onUpdateDraft) {
        onUpdateDraft({ caption, cta });
      } else if (onUpdateCaption) {
        onUpdateCaption(caption);
      }
    }
    setEditingCaption(!editingCaption);
  };

  const handleSaveHashtags = () => {
    if (editingHashtags) {
      const parsed = hashtagsInput
        .split(/[\s,]+/)
        .map(t => t.trim().replace(/^#+/, ''))
        .filter(Boolean);
      setHashtags(parsed);
      if (onUpdateDraft) {
        onUpdateDraft({ hashtags: parsed });
      }
    }
    setEditingHashtags(!editingHashtags);
  };

  const handleSaveSlide = () => {
    if (isEditingSlide && onUpdateDraft) {
      const updatedSlides = [...draft.slides];
      updatedSlides[activeSlide] = {
        ...updatedSlides[activeSlide],
        headline: slideHeadline,
        body: slideBody,
        visual_cue: slideVisualCue,
      };
      onUpdateDraft({ slides: updatedSlides });
    }
    setIsEditingSlide(!isEditingSlide);
  };

  const handleSchedule = () => {
    if (!schedDate || !schedTime) return;
    onSchedule({ scheduled_date: schedDate, scheduled_time: schedTime, platform: 'Instagram' });
    setShowScheduler(false);
  };

  const currentRole = SCENE_ROLES[activeSlide] || `Beat ${activeSlide + 1}`;

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Content Studio</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {draft.is_demo && <div className="demo-banner">DEMO</div>}
          {isScheduled ? (
            <div
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                background: 'var(--accent-subtle)',
                color: 'var(--accent-light)',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid var(--accent-border)',
              }}
            >
              ✓ Scheduled for {draft.scheduled_date}
            </div>
          ) : isApproved ? (
            <div
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                background: 'var(--green-subtle)',
                color: 'var(--green)',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              ✓ Approved
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28 }}>
        {/* Left Column: Instagram Preview & Storyboard Strip */}
        <div>
          <div
            className="label"
            style={{
              marginBottom: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Instagram Mockup Preview</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500 }}>
              {draft.format}
            </span>
          </div>

          <BigSlideCard
            slide={draft.slides[activeSlide]}
            totalSlides={draft.slides.length}
            brandName={opportunity?.audience ? 'SNITCH' : 'SNITCH'}
            format={draft.format}
          />

          {/* Slide strip */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              Storyboard Frames ({draft.slides.length} scenes)
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {draft.slides.map((s, i) => (
                <SlidePreview
                  key={i}
                  slide={s}
                  isActive={i === activeSlide}
                  onClick={() => {
                    setActiveSlide(i);
                    setIsEditingSlide(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scene Breakdown, Copy & Strategy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Scene / Slide Details Card */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="label" style={{ marginBottom: 2 }}>
                  Scene {activeSlide + 1} Storyboard Breakdown
                </div>
                <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>{currentRole}</div>
              </div>
              <button className="btn-ghost" onClick={handleSaveSlide} style={{ fontSize: 12 }}>
                <Edit3 size={12} />
                {isEditingSlide ? 'Save Scene' : 'Edit Scene'}
              </button>
            </div>

            {isEditingSlide ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    On-Screen Headline Overlay
                  </div>
                  <input
                    type="text"
                    value={slideHeadline}
                    onChange={e => setSlideHeadline(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Voiceover (VO) Script / Narration
                  </div>
                  <textarea
                    value={slideBody}
                    onChange={e => setSlideBody(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      resize: 'vertical',
                      minHeight: 70,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Visual Cue / Camera Direction
                  </div>
                  <input
                    type="text"
                    value={slideVisualCue}
                    onChange={e => setSlideVisualCue(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                    On-Screen Headline Overlay
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {draft.slides[activeSlide].headline}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                    Voiceover (VO) Script / Dialogue
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {draft.slides[activeSlide].body}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                    📷 Camera & Visual Direction
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--accent-light)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {draft.slides[activeSlide].visual_cue}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caption & CTA Card */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label">Caption & Call-to-Action</div>
              <button className="btn-ghost" onClick={handleSaveCaption} style={{ fontSize: 12 }}>
                <Edit3 size={12} />
                {editingCaption ? 'Save' : 'Edit'}
              </button>
            </div>
            {editingCaption ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Caption</div>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 12,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      resize: 'vertical',
                      minHeight: 100,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Call to Action (CTA)
                  </div>
                  <input
                    type="text"
                    value={cta}
                    onChange={e => setCta(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    placeholder="e.g. Shop now — link in bio 🔗"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {caption}
                </p>
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: 'var(--accent-subtle)',
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>CTA:</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cta || draft.cta}</span>
                </div>
              </div>
            )}
          </div>

          {/* Hashtags Card */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label">
                <Hash size={11} style={{ display: 'inline', marginRight: 4 }} />
                Hashtags ({hashtags.length})
              </div>
              <button className="btn-ghost" onClick={handleSaveHashtags} style={{ fontSize: 12 }}>
                <Edit3 size={12} />
                {editingHashtags ? 'Save' : 'Edit'}
              </button>
            </div>
            {editingHashtags ? (
              <div>
                <textarea
                  value={hashtagsInput}
                  onChange={e => setHashtagsInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    minHeight: 70,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="e.g. #snitch #summer2026 #mensfashion #linen"
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Separate hashtags with spaces or commas. Click Save to apply.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {hashtags.map(h => (
                  <span
                    key={h}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent-light)',
                    }}
                  >
                    {h.startsWith('#') ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Opportunity Intelligence Banner */}
          {(() => {
            const optimal = getOptimalSchedule(
              opportunity?.platform || draft.platform,
              opportunity?.audience || 'Young Millennial',
              draft.format,
              draft.scheduled_date,
              draft.scheduled_time
            );
            return (
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  background: 'rgba(99, 102, 241, 0.04)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Sparkles size={18} color="var(--accent-light)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Why this will perform: {opportunity ? `${opportunity.score}/100 Opportunity Fit` : 'High algorithmic confidence'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Optimal schedule: <strong style={{ color: 'var(--accent-light)' }}>{optimal.timeText}</strong> ({optimal.reason}) · Target: {opportunity?.audience || 'Young Millennial'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={onRegenerate}>
              <RefreshCw size={14} />
              Regenerate
            </button>
            {!isApproved && (
              <button id="approve-btn" className="btn-primary" onClick={onApprove}>
                <Check size={14} />
                Approve Content
              </button>
            )}
            {isApproved && !isScheduled && (
              <button id="schedule-btn" className="btn-primary" onClick={() => setShowScheduler(true)}>
                <CalendarClock size={14} />
                Schedule Post
              </button>
            )}
          </div>

          {/* Scheduler Popup */}
          {showScheduler && (
            <div className="card" style={{ padding: 20 }}>
              <div className="label" style={{ marginBottom: 14 }}>
                Schedule this post
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Date</div>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 7,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Time</div>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={e => setSchedTime(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 7,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={handleSchedule} disabled={!schedDate}>
                  Confirm Schedule
                </button>
                <button className="btn-secondary" onClick={() => setShowScheduler(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
