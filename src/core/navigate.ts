// Where a command sends the user. Context-relative jumps (open the record this
// page points at) open a new tab so the current post or ticket stays put; general
// destination nav (Home, Posts) replaces the current page with navigateTo.

export function navigateTo(url: string): void {
  window.location.href = url;
}

export function openInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener');
}

// New tab for a URL that isn't known until a fetch resolves. The tab must be
// opened synchronously inside the click's user gesture, or the popup blocker
// kills it once we await; we open it blank now and point it at the URL once it
// lands. A null URL (resolution failed) closes the tab and runs onFail. If the
// blocker still refused the blank tab, fall back to same-tab navigation.
export function openResolvedInNewTab(
  resolve: Promise<string | null>,
  onFail?: () => void,
): void {
  const tab = window.open('', '_blank');
  resolve
    .then((url) => {
      if (!url) {
        tab?.close();
        onFail?.();
        return;
      }
      if (tab) tab.location.href = url;
      else navigateTo(url);
    })
    .catch(() => {
      tab?.close();
      onFail?.();
    });
}
