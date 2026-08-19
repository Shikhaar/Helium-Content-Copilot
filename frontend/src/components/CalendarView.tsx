'use client';
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { CalendarEntry } from '../lib/types';

interface CalendarViewProps {
  entries: CalendarEntry[];
  onDeleteEntry?: (id: string) => void;
  onSelectDraft?: (draftId: string) => void;
}

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// Subtle dot color per status (editorial, not neon)
const STATUS_DOT: Record<string, string> = {
  scheduled: 'var(--accent)',
  approved:  'var(--green)',
  published: 'var(--green-light)',
  draft:     'var(--text-muted)',
};

const STATUS_LABEL_CLASS: Record<string, string> = {
  scheduled: 'badge badge-accent',
  approved:  'badge badge-green',
  published: 'badge badge-green',
  draft:     'badge badge-neutral',
};

export default function CalendarView({ entries, onDeleteEntry, onSelectDraft }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear]       = React.useState(today.getFullYear());
  const [month, setMonth]     = React.useState(today.getMonth());
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const days = getCalendarDays(year, month);

  const entriesByDate: Record<string, CalendarEntry[]> = {};
  entries.forEach(e => {
    const d = e.scheduled_datetime.split('T')[0];
    if (!entriesByDate[d]) entriesByDate[d] = [];
    entriesByDate[d].push(e);
  });

  const prev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteEntry) return;
    setDeletingId(id);
    try { await onDeleteEntry(id); } finally { setDeletingId(null); }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Content Calendar
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {entries.length} post{entries.length !== 1 ? 's' : ''} scheduled.
          {' '}Click any post to open and edit it in Content Studio.
        </p>
      </div>

      {/* Calendar card */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', padding: '20px 20px' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn-ghost" onClick={prev} style={{ padding: '5px 11px', fontSize: 16 }}>‹</button>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {MONTHS[month]} {year}
          </h2>
          <button className="btn-ghost" onClick={next} style={{ padding: '5px 11px', fontSize: 16 }}>›</button>
        </div>

        {/* Scrollable on mobile */}
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 480 }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', padding: '5px 0', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} style={{ minHeight: 70 }} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEntries = entriesByDate[dateStr] || [];
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                return (
                  <div key={day} style={{
                    minHeight: 70, padding: '7px 7px',
                    border: `1px solid ${isToday ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 6,
                    background: isToday ? 'var(--accent-subtle)' : 'transparent',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                      marginBottom: 5,
                    }}>
                      {day}
                    </div>
                    {dayEntries.map(entry => (
                      <div
                        key={entry.id}
                        onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                        title={entry.title}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '2px 5px', borderRadius: 3, marginBottom: 2,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          cursor: entry.draft_id ? 'pointer' : 'default',
                          transition: 'background 0.12s ease',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={e => {
                          if (entry.draft_id) (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                        }}
                      >
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_DOT[entry.status] || 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {entry.title.split(' ').slice(0, 3).join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming scheduled list */}
      {entries.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="label" style={{ marginBottom: 14 }}>Scheduled Posts</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', overflow: 'hidden' }}>
            {entries
              .sort((a, b) => a.scheduled_datetime.localeCompare(b.scheduled_datetime))
              .map((entry, i) => {
                const dt = new Date(entry.scheduled_datetime);
                const isDeleting = deletingId === entry.id;
                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: entry.draft_id ? 'pointer' : 'default',
                      transition: 'background 0.12s ease',
                    }}
                    onClick={() => entry.draft_id && onSelectDraft?.(entry.draft_id)}
                    onMouseEnter={e => {
                      if (entry.draft_id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {/* Date block */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 6,
                      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{MONTHS[dt.getMonth()]}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{dt.getDate()}</div>
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {entry.platform} · {entry.format} · {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {/* Status badge */}
                    <span className={STATUS_LABEL_CLASS[entry.status] || 'badge badge-neutral'} style={{ fontSize: 10, flexShrink: 0 }}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>
                    {/* Delete */}
                    {onDeleteEntry && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                        disabled={isDeleting}
                        className="btn-danger"
                        style={{ padding: '5px 7px', flexShrink: 0 }}
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

      {entries.length === 0 && (
        <div style={{ marginTop: 48, textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>—</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>No posts scheduled yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Generate and approve content to start filling your calendar.
          </div>
        </div>
      )}
    </div>
  );
}
