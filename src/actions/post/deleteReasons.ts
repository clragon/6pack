export interface DeleteReason {
  label: string;
  reason: string;
  keywords: string[];
  needsId?: boolean;
}

export const DELETE_REASONS: DeleteReason[] = [
  {
    label: 'Inferior/duplicate',
    reason: 'Inferior version/duplicate of post #',
    keywords: ['inferior', 'duplicate', 'dupe', 'dup'],
    needsId: true,
  },
  {
    label: 'Does not meet standards (Artistic)',
    reason: 'Does not meet minimum quality standards (Artistic)',
    keywords: ['quality', 'artistic', 'bad', 'ugly', 'dnmqs'],
  },
  {
    label: 'Does not meet standards (Resolution)',
    reason: 'Does not meet minimum quality standards (Resolution)',
    keywords: ['quality', 'resolution', 'small', 'tiny', 'dnmqs'],
  },
  {
    label: 'Does not meet standards (Compression)',
    reason: 'Does not meet minimum quality standards (Compression)',
    keywords: ['quality', 'compression', 'jpeg', 'artifact', 'dnmqs'],
  },
  {
    label: 'Does not meet standards (Trivial edit)',
    reason:
      'Does not meet minimum quality standards (Trivial or low quality edit)',
    keywords: ['quality', 'trivial', 'edit', 'low', 'dnmqs'],
  },
  {
    label: 'Irrelevant to site',
    reason: 'Irrelevant to site',
    keywords: ['irrelevant', 'offtopic', 'off-topic'],
  },
  {
    label: 'Irrelevant (Photo)',
    reason: 'Irrelevant to site (Photo)',
    keywords: ['irrelevant', 'photo', 'photograph', 'irl'],
  },
  {
    label: 'Irrelevant (Human only)',
    reason: 'Irrelevant to site (Human only)',
    keywords: ['irrelevant', 'human', 'humans'],
  },
  {
    label: 'Irrelevant (AI generated)',
    reason: 'Irrelevant to site (AI assisted/generated)',
    keywords: ['irrelevant', 'ai', 'generated', 'artificial'],
  },
  {
    label: 'JPG resaved as PNG',
    reason: 'JPG resaved as PNG',
    keywords: ['jpg', 'png', 'resave', 'format'],
  },
  {
    label: 'Broken/corrupted file',
    reason: 'Broken/corrupted file',
    keywords: ['broken', 'corrupt', 'corrupted', 'error'],
  },
  {
    label: 'Paysite/commercial content',
    reason: 'Paysite/commercial content',
    keywords: ['paysite', 'commercial', 'paid', 'patreon'],
  },
  {
    label: 'Advertisement',
    reason: 'Advertisement',
    keywords: ['ad', 'advertisement', 'promo', 'spam'],
  },
];
