import { useRef } from 'preact/hooks';

import { RULES, RULE_GROUPS } from './rules';
import { rove } from '../../core/palette/rove';

export function RuleGroups({
  isActive,
  onToggle,
}: {
  isActive: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ordered: string[] = [];
  const groups = Object.values(RULE_GROUPS)
    .map((label) => {
      const keys = Object.keys(RULES).filter(
        (key) => RULES[key].group === label,
      );
      ordered.push(...keys);
      return { label, keys };
    })
    .filter((group) => group.keys.length > 0);

  return (
    <div
      class="sp-qf-rule-groups"
      ref={ref}
      onKeyDown={(event) => rove(ref.current, event, '.sp-qf-pill')}
    >
      {groups.map((group) => (
        <div class="sp-qf-rule-group" key={group.label}>
          <div class="sp-qf-rule-group-label">{group.label}</div>
          <div class="sp-qf-rules">
            {group.keys.map((key) => (
              <button
                type="button"
                key={key}
                tabIndex={key === ordered[0] ? 0 : -1}
                class={'sp-qf-pill' + (isActive(key) ? ' sp-qf-on' : '')}
                onClick={() => onToggle(key)}
              >
                {RULES[key].title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
