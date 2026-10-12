import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import AppProviders from '@/components/AppProviders';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const description = 'Your goals, turned into one clear step at a time. Finish it, unlock the next.';

export const metadata: Metadata = {
  title: 'Daily Path — One step at a time',
  description,
  openGraph: {
    title: 'Daily Path — One step at a time',
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Path — One step at a time',
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script edits <html> classes before hydration, so React must not flag the mismatch.
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="bg-canvas text-ink font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
