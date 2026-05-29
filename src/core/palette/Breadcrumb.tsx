import { Flame } from 'lucide-preact';

export interface Crumb {
  label: string;
  onClick?: () => void;
}

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
        title="Home"
        aria-label="Home"
        onClick={onHome}
      >
        <Flame size={16} />
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
