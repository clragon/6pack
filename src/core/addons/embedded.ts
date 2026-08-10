import type { SixpackAddon } from './types';
import { sourcesAddon } from '../../addons/source-shortener';
import { ouroboruAddon } from '../../addons/ouroboru';
import { betterEditsAddon } from '../../addons/better-edits';
import { leanApprovalsAddon } from '../../addons/lean-approvals';
import { re621Addon } from '../../addons/re621';
import { quickRepliesAddon } from '../../addons/quick-replies';
import { quickFeedbacksAddon } from '../../addons/quick-feedbacks';
import { fileUploadHelperAddon } from '../../addons/file-upload-helper';
import { compareReplacementsAddon } from '../../addons/compare-replacements';
import { hoverZoomAddon } from '../../addons/hover-zoom';

// Add-on objects compiled into a fat build, keyed by catalog id. The manager
// registers these directly instead of fetching and eval'ing an artifact, so a
// fat build needs no add-on server. The thin build (__FAT__ false) tree-shakes
// this whole module out, since its only reference sits behind a dropped branch.
export const EMBEDDED: Record<string, SixpackAddon> = {
  'source-shortener': sourcesAddon,
  ouroboru: ouroboruAddon,
  'better-edits': betterEditsAddon,
  'lean-approvals': leanApprovalsAddon,
  re621: re621Addon,
  'quick-replies': quickRepliesAddon,
  'quick-feedbacks': quickFeedbacksAddon,
  'file-upload-helper': fileUploadHelperAddon,
  'compare-replacements': compareReplacementsAddon,
  'hover-zoom': hoverZoomAddon,
};
