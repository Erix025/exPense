import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgRemove } from '@actual-app/components/icons/v2';
import { Input } from '@actual-app/components/input';
import { SpaceBetween } from '@actual-app/components/space-between';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { getNormalisedString } from '@actual-app/core/shared/normalisation';
import { useQuery } from '@tanstack/react-query';

import { useTagCSS } from '#hooks/useTagCSS';
import { tagQueries } from '#tags/queries';

type TransactionTagPickerProps = {
  value: string[];
  onChange: (tagIds: string[]) => void;
};

export function TransactionTagPicker({
  value,
  onChange,
}: TransactionTagPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: tags = [] } = useQuery(tagQueries.list());
  const getTagCSS = useTagCSS({ ellipsis: true });
  const selectedIds = useMemo(() => new Set(value), [value]);
  const selectedTags = tags.filter(tag => selectedIds.has(tag.id));
  const normalizedSearch = getNormalisedString(search.trim());
  const matchingTags = normalizedSearch
    ? tags
        .filter(
          tag =>
            !tag.hidden &&
            !selectedIds.has(tag.id) &&
            getNormalisedString(tag.tag).includes(normalizedSearch),
        )
        .slice(0, 20)
    : [];

  return (
    <View style={{ gap: 8 }}>
      {selectedTags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {selectedTags.map(tag => (
            <Button
              key={tag.id}
              variant="bare"
              aria-label={t('Remove tag {{tag}}', { tag: tag.tag })}
              className={getTagCSS(tag.tag, { color: tag.color })}
              onPress={() => onChange(value.filter(tagId => tagId !== tag.id))}
            >
              <SpaceBetween
                direction="horizontal"
                gap={4}
                wrap={false}
                align="center"
              >
                <span>{tag.tag}</span>
                <SvgRemove height={9} width={9} />
              </SpaceBetween>
            </Button>
          ))}
        </View>
      )}

      <Input
        aria-label={t('Search tags')}
        placeholder={t('Search tags')}
        value={search}
        onChange={event => setSearch(event.currentTarget.value)}
        autoComplete="off"
      />

      {normalizedSearch.length > 0 && (
        <View style={{ gap: 4 }}>
          {matchingTags.length > 0 ? (
            matchingTags.map(tag => (
              <Button
                key={tag.id}
                variant="bare"
                className={getTagCSS(tag.tag, { color: tag.color })}
                onPress={() => {
                  onChange([...value, tag.id]);
                  setSearch('');
                }}
              >
                {tag.tag}
              </Button>
            ))
          ) : (
            <Text style={{ color: theme.pageTextLight }}>
              <Trans>No matching tags</Trans>
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
