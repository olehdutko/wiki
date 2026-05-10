/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Той самий секрет, що DUMP_SECRET на сервері (опційно, для /api/database/dump) */
  readonly VITE_DUMP_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
