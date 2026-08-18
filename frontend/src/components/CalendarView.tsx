'use client';
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { CalendarEntry } from '@/lib/types';

interface CalendarViewProps {
  entries: CalendarEntry[];
  onDeleteEntry?: (id: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'var(--accent)',
  approved: 'var(--amber)',
  published: 'var(--green)',
  draft: 'var(--text-muted)',
};

export default function CalendarView({ entries, onDeleteEntry }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
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
    try {
      await onDeleteEntry(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Content Calendar
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {entries.length} post{entries.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {/* Calendar header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button className="btn-ghost" onClick={prev} style={{ padding: '6px 12px', fontSize: 16 }}>‹</button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {MONTHS[month]} {year}
          </h2>
          <button className="btn-ghost" onClick={next} style={{ padding: '6px 12px', fontSize: 16 }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0', letterSpacing: '0.05em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = entriesByDate[dateStr] || [];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div key={day} style={{
                minHeight: 80, padding: '8px 8px',
                border: `1px solid ${isToday ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 8,
                background: isToday ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 400,
                  color: isToday ? 'var(--accent-light)' : 'var(--text-muted)',
                  marginBottom: 6,
                }}>
                  {day}
                </div>
                {dayEntries.map(entry => (
                  <div key={entry.id} style={{
                    fontSize: 10, fontWeight: 500,
                    background: STATUS_COLORS[entry.status] || 'var(--accent)',
                    color: '#fff', borderRadius: 3, padding: '2px 5px',
                    marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    opacity: 0.9,
                  }}>
                    {entry.title.split(' ').slice(0, 3).join(' ')}…
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {entries.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Scheduled Posts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.sort((a, b) => a.scheduled_datetime.localeCompare(b.scheduled_datetime)).map(entry => {
              const dt = new Date(entry.scheduled_datetime);
              const isDeleting = deletingId === entry.id;
              return (
                <div key={entry.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, background: 'var(--accent-subtle)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{MONTHS[dt.getMonth()]}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-light)', lineHeight: 1 }}>{dt.getDate()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {entry.platform} · {entry.format} · {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 600,
                    background: 'var(--accent-subtle)', color: 'var(--accent-light)',
                    border: '1px solid var(--accent-border)',
                  }}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </div>
                  {onDeleteEntry && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={isDeleting}
                      style={{
                        background: 'none',
                        border: '1px solid transparent',
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      title="Remove from calendar"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No posts scheduled yet</div>
          <div style={{ fontSize: 13 }}>Generate and approve content to start filling your calendar</div>
        </div>
      )}
    </div>
  );
}
