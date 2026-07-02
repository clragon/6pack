import { registerAddon } from '../bridge';
import { re621Addon } from './index';

// Published artifact entry: 6pack fetches and evals it (managed), or it can be
// installed standalone. Registering is all it does.
registerAddon(re621Addon);
