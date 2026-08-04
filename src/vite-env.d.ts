/// <reference types="vite/client" />

declare const __FAT__: boolean;

// addonBase in vite.config.ts ends the value with a slash, and
// core/addons/loader.ts appends the artifact filename to it.
declare const __ADDON_BASE__: string;
