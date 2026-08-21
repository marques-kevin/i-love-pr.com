declare const __APP_VERSION__: string

/** dither-kit ships a `process.env.NODE_ENV` guard; Vite replaces it at build. */
declare const process: {
  env: {
    NODE_ENV?: string
  }
}

interface ImportMetaEnv {
  readonly VITE_SHARE_API_URL?: string
  readonly VITE_SHARE_UPLOAD_SECRET?: string
  readonly VITE_DEMO_MODE?: string
}
