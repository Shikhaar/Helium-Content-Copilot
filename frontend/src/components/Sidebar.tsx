'use client';
import React from 'react';
import {
  Lightbulb,
  Wand2,
  Calendar,
  Building2,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';

export type Tab = 'opportunities' | 'create' | 'calendar' | 'brand';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onHome: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { id: 'opportunities' as Tab, label: 'Opportunities', icon: Lightbulb },
  { id: 'create' as Tab, label: 'Content Studio', icon: Wand2 },
  { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar },
  { id: 'brand' as Tab, label: 'Brand & Catalog', icon: Building2 },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onHome,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const handleItemClick = (id: Tab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleHomeClick = () => {
    onHome();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
          className="mobile-only"
        />
      )}

      <aside
        style={{
          width: isCollapsed ? 68 : 220,
          minHeight: '100vh',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          flexShrink: 0,
          transition: 'width 0.2s ease, transform 0.25s ease',
          zIndex: 100,
        }}
        className={`sidebar-container ${isMobileOpen ? 'mobile-drawer-open' : 'mobile-drawer-closed'}`}
      >
        {/* Logo & Header */}
        <div
          style={{
            padding: isCollapsed ? '18px 12px' : '20px 16px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
          }}
        >
          <button
            onClick={handleHomeClick}
            title="Helium Content Copilot"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 8,
              transition: 'background 0.15s ease',
              overflow: 'hidden',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {/* Brand mark — stylised H letterform */}
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <rect width="30" height="30" rx="7" fill="url(#logoGrad)" />
              <rect x="7" y="7" width="4" height="16" rx="1.5" fill="white" />
              <rect x="19" y="7" width="4" height="16" rx="1.5" fill="white" />
              <rect x="7" y="12.5" width="16" height="3.5" rx="1.5" fill="white" fillOpacity="0.85" />
              <circle cx="23" cy="8.5" r="2.5" fill="#a78bfa" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6c63ff" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
            {!isCollapsed && (
              <div style={{ textAlign: 'left', minWidth: 110 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  Content Copilot
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  by Helium
                </div>
              </div>
            )}
          </button>

          {/* Mobile Close Button (X) */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="mobile-only"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: isCollapsed ? '12px 6px' : '12px 10px', flex: 1 }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => handleItemClick(id)}
                title={isCollapsed ? label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : 10,
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: 4,
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
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <div
            className="desktop-only"
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: isCollapsed ? 'center' : 'flex-end',
            }}
          >
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 11,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'none';
              }}
            >
              {isCollapsed ? <PanelLeft size={16} /> : (
                <>
                  <PanelLeftClose size={14} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info (when expanded) */}
        {!isCollapsed && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              SNITCH concept demo
              <br />
              Not affiliated with SNITCH™
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
