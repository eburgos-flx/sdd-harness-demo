import type { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata = {
  title: 'Quick Polls',
  description: 'Rapid, share-anywhere polls. No accounts, no tracking.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
