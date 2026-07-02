import type { SixpackAddon } from './types';
import { sourcesAddon } from '../../addons/sources';
import { ouroboruAddon } from '../../addons/ouroboru';
import { betterEditsAddon } from '../../addons/better-edits';
import { leanApprovalsAddon } from '../../addons/lean-approvals';
import { re621Addon } from '../../addons/re621';

// Add-on objects compiled into a fat build, keyed by catalog id. The manager
// registers these directly instead of fetching and eval'ing an artifact, so a
// fat build needs no add-on server. The thin build (__FAT__ false) tree-shakes
// this whole module out, since its only reference sits behind a dropped branch.
// Keep the ids in sync with manifest.json.
export const EMBEDDED: Record<string, SixpackAddon> = {
  sources: sourcesAddon,
  ouroboru: ouroboruAddon,
  'better-edits': betterEditsAddon,
  'lean-approvals': leanApprovalsAddon,
  re621: re621Addon,
};
