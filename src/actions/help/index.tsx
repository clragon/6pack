import { render, type VNode } from 'preact';

import type { Action } from '../../core/actions/types';
import { addonManuals, type AddonManual } from '../../core/addons/manual';
import { formatTrigger } from '../../core/config';
import { openDialog, type DialogCrumb } from '../../core/palette/dialog';
import HELP_CSS from './styles.css?inline';

function Section({
  title,
  items,
}: {
  title: string;
  items: { term: string; detail?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <>
      <div class="sp-man-section">{title}</div>
      <dl class="sp-man-rows">
        {items.map((item) => (
          <div class="sp-man-row" key={item.term}>
            <dt>{item.term}</dt>
            {item.detail && <dd>{item.detail}</dd>}
          </div>
        ))}
      </dl>
    </>
  );
}

function ManPage({ manual }: { manual: AddonManual }) {
  return (
    <div class="sp-man">
      <div class="sp-man-name">{manual.name}</div>
      <p class="sp-man-desc">
        {manual.description ?? 'No description provided.'}
      </p>
      <Section
        title="Commands"
        items={manual.actions.map((action) => ({
          term: action.title,
          detail: action.description,
        }))}
      />
      <Section
        title="Settings"
        items={manual.settings.map((setting) => ({
          term: setting.label,
          detail: setting.description,
        }))}
      />
    </div>
  );
}

function Overview() {
  const trigger = formatTrigger();
  return (
    <div class="sp-man">
      <div class="sp-man-name">Using the palette</div>
      <p class="sp-man-desc">
        6pack is a command palette for e621. Open it with {trigger}, type to
        find a command, and run it with Enter.
      </p>
      <div class="sp-man-section">Navigating</div>
      <dl class="sp-man-rows">
        <div class="sp-man-row">
          <dt>{trigger}</dt>
          <dd>open or close the palette</dd>
        </div>
        <div class="sp-man-row">
          <dt>Up / Down</dt>
          <dd>move through the list</dd>
        </div>
        <div class="sp-man-row">
          <dt>Enter</dt>
          <dd>run the selected command</dd>
        </div>
        <div class="sp-man-row">
          <dt>Tab / Right</dt>
          <dd>drill into a group</dd>
        </div>
        <div class="sp-man-row">
          <dt>Esc</dt>
          <dd>go back a level, or close</dd>
        </div>
        <div class="sp-man-row">
          <dt>Alt + Up / Down</dt>
          <dd>move the row you are on, where a list can be reordered</dd>
        </div>
      </dl>
      <div class="sp-man-section">Chips</div>
      <p class="sp-man-text">
        Ambient state shows as chips above the input. Open one to act on it
        without leaving this page.
      </p>
      <div class="sp-man-section">Add-ons</div>
      <p class="sp-man-text">
        Additional functionality can be added to 6pack with so called Add-ons.
        You can enable add-ons by simply typing the add-on command.
      </p>
    </div>
  );
}

function openPage(title: string, body: VNode): void {
  const trail: DialogCrumb[] = [{ title: 'Help', target: 'help' }, { title }];
  openDialog({
    trail,
    styles: HELP_CSS,
    render: (host) => {
      render(body, host);
      return () => render(null, host);
    },
  });
}

export const help: Action = {
  id: 'help',
  title: 'Help',
  description: 'How the palette works, and what each add-on does',
  keywords: ['help', 'manual', 'docs', 'guide', 'about'],
  // A manual is worth reading only once you have drilled to it, so an add-on's
  // name does not surface its help page in the root list.
  drillOnly: true,
  submenu: () => [
    {
      id: 'help.overview',
      title: 'Using the palette',
      run: () => openPage('Using the palette', <Overview />),
    },
    ...addonManuals().map((manual) => ({
      id: `help.addon.${manual.id}`,
      title: manual.name,
      run: () => openPage(manual.name, <ManPage manual={manual} />),
    })),
  ],
};
