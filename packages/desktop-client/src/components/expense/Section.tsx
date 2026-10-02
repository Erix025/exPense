import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

export function Section({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 10, marginBottom: 24 }}>
      <Text style={{ fontSize: 17, fontWeight: 600 }}>{title}</Text>
      {children}
    </View>
  );
}

export const panelStyle = {
  border: `1px solid ${theme.tableBorder}`,
  borderRadius: 8,
  backgroundColor: theme.tableBackground,
  overflow: 'hidden',
} as const;
