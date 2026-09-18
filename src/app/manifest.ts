import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vyra — Personal Life Optimization Super App',
    short_name: 'Vyra',
    description: 'Personal life optimization super app unifying fitness, postural architecture, nutrition, and lifestyle performance.',
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