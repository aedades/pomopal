// Version is injected at build time from package.json via vite.config.ts
declare const __APP_VERSION__: string

export const VERSION = __APP_VERSION__
