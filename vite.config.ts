import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { get_umami_data_domains, UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID } from './src/lib/umami.js'

const OBJECT_TAG = '[object Object]'
const STRING_TAG = '[object String]'

function read_package_version(raw: string): string {
  const parsed = JSON.parse(raw)
  if (
    parsed !== null &&
    !Array.isArray(parsed) &&
    Object.prototype.toString.call(parsed) === OBJECT_TAG &&
    Object.prototype.toString.call(parsed.version) === STRING_TAG
  ) {
    return parsed.version
  }
  return '0.0.0'
}

const root_dir = path.dirname(fileURLToPath(import.meta.url))
const package_version = read_package_version(
  readFileSync(path.join(root_dir, 'package.json'), 'utf8'),
)

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(package_version),
  },
  resolve: {
    alias: {
      '@': path.resolve(root_dir, './src'),
    },
  },
  plugins: [
    {
      name: 'prod-umami',
      apply: 'build',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            attrs: {
              defer: true,
              src: UMAMI_SCRIPT_URL,
              'data-website-id': UMAMI_WEBSITE_ID,
              'data-domains': get_umami_data_domains(),
            },
            injectTo: 'head',
          },
        ]
      },
    },
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
        theme_color: '#ffffff',
        background_color: '#ffffff',
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
