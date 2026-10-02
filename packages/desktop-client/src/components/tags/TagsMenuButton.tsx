import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgDotsHorizontalTriple } from '@actual-app/components/icons/v1';
import { SvgViewHide, SvgViewShow } from '@actual-app/components/icons/v2';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { View } from '@actual-app/components/view';

import { useSyncedPref } from '#hooks/useSyncedPref';

export function TagsMenuButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showHidden, setShowHidden] = useSyncedPref('show-hidden-tags');
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <View>
      <Button
        ref={triggerRef}
        variant="bare"
        aria-label={t('Menu')}
        onClick={() => setOpen(true)}
      >
        <SvgDotsHorizontalTriple width={17} height={17} />
      </Button>
      <Popover
        triggerRef={triggerRef}
        isOpen={open}
        isNonModal
        onOpenChange={setOpen}
      >
        <Menu
          items={[
            showHidden === 'true'
              ? {
                  name: 'set-dont-show-hidden',
                  text: t("Don't show hidden tags"),
                  icon: SvgViewHide,
                }
              : {
                  name: 'set-show-hidden',
                  text: t('Show hidden tags'),
                  icon: SvgViewShow,
                },
          ]}
          onMenuSelect={name => {
            switch (name) {
              case 'set-dont-show-hidden':
                setShowHidden('false');
                break;
              case 'set-show-hidden':
                setShowHidden('true');
                break;
              default:
                console.error('Unhandled menu option', name);
            }
          }}
        />
      </Popover>
    </View>
  );
}
