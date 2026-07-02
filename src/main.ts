import { matchesTrigger, triggerIsModless } from './core/config';
import { detectContext } from './core/context/detect';
import { record } from './core/diag';
import { ActionRegistry } from './core/actions/registry';
import { addons } from './core/addons/manager';
import { mountPalette } from './core/palette/mount';
import { isConfirmActive } from './core/palette/confirm';
import { deepActiveElement, isEditableElement } from './core/palette/focus';
import { captureStore, paletteStore } from './core/palette/store';
import { log } from './core/log';
import { whenReady } from './core/ready';
import { mountBurnControls } from './burn/mount';
import {
  canComposeResponse,
  prefetchReportedDestination,
  readAccused,
  readTicketStatus,
} from './site/ticket';
import { listTicketResponses } from './core/tickets/providers';
import { publishOpenTicket } from './core/tickets/registry';
import { installTicketCommandHandler } from './core/tickets/commands';
import { installTicketChips } from './core/tickets/chipSource';
import { installMassBanChip } from './core/bans/chip';
import { captureBanForm } from './site/banCapture';
import { mountBanHint } from './site/banHint';
import { loadCurrentUser } from './site/user';
import { allActions } from './actions';

const page = detectContext();
record('page', page);

const registry = new ActionRegistry();
registry.register(...allActions);

// Publish the bridge and load enabled add-ons eagerly at document-start: a
// cached add-on registers and injects its styles before first paint, and its
// own setup defers DOM work via ctx.whenReady. Third-party hooks registering
// earlier queue on the bridge stub and drain when init publishes.
addons.init(registry, page);

// The rest reads or mounts into the page, so it waits for the parse.
whenReady(() => {
  // Every tab can show chips for tickets open in other tabs, so register the
  // source regardless of the current page. The mass-ban chip likewise surfaces a
  // pending ban template on any page.
  installTicketChips();
  installMassBanChip();

  // On the new-ban form, capture the submitted ban fields for the pending template.
  if (location.pathname === '/bans/new') captureBanForm();
  // On any ban page, hint at the pending template with a flame by the heading.
  if (/^\/bans\//.test(location.pathname)) mountBanHint();

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
  // row. Only a moderator's view renders the response field, and an already-closed
  // ticket or one with no responses on offer is not worth announcing.
  if (page.kind === 'ticket' && canComposeResponse()) {
    const status = readTicketStatus();
    const responses = listTicketResponses();
    if (status !== 'approved' && responses.length > 0) {
      publishOpenTicket({
        ticketId: page.id,
        status: status ?? 'pending',
        accused: readAccused(),
        responses,
        canHandle: true,
      });
      installTicketCommandHandler();
    }
  }

  // Inject the burn checkboxes + controls on pages with burnable items.
  mountBurnControls();

  mountPalette(page, () => registry.available(page));

  log.info(
    page.kind === 'post'
      ? `ready on post #${page.id}`
      : `ready on ${page.kind}`,
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
});
