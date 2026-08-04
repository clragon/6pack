import type { SixpackAddon } from './types';
import { navbarAddon } from '../../addons/navbar';

// Add-ons compiled into 6pack itself, present in every build and installed
// straight through the host. Being compiled in lets them import core directly
// rather than reaching it through the bridge; it does not make them enabled
// (see the catalog).
export const INBUILT: Record<string, SixpackAddon> = {
  navbar: navbarAddon,
};
