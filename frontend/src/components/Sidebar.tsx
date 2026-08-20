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

  const displayName = user?.fullName || user?.firstName || 'BrandBrew User';
  const email = user?.primaryEmailAddress?.emailAddress || 'user@brandbrew.internal';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'BB';

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
            padding: isCollapsed ? '8px 6px 12px' : '8px 10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--sidebar)',
            position: 'relative',
          }}
        >
          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="desktop-only"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : 8,
                padding: isCollapsed ? '8px 0' : '6px 8px',
                borderRadius: 5,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {isCollapsed ? (
                <PanelLeft size={15} strokeWidth={1.75} />
              ) : (
                <>
                  <PanelLeftClose size={14} strokeWidth={1.75} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}

          {/* Account Popover Menu */}
          {isAccountMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: isCollapsed ? 64 : 10,
                width: 220,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 12px 28px -4px rgba(32, 27, 23, 0.18)',
                padding: '6px 0',
                zIndex: 250,
                marginBottom: 6,
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

              {/* Workspace Section */}
              <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Active Workspace
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      background: 'var(--brown-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: 'var(--brown-primary)',
                    }}
                  >
                    {brandName.charAt(0)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {brandName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {campaign}</span>
                  </div>
                </div>
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

          {/* Interactive Account & Workspace Identity Button */}
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title={isCollapsed ? `${displayName} (${email})` : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: 8,
              padding: isCollapsed ? '6px 0' : '6px 8px',
              borderRadius: 6,
              background: isAccountMenuOpen ? 'rgba(217, 200, 181, 0.45)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!isAccountMenuOpen) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.45)';
              }
            }}
            onMouseLeave={e => {
              if (!isAccountMenuOpen) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {/* User Avatar */}
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    background: 'var(--brown-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--brown-primary)',
                    flexShrink: 0,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {initials}
                </div>
              )}

              {!isCollapsed && (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      lineHeight: 1.2,
                      marginTop: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {email}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {isAccountMenuOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
