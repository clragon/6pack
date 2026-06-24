/// <reference types="vite/client" />

// True in a fat build (add-ons compiled in); false in the default thin build
// (add-ons fetched at runtime). Injected by vite define in vite.config.ts.
declare const __FAT__: boolean;
