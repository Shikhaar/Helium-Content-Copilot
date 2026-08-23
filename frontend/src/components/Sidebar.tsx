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
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import UserProfileModal from './UserProfileModal';
import type { Brand } from '../lib/types';

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
  brands?: Brand[];
  activeBrandId?: string;
  onSelectBrand?: (brandId: string) => void;
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
  brands = [],
  activeBrandId = 'snitch',
  onSelectBrand,
}: SidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const brandMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (brandMenuRef.current && !brandMenuRef.current.contains(event.target as Node)) {
        setIsBrandMenuOpen(false);
      }
    };
    if (isAccountMenuOpen || isBrandMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen, isBrandMenuOpen]);

  const handleItemClick = (id: Tab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleHomeClick = () => {
    onHome();
    if (onCloseMobile) onCloseMobile();
  };

  const getBrandMonogram = (name: string) => {
    if (!name) return 'B';
    const clean = name.trim().replace(/^(THE|A)\s+/i, '');
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const displayName = user?.fullName || user?.firstName || 'Shikhar';
  const firstName = user?.firstName || (displayName.split(' ')[0]) || 'Shikhar';
  const role = (user?.publicMetadata?.role as string) || 'Admin';
  const email = user?.primaryEmailAddress?.emailAddress || 'shikharsrivastava3004@gmail.com';
  const singleInitial = (firstName.charAt(0) || 'S').toUpperCase();
  const brandMonogram = getBrandMonogram(brandName);

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
        className={`sidebar-container ${isMobileOpen ? 'mobile-drawer-open' : 'mobile-drawer-closed'}`}
        style={{
          width: isCollapsed ? 64 : 220,
          height: '100vh',
          maxHeight: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100,
          overflow: 'visible',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header & Navigation */}
        <div>
          {/* Logo Header */}
          <div
            style={{
              padding: isCollapsed ? '16px 0 14px' : '16px 14px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
            }}
          >
            {!isCollapsed ? (
              <button
                onClick={handleHomeClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                title="BrandBrew Home"
              >
                <img
                  src="/brandbrew-icon.png"
                  alt="BrandBrew Logo"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: 'contain',
                    display: 'block',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  <span style={{ color: 'var(--text-primary, #211914)' }}>Brand</span>
                  <span style={{ color: '#A66B38' }}>Brew</span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleHomeClick}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="BrandBrew — Go to Home"
              >
                <img
                  src="/brandbrew-icon.png"
                  alt="BrandBrew"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </button>
            )}

            {/* Desktop Collapse Toggle */}
            {!isCollapsed && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--border)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLElement).style.background = 'none';
                }}
              >
                <PanelLeftClose size={15} />
              </button>
            )}

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="mobile-only"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && onToggleCollapse && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px' }}>
              <button
                onClick={onToggleCollapse}
                title="Expand sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--border)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLElement).style.background = 'none';
                }}
              >
                <PanelLeft size={15} />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav style={{ padding: isCollapsed ? '10px 8px' : '10px 8px' }}>
            {/* Section: STRATEGY */}
            {!isCollapsed && (
              <div
                style={{
                  padding: '6px 8px 4px',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                STRATEGY
              </div>
            )}
            {workspaceItems.map(({ id, label, icon }) => navItem(id, label, icon))}

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: 'var(--border)',
                margin: isCollapsed ? '8px 0' : '10px 8px',
              }}
            />

            {/* Section: BRAND ASSETS */}
            {!isCollapsed && (
              <div
                style={{
                  padding: '4px 8px 4px',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                BRAND
              </div>
            )}
            {isCollapsed && <div style={{ height: 16 }} />}
            {brandItems.map(({ id, label, icon }) => navItem(id, label, icon))}
          </nav>
        </div>

        {/* ── Bottom: BRAND + ACCOUNT ── */}
        <div
          ref={accountMenuRef}
          style={{
            borderTop: '1px solid var(--border)',
            padding: isCollapsed ? '10px 6px 14px' : '12px 10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            background: 'var(--sidebar)',
            position: 'relative',
          }}
        >
          {/* BRAND section label */}
          {!isCollapsed && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                padding: '0 4px 7px',
              }}
            >
              Brand
            </div>
          )}

          {/* Brand Switcher */}
          <div ref={brandMenuRef} style={{ position: 'relative', marginBottom: 0 }}>
            {!isCollapsed ? (
              <div
                onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
                title="Switch Brand Workspace"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: isBrandMenuOpen ? 'var(--surface)' : 'rgba(255, 252, 247, 0.8)',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                }}
                onMouseLeave={e => {
                  if (!isBrandMenuOpen) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 252, 247, 0.8)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: 'var(--brown-dark)',
                      color: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontFamily: 'var(--font-sans)',
                      flexShrink: 0,
                      boxShadow: '0 1px 3px rgba(44, 24, 16, 0.15)',
                    }}
                  >
                    {brandMonogram}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {brandName}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-secondary)',
                        marginTop: 1,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {campaign}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  color="var(--text-muted)"
                  style={{
                    transform: isBrandMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                    marginLeft: 4,
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'var(--brown-dark)',
                  color: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 800,
                }}
                onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
                title={`${brandName} · ${campaign}`}
              >
                {brandMonogram}
              </div>
            )}

            {/* Brand Dropdown */}
            {isBrandMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: isCollapsed ? 64 : 0,
                  right: isCollapsed ? 'auto' : 0,
                  marginBottom: 8,
                  width: isCollapsed ? 230 : 'auto',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  boxShadow: '0 8px 24px rgba(32, 27, 23, 0.14)',
                  padding: '6px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  YOUR BRANDS
                </div>
                {brands.map(b => {
                  const isSelected = b.id === activeBrandId;
                  const mono = getBrandMonogram(b.name);
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        if (onSelectBrand) onSelectBrand(b.id);
                        setIsBrandMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '7px 8px',
                        borderRadius: 6,
                        border: 'none',
                        background: isSelected ? 'var(--brown-soft)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.35)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            background: isSelected ? 'var(--brown-dark)' : 'rgba(238, 231, 220, 0.8)',
                            color: isSelected ? 'var(--surface)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {mono}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {b.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, lineHeight: 1.2 }}>
                            {b.campaign}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={13} color="var(--brown-primary)" strokeWidth={2.5} />}
                    </button>
                  );
                })}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    onTabChange('brand');
                    setIsBrandMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--brown-primary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.35)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Building2 size={12} />
                  Manage Brand &amp; Catalog
                </button>
              </div>
            )}
          </div>

          {/* Divider + ACCOUNT section label */}
          <div style={{ height: 1, background: 'var(--border)', margin: isCollapsed ? '8px 0' : '10px 0' }} />
          {!isCollapsed && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                padding: '0 4px 7px',
              }}
            >
              Account
            </div>
          )}

          {/* Account Popover */}
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
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {email}
                </div>
              </div>

              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setIsAccountMenuOpen(false); setIsProfileModalOpen(true); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', textAlign: 'left', transition: 'background 0.12s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                >
                  <UserIcon size={14} color="var(--text-secondary)" />
                  <span>Profile &amp; Details</span>
                </button>
              </div>

              <div style={{ padding: '4px 0 0' }}>
                <button
                  onClick={() => signOut({ redirectUrl: '/sign-in' })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9C3426', fontWeight: 500, textAlign: 'left', transition: 'background 0.12s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FDE8E4'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}

          {/* User Account Row */}
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title={isCollapsed ? `${displayName} (${role})` : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: 10,
              padding: isCollapsed ? '6px 0' : '5px 6px',
              borderRadius: 6,
              background: isAccountMenuOpen ? 'rgba(217, 200, 181, 0.45)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!isAccountMenuOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(217, 200, 181, 0.35)';
            }}
            onMouseLeave={e => {
              if (!isAccountMenuOpen) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E2D5C3 0%, #CBB9A2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firstName}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.2, marginTop: 2 }}>
                    {role}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={15} color="var(--text-muted)" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
