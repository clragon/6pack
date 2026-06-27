import { registerAddon } from '../bridge';
import { leanApprovalsAddon } from './index';

// Published artifact entry: 6pack fetches and evals it (managed), or it can be
// installed standalone. Registering is all it does.
registerAddon(leanApprovalsAddon);
