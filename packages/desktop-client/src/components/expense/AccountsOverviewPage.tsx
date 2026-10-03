import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { send } from '@actual-app/core/platform/client/connection';
import { useQuery } from '@tanstack/react-query';

import { Page } from '#components/Page';
import { useAccounts } from '#hooks/useAccounts';
import { useFormat } from '#hooks/useFormat';
import { useNavigate } from '#hooks/useNavigate';

export function AccountsOverviewPage() {
  const { t } = useTranslation();
  const format = useFormat();
  const navigate = useNavigate();
  const { data: accounts = [] } = useAccounts();
  const activeAccounts = accounts.filter(account => !account.closed);
  const closedAccounts = accounts.filter(account => account.closed);
  const balances = useQuery({
    queryKey: ['expense', 'accounts-overview-balances', activeAccounts.map(a => a.id)],
    queryFn: async () =>
      Promise.all(
        activeAccounts.map(async account => ({
          account,
          balance: (await send('account-properties', { id: account.id })).balance,
        })),
      ),
    enabled: activeAccounts.length > 0,
  });

  const totalBalance = useMemo(
    () => balances.data?.reduce((sum, item) => sum + item.balance, 0) ?? 0,
    [balances.data],
  );

  return (
    <Page header={t('Accounts')}>
      <div className="expense-accounts-page">
        <div className="exv-metric expense-accounts-total">
          <span className="exv-metric-label">{t('Total balance')}</span>
          <span className="exv-metric-value">
            {format(totalBalance, 'financial')}
          </span>
        </div>

        <section className="expense-accounts-section">
          <h2>{t('Accounts')}</h2>
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
                  <span className="exv-list-row-meta">{t('View transactions')}</span>
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
        </section>

        {closedAccounts.length > 0 && (
          <section className="expense-accounts-section">
            <h2>{t('Closed accounts')}</h2>
            <div className="exv-list">
              {closedAccounts.map(account => (
                <button
                  key={account.id}
                  className="exv-list-row"
                  type="button"
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <span className="exv-status-dot" data-tone="neutral" />
                  <span className="exv-list-row-main">
                    <span className="exv-list-row-title">{account.name}</span>
                    <span className="exv-list-row-meta">{t('Closed')}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
