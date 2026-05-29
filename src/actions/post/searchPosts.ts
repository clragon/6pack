import type { Action } from '../../core/actions/types';
import { suggestTagQuery } from '../../site/autocomplete';
import { isPostListing } from '../../site/post';

export const searchPosts: Action = {
  id: 'search-posts',
  title: 'Search posts',
  description: 'Search posts by tags (or type ? as a prefix)',
  keywords: ['search', 'tags', 'find', 'query', 'filter'],
  prefix: '?',
  when: () => isPostListing(),
  search: {
    placeholder: 'Search tags…',
    suggest: (query) => suggestTagQuery(query),
    onSubmit: (query) => {
      const tags = query.trim();
      window.location.href = tags
        ? `/posts?tags=${encodeURIComponent(tags)}`
        : '/posts';
    },
  },
};
