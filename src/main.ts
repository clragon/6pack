import { matchesTrigger, triggerIsModless } from './core/config';
import { detectContext } from './core/context/detect';
import { record } from './core/diag';
import { ActionRegistry } from './core/actions/registry';
import { AddonHost } from './core/addons/host';
import { sourcesAddon } from './addons/sources';
import { mountPalette } from './core/palette/mount';
import { isConfirmActive } from './core/palette/confirm';
import { deepActiveElement, isEditableElement } from './core/palette/focus';
import { captureStore, paletteStore } from './core/palette/store';
import { log } from './core/log';
import { mountBurnControls } from './burn/mount';
import {
  prefetchReportedDestination,
  readAccused,
  readTicketStatus,
} from './site/ticket';
import {
  canComposeResponse,
  readTicketTemplates,
} from './site/ticketTemplates';
import { publishOpenTicket } from './core/tickets/registry';
import { installTicketCommandHandler } from './core/tickets/commands';
import { installTicketChips } from './core/tickets/chipSource';
import { loadCurrentUser } from './site/user';
import { allActions } from './actions';

const page = detectContext();
record('page', page);

const registry = new ActionRegistry();
registry.register(...allActions);

const addons = new AddonHost(registry, page);
addons.register(sourcesAddon);
addons.publish();

installTicketChips();

void loadCurrentUser().then((user) => {
  record('user', user ? `${user.name} #${user.id}` : 'anonymous');
  if (user) record('level', `${user.levelString} (${user.level})`);
});

if (page.kind === 'ticket') prefetchReportedDestination();

if (page.kind === 'ticket' && canComposeResponse()) {
  const status = readTicketStatus();
  if (status !== 'approved') {
    publishOpenTicket({
      ticketId: page.id,
      status: status ?? 'pending',
      accused: readAccused(),
      templates: readTicketTemplates(),
      canHandle: true,
    });
    installTicketCommandHandler();
  }
}

mountBurnControls();

mountPalette(page, () => registry.available(page));

log.info(
  page.kind === 'post' ? `ready on post #${page.id}` : `ready on ${page.kind}`,
);

window.addEventListener(
  'keydown',
  (event) => {
    if (captureStore.isOpen() || isConfirmActive()) return;
    if (!matchesTrigger(event)) return;
    if (triggerIsModless() && isEditableElement(deepActiveElement())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    paletteStore.toggle();
  },
  true,
);
