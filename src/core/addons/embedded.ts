import type { SixpackAddon } from './types';
import { sourcesAddon } from '../../addons/sources';
import { ouroboruAddon } from '../../addons/ouroboru';
import { betterEditsAddon } from '../../addons/better-edits';
import { leanApprovalsAddon } from '../../addons/lean-approvals';
import { re621Addon } from '../../addons/re621';
import { quickRepliesAddon } from '../../addons/quick-replies';

export const EMBEDDED: Record<string, SixpackAddon> = {
  sources: sourcesAddon,
  ouroboru: ouroboruAddon,
  'better-edits': betterEditsAddon,
  'lean-approvals': leanApprovalsAddon,
  re621: re621Addon,
  'quick-replies': quickRepliesAddon,
};
