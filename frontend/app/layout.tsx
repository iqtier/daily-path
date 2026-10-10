import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Daily Path — One Focus at a Time',
  description: 'Calm, focused daily task execution that reveals one step at a time.',
  openGraph: {
    title: 'Daily Path — One Focus at a Time',
    description: 'Calm, focused daily task execution that reveals one step at a time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Path — One Focus at a Time',
    description: 'Calm, focused daily task execution that reveals one step at a time.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
