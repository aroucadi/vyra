import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VYRA',
    short_name: 'VYRA',
    description: 'Postural hypertrophy and athletic progression protocol.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0F17',
    theme_color: '#0B0F17',
    icons: [
      {
        src: '/icon.svg',
        sizes: '180x180 192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}