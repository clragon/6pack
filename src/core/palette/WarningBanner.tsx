import { useFatals } from './banner';

export function WarningBanner() {
  const fatals = useFatals();
  if (fatals.length === 0) return null;
  return (
    <div class="sp-banner" role="alert">
      <div class="sp-banner-title">6 P.A.C.K. is broken</div>
      {fatals.map((fatal) => (
        <div class="sp-banner-detail" key={fatal}>
          {fatal}
        </div>
      ))}
    </div>
  );
}
