import { SignIn } from '@clerk/nextjs';

export function generateStaticParams() {
  return [{ 'sign-in': [] }];
}

export default function SignInPage() {
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
            gap: 10,
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <img
            src="/brandbrew-icon.png"
            alt="BrandBrew"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
            <span style={{ color: 'var(--text-primary)' }}>Brand</span>
            <span style={{ color: '#A66B38' }}>Brew</span>
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
          Welcome back to BrandBrew
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            maxWidth: 360,
            lineHeight: 1.45,
          }}
        >
          Brew your next winning content idea from catalog signals and real customer demand.
        </p>
      </div>

      {/* Clerk Sign In Component */}
      <SignIn />
    </div>
  );
}
