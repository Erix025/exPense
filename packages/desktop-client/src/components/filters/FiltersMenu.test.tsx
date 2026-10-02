import type { ComponentProps } from 'react';

import { initServer } from '@actual-app/core/platform/client/connection';
import type { TagEntity } from '@actual-app/core/types/models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestQueryClient, TestProviders } from '#mocks';
import { tagQueries } from '#tags/queries';

import { FilterEditor } from './FiltersMenu';

vi.mock(
  '@actual-app/core/platform/client/connection',
  () => import('#mocks/connection'),
);

describe('FilterEditor amount sign', () => {
  const renderEditor = (
    props: Partial<ComponentProps<typeof FilterEditor>> = {},
  ) => {
    const onSave = vi.fn();
    render(
      <FilterEditor
        field="amount"
        op="gt"
        // New filters render null values as empty strings.
        value=""
        onSave={onSave}
        onClose={vi.fn()}
        {...props}
      />,
      { wrapper: TestProviders },
    );
    return { onSave };
  };

  it('submits a positive amount for a filter created without a value', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor();

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '150');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'amount', op: 'gt', value: 15000 }),
    );
  });

  it('keeps an existing negative amount negative when edited', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({ value: -15000 });

    expect(
      screen.getByRole('button', { name: 'Make positive' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'amount', op: 'gt', value: -15000 }),
    );
  });
});

describe('FilterEditor structured tag filter', () => {
  it('searches and saves selected tag IDs without hash syntax', async () => {
    const tags: TagEntity[] = [
      {
        id: 'tag-travel',
        tag: 'Travel',
        color: null,
        description: null,
        hidden: false,
      },
    ];
    initServer({ 'tags-get': async () => tags });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(tagQueries.list().queryKey, tags);
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <TestProviders queryClient={queryClient}>
        <FilterEditor
          field="notes"
          op="hasTags"
          value=""
          options={{ transactionTags: true }}
          onSave={onSave}
          onClose={vi.fn()}
        />
      </TestProviders>,
    );

    const search = screen.getByPlaceholderText('Search tags');
    await user.type(search, 'trav');
    await user.click(screen.getByRole('button', { name: 'Travel' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        field: 'notes',
        op: 'hasTags',
        value: 'tag-travel',
        options: { transactionTags: true },
      }),
    );
  });
});
