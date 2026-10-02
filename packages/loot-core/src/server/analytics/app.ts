import { createApp } from '#server/app';
import * as db from '#server/db';

export type AnalyticsPeriod = {
  startDate: string;
  endDate: string;
};

export type AnalyticsSummary = {
  income: number;
  expense: number;
  net: number;
};

export type AnalyticsBreakdownItem = {
  id: string | null;
  name: string;
  amount: number;
};

export type AnalyticsTrendItem = AnalyticsSummary & {
  month: string;
};

export type AnalyticsRecentTransaction = {
  id: string;
  date: string;
  amount: number;
  isSplit: boolean;
  payee: string | null;
  category: string | null;
  account: string;
};

export type AnalyticsHandlers = {
  'expense/home-summary': typeof getHomeSummary;
  'expense/category-breakdown': typeof getCategoryBreakdown;
  'expense/payee-breakdown': typeof getPayeeBreakdown;
  'expense/monthly-trend': typeof getMonthlyTrend;
  'expense/recent-transactions': typeof getRecentTransactions;
};

export const app = createApp<AnalyticsHandlers>();

app.method('expense/home-summary', getHomeSummary);
app.method('expense/category-breakdown', getCategoryBreakdown);
app.method('expense/payee-breakdown', getPayeeBreakdown);
app.method('expense/monthly-trend', getMonthlyTrend);
app.method('expense/recent-transactions', getRecentTransactions);

function validatePeriod({ startDate, endDate }: AnalyticsPeriod) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    Number.isNaN(Date.parse(`${startDate}T00:00:00Z`)) ||
    Number.isNaN(Date.parse(`${endDate}T00:00:00Z`)) ||
    startDate > endDate
  ) {
    throw new Error('Invalid analytics date range');
  }

  return {
    start: db.toDateRepr(startDate),
    end: db.toDateRepr(endDate),
  };
}

const eligibleTransactions = `
  FROM v_transactions_internal_alive t
  LEFT JOIN categories c ON c.id = t.category AND c.tombstone = 0
`;

const eligibleTransactionsWhere = `
  WHERE t.date >= ? AND t.date <= ?
    AND t.is_parent = 0
    AND t.transfer_id IS NULL
    AND IFNULL(t.starting_balance_flag, 0) = 0
`;

const incomeExpression = `
  COALESCE(SUM(
    CASE
      WHEN c.is_income = 1 OR (c.id IS NULL AND t.amount > 0)
      THEN t.amount
      ELSE 0
    END
  ), 0)
`;

const expenseExpression = `
  COALESCE(SUM(
    CASE
      WHEN c.is_income = 0 OR (c.id IS NULL AND t.amount < 0)
      THEN -t.amount
      ELSE 0
    END
  ), 0)
`;

const summaryExpressions = `${incomeExpression} AS income, ${expenseExpression} AS expense`;

async function getHomeSummary(
  period: AnalyticsPeriod,
): Promise<AnalyticsSummary> {
  const { start, end } = validatePeriod(period);
  const summary = await db.first<Pick<AnalyticsSummary, 'income' | 'expense'>>(
    `SELECT ${summaryExpressions} ${eligibleTransactions}${eligibleTransactionsWhere}`,
    [start, end],
  );
  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;

  return { income, expense, net: income - expense };
}

function getLimit(limit = 5) {
  if (!Number.isFinite(limit)) {
    return 5;
  }
  return Math.max(1, Math.min(20, Math.floor(limit)));
}

async function getCategoryBreakdown(
  input: AnalyticsPeriod & { limit?: number },
): Promise<AnalyticsBreakdownItem[]> {
  const { start, end } = validatePeriod(input);
  const limit = getLimit(input.limit);
  return db.all<AnalyticsBreakdownItem>(
    `
      SELECT
        c.id AS id,
        COALESCE(c.name, 'Uncategorized') AS name,
        SUM(-t.amount) AS amount
      ${eligibleTransactions}
      ${eligibleTransactionsWhere}
        AND (c.is_income = 0 OR (c.id IS NULL AND t.amount < 0))
      GROUP BY c.id, c.name
      ORDER BY amount DESC, name ASC
      LIMIT ?
    `,
    [start, end, limit],
  );
}

async function getPayeeBreakdown(
  input: AnalyticsPeriod & { limit?: number },
): Promise<AnalyticsBreakdownItem[]> {
  const { start, end } = validatePeriod(input);
  const limit = getLimit(input.limit);
  return db.all<AnalyticsBreakdownItem>(
    `
      SELECT
        p.id AS id,
        COALESCE(p.name, 'Unspecified') AS name,
        SUM(-t.amount) AS amount
      ${eligibleTransactions}
      LEFT JOIN payees p ON p.id = t.payee AND p.tombstone = 0
      ${eligibleTransactionsWhere}
        AND (c.is_income = 0 OR (c.id IS NULL AND t.amount < 0))
      GROUP BY p.id, p.name
      ORDER BY amount DESC, name ASC
      LIMIT ?
    `,
    [start, end, limit],
  );
}

async function getMonthlyTrend(
  period: AnalyticsPeriod,
): Promise<AnalyticsTrendItem[]> {
  const { start, end } = validatePeriod(period);
  return db.all<AnalyticsTrendItem>(
    `
      SELECT
        substr(CAST(t.date AS TEXT), 1, 4) || '-' ||
          substr(CAST(t.date AS TEXT), 5, 2) AS month,
        ${summaryExpressions},
        ${incomeExpression} - ${expenseExpression} AS net
      ${eligibleTransactions}
      ${eligibleTransactionsWhere}
      GROUP BY month
      ORDER BY month ASC
    `,
    [start, end],
  );
}

async function getRecentTransactions({ limit = 8 }: { limit?: number } = {}) {
  const safeLimit = getLimit(limit);
  const transactions = await db.all<
    Omit<AnalyticsRecentTransaction, 'date' | 'isSplit'> & {
      date: number | string;
      is_parent: number;
    }
  >(
    `
      SELECT
        t.id,
        t.date,
        t.amount,
        t.is_parent,
        p.name AS payee,
        c.name AS category,
        a.name AS account
      FROM v_transactions_internal_alive t
      JOIN accounts a ON a.id = t.account AND a.tombstone = 0
      LEFT JOIN payees p ON p.id = t.payee AND p.tombstone = 0
      LEFT JOIN categories c ON c.id = t.category AND c.tombstone = 0
      WHERE t.is_child = 0
      ORDER BY t.date DESC, t.id DESC
      LIMIT ?
    `,
    [safeLimit],
  );

  return transactions.map(({ is_parent, ...transaction }) => {
    const date = String(transaction.date).padStart(8, '0');
    return {
      ...transaction,
      date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      isSplit: is_parent === 1,
    };
  });
}
