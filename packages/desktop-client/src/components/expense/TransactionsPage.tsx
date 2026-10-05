import { useTranslation } from 'react-i18next';

import { Page } from '#components/Page';
import { AddTransactionButton } from '#components/mobile/transactions/AddTransactionButton';
import { AllAccountTransactions } from '#components/mobile/accounts/AllAccountTransactions';

export function TransactionsPage() {
  const { t } = useTranslation();

  return (
    <Page
      header={
        <div className="expense-page-heading">
          <span>{t('Transactions')}</span>
          <AddTransactionButton />
        </div>
      }
      padding={0}
    >
      <div className="expense-transaction-cards-page">
        <AllAccountTransactions />
      </div>
    </Page>
  );
}
