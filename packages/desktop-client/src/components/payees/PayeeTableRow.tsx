// @ts-strict-ignore
import { memo, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { SvgBookmark, SvgLightBulb } from '@actual-app/components/icons/v1';
import { theme } from '@actual-app/components/theme';
import { Tooltip } from '@actual-app/components/tooltip';
import type { PayeeEntity } from '@actual-app/core/types/models';

import { CustomCell, InputCell, Row, SelectCell } from '#components/table';
import { useContextMenu } from '#hooks/useContextMenu';
import { useSelectedDispatch, useSelectedItems } from '#hooks/useSelected';
import { useSyncedPref } from '#hooks/useSyncedPref';

type EditablePayeeFields = keyof Pick<
  PayeeEntity,
  'name' | 'favorite' | 'learn_categories'
>;

type PayeeTableRowProps = {
  payee: PayeeEntity;
  ruleCount: number;
  selected: boolean;
  hovered: boolean;
  editing: boolean;
  focusedField: string;
  onHover?: (id: PayeeEntity['id']) => void;
  onEdit: (id: PayeeEntity['id'], field: string) => void;
  onUpdate: <T extends EditablePayeeFields>(
    id: PayeeEntity['id'],
    field: T,
    value: PayeeEntity[T],
  ) => void;
  onDelete: (ids: PayeeEntity['id'][]) => void;
  onViewRules: (id: PayeeEntity['id']) => void;
  onCreateRule: (id: PayeeEntity['id']) => void;
  style?: CSSProperties;
};

export const PayeeTableRow = memo(
  ({
    payee,
    selected,
    hovered,
    editing,
    focusedField,
    onHover,
    onDelete,
    onEdit,
    onUpdate,
    style,
  }: PayeeTableRowProps) => {
    const { id } = payee;
    const dispatchSelected = useSelectedDispatch();
    const selectedItems = useSelectedItems();
    const selectedIds = useMemo(() => {
      const ids =
        selectedItems && selectedItems.size > 0 ? selectedItems : [payee.id];
      return Array.from(new Set(ids));
    }, [payee, selectedItems]);

    const borderColor = selected
      ? theme.tableBorderSelected
      : theme.tableBorder;
    const backgroundFocus = hovered || focusedField === 'select';
    const [learnCategories = 'true'] = useSyncedPref('learn-categories');
    const isLearnCategoriesEnabled = String(learnCategories) === 'true';

    const { t } = useTranslation();

    const triggerRef = useRef(null);
    useContextMenu({
      triggerRef,
      items: [
        {
          name: 'delete',
          text: t('Delete'),
          onClick: () => onDelete(selectedIds),
          hidden: payee.transfer_acct != null,
        },
        {
          name: 'favorite',
          text: payee.favorite ? t('Unfavorite') : t('Favorite'),
          onClick: () =>
            selectedIds.forEach(id =>
              onUpdate(id, 'favorite', !payee.favorite),
            ),
          hidden: payee.transfer_acct != null,
        },
        {
          name: 'learn',
          text: payee.learn_categories
            ? t('Disable learning')
            : t('Enable learning'),
          onClick: () =>
            selectedIds.forEach(id =>
              onUpdate(id, 'learn_categories', !payee.learn_categories),
            ),
          hidden: !isLearnCategoriesEnabled,
        },
      ],
    });

    return (
      <Row
        ref={triggerRef}
        style={{
          alignItems: 'stretch',
          ...style,
          borderColor,
          backgroundColor: hovered
            ? theme.tableRowBackgroundHover
            : selected
              ? theme.tableRowBackgroundHighlight
              : backgroundFocus
                ? theme.tableRowBackgroundHover
                : theme.tableBackground,
          ...(selected && {
            backgroundColor: theme.tableRowBackgroundHighlight,
            zIndex: 100,
          }),
        }}
        data-focus-key={payee.id}
        onMouseEnter={() => onHover && onHover(payee.id)}
      >
        <SelectCell
          exposed={
            payee.transfer_acct == null && (hovered || selected || editing)
          }
          focused={focusedField === 'select'}
          selected={selected}
          onSelect={e => {
            if (payee.transfer_acct != null) {
              return;
            }
            dispatchSelected({
              type: 'select',
              id: payee.id,
              isRangeSelect: e.shiftKey,
            });
          }}
        />
        <CustomCell
          width={20}
          exposed={!payee.transfer_acct}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          {() => {
            return (
              <>
                {payee.favorite ? <SvgBookmark style={{ width: 10 }} /> : null}
                {isLearnCategoriesEnabled && !payee.learn_categories && (
                  <Tooltip content={t('Category learning disabled')}>
                    <SvgLightBulb style={{ color: 'red', width: 10 }} />
                  </Tooltip>
                )}
              </>
            );
          }}
        </CustomCell>
        <InputCell
          value={(payee.transfer_acct ? t('Transfer: ') : '') + payee.name}
          valueStyle={
            (!selected &&
              payee.transfer_acct && { color: theme.pageTextSubdued }) ||
            (!selected && !payee.transfer_acct && { color: theme.tableText }) ||
            (selected && { color: theme.tableTextSelected })
          }
          exposed={focusedField === 'name'}
          width="flex"
          onUpdate={value =>
            !payee.transfer_acct && onUpdate(id, 'name', value)
          }
          onExpose={() => onEdit(id, 'name')}
          inputProps={{ readOnly: !!payee.transfer_acct }}
        />
      </Row>
    );
  },
);

PayeeTableRow.displayName = 'PayeeTableRow';
