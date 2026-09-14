import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NewME — AI-Assisted Strength Coaching',
    short_name: 'NewME',
    description: 'Periodized workout and nutrition coaching platform for certified coaches and athletes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F17',
    theme_color: '#0B0F17',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}