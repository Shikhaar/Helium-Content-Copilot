'use client';
import React from 'react';
import {
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Check,
  X,
  Plus,
} from 'lucide-react';
import type { CalendarEntry } from '../lib/types';

interface CalendarViewProps {
  entries: CalendarEntry[];
  onDeleteEntry?: (id: string) => void;
  onSelectDraft?: (draftId: string) => void;
  onRescheduleEntry?: (entryId: string, draftId: string, newDate: string, newTime?: string) => Promise<any> | void;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Optimal D2C posting times
const PRESET_TIMES = [
  { label: 'Morning Drop', time: '09:00' },
  { label: 'Lunch Break', time: '13:00' },
  { label: 'Peak Evening', time: '19:00' },
  { label: 'Late Night', time: '21:00' },
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function CalendarView({
  entries,
  onDeleteEntry,
  onSelectDraft,
  onRescheduleEntry,
}: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Drag and drop state
  const [draggedEntry, setDraggedEntry] = React.useState<CalendarEntry | null>(null);
  const [dragOverDate, setDragOverDate] = React.useState<string | null>(null);
  const [rescheduleToast, setRescheduleToast] = React.useState<string | null>(null);

  // Expanded Day Popover (for days with +X more posts)
  const [expandedDate, setExpandedDate] = React.useState<string | null>(null);

  // Quick Time/Date Edit Modal State
  const [editingEntry, setEditingEntry] = React.useState<{
    entry: CalendarEntry;
    date: string;
    time: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const days = getCalendarDays(year, month);

  // Group entries by date YYYY-MM-DD
  const entriesByDate: Record<string, CalendarEntry[]> = {};
  entries.forEach(e => {
    const d = e.scheduled_datetime.split('T')[0];
    if (!entriesByDate[d]) entriesByDate[d] = [];
    entriesByDate[d].push(e);
  });

  const prevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteEntry) return;
    setDeletingId(id);
    try {
      await onDeleteEntry(id);
    } finally {
      setDeletingId(null);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (entry: CalendarEntry, e: React.DragEvent) => {
    if (!entry.draft_id || !onRescheduleEntry) return;
    setDraggedEntry(entry);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: entry.id,
      draft_id: entry.draft_id,
      title: entry.title,
      scheduled_datetime: entry.scheduled_datetime,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCell = (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeaveCell = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverDate(null);
  };

  const handleDropOnCell = async (targetDateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);

    let entryToMove = draggedEntry;
    if (!entryToMove) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          entryToMove = entries.find(item => item.id === parsed.id) || null;
        }
      } catch {
        // ignore parse failure
      }
    }

    if (!entryToMove || !entryToMove.draft_id || !onRescheduleEntry) return;

    const currentDateStr = entryToMove.scheduled_datetime.split('T')[0];
    if (currentDateStr === targetDateStr) return;

    const existingTime = entryToMove.scheduled_datetime.split('T')[1]?.slice(0, 5) || '19:00';

    try {
      await onRescheduleEntry(entryToMove.id, entryToMove.draft_id, targetDateStr, existingTime);
      const [, m, d] = targetDateStr.split('-');
      const monthLabel = MONTHS[parseInt(m, 10) - 1] || m;
      setRescheduleToast(`Moved to ${monthLabel} ${parseInt(d, 10)} at ${existingTime}`);
      setTimeout(() => setRescheduleToast(null), 3000);
    } catch (err) {
      console.error('Drag reschedule failed:', err);
    } finally {
      setDraggedEntry(null);
    }
  };

  // Quick Modal Submit
  const handleQuickRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !onRescheduleEntry || !editingEntry.entry.draft_id) return;
    setIsUpdating(true);
    try {
      await onRescheduleEntry(
        editingEntry.entry.id,
        editingEntry.entry.draft_id,
        editingEntry.date,
        editingEntry.time,
      );
      const [, m, d] = editingEntry.date.split('-');
      const monthLabel = MONTHS[parseInt(m, 10) - 1] || m;
      setRescheduleToast(`Rescheduled to ${monthLabel} ${parseInt(d, 10)} at ${editingEntry.time}`);
      setTimeout(() => setRescheduleToast(null), 3000);
      setEditingEntry(null);
    } catch (err) {
      console.error('Reschedule failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const sortedEntries = entries
    .slice()
    .sort((a, b) => a.scheduled_datetime.localeCompare(b.scheduled_datetime));

  return (
    <div className="page-container fade-up" style={{ maxWidth: 980, width: '100%', boxSizing: 'border-box' }}>
      {/* Toast notification */}
      {rescheduleToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: 'var(--brown-primary, #5A3021)',
            color: '#FFFCF7',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(33, 25, 20, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} color="#FFFCF7" />
          <span>{rescheduleToast}</span>
        </div>
      )}

      {/* Header Section */}
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 4, letterSpacing: '0.08em', fontSize: 11 }}>
          CONTENT TIMELINE
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #171513)' }}>
            {entries.length} {entries.length === 1 ? 'post' : 'posts'} scheduled.
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted, #8F8275)' }}>
            Drag any post pill to reschedule across days.
          </span>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div
        className="card"
        style={{
          border: '1px solid #DDD3C5',
          borderRadius: 10,
          background: '#FFFCF7',
          padding: '20px 20px 24px',
          marginBottom: 32,
          boxShadow: '0 4px 16px rgba(33, 25, 20, 0.03)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Month Header Navigation (Centered Newsreader Serif) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            padding: '0 4px',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            onClick={prevMonth}
            aria-label="Previous month"
            style={{
              padding: '6px 10px',
              fontSize: 14,
              color: 'var(--text-secondary, #6F665D)',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <h2
            className="serif-heading"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary, #171513)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {FULL_MONTHS[month]} {year}
          </h2>

          <button
            type="button"
            className="btn-ghost"
            onClick={nextMonth}
            aria-label="Next month"
            style={{
              padding: '6px 10px',
              fontSize: 14,
              color: 'var(--text-secondary, #6F665D)',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── 7 EQUAL-WIDTH COLUMNS GRID ───────────────────────────── */}
        <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {/* Weekday Labels Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 6,
              marginBottom: 8,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {DAYS.map(dayName => (
              <div
                key={dayName}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted, #8F8275)',
                  textAlign: 'center',
                  padding: '4px 0',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 7-Column Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 6,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {days.map((day, i) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${i}`}
                    style={{
                      minHeight: 120,
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px dashed rgba(221, 211, 197, 0.4)',
                      opacity: 0.35,
                      boxSizing: 'border-box',
                      minWidth: 0,
                    }}
                  />
                );
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEntries = entriesByDate[dateStr] || [];
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const isDragOver = dragOverDate === dateStr;

              // Display up to 2 posts directly, fold remainder into "+ X more"
              const maxVisible = 2;
              const visibleEntries = dayEntries.slice(0, maxVisible);
              const overflowCount = dayEntries.length - maxVisible;

              return (
                <div
                  key={day}
                  onDragOver={e => handleDragOverCell(dateStr, e)}
                  onDragLeave={handleDragLeaveCell}
                  onDrop={e => handleDropOnCell(dateStr, e)}
                  style={{
                    minHeight: 120,
                    height: '100%',
                    padding: '8px 7px',
                    borderRadius: 6,
                    boxSizing: 'border-box',
                    minWidth: 0,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    border: isDragOver
                      ? '2px dashed var(--brown-primary, #5A3021)'
                      : `1px solid ${isToday ? 'var(--brown-primary, #5A3021)' : '#DDD3C5'}`,
                    background: isDragOver
                      ? '#EFE6D8'
                      : isToday
                      ? '#F9F5EE'
                      : '#FFFCF7',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                  }}
                >
                  {/* Date Header Top Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 6,
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'var(--brown-primary, #5A3021)' : 'var(--text-primary, #171513)',
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </span>

                    {isToday && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: 'var(--brown-primary, #5A3021)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Content / Stacked Post Pills */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      width: '100%',
                      minWidth: 0,
                      maxWidth: '100%',
                      flex: 1,
                    }}
                  >
                    {visibleEntries.map(entry => {
                      const timeStr = entry.scheduled_datetime.split('T')[1]?.slice(0, 5) || '19:00';
                      const isDraggingThis = draggedEntry?.id === entry.id;

                      return (
                        <div
                          key={entry.id}
                          draggable={Boolean(entry.draft_id && onRescheduleEntry)}
                          onDragStart={e => handleDragStart(entry, e)}
                          onClick={e => {
                            e.stopPropagation();
                            if (entry.draft_id) onSelectDraft?.(entry.draft_id);
                          }}
                          title={`${entry.title} (${timeStr}) — Click to edit or drag to move`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 5px',
                            borderRadius: 4,
                            background: '#E8DCCB',
                            border: '1px solid #D6C7B5',
                            color: '#422217',
                            width: '100%',
                            minWidth: 0,
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            cursor: entry.draft_id ? 'grab' : 'default',
                            opacity: isDraggingThis ? 0.35 : 1,
                            transition: 'background 0.12s ease, border-color 0.12s ease',
                            userSelect: 'none',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = '#DCCEB9';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = '#E8DCCB';
                          }}
                        >
                          <span
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: '#5A3021',
                              flexShrink: 0,
                              display: 'inline-block',
                            }}
                          />
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#5A3021',
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >
                            {timeStr}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              color: '#211914',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              flex: 1,
                              lineHeight: 1.2,
                            }}
                          >
                            {entry.title}
                          </span>
                        </div>
                      );
                    })}

                    {/* Overflow Pill for Multiple Posts */}
                    {overflowCount > 0 && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setExpandedDate(dateStr);
                        }}
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: 'var(--brown-primary, #5A3021)',
                          background: 'rgba(232, 220, 203, 0.5)',
                          border: '1px dashed #D6C7B5',
                          borderRadius: 3,
                          padding: '2px 4px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          width: '100%',
                          minWidth: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        + {overflowCount} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SCHEDULED POSTS AGENDA / LIST VIEW ──────────────────────── */}
      {sortedEntries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="label" style={{ marginBottom: 12, letterSpacing: '0.08em', fontSize: 11 }}>
            SCHEDULED POSTS ({sortedEntries.length})
          </div>

          <div
            className="card"
            style={{
              border: '1px solid #DDD3C5',
              borderRadius: 8,
              background: '#FFFCF7',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(33, 25, 20, 0.02)',
            }}
          >
            {sortedEntries.map((entry, i) => {
              const dt = new Date(entry.scheduled_datetime);
              const isDeleting = deletingId === entry.id;
              const timeStr = entry.scheduled_datetime.split('T')[1]?.slice(0, 5) || '19:00';
              const dateStr = entry.scheduled_datetime.split('T')[0];

              return (
                <div
                  key={entry.id}
                  draggable={Boolean(entry.draft_id && onRescheduleEntry)}
                  onDragStart={e => handleDragStart(entry, e)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    borderBottom: i < sortedEntries.length - 1 ? '1px solid #DDD3C5' : 'none',
                    transition: 'background 0.12s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(90, 48, 33, 0.03)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {/* Drag Grip Handle */}
                  <div
                    style={{ cursor: 'grab', color: '#8F8275', display: 'flex', alignItems: 'center' }}
                    title="Drag to a day cell on the calendar above to reschedule"
                  >
                    <GripVertical size={14} />
                  </div>

                  {/* Date Block */}
                  <div
                    onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 6,
                      background: '#E8DCCB',
                      border: '1px solid #D6C7B5',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: '#8F8275',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                      }}
                    >
                      {MONTHS[dt.getMonth()]}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#171513',
                        lineHeight: 1.1,
                        marginTop: 2,
                      }}
                    >
                      {dt.getDate()}
                    </div>
                  </div>

                  {/* Content Title & Details */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#171513',
                        marginBottom: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8F8275', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{entry.platform}</span>
                      <span>·</span>
                      <span>{entry.format}</span>
                      <span>·</span>
                      <span style={{ color: '#171513', fontWeight: 600 }}>{timeStr} IST</span>
                    </div>
                  </div>

                  {/* Time pill with quick edit */}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingEntry({ entry, date: dateStr, time: timeStr })}
                    style={{
                      fontSize: 11,
                      padding: '5px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                      background: '#FFFCF7',
                      borderColor: '#DDD3C5',
                    }}
                    title="Change date & time"
                  >
                    <Clock size={12} />
                    <span>{timeStr}</span>
                  </button>

                  {/* Status Badge */}
                  <span
                    className="badge badge-accent"
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      background: '#E8D9C8',
                      color: '#5A3828',
                      flexShrink: 0,
                    }}
                  >
                    Scheduled
                  </span>

                  {/* Delete Button */}
                  {onDeleteEntry && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      disabled={isDeleting}
                      className="btn-danger"
                      style={{ padding: '6px 8px', flexShrink: 0 }}
                      title="Remove from calendar"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div style={{ marginTop: 48, textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>—</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary, #6F665D)', marginBottom: 5 }}>
            No posts scheduled yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted, #8F8275)' }}>
            Generate and approve content from opportunities to schedule posts on your timeline.
          </div>
        </div>
      )}

      {/* ── EXPANDED DAY VIEW POPOVER (For days with +X posts) ──────── */}
      {expandedDate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(23, 21, 19, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setExpandedDate(null)}
        >
          <div
            className="card fade-up"
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#FFFCF7',
              padding: '22px 24px',
              borderRadius: 10,
              border: '1px solid #DDD3C5',
              boxShadow: '0 20px 40px rgba(33, 25, 20, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="label" style={{ marginBottom: 2 }}>SCHEDULED FOR</div>
                <h3 className="serif-heading" style={{ fontSize: 18, color: '#171513' }}>
                  {expandedDate}
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setExpandedDate(null)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(entriesByDate[expandedDate] || []).map(entry => {
                const timeStr = entry.scheduled_datetime.split('T')[1]?.slice(0, 5) || '19:00';
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setExpandedDate(null);
                      if (entry.draft_id) onSelectDraft?.(entry.draft_id);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      background: '#E8DCCB',
                      border: '1px solid #D6C7B5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#211914', marginBottom: 2 }}>
                        {entry.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#5A3828' }}>
                        {entry.format} · {entry.platform}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5A3021' }}>
                      {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK RESCHEDULE MODAL ──────────────────────────────────── */}
      {editingEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(23, 21, 19, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setEditingEntry(null)}
        >
          <div
            className="card fade-up"
            style={{
              maxWidth: 440,
              width: '100%',
              background: '#FFFCF7',
              padding: '24px 26px',
              borderRadius: 10,
              border: '1px solid #DDD3C5',
              boxShadow: '0 20px 40px rgba(33, 25, 20, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>RESCHEDULE POST</div>
                <h3 className="serif-heading" style={{ fontSize: 18, color: '#171513' }}>
                  Change Publication Date & Time
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditingEntry(null)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#6F665D', marginBottom: 18, lineHeight: 1.4 }}>
              {editingEntry.entry.title}
            </p>

            <form onSubmit={handleQuickRescheduleSubmit}>
              {/* Date Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6F665D', display: 'block', marginBottom: 6 }}>
                  Date
                </label>
                <input
                  type="date"
                  value={editingEntry.date}
                  onChange={e => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Preset Time Pills */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6F665D', display: 'block', marginBottom: 6 }}>
                  Optimal D2C Posting Times
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {PRESET_TIMES.map(preset => {
                    const isSelected = editingEntry.time === preset.time;
                    return (
                      <button
                        type="button"
                        key={preset.time}
                        onClick={() => setEditingEntry({ ...editingEntry, time: preset.time })}
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
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6F665D', display: 'block', marginBottom: 6 }}>
                  Custom Time (IST)
                </label>
                <input
                  type="time"
                  value={editingEntry.time}
                  onChange={e => setEditingEntry({ ...editingEntry, time: e.target.value })}
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
                  onClick={() => setEditingEntry(null)}
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editingEntry.date || !editingEntry.time}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '8px 18px' }}
                >
                  {isUpdating ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
