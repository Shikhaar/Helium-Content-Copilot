'use client';
import { LayoutDashboard, Lightbulb, Wand2, Calendar, Building2 } from 'lucide-react';

type Tab = 'opportunities' | 'create' | 'calendar' | 'brand';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onHome: () => void;
}

const navItems = [
  { id: 'opportunities' as Tab, label: 'Opportunities', icon: Lightbulb },
  { id: 'create' as Tab, label: 'Content Studio', icon: Wand2 },
  { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar },
  { id: 'brand' as Tab, label: 'Brand & Catalog', icon: Building2 },
];

export default function Sidebar({ activeTab, onTabChange, onHome }: SidebarProps) {
  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onHome}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 6px', borderRadius: 8, width: '100%',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {/* Brand mark — stylised H letterform using two vertical bars + connector */}
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="30" rx="7" fill="url(#logoGrad)" />
            {/* Left pillar */}
            <rect x="7" y="7" width="4" height="16" rx="1.5" fill="white" />
            {/* Right pillar */}
            <rect x="19" y="7" width="4" height="16" rx="1.5" fill="white" />
            {/* Cross bar — offset upward for a modern, asymmetric feel */}
            <rect x="7" y="12.5" width="16" height="3.5" rx="1.5" fill="white" fillOpacity="0.85" />
            {/* Accent dot */}
            <circle cx="23" cy="8.5" r="2.5" fill="#a78bfa" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6c63ff" />
                <stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Content Copilot
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              by Helium
            </div>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 12px', flex: 1 }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => onTabChange(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: 2,
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          SNITCH concept demo
          <br />
          Not affiliated with SNITCH™
        </div>
      </div>
    </aside>
  );
}
