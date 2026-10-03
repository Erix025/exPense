import { useTranslation } from 'react-i18next';

import { Page } from '#components/Page';
import { AllAccountTransactions } from '#components/mobile/accounts/AllAccountTransactions';

export function TransactionsPage() {
  const { t } = useTranslation();

  return (
    <Page header={t('Transactions')} padding={0}>
      <div className="expense-transaction-cards-page">
        <AllAccountTransactions />
      </div>
    </Page>
  );
}
