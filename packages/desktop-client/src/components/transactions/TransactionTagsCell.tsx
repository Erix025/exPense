import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { Popover } from '@actual-app/components/popover';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { useQuery } from '@tanstack/react-query';

import { TransactionTagPicker } from '#components/autocomplete/TransactionTagPicker';
import { Cell } from '#components/table';
import { useTagCSS } from '#hooks/useTagCSS';
import { tagQueries } from '#tags/queries';

type TransactionTagsCellProps = {
  value: string[];
  isLoading: boolean;
  focused: boolean;
  onExpose: () => void;
  onChange: (tagIds: string[]) => void;
};

export function TransactionTagsCell({
  value,
  isLoading,
  focused,
  onExpose,
  onChange,
}: TransactionTagsCellProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: tags = [] } = useQuery(tagQueries.list());
  const getTagCSS = useTagCSS({ ellipsis: true });
  const selectedTagIds = new Set(value);
  const selectedTags = tags.filter(tag => selectedTagIds.has(tag.id));
  const displayValue = selectedTags.map(tag => tag.tag).join(', ');

  useEffect(() => {
    if (focused) {
      setIsOpen(true);
    }
  }, [focused]);

  return (
    <Cell
      name="tags"
      width="flex"
      value={displayValue}
      focused={focused}
      exposed={focused}
      formatter={() =>
        isLoading ? (
          <Text>
            <Trans>Loading</Trans>
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 4, overflow: 'hidden' }}>
            {selectedTags.map(tag => (
              <span
                key={tag.id}
                className={getTagCSS(tag.tag, { color: tag.color })}
              >
                {tag.tag}
              </span>
            ))}
          </View>
        )
      }
      onExpose={onExpose}
    >
      {() => (
        <>
          <Button
            ref={triggerRef}
            variant="bare"
            isDisabled={isLoading}
            aria-label={t('Edit tags')}
            onPress={() => setIsOpen(true)}
          >
            {selectedTags.length > 0 ? (
              <View
                style={{ flexDirection: 'row', gap: 4, overflow: 'hidden' }}
              >
                {selectedTags.map(tag => (
                  <span
                    key={tag.id}
                    className={getTagCSS(tag.tag, { color: tag.color })}
                  >
                    {tag.tag}
                  </span>
                ))}
              </View>
            ) : (
              <>
                <SvgAdd width={10} height={10} />
                <Text style={{ marginLeft: 4 }}>
                  <Trans>Add tag</Trans>
                </Text>
              </>
            )}
          </Button>
          <Popover
            triggerRef={triggerRef}
            isOpen={isOpen}
            isNonModal
            onOpenChange={setIsOpen}
          >
            <View style={{ width: 280, padding: 8 }}>
              <TransactionTagPicker value={value} onChange={onChange} />
            </View>
          </Popover>
        </>
      )}
    </Cell>
  );
}
