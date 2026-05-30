export function navigateTo(url: string): void {
  window.location.href = url;
}

export function openInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener');
}

export function openResolvedInNewTab(
  resolve: Promise<string | null>,
  onFail?: () => void,
): void {
  // Browsers allow window.open only during the click's user activation, so the
  // tab opens blank now and the url lands once the promise settles.
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
