import { useTranslation } from 'react-i18next';

import { SvgAdd } from '@actual-app/components/icons/v1';

import { Page } from '#components/Page';
import { useCategories } from '#hooks/useCategories';
import {
  useCreateCategoryGroupMutation,
  useCreateCategoryMutation,
} from '#budget/mutations';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

export function CategoriesPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const createCategoryGroup = useCreateCategoryGroupMutation();
  const createCategory = useCreateCategoryMutation();
  const { data: { grouped = [] } = {} } = useCategories();

  const addGroup = () => {
    dispatch(
      pushModal({
        modal: {
          name: 'new-category-group',
          options: {
            onValidate: (name: string) => (!name ? t('Name is required.') : null),
            onSubmit: async (name: string) => {
              createCategoryGroup.mutate({ name });
            },
          },
        },
      }),
    );
  };

  const addCategory = (groupId: string, isIncome: boolean) => {
    dispatch(
      pushModal({
        modal: {
          name: 'new-category',
          options: {
            onValidate: (name: string) => (!name ? t('Name is required.') : null),
            onSubmit: async (name: string) => {
              createCategory.mutate({
                name,
                groupId,
                isIncome,
                isHidden: false,
              });
            },
          },
        },
      }),
    );
  };

  return (
    <Page header={t('Categories')}>
      <div className="expense-categories-page">
        <div className="expense-categories-toolbar">
          <p>{t('Organize transactions by type. Categories are optional when recording a transaction.')}</p>
          <button className="exv-button" data-variant="primary" type="button" onClick={addGroup}>
            <SvgAdd width={14} height={14} />
            {t('Add category group')}
          </button>
        </div>
        <div className="expense-category-groups">
          {grouped.map(group => (
            <section className="exv-surface expense-category-group" key={group.id}>
              <div className="expense-category-group-heading">
                <h2>{group.name}</h2>
                <button
                  className="exv-icon-button"
                  type="button"
                  aria-label={t('Add category')}
                  onClick={() => addCategory(group.id, !!group.is_income)}
                >
                  <SvgAdd width={14} height={14} />
                </button>
              </div>
              <div className="expense-category-items">
                {(group.categories ?? []).map(category => (
                  <span className="exv-badge" key={category.id}>{category.name}</span>
                ))}
                {group.categories?.length === 0 && <span className="exv-field-help">{t('No categories yet')}</span>}
              </div>
            </section>
          ))}
          {grouped.length === 0 && (
            <div className="exv-empty-state exv-surface">
              <span className="exv-empty-state-title">{t('No category groups yet')}</span>
              <span>{t('Create a group, then add categories from the group menu.')}</span>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
