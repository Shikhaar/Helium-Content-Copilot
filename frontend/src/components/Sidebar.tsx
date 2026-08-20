'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Lightbulb,
  Wand2,
  Calendar,
  Building2,
  PanelLeftClose,
  PanelLeft,
  X,
  User as UserIcon,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import UserProfileModal from './UserProfileModal';

export type Tab = 'opportunities' | 'create' | 'calendar' | 'brand';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onHome: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  brandName?: string;
  campaign?: string;
}

const workspaceItems = [
  { id: 'opportunities' as Tab, label: 'Opportunities',  icon: Lightbulb },
  { id: 'create'        as Tab, label: 'Content Studio', icon: Wand2 },
  { id: 'calendar'      as Tab, label: 'Calendar',        icon: Calendar },
];

const brandItems = [
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
  brandName = 'SNITCH',
  campaign = 'Summer 2026',
}: SidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  const handleItemClick = (id: Tab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleHomeClick = () => {
    onHome();
    if (onCloseMobile) onCloseMobile();
  };

  const displayName = user?.fullName || user?.firstName || 'Shikhar';
  const firstName = user?.firstName || (displayName.split(' ')[0]) || 'Shikhar';
  const role = (user?.publicMetadata?.role as string) || 'Admin';
  const email = user?.primaryEmailAddress?.emailAddress || 'shikharsrivastava3004@gmail.com';
  const singleInitial = (firstName.charAt(0) || 'S').toUpperCase();
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S';

  const navItem = (id: Tab, label: string, Icon: React.ElementType) => {
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
          gap: isCollapsed ? 0 : 9,
          padding: isCollapsed ? '9px 0' : '8px 10px',
          borderRadius: 6,
          border: 'none',
          background: isActive ? 'var(--brown-soft)' : 'transparent',
          color: isActive ? 'var(--brown-primary)' : 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          cursor: 'pointer',
          transition: 'background 0.15s ease, color 0.15s ease',
          marginBottom: 2,
          textAlign: 'left',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.45)';
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
        <Icon
          size={15}
          strokeWidth={isActive ? 2 : 1.6}
          style={{ flexShrink: 0, color: isActive ? 'var(--brown-primary)' : 'inherit' }}
        />
        {!isCollapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(32, 27, 23, 0.5)',
            zIndex: 199,
          }}
          className="mobile-only"
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        brandName={brandName}
        campaign={campaign}
      />

      <aside
        style={{
          width: isCollapsed ? 60 : 220,
          height: '100vh',
          maxHeight: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.2s ease, transform 0.25s ease',
          zIndex: 100,
          boxSizing: 'border-box',
        }}
        className={`sidebar-container ${isMobileOpen ? 'mobile-drawer-open' : 'mobile-drawer-closed'}`}
      >
        {/* Logo */}
        <div
          style={{
            padding: isCollapsed ? '18px 0' : '18px 16px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
          }}
        >
          <button
            onClick={handleHomeClick}
            title="BrandBrew Content Copilot"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {/* B mark */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                background: 'var(--brown-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--surface)',
                  letterSpacing: '-0.04em',
                }}
              >
                B
              </span>
            </div>
            {!isCollapsed && (
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--brown-dark)',
                    letterSpacing: '0.08em',
                    lineHeight: 1.15,
                    textTransform: 'uppercase',
                  }}
                >
                  BrandBrew
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: 1,
                  }}
                >
                  Content Copilot
                </div>
              </div>
            )}
          </button>

          {/* Mobile Close */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="mobile-only"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ padding: isCollapsed ? '14px 6px' : '14px 10px', flex: 1, overflowY: 'auto' }}>
          {/* WORKSPACE group */}
          {!isCollapsed && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '0 10px',
                marginBottom: 6,
              }}
            >
              WORKSPACE
            </div>
          )}
          {workspaceItems.map(({ id, label, icon }) => navItem(id, label, icon))}

          {/* BRAND group */}
          {!isCollapsed && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '0 10px',
                marginTop: 20,
                marginBottom: 6,
              }}
            >
              BRAND
            </div>
          )}
          {isCollapsed && <div style={{ height: 16 }} />}
          {brandItems.map(({ id, label, icon }) => navItem(id, label, icon))}
        </nav>

        {/* Bottom Utility & Workspace / Account Section */}
        <div
          ref={accountMenuRef}
          style={{
            borderTop: '1px solid var(--border)',
            padding: isCollapsed ? '10px 6px 14px' : '14px 10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--sidebar)',
            position: 'relative',
          }}
        >
          {/* Workspace Switcher Card (SNITCH · Summer 2026) */}
          {!isCollapsed ? (
            <div
              onClick={() => onTabChange('brand')}
              title="Switch Workspace / Brand Catalog"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'rgba(255, 252, 247, 0.65)',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 252, 247, 0.65)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Brand square logo */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#EDE4D8',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px 4px',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {brandName}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {brandName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.2 }}>
                    {campaign}
                  </div>
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
          ) : (
            /* Collapsed Brand Icon */
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#EDE4D8',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                cursor: 'pointer',
              }}
              onClick={() => onTabChange('brand')}
              title={`${brandName} · ${campaign}`}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
                {brandName.charAt(0)}
              </span>
            </div>
          )}

          {/* Account Popover Menu */}
          {isAccountMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: isCollapsed ? 64 : 10,
                right: isCollapsed ? 'auto' : 10,
                width: isCollapsed ? 220 : 'auto',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 12px 28px -4px rgba(32, 27, 23, 0.18)',
                padding: '6px 0',
                zIndex: 250,
                marginBottom: 8,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {/* User Identity Header */}
              <div
                style={{
                  padding: '8px 12px 10px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}
                >
                  {email}
                </div>
              </div>

              {/* Account Section */}
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'none';
                  }}
                >
                  <UserIcon size={14} color="var(--text-secondary)" />
                  <span>Profile & Details</span>
                </button>
              </div>

              {/* Log out Button */}
              <div style={{ padding: '4px 0 0' }}>
                <button
                  onClick={() => signOut({ redirectUrl: '/sign-in' })}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#9C3426',
                    fontWeight: 500,
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#FDE8E4';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'none';
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive User Account Row (Shikhar · Admin >) */}
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title={isCollapsed ? `${displayName} (${role})` : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: 10,
              padding: isCollapsed ? '6px 0' : '4px 4px',
              borderRadius: 6,
              background: isAccountMenuOpen ? 'rgba(217, 200, 181, 0.45)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!isAccountMenuOpen) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.35)';
              }
            }}
            onMouseLeave={e => {
              if (!isAccountMenuOpen) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {/* Circular Avatar with Initial */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E2D5C3 0%, #CBB9A2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#211914',
                  flexShrink: 0,
                  fontFamily: 'var(--font-sans)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                {singleInitial}
              </div>

              {!isCollapsed && (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {firstName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.2,
                      marginTop: 2,
                    }}
                  >
                    {role}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
