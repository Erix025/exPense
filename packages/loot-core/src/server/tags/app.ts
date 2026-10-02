import { createApp } from '#server/app';
import * as db from '#server/db';
import { mutator } from '#server/mutators';
import { batchMessages } from '#server/sync';
import { undoable } from '#server/undo';
import type { TagEntity } from '#types/models';

import { replaceTransactionTagLinks } from './links';

export type TagsHandlers = {
  'tags-get': typeof getTags;
  'tags-create': typeof createTag;
  'tags-delete': typeof deleteTag;
  'tags-delete-all': typeof deleteAllTags;
  'tags-hide-all': typeof hideAllTags;
  'tags-unhide-all': typeof unhideAllTags;
  'tags-update': typeof updateTag;
  'tags-rename': typeof renameTag;
  'transaction-tags-get': typeof getTransactionTags;
  'transaction-tags-set': typeof setTransactionTags;
  'transaction-tags-filter': typeof filterTransactionIdsByTags;
};

export const app = createApp<TagsHandlers>();
app.method('tags-get', getTags);
app.method('tags-create', mutator(undoable(createTag)));
app.method('tags-delete', mutator(undoable(deleteTag)));
app.method('tags-delete-all', mutator(undoable(deleteAllTags)));
app.method('tags-hide-all', mutator(undoable(hideAllTags)));
app.method('tags-unhide-all', mutator(undoable(unhideAllTags)));
app.method('tags-update', mutator(undoable(updateTag)));
app.method('tags-rename', mutator(undoable(renameTag)));
app.method('transaction-tags-get', getTransactionTags);
app.method('transaction-tags-set', mutator(undoable(setTransactionTags)));
app.method('transaction-tags-filter', filterTransactionIdsByTags);

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});
async function getTags(): Promise<TagEntity[]> {
  const tags = await db.getTags();
  tags.sort((a, b) => collator.compare(a.tag, b.tag));
  return tags.map(tag => ({ ...tag, hidden: !!tag.hidden }));
}

async function createTag({
  tag,
  color = null,
  description = null,
}: Omit<TagEntity, 'id'>): Promise<TagEntity> {
  const normalizedTag = tag.trim();
  if (!normalizedTag) {
    throw new Error('Tag name is required');
  }

  const allTags = await db.getAllTags();

  const { id: tagId = null } = allTags.find(t => t.tag === normalizedTag) || {};
  if (tagId) {
    await db.updateTag({
      id: tagId,
      tag: normalizedTag,
      color,
      description,
      tombstone: 0,
    });
    return { id: tagId, tag: normalizedTag, color, description };
  }

  const id = await db.insertTag({
    tag: normalizedTag,
    color: color ? color.trim() : null,
    description,
  });

  return { id, tag: normalizedTag, color, description };
}

async function deleteTag(tag: Pick<TagEntity, 'id'>): Promise<TagEntity['id']> {
  await db.deleteTag(tag);
  return tag.id;
}

async function deleteAllTags(
  ids: Array<TagEntity['id']>,
): Promise<Array<TagEntity['id']>> {
  await batchMessages(async () => {
    for (const id of ids) {
      await db.deleteTag({ id });
    }
  });
  return ids;
}

async function hideAllTags(ids: Array<TagEntity['id']>) {
  await batchMessages(async () => {
    for (const id of ids) {
      await db.updateTag({ id, hidden: 1 });
    }
  });
  return ids;
}

async function unhideAllTags(ids: Array<TagEntity['id']>) {
  await batchMessages(async () => {
    for (const id of ids) {
      await db.updateTag({ id, hidden: 0 });
    }
  });
  return ids;
}

async function updateTag(
  tag: Partial<TagEntity> & Pick<TagEntity, 'id'>,
): Promise<Partial<TagEntity>> {
  const { hidden, ...rest } = tag;
  await db.updateTag({
    ...rest,
    ...(hidden !== undefined ? { hidden: hidden ? 1 : 0 } : {}),
  });
  return tag;
}

async function renameTag({
  id,
  tag: newTag,
}: Pick<TagEntity, 'id' | 'tag'>): Promise<TagEntity['id']> {
  const name = newTag.trim();
  if (!name) {
    throw new Error('Tag name is required');
  }

  const tags = await db.getTags();
  const allTags = await db.getAllTags();
  const existing = tags.find(t => t.id === id);
  if (!existing) {
    throw new Error('Tag not found');
  }
  if (existing.tag === name) {
    return id;
  }
  if (allTags.some(t => t.id !== id && t.tag === name)) {
    throw new Error('A tag with that name already exists');
  }

  await db.updateTag({ id, tag: name });

  return id;
}

async function getTransactionTags({
  transactionIds,
}: {
  transactionIds: string[];
}) {
  const rows = await db.getTransactionTagsForTransactions(transactionIds);
  const tagsByTransaction: Record<string, TagEntity[]> = {};

  for (const row of rows) {
    const tags = tagsByTransaction[row.transaction_id] ?? [];
    tags.push({
      id: row.tag_id,
      tag: row.tag,
      color: row.color,
      description: row.description,
      hidden: !!row.hidden,
    });
    tagsByTransaction[row.transaction_id] = tags;
  }

  return tagsByTransaction;
}

async function setTransactionTags({
  transactionId,
  tagIds,
}: {
  transactionId: string;
  tagIds: string[];
}) {
  const transaction = await db.first<{ id: string }>(
    'SELECT id FROM transactions WHERE id = ? AND tombstone = 0',
    [transactionId],
  );
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  await batchMessages(async () => {
    await replaceTransactionTagLinks(transactionId, tagIds);
  });
  return [...new Set(tagIds)];
}

async function filterTransactionIdsByTags({
  tagIds,
  matchAll,
}: {
  tagIds: string[];
  matchAll: boolean;
}) {
  return db.getTransactionIdsByTags(tagIds, matchAll);
}
