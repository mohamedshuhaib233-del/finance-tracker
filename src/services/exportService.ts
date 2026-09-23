import { Account, Transaction } from '../types';
import { db } from '../db/database';

export class ExportService {
  /**
   * Export transactions to CSV
   */
  static exportTransactionsToCSV(
    transactions: Transaction[],
    accounts: Account[],
    filters?: { startDate?: string; endDate?: string; accountId?: string; category?: string }
  ) {
    let list = [...transactions];

    if (filters?.startDate) {
      list = list.filter((t) => t.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((t) => t.date <= filters.endDate!);
    }
    if (filters?.accountId && filters.accountId !== 'all') {
      list = list.filter((t) => t.accountId === filters.accountId || t.toAccountId === filters.accountId);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((t) => t.category === filters.category);
    }

    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Account', 'Transfer Destination', 'Category', 'Notes', 'Tags'];
    const rows = list.map((tx) => [
      `"${tx.date}"`,
      `"${tx.type}"`,
      tx.amount,
      `"${tx.currency}"`,
      `"${accountMap.get(tx.accountId) || tx.accountId}"`,
      tx.toAccountId ? `"${accountMap.get(tx.toAccountId) || tx.toAccountId}"` : '""',
      `"${tx.category || ''}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
      `"${(tx.tags || []).join(';')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Finance_Tracker_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Trigger browser print for printable luxury financial statement PDF
   */
  static printFinancialStatement() {
    window.print();
  }

  /**
   * Full database backup to JSON
   */
  static async exportFullBackupJSON(): Promise<void> {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      budgets: await db.budgets.toArray(),
      savingsGoals: await db.savingsGoals.toArray(),
      subscriptions: await db.subscriptions.toArray(),
      recurringRules: await db.recurringRules.toArray(),
      notifications: await db.notifications.toArray(),
      userSettings: await db.userSettings.toArray(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finance_Tracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Import database backup from JSON
   */
  static async importBackupJSON(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      await db.transaction(
        'rw',
        [
          db.accounts,
          db.transactions,
          db.budgets,
          db.savingsGoals,
          db.subscriptions,
          db.recurringRules,
          db.notifications,
          db.userSettings,
        ],
        async () => {
          if (data.accounts) {
            await db.accounts.clear();
            await db.accounts.bulkAdd(data.accounts);
          }
          if (data.transactions) {
            await db.transactions.clear();
            await db.transactions.bulkAdd(data.transactions);
          }
          if (data.budgets) {
            await db.budgets.clear();
            await db.budgets.bulkAdd(data.budgets);
          }
          if (data.savingsGoals) {
            await db.savingsGoals.clear();
            await db.savingsGoals.bulkAdd(data.savingsGoals);
          }
          if (data.subscriptions) {
            await db.subscriptions.clear();
            await db.subscriptions.bulkAdd(data.subscriptions);
          }
          if (data.recurringRules) {
            await db.recurringRules.clear();
            await db.recurringRules.bulkAdd(data.recurringRules);
          }
          if (data.notifications) {
            await db.notifications.clear();
            await db.notifications.bulkAdd(data.notifications);
          }
          if (data.userSettings && data.userSettings.length > 0) {
            await db.userSettings.clear();
            await db.userSettings.bulkAdd(data.userSettings);
          }
        }
      );
      return true;
    } catch (err) {
      console.error('Backup restoration failed:', err);
      return false;
    }
  }
}
