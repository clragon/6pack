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

// Load the built-in add-ons through the public contract (no privileged path),
// then expose the bridge so third-party hooks can register too.
const addons = new AddonHost(registry, page);
addons.register(sourcesAddon);
addons.publish();

// Every tab can show chips for tickets open in other tabs, so register the source
// regardless of the current page.
installTicketChips();

// Warm the permission cache so level-gated actions resolve on first open, and
// record the resolved user as clean diagnostic rows.
void loadCurrentUser().then((user) => {
  record('user', user ? `${user.name} #${user.id}` : 'anonymous');
  if (user) record('level', `${user.levelString} (${user.level})`);
});

// On a ticket, resolve the reported content's destination ahead of the click so
// the in-context command opens straight at it.
if (page.kind === 'ticket') prefetchReportedDestination();

// Publish an open, handleable ticket so other tabs can close it from their chip
// row. Only a moderator's view renders the response field (and RE621's chips),
// and an already-approved ticket is closed, so neither is worth announcing.
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

// Inject the burn checkboxes + controls on pages with burnable items.
mountBurnControls();

mountPalette(page, () => registry.available(page));

log.info(
  page.kind === 'post' ? `ready on post #${page.id}` : `ready on ${page.kind}`,
);

// Capture phase so the trigger wins over e621's own document-level key handler.
window.addEventListener(
  'keydown',
  (event) => {
    if (captureStore.isOpen() || isConfirmActive()) return; // a prompt is open
    if (!matchesTrigger(event)) return;
    // A modifier-less trigger (e.g. plain "Q") must not hijack typing in a
    // field; close with Esc instead.
    if (triggerIsModless() && isEditableElement(deepActiveElement())) return;
    event.preventDefault();
    // Stop e621's own hotkey handler from also seeing this key (its search-focus
    // hotkey scrolls the page to the top).
    event.stopImmediatePropagation();
    paletteStore.toggle();
  },
  true,
);
