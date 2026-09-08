import type { NextConfig } from 'next';
import path from 'node:path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/ambiently';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname, '..'),
  experimental: { externalDir: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // The demo compiles the library straight from ../src so edits show up without a build step.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'ambiently/react': path.resolve(__dirname, '../src/react.ts'),
      ambiently$: path.resolve(__dirname, '../src/index.ts'),
    };
    return config;
  },
};

export default nextConfig;
