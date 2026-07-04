import { renderRuleBlock } from './rules';

export interface RecordDraft {
  reason: string;
  rules: string[];
  sources: string[];
}

function processSource(source: string): string {
  return decodeURI(source)
    .trim()
    .replace(/https:\/\/e(?:621|926)\.net\//g, '/')
    .replace(/\/posts\/(\d+)#comment-(\d+)/g, '/comments/$2')
    .replace(
      /\/forum_topics\/(\d+)(?:\?page=\d+)?#forum_post_(\d+)/g,
      '/forum_posts/$2',
    )
    .replace(/\?lr=\d+&/, '?')
    .replace(/\?commit=Search&/, '?')
    .replace(/post #(\d+)/, '/posts/$1')
    .replace(/comment #(\d+)/, '/comments/$1')
    .replace(/topic #(\d+)/, '/forum_topics/$1')
    .replace(/post changes #(\d+)/, '/post_versions?search[post_id]=$1');
}

function formatSources(sources: string[]): string {
  const links = sources.map((s) => s.trim()).filter(Boolean);
  if (links.length === 0) return '';
  if (links.length === 1) return `"[Source]":${processSource(links[0])}`;
  return links.map((s, i) => `"[${i + 1}]":${processSource(s)}`).join(' ');
}

export function assembleRecord(draft: RecordDraft): string {
  const sources = formatSources(draft.sources);
  const lead = draft.reason.includes('$S')
    ? draft.reason.replace('$S', sources)
    : [draft.reason.trim(), sources].filter(Boolean).join(' ');
  const blocks = draft.rules.map(renderRuleBlock).filter(Boolean).join('\n');
  return lead + (blocks ? '\n\n' + blocks + '\n' : '');
}
