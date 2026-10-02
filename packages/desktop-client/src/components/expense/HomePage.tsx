import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import { useQuery } from '@tanstack/react-query';

import { Page } from '#components/Page';
import { useAccounts } from '#hooks/useAccounts';
import { useFormat } from '#hooks/useFormat';
import { useNavigate } from '#hooks/useNavigate';

import { panelStyle, Section } from './Section';
import { SummaryCard } from './SummaryCard';

export function HomePage() {
  const { t } = useTranslation();
  const format = useFormat();
  const navigate = useNavigate();
  const month = monthUtils.currentMonth();
  const period = useMemo(
    () => ({
      startDate: monthUtils.firstDayOfMonth(month),
      endDate: monthUtils.currentDay(),
    }),
    [month],
  );
  const summary = useQuery({
    queryKey: ['expense', 'home-summary', period.startDate, period.endDate],
    queryFn: () => send('expense/home-summary', period),
  });
  const recentTransactions = useQuery({
    queryKey: ['expense', 'recent-transactions'],
    queryFn: () => send('expense/recent-transactions', { limit: 8 }),
  });
  const { data: accounts = [] } = useAccounts();
  const activeAccounts = accounts.filter(account => !account.closed);
  const balances = useQuery({
    queryKey: ['expense', 'account-balances', activeAccounts.map(a => a.id)],
    queryFn: async () =>
      Promise.all(
        activeAccounts.map(async account => ({
          account,
          balance: (await send('account-properties', { id: account.id }))
            .balance,
        })),
      ),
    enabled: activeAccounts.length > 0,
  });

  return (
    <Page header={t('Home')}>
      <div style={{ padding: '20px 0 36px' }}>
        <Section title={month}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
            }}
          >
            <SummaryCard
              label={t('Spent')}
              value={summary.data?.expense}
              format={format}
            />
            <SummaryCard
              label={t('Income')}
              value={summary.data?.income}
              format={format}
            />
            <SummaryCard
              label={t('Net')}
              value={summary.data?.net}
              format={format}
            />
          </div>
        </Section>

        <Section title={t('Accounts')}>
          <div style={{ display: 'grid', gap: 1 }}>
            {balances.data?.map(({ account, balance }) => (
              <button
                key={account.id}
                type="button"
                onClick={() => navigate(`/accounts/${account.id}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: 0,
                  borderBottom: '1px solid var(--table-border)',
                  background: 'transparent',
                  color: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>{account.name}</span>
                <span>{format(balance, 'financial')}</span>
              </button>
            ))}
            {activeAccounts.length === 0 && (
              <div>
                <Trans>No accounts yet.</Trans>
              </div>
            )}
          </div>
        </Section>

        <Section title={t('Recent transactions')}>
          <div style={panelStyle}>
            {recentTransactions.data?.map(transaction => (
              <View
                key={transaction.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 4,
                  padding: '11px 14px',
                  borderBottom: `1px solid ${theme.tableBorder}`,
                }}
              >
                <View style={{ minWidth: 0, gap: 2 }}>
                  <Text
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {transaction.payee ||
                      transaction.category ||
                      (transaction.isSplit
                        ? t('Split transaction')
                        : t('Transaction'))}
                  </Text>
                  <Text style={{ color: theme.pageTextLight, fontSize: 12 }}>
                    {[
                      transaction.date,
                      transaction.account,
                      transaction.category,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Text style={{ textAlign: 'right' }}>
                  {format(transaction.amount, 'financial')}
                </Text>
              </View>
            ))}
            {recentTransactions.data?.length === 0 && (
              <View style={{ padding: 14 }}>
                <Text style={{ color: theme.pageTextLight }}>
                  <Trans>No transactions yet.</Trans>
                </Text>
              </View>
            )}
          </div>
        </Section>
      </div>
    </Page>
  );
}
