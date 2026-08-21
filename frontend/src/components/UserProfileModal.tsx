'use client';
import React from 'react';
import { X, User, Mail, Shield, Sparkles, Building2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    fullName?: string | null;
    firstName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
    imageUrl?: string;
    createdAt?: Date | null;
  } | null;
  brandName?: string;
  campaign?: string;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  brandName = 'SNITCH',
  campaign = 'Summer 2026',
}: UserProfileModalProps) {
  if (!isOpen) return null;

  const displayName = user?.fullName || user?.firstName || 'BrandBrew User';
  const email = user?.primaryEmailAddress?.emailAddress || 'user@brandbrew.internal';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'BB';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(32, 27, 23, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px -10px rgba(32, 27, 23, 0.2)',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="var(--brown-primary)" strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Account Profile
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* User Info Hero */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={displayName}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  objectFit: 'cover',
                  border: '1px solid var(--border)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: 'var(--brown-dark)',
                  color: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {email}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Shield size={14} />
                <span>Role</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'var(--brown-soft)',
                  color: 'var(--brown-primary)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                Authenticated
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Building2 size={14} />
                <span>Active Brand</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {brandName} ({campaign})
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Sparkles size={14} />
                <span>Authentication</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Managed via Clerk
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-subtle)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: 'var(--brown-dark)',
              color: 'var(--surface)',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
