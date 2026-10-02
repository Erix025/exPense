import * as db from '#server/db';

import { app } from './app';

beforeEach(global.emptyDatabase());

describe('expense analytics', () => {
  it('counts transfers, opening balances, refunds, split rows and offbudget accounts correctly', async () => {
    await db.insertAccount({ id: 'wallet', name: 'Wallet' });
    await db.insertAccount({
      id: 'tracking',
      name: 'Tracking account',
      offbudget: 1,
    });
    await db.insertCategoryGroup({
      id: 'expenses',
      name: 'Expenses',
      is_income: 0,
    });
    await db.insertCategoryGroup({
      id: 'income',
      name: 'Income',
      is_income: 1,
    });
    await db.insertCategory({
      id: 'food',
      name: 'Food',
      cat_group: 'expenses',
      is_income: 0,
    });
    await db.insertCategory({
      id: 'salary',
      name: 'Salary',
      cat_group: 'income',
      is_income: 1,
    });
    await db.insertPayee({ id: 'cafe', name: 'Cafe' });
    await db.insertPayee({ id: 'employer', name: 'Employer' });

    await db.insertTransaction({
      id: 'opening',
      account: 'wallet',
      amount: 5000,
      date: '2024-01-01',
      starting_balance_flag: true,
    });
    await db.insertTransaction({
      id: 'purchase',
      account: 'wallet',
      amount: -500,
      category: 'food',
      payee: 'cafe',
      date: '2024-01-02',
    });
    await db.insertTransaction({
      id: 'refund',
      account: 'wallet',
      amount: 100,
      category: 'food',
      payee: 'cafe',
      date: '2024-01-03',
    });
    await db.insertTransaction({
      id: 'income',
      account: 'wallet',
      amount: 2000,
      category: 'salary',
      payee: 'employer',
      date: '2024-01-04',
    });
    await db.insertTransaction({
      id: 'uncategorized',
      account: 'wallet',
      amount: -50,
      date: '2024-01-05',
    });
    await db.insertTransaction({
      id: 'transfer-out',
      account: 'wallet',
      amount: -700,
      date: '2024-01-06',
      transfer_id: 'transfer-in',
    });
    await db.insertTransaction({
      id: 'transfer-in',
      account: 'tracking',
      amount: 700,
      date: '2024-01-06',
      transfer_id: 'transfer-out',
    });
    await db.insertTransaction({
      id: 'split-parent',
      account: 'wallet',
      amount: -300,
      category: 'food',
      date: '2024-01-07',
      is_parent: true,
    });
    await db.insertTransaction({
      id: 'split-child-one',
      account: 'wallet',
      amount: -200,
      category: 'food',
      date: '2024-01-07',
      is_child: true,
      parent_id: 'split-parent',
      payee: 'cafe',
    });
    await db.insertTransaction({
      id: 'split-child-two',
      account: 'wallet',
      amount: -100,
      category: 'food',
      date: '2024-01-07',
      is_child: true,
      parent_id: 'split-parent',
      payee: 'cafe',
    });
    await db.insertTransaction({
      id: 'tracking-expense',
      account: 'tracking',
      amount: -75,
      category: 'food',
      payee: 'cafe',
      date: '2024-01-08',
    });
    await db.insertTransaction({
      id: 'next-month',
      account: 'wallet',
      amount: -900,
      category: 'food',
      date: '2024-02-01',
    });

    const period = { startDate: '2024-01-01', endDate: '2024-01-31' };
    expect(await app.handlers['expense/home-summary'](period)).toEqual({
      income: 2000,
      expense: 825,
      net: 1175,
    });
    expect(await app.handlers['expense/category-breakdown'](period)).toEqual([
      { id: 'food', name: 'Food', amount: 775 },
      { id: null, name: 'Uncategorized', amount: 50 },
    ]);
    expect(await app.handlers['expense/payee-breakdown'](period)).toEqual([
      { id: 'cafe', name: 'Cafe', amount: 775 },
      { id: null, name: 'Unspecified', amount: 50 },
    ]);
    expect(await app.handlers['expense/monthly-trend'](period)).toEqual([
      { month: '2024-01', income: 2000, expense: 825, net: 1175 },
    ]);
    expect(
      await app.handlers['expense/recent-transactions']({ limit: 2 }),
    ).toEqual([
      {
        id: 'next-month',
        date: '2024-02-01',
        amount: -900,
        isSplit: false,
        payee: null,
        category: 'Food',
        account: 'Wallet',
      },
      {
        id: 'tracking-expense',
        date: '2024-01-08',
        amount: -75,
        isSplit: false,
        payee: 'Cafe',
        category: 'Food',
        account: 'Tracking account',
      },
    ]);
  });

  it('rejects invalid analytics periods', async () => {
    await expect(
      app.handlers['expense/home-summary']({
        startDate: '2024-02-01',
        endDate: '2024-01-01',
      }),
    ).rejects.toThrow('Invalid analytics date range');
  });
});
