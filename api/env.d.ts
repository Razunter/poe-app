/// <reference types="vite/client" />

// eslint-disable-next-line unicorn/prevent-abbreviations
type ImportMetaEnvironment = {
  readonly VITE_YTAPI: string;
  readonly VITE_TwitchClientId: string;
  readonly VITE_TwitchClientSecret: string;
  readonly VITE_jsonPath: string;
}

type ImportMeta = {
  readonly env: ImportMetaEnvironment;
}
