import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VYRA',
    short_name: 'VYRA',
    description: 'Postural hypertrophy and athletic progression protocol.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#090C11',
    theme_color: '#090C11',
    categories: ['fitness', 'health', 'sports'],
    shortcuts: [
      {
        name: "Today's Protocol",
        short_name: "Today",
        description: "Open today's workout protocol and chronobiology arc",
        url: "/today",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Kinetic Flight HUD",
        short_name: "Gym HUD",
        description: "Launch stealth active session logger",
        url: "/session",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}