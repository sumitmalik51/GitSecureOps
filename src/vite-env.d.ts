/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_AZURE_OPENAI_DEPLOYMENT_NAME: string
  readonly VITE_AZURE_OPENAI_API_VERSION: string
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GITHUB_CLIENT_SECRET: string
  readonly VITE_GITHUB_REDIRECT_URI: string
  readonly GITHUB_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
