BEGIN TRANSACTION;

CREATE TABLE transaction_tags (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  tag_id TEXT,
  tombstone INTEGER DEFAULT 0
);

CREATE INDEX idx_transaction_tags_transaction
  ON transaction_tags (transaction_id, tombstone);

CREATE INDEX idx_transaction_tags_tag
  ON transaction_tags (tag_id, tombstone);

COMMIT;
