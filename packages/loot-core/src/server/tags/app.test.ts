import * as db from '#server/db';
import { loadMappings } from '#server/db/mappings';
import { app } from '#server/tags/app';

beforeEach(async () => {
  await global.emptyDatabase()();
  await loadMappings();
});

async function insertTransaction(notes: string) {
  return await db.insertTransaction({
    account: 'account-1',
    date: '2024-01-01',
    amount: -1000,
    notes,
  });
}

async function getNotes(id: string) {
  const transaction = await db.first<{ notes: string }>(
    'SELECT notes FROM transactions WHERE id = ?',
    [id],
  );
  return transaction?.notes;
}

describe('tags app', () => {
  describe('tags-rename', () => {
    beforeEach(async () => {
      await db.insertAccount({ id: 'account-1', name: 'Account 1' });
    });

    it('renames a standalone tag without changing transaction notes', async () => {
      const id = await db.insertTag({
        tag: 'Reimbursable',
        color: null,
        description: null,
      });
      const matching = await insertTransaction('Lunch #Reimbursable');
      await app.handlers['transaction-tags-set']({
        transactionId: matching,
        tagIds: [id],
      });

      await app.handlers['tags-rename']({ id, tag: '  ToBeReimbursed  ' });

      expect(await db.getTags()).toEqual([
        expect.objectContaining({ id, tag: 'ToBeReimbursed' }),
      ]);
      expect(await getNotes(matching)).toBe('Lunch #Reimbursable');
      expect(
        await app.handlers['transaction-tags-get']({
          transactionIds: [matching],
        }),
      ).toEqual({
        [matching]: [expect.objectContaining({ id, tag: 'ToBeReimbursed' })],
      });
    });

    it('rejects an invalid name', async () => {
      const id = await db.insertTag({
        tag: 'Food',
        color: null,
        description: null,
      });

      await expect(
        app.handlers['tags-rename']({ id, tag: '   ' }),
      ).rejects.toThrow('Tag name is required');
    });

    it('rejects renaming onto an existing tag', async () => {
      const id = await db.insertTag({
        tag: 'Food',
        color: null,
        description: null,
      });
      await db.insertTag({
        tag: 'Groceries',
        color: null,
        description: null,
      });

      await expect(
        app.handlers['tags-rename']({ id, tag: 'Groceries' }),
      ).rejects.toThrow('A tag with that name already exists');
    });

    it('rejects renaming onto a deleted tag', async () => {
      const id = await db.insertTag({
        tag: 'Food',
        color: null,
        description: null,
      });
      const deletedId = await db.insertTag({
        tag: 'Groceries',
        color: null,
        description: null,
      });
      await app.handlers['tags-delete']({ id: deletedId });

      await expect(
        app.handlers['tags-rename']({ id, tag: 'Groceries' }),
      ).rejects.toThrow('A tag with that name already exists');
    });

    it('rejects an unknown tag', async () => {
      await expect(
        app.handlers['tags-rename']({ id: 'missing', tag: 'Food' }),
      ).rejects.toThrow('Tag not found');
    });
  });

  describe('transaction tags', () => {
    beforeEach(async () => {
      await db.insertAccount({ id: 'account-1', name: 'Account 1' });
    });

    it('sets, replaces, and restores links without duplicates', async () => {
      const lunch = await db.insertTag({
        tag: 'Lunch',
        color: null,
        description: null,
      });
      const travel = await db.insertTag({
        tag: 'Travel 2026',
        color: null,
        description: null,
      });
      const transactionId = await insertTransaction('Cafe');

      await app.handlers['transaction-tags-set']({
        transactionId,
        tagIds: [lunch, travel, lunch],
      });
      await app.handlers['transaction-tags-set']({
        transactionId,
        tagIds: [travel],
      });

      expect(
        await app.handlers['transaction-tags-get']({
          transactionIds: [transactionId],
        }),
      ).toEqual({
        [transactionId]: [expect.objectContaining({ id: travel })],
      });

      const removedLinkId = `${transactionId}:${lunch}`;
      expect(
        await db.first<{ tombstone: number }>(
          'SELECT tombstone FROM transaction_tags WHERE id = ?',
          [removedLinkId],
        ),
      ).toEqual({ tombstone: 1 });

      await app.handlers['transaction-tags-set']({
        transactionId,
        tagIds: [lunch, travel],
      });
      expect(
        await db.all('SELECT id FROM transaction_tags WHERE tombstone = 0'),
      ).toHaveLength(2);
    });

    it('rejects missing transactions and tags', async () => {
      const tagId = await db.insertTag({
        tag: 'Food',
        color: null,
        description: null,
      });
      const transactionId = await insertTransaction('Lunch');

      await expect(
        app.handlers['transaction-tags-set']({
          transactionId: 'missing-transaction',
          tagIds: [tagId],
        }),
      ).rejects.toThrow('Transaction not found');
      await expect(
        app.handlers['transaction-tags-set']({
          transactionId,
          tagIds: ['missing-tag'],
        }),
      ).rejects.toThrow('One or more tags do not exist');
    });

    it('returns no rows for an empty transaction id list', async () => {
      expect(
        await app.handlers['transaction-tags-get']({ transactionIds: [] }),
      ).toEqual({});
    });
  });
});
