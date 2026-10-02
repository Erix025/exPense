import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

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
    <View
      style={{
        gap: 8,
        padding: 16,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 8,
        backgroundColor: theme.tableBackground,
      }}
    >
      <Text style={{ color: theme.pageTextLight }}>{label}</Text>
      <Text style={{ fontSize: 23, fontWeight: 600 }}>
        {value === undefined ? '—' : format(value, 'financial')}
      </Text>
    </View>
  );
}
