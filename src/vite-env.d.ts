/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_FUNCTION_APP_URL: string
  readonly VITE_STATIC_WEB_APP_URL: string
  readonly VITE_GITHUB_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
