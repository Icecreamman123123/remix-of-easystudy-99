/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOVABLE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
