import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import { useQuery } from '@tanstack/react-query';

import { Page } from '#components/Page';
import { useAccounts } from '#hooks/useAccounts';
import { useFormat } from '#hooks/useFormat';
import { useNavigate } from '#hooks/useNavigate';

import { Section } from './Section';
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
          <div className="exv-list">
            {balances.data?.map(({ account, balance }) => (
              <button
                key={account.id}
                className="exv-list-row"
                type="button"
                onClick={() => navigate(`/accounts/${account.id}`)}
              >
                <span className="exv-status-dot" data-tone="info" />
                <span className="exv-list-row-main">
                  <span className="exv-list-row-title">{account.name}</span>
                  <span className="exv-list-row-meta">{t('Account balance')}</span>
                </span>
                <span className="exv-list-row-value">
                  {format(balance, 'financial')}
                </span>
              </button>
            ))}
            {activeAccounts.length === 0 && (
              <div className="exv-empty-state">
                <span className="exv-empty-state-title">
                  <Trans>No accounts yet.</Trans>
                </span>
              </div>
            )}
          </div>
        </Section>

        <Section title={t('Recent transactions')}>
          <div className="exv-list">
            {recentTransactions.data?.map(transaction => (
              <div
                key={transaction.id}
                className="exv-list-row"
              >
                <span
                  className="exv-status-dot"
                  data-tone={transaction.amount >= 0 ? 'success' : 'error'}
                />
                <span className="exv-list-row-main">
                  <span className="exv-list-row-title">
                    {transaction.payee ||
                      transaction.category ||
                      (transaction.isSplit
                        ? t('Split transaction')
                        : t('Transaction'))}
                  </span>
                  <span className="exv-list-row-meta">
                    {[
                      transaction.date,
                      transaction.account,
                      transaction.category,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="exv-list-row-value">
                  {format(transaction.amount, 'financial')}
                </span>
              </div>
            ))}
            {recentTransactions.data?.length === 0 && (
              <div className="exv-empty-state">
                <span className="exv-empty-state-title">
                  <Trans>No transactions yet.</Trans>
                </span>
              </div>
            )}
          </div>
        </Section>
      </div>
    </Page>
  );
}
