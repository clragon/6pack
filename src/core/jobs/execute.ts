import { hide, markWarning } from '../api/burn';
import { createBan } from '../api/ban';
import type { Burn } from './queue';

export async function burnTarget(burn: Burn, id: string): Promise<void> {
  if (burn.type === 'user') {
    await createBan(Number(id), burn.fields ?? {});
    return;
  }
  await hide(burn.type, id);
  if (burn.markType) await markWarning(burn.type, id, burn.markType);
}
