/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // 添加更多环境变量定义...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

