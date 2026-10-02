import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import { useQuery } from '@tanstack/react-query';

import { Page } from '#components/Page';
import { useFormat } from '#hooks/useFormat';

import { panelStyle, Section } from './Section';
import { SummaryCard } from './SummaryCard';

export function AnalyticsPage() {
  const { t } = useTranslation();
  const format = useFormat();
  const month = monthUtils.currentMonth();
  const period = useMemo(
    () => ({
      startDate: monthUtils.firstDayOfMonth(monthUtils.subMonths(month, 5)),
      endDate: monthUtils.currentDay(),
    }),
    [month],
  );
  const queryKey = ['expense', period.startDate, period.endDate];
  const summary = useQuery({
    queryKey: [...queryKey, 'summary'],
    queryFn: () => send('expense/home-summary', period),
  });
  const categories = useQuery({
    queryKey: [...queryKey, 'categories'],
    queryFn: () => send('expense/category-breakdown', { ...period, limit: 10 }),
  });
  const payees = useQuery({
    queryKey: [...queryKey, 'payees'],
    queryFn: () => send('expense/payee-breakdown', { ...period, limit: 10 }),
  });
  const trend = useQuery({
    queryKey: [...queryKey, 'trend'],
    queryFn: () => send('expense/monthly-trend', period),
  });

  return (
    <Page header={t('Analytics')}>
      <div style={{ padding: '20px 0 36px' }}>
        <Section title={t('Last 6 months')}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
            }}
          >
            <SummaryCard
              label={t('Income')}
              value={summary.data?.income}
              format={format}
            />
            <SummaryCard
              label={t('Spent')}
              value={summary.data?.expense}
              format={format}
            />
            <SummaryCard
              label={t('Net change')}
              value={summary.data?.net}
              format={format}
            />
          </div>
        </Section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          <Section title={t('Spending by category')}>
            <div style={panelStyle}>
              {categories.data?.map(item => (
                <BreakdownRow
                  key={item.id ?? 'uncategorized'}
                  label={item.name}
                  amount={item.amount}
                  format={format}
                />
              ))}
              {categories.data?.length === 0 && <EmptyRow />}
            </div>
          </Section>
          <Section title={t('Spending by payee')}>
            <div style={panelStyle}>
              {payees.data?.map(item => (
                <BreakdownRow
                  key={item.id ?? 'unspecified'}
                  label={item.name}
                  amount={item.amount}
                  format={format}
                />
              ))}
              {payees.data?.length === 0 && <EmptyRow />}
            </div>
          </Section>
        </div>

        <Section title={t('Monthly trend')}>
          <div style={panelStyle}>
            <View
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(70px, 1fr) repeat(3, minmax(70px, 1fr))',
                gap: 12,
                padding: '10px 14px',
                borderBottom: `1px solid ${theme.tableBorder}`,
              }}
            >
              <Text style={{ color: theme.pageTextLight }}>
                <Trans>Month</Trans>
              </Text>
              <Text style={{ color: theme.pageTextLight, textAlign: 'right' }}>
                <Trans>Income</Trans>
              </Text>
              <Text style={{ color: theme.pageTextLight, textAlign: 'right' }}>
                <Trans>Spent</Trans>
              </Text>
              <Text style={{ color: theme.pageTextLight, textAlign: 'right' }}>
                <Trans>Net</Trans>
              </Text>
            </View>
            {trend.data?.map(item => (
              <View
                key={item.month}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(70px, 1fr) repeat(3, minmax(70px, 1fr))',
                  gap: 12,
                  padding: '12px 14px',
                  borderBottom: `1px solid ${theme.tableBorder}`,
                }}
              >
                <Text>{item.month}</Text>
                <Text style={{ textAlign: 'right' }}>
                  {format(item.income, 'financial')}
                </Text>
                <Text style={{ textAlign: 'right' }}>
                  {format(item.expense, 'financial')}
                </Text>
                <Text style={{ textAlign: 'right' }}>
                  {format(item.net, 'financial')}
                </Text>
              </View>
            ))}
            {trend.data?.length === 0 && <EmptyRow />}
          </div>
        </Section>
      </div>
    </Page>
  );
}

function BreakdownRow({
  label,
  amount,
  format,
}: {
  label: string;
  amount: number;
  format: ReturnType<typeof useFormat>;
}) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        borderBottom: `1px solid ${theme.tableBorder}`,
      }}
    >
      <Text>{label}</Text>
      <Text>{format(amount, 'financial')}</Text>
    </View>
  );
}

function EmptyRow() {
  return (
    <View style={{ padding: 14 }}>
      <Text style={{ color: theme.pageTextLight }}>
        <Trans>No transactions yet.</Trans>
      </Text>
    </View>
  );
}
