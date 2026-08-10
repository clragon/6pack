import { render } from 'preact';
import { Flame } from 'lucide-preact';

import type { Action } from '../../core/actions/types';
import { formatTrigger } from '../../core/config';
import { closeDialog, openDialog } from '../../core/palette/dialog';
import { openPaletteAt } from '../../core/palette/store';
import { readJson, writeJson } from '../../core/storage';
import WELCOME_CSS from './styles.css?inline';

const KEY = 'sp.core.palette.welcomed';

// Names the command and opens it, so the word is both what to type and the way
// there. The palette takes over from the dialog, the same handover a breadcrumb
// `target` makes.
function Command({ id, children }: { id: string; children: string }) {
  return (
    <button
      type="button"
      class="sp-wel-cmd"
      onClick={() => {
        closeDialog();
        openPaletteAt(id);
      }}
    >
      {children}
    </button>
  );
}

function Page() {
  return (
    <div class="sp-wel">
      <div class="sp-wel-head">
        <Flame size={40} fill="currentColor" />
        <div class="sp-wel-name">6 P.A.C.K.</div>
      </div>
      <p class="sp-wel-tagline">
        Portable Areal Combustion Kit for e6
        <span class="sp-wel-version">v{__VERSION__}</span>
      </p>

      <p class="sp-wel-open">
        open with <kbd class="sp-wel-key">{formatTrigger()}</kbd> or the flame
        in the subnavbar
      </p>

      <div class="sp-wel-hints">
        <div>
          type <Command id="help">help</Command> for usage
        </div>
        <div>
          type <Command id="addons">addons</Command> for additional
          functionality
        </div>
      </div>
    </div>
  );
}

export function openWelcome(): void {
  openDialog({
    trail: [{ title: 'Welcome' }],
    styles: WELCOME_CSS,
    render: (host) => {
      render(<Page />, host);
      return () => render(null, host);
    },
  });
}

// Shown once, on the first page load after installing. Thereafter the command is
// `secret`, so typing its name in full is the only way back to it.
export function welcomeIfUnseen(): void {
  if (readJson<boolean>(KEY, false)) return;
  writeJson(KEY, true);
  openWelcome();
}

export const welcome: Action = {
  id: 'welcome',
  title: 'Welcome',
  description: 'What 6pack is, how to open it, and which version this is',
  keywords: ['welcome', 'about', 'version'],
  secret: true,
  run: () => openWelcome(),
};
