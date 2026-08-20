import { SignUp } from '@clerk/nextjs';

export function generateStaticParams() {
  return [{ 'sign-up': [] }];
}

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'var(--brown-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--surface)',
                letterSpacing: '-0.04em',
              }}
            >
              B
            </span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 13,
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
                fontSize: 10,
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
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.65rem',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginTop: 12,
            marginBottom: 4,
            letterSpacing: '-0.01em',
          }}
        >
          Create your BrandBrew Workspace
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            maxWidth: 360,
            lineHeight: 1.45,
          }}
        >
          Brew high-converting editorial social campaigns from real customer signals.
        </p>
      </div>

      {/* Clerk Sign Up Component */}
      <SignUp />
    </div>
  );
}
