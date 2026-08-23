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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <img
            src="/brandbrew-logo.png"
            alt="BrandBrew"
            style={{ height: 38, width: 'auto', objectFit: 'contain' }}
          />
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
