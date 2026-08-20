'use client';
import React from 'react';
import {
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  GripVertical,
  Check,
  X,
} from 'lucide-react';
import type { CalendarEntry } from '../lib/types';

interface CalendarViewProps {
  entries: CalendarEntry[];
  onDeleteEntry?: (id: string) => void;
  onSelectDraft?: (draftId: string) => void;
  onRescheduleEntry?: (entryId: string, draftId: string, newDate: string, newTime?: string) => Promise<any> | void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Peak social engagement times for D2C brands
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

const STATUS_DOT: Record<string, string> = {
  scheduled: 'var(--brown-primary)',
  approved: 'var(--green)',
  published: '#55705A',
  draft: 'var(--text-muted)',
};

const STATUS_LABEL_CLASS: Record<string, string> = {
  scheduled: 'badge badge-accent',
  approved: 'badge badge-green',
  published: 'badge badge-green',
  draft: 'badge badge-neutral',
};

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

  // Drag-and-drop state
  const [draggedEntry, setDraggedEntry] = React.useState<CalendarEntry | null>(null);
  const [dragOverDate, setDragOverDate] = React.useState<string | null>(null);
  const [rescheduleToast, setRescheduleToast] = React.useState<string | null>(null);

  // Quick Time/Date Edit Modal State
  const [editingEntry, setEditingEntry] = React.useState<{
    entry: CalendarEntry;
    date: string;
    time: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const days = getCalendarDays(year, month);

  const entriesByDate: Record<string, CalendarEntry[]> = {};
  entries.forEach(e => {
    const d = e.scheduled_datetime.split('T')[0];
    if (!entriesByDate[d]) entriesByDate[d] = [];
    entriesByDate[d].push(e);
  });

  const prev = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const next = () => {
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
        // ignore parse fail
      }
    }

    if (!entryToMove || !entryToMove.draft_id || !onRescheduleEntry) return;

    // Check if target is already the same date
    const currentDateStr = entryToMove.scheduled_datetime.split('T')[0];
    if (currentDateStr === targetDateStr) return;

    const existingTime = entryToMove.scheduled_datetime.split('T')[1]?.slice(0, 5) || '19:00';

    try {
      await onRescheduleEntry(entryToMove.id, entryToMove.draft_id, targetDateStr, existingTime);
      const [y, m, d] = targetDateStr.split('-');
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
      const [y, m, d] = editingEntry.date.split('-');
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

  return (
    <div className="page-container fade-up" style={{ maxWidth: 940 }}>
      {/* Toast notification */}
      {rescheduleToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: 'var(--brown-primary)',
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

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>TIMELINE</div>
          <h1
            className="serif-heading"
            style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            Content Calendar
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {entries.length} post{entries.length !== 1 ? 's' : ''} scheduled. Drag any post pill to reschedule across days.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brown-primary)' }} />
            Scheduled
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
            Approved
          </span>
        </div>
      </div>

      {/* Calendar Card */}
      <div
        className="card"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          background: 'var(--surface)',
          padding: '20px 22px',
          marginBottom: 28,
        }}
      >
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <button className="btn-ghost" onClick={prev} style={{ padding: '6px 12px', fontSize: 16, color: 'var(--text-secondary)' }}>
            ‹
          </button>
          <h2 className="serif-heading" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {MONTHS[month]} {year}
          </h2>
          <button className="btn-ghost" onClick={next} style={{ padding: '6px 12px', fontSize: 16, color: 'var(--text-secondary)' }}>
            ›
          </button>
        </div>

        {/* Scrollable on mobile */}
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 540 }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {DAYS.map(d => (
                <div
                  key={d}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '4px 0',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {days.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      style={{
                        minHeight: 88,
                        borderRadius: 6,
                        background: 'transparent',
                        opacity: 0.2,
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

                return (
                  <div
                    key={day}
                    onDragOver={e => handleDragOverCell(dateStr, e)}
                    onDragLeave={handleDragLeaveCell}
                    onDrop={e => handleDropOnCell(dateStr, e)}
                    style={{
                      minHeight: 88,
                      padding: '8px 8px',
                      border: isDragOver
                        ? '2px dashed var(--brown-primary)'
                        : `1px solid ${isToday ? 'var(--brown-primary)' : 'var(--border)'}`,
                      borderRadius: 6,
                      background: isDragOver
                        ? 'var(--surface-subtle)'
                        : isToday
                        ? 'rgba(90, 56, 40, 0.04)'
                        : 'var(--surface)',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Day number */}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'var(--brown-primary)' : 'var(--text-muted)',
                        marginBottom: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{day}</span>
                      {isToday && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brown-primary)' }}>Today</span>
                      )}
                    </div>

                    {/* Post pills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEntries.map(entry => {
                        const timeStr = entry.scheduled_datetime.split('T')[1]?.slice(0, 5) || '19:00';
                        const isDraggingThis = draggedEntry?.id === entry.id;

                        return (
                          <div
                            key={entry.id}
                            draggable={Boolean(entry.draft_id && onRescheduleEntry)}
                            onDragStart={e => handleDragStart(entry, e)}
                            onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                            title={`${entry.title} (${timeStr}) — Drag to move or click to edit`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 6px',
                              borderRadius: 4,
                              background: 'var(--surface-subtle)',
                              border: '1px solid var(--border)',
                              cursor: entry.draft_id ? 'grab' : 'default',
                              opacity: isDraggingThis ? 0.35 : 1,
                              transition: 'all 0.12s ease',
                              overflow: 'hidden',
                              userSelect: 'none',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = 'var(--brown-soft)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)';
                            }}
                          >
                            <GripVertical size={10} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: STATUS_DOT[entry.status] || 'var(--brown-primary)',
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                flex: 1,
                              }}
                            >
                              {entry.title.split(' ').slice(0, 3).join(' ')}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              {timeStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Scheduled List */}
      {entries.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: 14 }}>Scheduled Posts ({entries.length})</div>
          <div
            className="card"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface)',
              overflow: 'hidden',
            }}
          >
            {entries
              .slice()
              .sort((a, b) => a.scheduled_datetime.localeCompare(b.scheduled_datetime))
              .map((entry, i) => {
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
                      borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s ease',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(90, 56, 40, 0.03)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {/* Drag Handle */}
                    <div style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} title="Drag to calendar to change date">
                      <GripVertical size={14} />
                    </div>

                    {/* Date Block */}
                    <div
                      onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
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
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {MONTHS[dt.getMonth()]}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1,
                        }}
                      >
                        {dt.getDate()}
                      </div>
                    </div>

                    {/* Content Info */}
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{entry.platform}</span>
                        <span>·</span>
                        <span>{entry.format}</span>
                        <span>·</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{timeStr} IST</span>
                      </div>
                    </div>

                    {/* Quick Reschedule Time Button */}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingEntry({ entry, date: dateStr, time: timeStr })}
                      style={{ fontSize: 11, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                      title="Adjust date & time"
                    >
                      <Clock size={12} />
                      <span>{timeStr}</span>
                    </button>

                    {/* Status Badge */}
                    <span
                      className={STATUS_LABEL_CLASS[entry.status] || 'badge badge-neutral'}
                      style={{ fontSize: 10, flexShrink: 0 }}
                    >
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>

                    {/* Delete button */}
                    {onDeleteEntry && (
                      <button
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
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
            No posts scheduled yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Generate and approve content from opportunities to schedule posts on your timeline.
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
              background: 'var(--surface)',
              padding: '24px 26px',
              borderRadius: 10,
              boxShadow: '0 20px 40px rgba(33, 25, 20, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>RESCHEDULE POST</div>
                <h3 className="serif-heading" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
                  Change Publication Date & Time
                </h3>
              </div>
              <button className="btn-ghost" onClick={() => setEditingEntry(null)} style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 18 }}>
              {editingEntry.entry.title}
            </p>

            <form onSubmit={handleQuickRescheduleSubmit}>
              {/* Date Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
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
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
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
                          border: isSelected ? '1px solid var(--brown-primary)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--brown-primary)' : 'var(--surface-subtle)',
                          color: isSelected ? '#FFFCF7' : 'var(--text-primary)',
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
                  value={editingEntry.time}
                  onChange={e => setEditingEntry({ ...editingEntry, time: e.target.value })}
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Action buttons */}
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
