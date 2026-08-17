'use client';
import { LayoutDashboard, Lightbulb, Wand2, Calendar, Building2 } from 'lucide-react';

type Tab = 'dashboard' | 'opportunities' | 'create' | 'calendar' | 'brand';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems = [
  { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'opportunities' as Tab, label: 'Opportunities', icon: Lightbulb },
  { id: 'create' as Tab, label: 'Create Content', icon: Wand2 },
  { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar },
  { id: 'brand' as Tab, label: 'Brand', icon: Building2 },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
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
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
          }}>H</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Content Copilot
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              by Helium
            </div>
          </div>
        </div>
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
