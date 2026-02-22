import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Luna — Your Cycle Companion',
        short_name: 'Luna',
        description: 'A beautiful, intelligent period tracker with AI-powered insights.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#f472b6',
        icons: [
            {
                src: '/icon',
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
