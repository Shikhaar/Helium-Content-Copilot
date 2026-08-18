'use client';
import React from 'react';
import { ArrowLeft, RefreshCw, Check, CalendarClock, Edit3, Hash } from 'lucide-react';
import type { ContentDraft, Opportunity, ScheduleRequest } from '@/lib/types';

interface ContentStudioProps {
  draft: ContentDraft | null;
  opportunity: Opportunity | null;
  isGenerating: boolean;
  onBack: () => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onSchedule: (req: ScheduleRequest) => void;
  onUpdateCaption?: (caption: string) => void;
  onUpdateDraft?: (updates: { caption?: string; cta?: string; hashtags?: string[] }) => void;
}

function SlidePreview({ slide, isActive, onClick }: {
  slide: { slide_number: number; headline: string; body: string; visual_cue: string };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 70, height: 70, borderRadius: 8, flexShrink: 0,
        border: isActive ? '2px solid var(--accent)' : '2px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s ease', overflow: 'hidden', padding: 8,
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}>
        {slide.slide_number}
      </div>
      <div style={{
        fontSize: 8, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        textAlign: 'center', lineHeight: 1.3, marginTop: 4,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
      }}>
        {slide.headline}
      </div>
    </div>
  );
}

function BigSlideCard({ slide, totalSlides = 4, brandName = 'SNITCH' }: {
  slide: { slide_number: number; headline: string; body: string; visual_cue: string };
  totalSlides?: number;
  brandName?: string;
}) {
  return (
    <div className="ig-card" style={{ width: 300, aspectRatio: '4/5', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
      {/* Background gradient mock */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, #1a1a3e 0%, #0a0a1f 100%)`,
      }} />
      {/* Slide number */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '3px 7px',
      }}>
        {slide.slide_number}/{totalSlides}
      </div>
      {/* Brand watermark */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
        letterSpacing: '0.08em',
      }}>
        {brandName}
      </div>
      {/* Content */}
      <div style={{ position: 'relative', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.01em' }}>
          {slide.headline}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          {slide.body}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
          📷 {slide.visual_cue}
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
  draft, opportunity, isGenerating, onBack, onRegenerate, onApprove, onSchedule, onUpdateCaption, onUpdateDraft,
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

  React.useEffect(() => {
    if (draft) {
      setCaption(draft.caption);
      setCta(draft.cta);
      setHashtags(draft.hashtags);
      setHashtagsInput(draft.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' '));
    }
  }, [draft]);

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

  const handleSchedule = () => {
    if (!schedDate || !schedTime) return;
    onSchedule({ scheduled_date: schedDate, scheduled_time: schedTime, platform: 'Instagram' });
    setShowScheduler(false);
  };

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
            <div style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--accent-subtle)', color: 'var(--accent-light)', fontSize: 12, fontWeight: 600, border: '1px solid var(--accent-border)' }}>
              ✓ Scheduled for {draft.scheduled_date}
            </div>
          ) : isApproved ? (
            <div style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--green-subtle)', color: 'var(--green)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(34,197,94,0.25)' }}>
              ✓ Approved
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 28 }}>
        {/* Left: Preview */}
        <div>
          <div className="label" style={{ marginBottom: 14 }}>Instagram Preview</div>
          <BigSlideCard slide={draft.slides[activeSlide]} totalSlides={draft.slides.length} />
          {/* Slide strip */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto' }}>
            {draft.slides.map((s, i) => (
              <SlidePreview key={i} slide={s} isActive={i === activeSlide} onClick={() => setActiveSlide(i)} />
            ))}
          </div>
        </div>

        {/* Right: Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Caption & CTA */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label">Caption & CTA</div>
              <button
                className="btn-ghost"
                onClick={handleSaveCaption}
                style={{ fontSize: 12 }}
              >
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
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: 12, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6,
                      resize: 'vertical', minHeight: 100, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Call to Action (CTA)</div>
                  <input
                    type="text"
                    value={cta}
                    onChange={e => setCta(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                    placeholder="e.g. Shop now — link in bio 🔗"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {caption}
                </p>
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-subtle)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>CTA:</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cta || draft.cta}</span>
                </div>
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label">
                <Hash size={11} style={{ display: 'inline', marginRight: 4 }} />
                Hashtags ({hashtags.length})
              </div>
              <button
                className="btn-ghost"
                onClick={handleSaveHashtags}
                style={{ fontSize: 12 }}
              >
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
                    width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 12, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6,
                    resize: 'vertical', minHeight: 70, outline: 'none', fontFamily: 'inherit',
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
                  <span key={h} style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 6,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    color: 'var(--accent-light)',
                  }}>
                    {h.startsWith('#') ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Slide details */}
          <div className="card" style={{ padding: 22 }}>
            <div className="label" style={{ marginBottom: 12 }}>Slide {activeSlide + 1} Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Headline</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {draft.slides[activeSlide].headline}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Body</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {draft.slides[activeSlide].body}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Visual Direction</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {draft.slides[activeSlide].visual_cue}
                </div>
              </div>
            </div>
          </div>

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

          {/* Scheduler */}
          {showScheduler && (
            <div className="card" style={{ padding: 20 }}>
              <div className="label" style={{ marginBottom: 14 }}>Schedule this post</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Date</div>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13,
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
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={handleSchedule} disabled={!schedDate}>
                  Confirm Schedule
                </button>
                <button className="btn-secondary" onClick={() => setShowScheduler(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
