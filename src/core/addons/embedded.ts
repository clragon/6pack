import type { SixpackAddon } from './types';
import { sourcesAddon } from '../../addons/sources';
import { ouroboruAddon } from '../../addons/ouroboru';
import { betterEditsAddon } from '../../addons/better-edits';
import { leanApprovalsAddon } from '../../addons/lean-approvals';

export const EMBEDDED: Record<string, SixpackAddon> = {
  sources: sourcesAddon,
  ouroboru: ouroboruAddon,
  'better-edits': betterEditsAddon,
  'lean-approvals': leanApprovalsAddon,
};
