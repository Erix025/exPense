import type { UseFormatResult } from '#hooks/useFormat';

export function SummaryCard({
  label,
  value,
  format,
}: {
  label: string;
  value?: number;
  format: UseFormatResult;
}) {
  return (
    <div className="exv-metric">
      <span className="exv-metric-label">{label}</span>
      <span className="exv-metric-value">
        {value === undefined ? '—' : format(value, 'financial')}
      </span>
    </div>
  );
}
