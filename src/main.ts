import { matchesTrigger, triggerIsModless } from './core/config';
import { detectContext } from './core/context/detect';
import { record } from './core/diag';
import { ActionRegistry } from './core/actions/registry';
import { addons } from './core/addons/manager';
import { mountPalette } from './core/palette/mount';
import { isConfirmActive } from './core/palette/confirm';
import { isDialogActive } from './core/palette/dialog';
import { deepActiveElement, isEditableElement } from './core/palette/focus';
import { captureStore, paletteStore } from './core/palette/store';
import { log } from './core/log';
import { whenReady } from './core/ready';
import { loadCurrentUser } from './site/user';
import { allActions } from './actions';

const page = detectContext();
record('page', page);

const registry = new ActionRegistry();
registry.register(...allActions);

addons.init(registry, page);

whenReady(() => {
  void loadCurrentUser().then((user) => {
    record('user', user ? `${user.name} #${user.id}` : 'anonymous');
    if (user) record('level', `${user.levelString} (${user.level})`);
  });

  mountPalette(page, () => registry.available(page));

  log.info(
    page.kind === 'post'
      ? `ready on post #${page.id}`
      : `ready on ${page.kind}`,
  );

  // e621's Hotkeys binds keydown on document and Q focuses the tag box, so
  // this listener runs in the capture phase and stops the event first.
  window.addEventListener(
    'keydown',
    (event) => {
      if (captureStore.isOpen() || isConfirmActive() || isDialogActive())
        return;
      if (!matchesTrigger(event)) return;
      if (triggerIsModless() && isEditableElement(deepActiveElement())) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      paletteStore.toggle();
    },
    true,
  );
});
