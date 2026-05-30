import { Flame } from 'lucide-preact';

export interface Crumb {
  label: string;
  // Navigate back to this level. Omit for the trailing (current) crumb.
  onClick?: () => void;
}

// Shared header across the palette and its dialogs: a flame root (home) followed
// by the trail of levels. The flame's onHome is context-specific (return to root
// in the palette, cancel in a dialog).
export function Breadcrumb({
  crumbs,
  onHome,
}: {
  crumbs: Crumb[];
  onHome: () => void;
}) {
  return (
    <div class="sp-crumbs">
      <button
        class="sp-home"
        type="button"
        title="6 P.A.C.K."
        aria-label="6 P.A.C.K."
        onClick={onHome}
      >
        <Flame size={16} fill="currentColor" />
      </button>
      {crumbs.map((crumb, index) => (
        <span class="sp-crumb-group" key={index}>
          <span class="sp-crumb-arrow">›</span>
          {crumb.onClick ? (
            <button class="sp-crumb" type="button" onClick={crumb.onClick}>
              {crumb.label}
            </button>
          ) : (
            <span class="sp-crumb sp-crumb-current">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
