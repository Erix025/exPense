import React, { Fragment } from 'react';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';

import { DesktopLinkedNotes } from './DesktopLinkedNotes';
import { parseNotes } from './linkParser';
import { MobileLinkedNotes } from './MobileLinkedNotes';

type NotesTagFormatterProps = {
  notes: string;
};

export function NotesTagFormatter({ notes }: NotesTagFormatterProps) {
  const { isNarrowWidth } = useResponsive();

  const segments = parseNotes(notes);

  return (
    <>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const nextSegment = segments[index + 1];
        // Add separator (space) after segment if next segment doesn't start with whitespace
        const separator =
          isLast ||
          (nextSegment?.type === 'text' && /^\s/.test(nextSegment.content))
            ? ''
            : ' ';

        switch (segment.type) {
          case 'text':
            return <Fragment key={index}>{segment.content}</Fragment>;

          case 'link':
            if (isNarrowWidth) {
              return (
                <MobileLinkedNotes
                  key={index}
                  displayText={segment.displayText}
                  url={segment.url}
                  separator={separator}
                  isFilePath={segment.isFilePath}
                />
              );
            }
            return (
              <DesktopLinkedNotes
                key={index}
                displayText={segment.displayText}
                url={segment.url}
                separator={separator}
                isFilePath={segment.isFilePath}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}
