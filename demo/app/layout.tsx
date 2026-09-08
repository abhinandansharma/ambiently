import type { Metadata } from 'next';
import './globals.css';

const description = 'Layer looping tracks and synthesised rain, wind and fire. Fades, crossfades, autoplay handled. Zero dependencies. npm install ambiently.';

export const metadata: Metadata = {
  metadataBase: new URL('https://abhinandansharma.github.io/ambiently/'),
  title: 'Ambiently — ambient sound for the web',
  description,
  openGraph: { type: 'website', url: 'https://abhinandansharma.github.io/ambiently/', title: 'Ambiently — ambient sound for the web', description, images: [{ url: 'og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', creator: '@notjustadev', title: 'Ambiently', description, images: ['og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
