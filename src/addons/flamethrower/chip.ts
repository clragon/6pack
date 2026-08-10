import type { Action } from '../../core/actions/types';
import { registerChipSource, type Chip } from '../../core/palette/chips';
import { resourceName } from '../../core/resource';
import { listBurns, removeBurn, subscribe, type Burn } from './queue';

function handled(burn: Burn): number {
  return burn.targets.filter((target) => target.status !== 'pending').length;
}

function failed(burn: Burn): number {
  return burn.targets.filter((target) => target.status === 'failed').length;
}

function toChip(burn: Burn): Chip {
  const total = burn.targets.length;
  const done = handled(burn);
  const bad = failed(burn);
  const finished = done === total;
  const suffix = bad ? ` · ${bad} failed` : '';
  return {
    id: `chip.burn.${burn.id}`,
    label: `Burn ${resourceName(burn.type, total)} (${done}/${total}${suffix})`,
    open: () => [
      {
        id: `burn.${burn.id}.close`,
        title: finished ? 'Dismiss' : 'Abort this burn',
        keywords: finished
          ? ['dismiss', 'clear', 'ok', 'done']
          : ['abort', 'cancel', 'stop', 'kill'],
        run: () => removeBurn(burn.id),
      } satisfies Action,
    ],
  };
}

export function installBurnChip(): void {
  registerChipSource({
    list: () => listBurns().map(toChip),
    subscribe,
  });
}
