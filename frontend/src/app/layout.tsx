import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Helium Content Copilot',
  description: 'Know what to post. Know why. Create it in seconds. AI-powered content strategy for D2C brands.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#5A3828',
          colorBackground: '#FFFCF7',
          borderRadius: '6px',
          fontFamily: 'var(--font-inter)',
        },
        elements: {
          card: 'border border-[var(--border)] shadow-sm bg-[var(--surface)]',
          formButtonPrimary:
            'bg-[var(--brown-dark)] hover:bg-[var(--brown-primary)] text-[var(--surface)] text-sm font-semibold py-2.5 transition-colors',
          headerTitle: 'font-serif text-2xl font-normal text-[var(--text-primary)]',
          headerSubtitle: 'text-sm text-[var(--text-muted)]',
          socialButtonsBlockButton:
            'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
          formFieldLabel: 'text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider',
          formFieldInput:
            'border-[var(--border)] focus:border-[var(--brown-primary)] focus:ring-[var(--brown-soft)] text-sm rounded-md',
          footerActionLink: 'text-[var(--brown-primary)] hover:text-[var(--brown-dark)] font-medium',
        },
      }}
    >
      <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
