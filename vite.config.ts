import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const root_dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root_dir, './src'),
    },
  },
  plugins: [
    {
      name: 'dev-react-scan',
      apply: 'serve',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            attrs: { type: 'module', src: '/src/dev_scan.ts' },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'iLovePR',
        short_name: 'iLovePR',
        description: 'Self-hosted GitHub PR analytics for tech leads',
        theme_color: '#0f766e',
        background_color: '#f4f7f6',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/**/*.ts',
        'src/repositories/**/*.ts',
        'src/store/**/*.ts',
        'src/modules/**/redux/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/lib/types.ts',
        'src/lib/github-client.ts',
        'src/lib/sync.ts',
      ],
    },
  },
})
