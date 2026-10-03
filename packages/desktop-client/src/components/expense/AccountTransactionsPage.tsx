import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { Page } from '#components/Page';
import { AccountTransactions } from '#components/mobile/accounts/AccountTransactions';
import { useAccount } from '#hooks/useAccount';

export function AccountTransactionsPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const account = useAccount(id);

  if (!account) {
    return (
      <Page header={t('Account')}>
        <div />
      </Page>
    );
  }

  return (
    <Page header={account.name} padding={0}>
      <div className="expense-transaction-cards-page">
        <AccountTransactions account={account} />
      </div>
    </Page>
  );
}
