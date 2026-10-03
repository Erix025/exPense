// @ts-strict-ignore
import React from 'react';
import type {
  ComponentProps,
  ComponentType,
  CSSProperties,
  SVGProps,
} from 'react';

import { Block } from '@actual-app/components/block';
import { View } from '@actual-app/components/view';

import { accountNameStyle } from './Account';
import { ItemContent } from './ItemContent';

const fontWeight = 600;

type SecondaryItemProps = {
  title: string;
  to?: string;
  Icon?:
    | ComponentType<SVGProps<SVGElement>>
    | ComponentType<SVGProps<SVGSVGElement>>;
  style?: CSSProperties;
  onClick?: ComponentProps<typeof ItemContent>['onClick'];
  bold?: boolean;
  indent?: number;
  dataTestId?: string;
};

export function SecondaryItem({
  Icon,
  title,
  style,
  to,
  onClick,
  bold,
  indent = 0,
  dataTestId,
}: SecondaryItemProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 16,
      }}
    >
      {Icon && <Icon width={12} height={12} />}
      <Block style={{ marginLeft: Icon ? 8 : 0, color: 'inherit' }}>
        {title}
      </Block>
    </View>
  );

  return (
    <View data-testid={dataTestId} style={{ flexShrink: 0, ...style }}>
      <ItemContent
        style={{
          ...accountNameStyle,
          color: 'var(--exv-color-text)',
          borderRadius: 8,
          paddingLeft: 14 + indent,
          fontWeight: bold ? fontWeight : null,
          ':hover': { backgroundColor: 'var(--exv-color-surface)' },
        }}
        to={to}
        onClick={onClick}
        activeStyle={{
          borderLeft: '4px solid var(--exv-color-accent)',
          paddingLeft: 14 - 4 + indent,
          color: 'var(--exv-color-accent-strong)',
          fontWeight: bold ? fontWeight : null,
        }}
      >
        {content}
      </ItemContent>
    </View>
  );
}
