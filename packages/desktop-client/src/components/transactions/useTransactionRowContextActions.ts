import { useMemo } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { isPreviewId } from '@actual-app/core/shared/transactions';
import type { TransactionEntity } from '@actual-app/core/types/models';

import type { ContextMenuItem } from '#contextmenu/types';
import { useContextMenu } from '#hooks/useContextMenu';
import { useSelectedItems } from '#hooks/useSelected';

type TransactionRowContextMenuProps = {
  rowRef: RefObject<HTMLElement | null>;
  transaction: TransactionEntity;
  getTransaction: (id: string) => TransactionEntity | undefined;
  onDuplicate: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onLinkSchedule: (ids: string[]) => void;
  onUnlinkSchedule: (ids: string[]) => void;
  onCreateRule: (ids: string[]) => void;
  onScheduleAction: (
    name: 'skip' | 'post-transaction' | 'post-transaction-today' | 'complete',
    ids: TransactionEntity['id'][],
  ) => void;
  onMakeAsNonSplitTransactions: (ids: string[]) => void;
};

export function useTransactionRowContextActions({
  rowRef,
  transaction,
  getTransaction,
  onDuplicate,
  onDelete,
  onMakeAsNonSplitTransactions,
}: TransactionRowContextMenuProps) {
  const { t } = useTranslation();
  const selectedItems = useSelectedItems();

  const selectedIds = useMemo(() => {
    const ids =
      selectedItems && selectedItems.size > 0
        ? selectedItems
        : [transaction.id];
    return Array.from(new Set(ids));
  }, [transaction, selectedItems]);

  const types = useMemo(() => {
    const items = selectedIds;
    return {
      preview: !!items.find(id => isPreviewId(id)),
      trans: !!items.find(id => !isPreviewId(id)),
    };
  }, [selectedIds]);

  const ambiguousDuplication = useMemo(() => {
    const transactions = selectedIds.map(id => getTransaction(id));

    return transactions.some(tx => tx && tx.is_child);
  }, [selectedIds, getTransaction]);

  const canUnsplitTransactions = useMemo(() => {
    if (selectedIds.length === 0 || types.preview) {
      return false;
    }

    const transactions = selectedIds.map(id => getTransaction(id));

    const areNoReconciledTransactions = transactions.every(
      tx => tx && !tx.reconciled,
    );
    const areAllSplitTransactions = transactions.every(
      tx => tx && (tx.is_parent || tx.is_child),
    );
    return areNoReconciledTransactions && areAllSplitTransactions;
  }, [selectedIds, types, getTransaction]);

  const transactionActions: ContextMenuItem[] = [
    {
      name: 'duplicate',
      text: t('Duplicate'),
      onClick: () => onDuplicate(selectedIds),
      hidden: ambiguousDuplication,
    },
    {
      name: 'delete',
      text: t('Delete'),
      onClick: () => onDelete(selectedIds),
    },
    {
      name: 'unsplit-transactions',
      text: t('Unsplit {{count}} transactions', {
        count: selectedIds.length,
      }),
      onClick: () => onMakeAsNonSplitTransactions(selectedIds),
      hidden: !canUnsplitTransactions,
    },
  ];

  useContextMenu({
    triggerRef: rowRef,
    items: types.trans ? transactionActions : [],
  });
}
