/// <reference types="vite/client" />

// True in a fat build (add-ons compiled in) and false in the default thin build
// (add-ons fetched at runtime). Injected by vite define in vite.config.ts.
declare const __FAT__: boolean;

// Base url the thin build's loader fetches add-on artifacts from, with a
// trailing slash. Injected by vite define in vite.config.ts.
declare const __ADDON_BASE__: string;

// This build's version, taken from package.json so an install can be named in a
// report. Injected by vite define in vite.config.ts.
declare const __VERSION__: string;
