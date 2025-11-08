/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_COMMENTS_ENABLED?: string;
  readonly PUBLIC_COMMENTS_REQUIRE_APPROVAL?: string;
  readonly PUBLIC_COMMENTS_PAGE_SIZE?: string;
  readonly PUBLIC_COMMENTS_MAX_LENGTH?: string;
  readonly PUBLIC_COMMENTS_DEFAULT_AUTHOR?: string;
}

/* eslint-disable no-redeclare, no-unused-vars */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/* eslint-enable no-redeclare, no-unused-vars */

export {};
