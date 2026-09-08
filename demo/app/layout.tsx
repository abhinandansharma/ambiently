import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ambiently — ambient sound for the web',
  description: 'Layer looping tracks and synthesised rain, wind and fire. Fades, crossfades, autoplay handled. Zero dependencies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
