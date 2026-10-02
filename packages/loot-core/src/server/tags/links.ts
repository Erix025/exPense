import * as db from '#server/db';

function transactionTagRelationId(transactionId: string, tagId: string) {
  return `${transactionId}:${tagId}`;
}

export async function replaceTransactionTagLinks(
  transactionId: string,
  tagIds: string[],
) {
  const uniqueTagIds = [...new Set(tagIds)];
  const allTags = await db.getAllTags();
  const availableTagIds = new Set(
    allTags.filter(tag => tag.tombstone === 0).map(tag => tag.id),
  );
  if (uniqueTagIds.some(tagId => !availableTagIds.has(tagId))) {
    throw new Error('One or more tags do not exist');
  }

  const links = await db.getTransactionTagLinks(transactionId);
  const linksByTagId = new Map(links.map(link => [link.tag_id, link]));
  const desiredTagIds = new Set(uniqueTagIds);

  for (const link of links) {
    if (link.tombstone === 0 && !desiredTagIds.has(link.tag_id)) {
      await db.deleteTransactionTag({ id: link.id });
    }
  }

  for (const tagId of uniqueTagIds) {
    const existingLink = linksByTagId.get(tagId);
    if (!existingLink) {
      await db.insertTransactionTag({
        id: transactionTagRelationId(transactionId, tagId),
        transaction_id: transactionId,
        tag_id: tagId,
        tombstone: 0,
      });
    } else if (existingLink.tombstone === 1) {
      await db.updateTransactionTag({ id: existingLink.id, tombstone: 0 });
    }
  }

  return uniqueTagIds;
}
