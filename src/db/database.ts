import Dexie, { type Table } from 'dexie';
import {
  Account,
  Budget,
  RecurringRule,
  SavingsGoal,
  SmartNotification,
  Subscription,
  Transaction,
  UserSettings,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECURRING_RULES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_SETTINGS,
  DEMO_ACCOUNTS,
  DEMO_BUDGETS,
  DEMO_GOALS,
  DEMO_NOTIFICATIONS,
  DEMO_TRANSACTIONS,
} from './seedData';

// -------------------------------------------------------------
// Multi-Vault Metadata & Registry (Local Storage Isolated)
// -------------------------------------------------------------
export interface VaultMeta {
  id: string;
  pin: string;
  userName: string;
  createdAt: string;
  lastAccessedAt?: string;
}

const VAULT_STORAGE_KEY = 'finance_tracker_vaults';
const ACTIVE_VAULT_KEY = 'finance_tracker_active_vault';

export function getRegisteredVaults(): VaultMeta[] {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading vaults from localStorage:', e);
  }

  // Return empty list on fresh browsers so new visitors can set up their own personal PIN
  return [];
}

export function hasRegisteredVaults(): boolean {
  return getRegisteredVaults().length > 0;
}

export function findVaultByPin(pin: string): VaultMeta | undefined {
  const vaults = getRegisteredVaults();
  const matched = vaults.find((v) => v.pin === pin);
  if (matched) return matched;

  // If entering owner's PIN 0000, seamlessly register or link owner vault
  if (pin === '0000') {
    return registerVault('0000', 'Owner');
  }

  return undefined;
}

export function registerVault(pin: string, userName?: string): VaultMeta {
  const vaults = getRegisteredVaults();
  const existing = vaults.find((v) => v.pin === pin);
  if (existing) {
    return existing;
  }

  const id = `vault_${pin}`;
  const newVault: VaultMeta = {
    id,
    pin,
    userName: userName?.trim() || (pin === '0000' ? 'Owner' : `User ${pin}`),
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  };

  vaults.push(newVault);
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaults));
  return newVault;
}

export function updateVaultMeta(vaultId: string, updates: Partial<VaultMeta>): void {
  const vaults = getRegisteredVaults();
  const idx = vaults.findIndex((v) => v.id === vaultId);
  if (idx !== -1) {
    vaults[idx] = { ...vaults[idx], ...updates };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaults));
  }
}

// -------------------------------------------------------------
// Multi-Vault Dexie Database
// -------------------------------------------------------------
export class FinanceTrackerDatabase extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  recurringRules!: Table<RecurringRule, string>;
  subscriptions!: Table<Subscription, string>;
  notifications!: Table<SmartNotification, string>;
  userSettings!: Table<UserSettings, string>;

  vaultId: string;

  constructor(vaultId = 'vault_0000') {
    super(`FinanceVault_${vaultId}`);
    this.vaultId = vaultId;
    this.version(1).stores({
      accounts: 'id, name, type, currency, includeInNetWorth, isArchived',
      transactions: 'id, type, amount, currency, accountId, toAccountId, category, date, isRecurring, createdAt',
      budgets: 'id, name, type, category, startDate, endDate',
      savingsGoals: 'id, name, priority, status, linkedAccountId',
      recurringRules: 'id, name, type, frequency, nextOccurrence, status',
      subscriptions: 'id, name, renewalDate, isActive, accountId',
      notifications: 'id, type, isRead, createdAt',
      userSettings: 'id',
    });
  }

  async initializeSeedData() {
    const accountsCount = await this.accounts.count();
    if (accountsCount === 0) {
      let migrated = false;

      // For owner's vault (vault_0000), migrate from previous unpartitioned database if available
      if (this.vaultId === 'vault_0000') {
        try {
          const legacyExists = await Dexie.exists('FinanceTrackerDB_v5');
          if (legacyExists) {
            const legacyDb = new Dexie('FinanceTrackerDB_v5');
            legacyDb.version(1).stores({
              accounts: 'id, name, type, currency, includeInNetWorth, isArchived',
              transactions: 'id, type, amount, currency, accountId, toAccountId, category, date, isRecurring, createdAt',
              budgets: 'id, name, type, category, startDate, endDate',
              savingsGoals: 'id, name, priority, status, linkedAccountId',
              recurringRules: 'id, name, type, frequency, nextOccurrence, status',
              subscriptions: 'id, name, renewalDate, isActive, accountId',
              notifications: 'id, type, isRead, createdAt',
              userSettings: 'id',
            });
            const [legAccs, legTxs, legBudgets, legGoals, legSubs, legRules, legNotifs, legSettings] = await Promise.all([
              legacyDb.table<Account, string>('accounts').toArray(),
              legacyDb.table<Transaction, string>('transactions').toArray(),
              legacyDb.table<Budget, string>('budgets').toArray(),
              legacyDb.table<SavingsGoal, string>('savingsGoals').toArray(),
              legacyDb.table<Subscription, string>('subscriptions').toArray(),
              legacyDb.table<RecurringRule, string>('recurringRules').toArray(),
              legacyDb.table<SmartNotification, string>('notifications').toArray(),
              legacyDb.table<UserSettings, string>('userSettings').toArray(),
            ]);
            legacyDb.close();

            if (legAccs.length > 0) {
              await this.accounts.bulkAdd(legAccs);
              if (legTxs.length > 0) await this.transactions.bulkAdd(legTxs);
              if (legBudgets.length > 0) await this.budgets.bulkAdd(legBudgets);
              if (legGoals.length > 0) await this.savingsGoals.bulkAdd(legGoals);
              if (legSubs.length > 0) await this.subscriptions.bulkAdd(legSubs);
              if (legRules.length > 0) await this.recurringRules.bulkAdd(legRules);
              if (legNotifs.length > 0) await this.notifications.bulkAdd(legNotifs);
              if (legSettings.length > 0) {
                await this.userSettings.bulkAdd(
                  legSettings.map((s) => ({ ...s, pinCode: '0000', isOnboarded: true, isAppLocked: true }))
                );
              }
              migrated = true;
            }
          }
        } catch (migErr) {
          console.warn('Legacy DB migration skipped:', migErr);
        }
      }

      if (!migrated) {
        await this.accounts.bulkAdd(INITIAL_ACCOUNTS);
        if (this.vaultId === 'vault_0000' && INITIAL_TRANSACTIONS.length > 0) {
          await this.transactions.bulkAdd(INITIAL_TRANSACTIONS);
        }
        await this.budgets.bulkAdd(INITIAL_BUDGETS);
        await this.savingsGoals.bulkAdd(INITIAL_GOALS);
        await this.subscriptions.bulkAdd(INITIAL_SUBSCRIPTIONS);
        await this.recurringRules.bulkAdd(INITIAL_RECURRING_RULES);
        await this.notifications.bulkAdd(INITIAL_NOTIFICATIONS);

        const vaults = getRegisteredVaults();
        const meta = vaults.find((v) => v.id === this.vaultId);
        const pin = meta?.pin || (this.vaultId === 'vault_0000' ? '0000' : '');
        const userName = meta?.userName || (this.vaultId === 'vault_0000' ? 'Owner' : 'User');

        await this.userSettings.add({
          ...INITIAL_USER_SETTINGS,
          pinCode: pin,
          userName: userName,
          isOnboarded: true,
          isAppLocked: true,
        });
      }
    }
  }

  async resetAllNumbersToZero() {
    await this.transaction('rw', [
      this.accounts,
      this.transactions,
      this.budgets,
      this.savingsGoals,
      this.notifications,
    ], async () => {
      const accs = await this.accounts.toArray();
      for (const a of accs) {
        await this.accounts.update(a.id, { openingBalance: 0, currentBalance: 0 });
      }
      await this.transactions.clear();
      const bdgs = await this.budgets.toArray();
      for (const b of bdgs) {
        await this.budgets.update(b.id, { spent: 0 });
      }
      const gls = await this.savingsGoals.toArray();
      for (const g of gls) {
        await this.savingsGoals.update(g.id, { currentAmount: 0 });
      }
      await this.notifications.clear();
      await this.notifications.add({
        id: `notif-${Date.now()}`,
        type: 'insight',
        title: 'Numbers Reset',
        message: 'All account balances and transactions have been reset to ₹0 in this vault.',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionScreen: 'dashboard',
      });
    });
  }

  async resetToDemoData() {
    await this.transaction('rw', [
      this.accounts,
      this.transactions,
      this.budgets,
      this.savingsGoals,
      this.subscriptions,
      this.recurringRules,
      this.notifications,
      this.userSettings,
    ], async () => {
      await this.accounts.clear();
      await this.transactions.clear();
      await this.budgets.clear();
      await this.savingsGoals.clear();
      await this.subscriptions.clear();
      await this.recurringRules.clear();
      await this.notifications.clear();
      await this.userSettings.clear();

      await this.accounts.bulkAdd(DEMO_ACCOUNTS);
      await this.transactions.bulkAdd(DEMO_TRANSACTIONS);
      await this.budgets.bulkAdd(DEMO_BUDGETS);
      await this.savingsGoals.bulkAdd(DEMO_GOALS);
      await this.subscriptions.bulkAdd(INITIAL_SUBSCRIPTIONS);
      await this.recurringRules.bulkAdd(INITIAL_RECURRING_RULES);
      await this.notifications.bulkAdd(DEMO_NOTIFICATIONS);

      const vaults = getRegisteredVaults();
      const meta = vaults.find((v) => v.id === this.vaultId);
      const pin = meta?.pin || (this.vaultId === 'vault_0000' ? '0000' : '');
      const userName = meta?.userName || (this.vaultId === 'vault_0000' ? 'Owner' : 'User');

      await this.userSettings.add({
        ...INITIAL_USER_SETTINGS,
        pinCode: pin,
        userName: userName,
        isOnboarded: true,
        isAppLocked: true,
      });
    });
  }
}

// -------------------------------------------------------------
// Dynamic Active Vault DB Router & Cache
// -------------------------------------------------------------
const dbCache = new Map<string, FinanceTrackerDatabase>();

export function getVaultDb(vaultId: string): FinanceTrackerDatabase {
  if (!dbCache.has(vaultId)) {
    dbCache.set(vaultId, new FinanceTrackerDatabase(vaultId));
  }
  return dbCache.get(vaultId)!;
}

let activeVaultId = localStorage.getItem(ACTIVE_VAULT_KEY) || 'vault_0000';
let activeDb = getVaultDb(activeVaultId);

export function getActiveVaultId(): string {
  return activeVaultId;
}

export function setActiveVault(vaultId: string): FinanceTrackerDatabase {
  activeVaultId = vaultId;
  localStorage.setItem(ACTIVE_VAULT_KEY, vaultId);
  activeDb = getVaultDb(vaultId);
  updateVaultMeta(vaultId, { lastAccessedAt: new Date().toISOString() });
  return activeDb;
}

// Transparent Proxy that forwards all Dexie properties and methods to currently active vault
export const db: FinanceTrackerDatabase = new Proxy({} as FinanceTrackerDatabase, {
  get(_target, prop) {
    const current = activeDb as any;
    const val = current[prop];
    if (typeof val === 'function') {
      return val.bind(current);
    }
    return val;
  },
  set(_target, prop, value) {
    (activeDb as any)[prop] = value;
    return true;
  },
});

// -------------------------------------------------------------
// Accounting & Balance Update Helpers
// -------------------------------------------------------------
export async function recordTransaction(tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }): Promise<Transaction> {
  const transactionId = tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fullTx: Transaction = {
    ...tx,
    id: transactionId,
    createdAt: new Date().toISOString(),
  };

  await db.transaction('rw', [db.accounts, db.transactions, db.budgets], async () => {
    // 1. Save transaction
    await db.transactions.add(fullTx);

    // 2. Adjust Source Account Balance
    const srcAccount = await db.accounts.get(fullTx.accountId);
    if (srcAccount) {
      let newBalance = srcAccount.currentBalance;
      if (fullTx.type === 'expense') {
        if (srcAccount.type === 'credit_card') {
          newBalance += fullTx.amount; // Outstanding debt goes UP
        } else {
          newBalance -= fullTx.amount;
        }
      } else if (fullTx.type === 'income') {
        newBalance += fullTx.amount;
      } else if (fullTx.type === 'transfer' || fullTx.type === 'credit_card_payment') {
        newBalance -= fullTx.amount;
      }
      await db.accounts.update(srcAccount.id, {
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Adjust Target Account Balance (if transfer or CC payment)
    if (fullTx.toAccountId) {
      const destAccount = await db.accounts.get(fullTx.toAccountId);
      if (destAccount) {
        let newBalance = destAccount.currentBalance;
        if (fullTx.type === 'credit_card_payment') {
          newBalance = Math.max(0, newBalance - fullTx.amount); // Outstanding debt goes DOWN
        } else if (fullTx.type === 'transfer') {
          if (destAccount.type === 'credit_card') {
            newBalance = Math.max(0, newBalance - fullTx.amount);
          } else {
            newBalance += fullTx.amount;
          }
        }
        await db.accounts.update(destAccount.id, {
          currentBalance: newBalance,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 4. Update matching budget spend if expense
    if (fullTx.type === 'expense' && fullTx.category) {
      const activeBudgets = await db.budgets
        .filter((b) => b.category === fullTx.category || b.category === 'All')
        .toArray();
      for (const budget of activeBudgets) {
        if (fullTx.date >= budget.startDate && fullTx.date <= budget.endDate) {
          await db.budgets.update(budget.id, {
            spent: budget.spent + fullTx.amount,
          });
        }
      }
    }
  });

  return fullTx;
}

export async function deleteTransaction(txId: string): Promise<void> {
  await db.transaction('rw', [db.accounts, db.transactions, db.budgets], async () => {
    const tx = await db.transactions.get(txId);
    if (!tx) return;

    // Reverse account changes
    const srcAccount = await db.accounts.get(tx.accountId);
    if (srcAccount) {
      let reversedBalance = srcAccount.currentBalance;
      if (tx.type === 'expense') {
        if (srcAccount.type === 'credit_card') {
          reversedBalance -= tx.amount;
        } else {
          reversedBalance += tx.amount;
        }
      } else if (tx.type === 'income') {
        reversedBalance -= tx.amount;
      } else if (tx.type === 'transfer' || tx.type === 'credit_card_payment') {
        reversedBalance += tx.amount;
      }
      await db.accounts.update(srcAccount.id, {
        currentBalance: reversedBalance,
        updatedAt: new Date().toISOString(),
      });
    }

    if (tx.toAccountId) {
      const destAccount = await db.accounts.get(tx.toAccountId);
      if (destAccount) {
        let reversedBalance = destAccount.currentBalance;
        if (tx.type === 'credit_card_payment') {
          reversedBalance += tx.amount;
        } else if (tx.type === 'transfer') {
          reversedBalance -= tx.amount;
        }
        await db.accounts.update(destAccount.id, {
          currentBalance: reversedBalance,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Reverse budget spend
    if (tx.type === 'expense' && tx.category) {
      const activeBudgets = await db.budgets
        .filter((b) => b.category === tx.category || b.category === 'All')
        .toArray();
      for (const budget of activeBudgets) {
        if (tx.date >= budget.startDate && tx.date <= budget.endDate) {
          await db.budgets.update(budget.id, {
            spent: Math.max(0, budget.spent - tx.amount),
          });
        }
      }
    }

    await db.transactions.delete(txId);
  });
}

// Account reconciliation helper
export async function reconcileAccount(accountId: string, actualBalance: number, notes?: string): Promise<void> {
  await db.transaction('rw', [db.accounts, db.transactions], async () => {
    const account = await db.accounts.get(accountId);
    if (!account) return;

    const diff = actualBalance - account.currentBalance;
    if (Math.abs(diff) > 0.01) {
      const isPositive = diff > 0;
      await db.transactions.add({
        id: `tx-reconcile-${Date.now()}`,
        type: isPositive ? 'income' : 'expense',
        amount: Math.abs(diff),
        currency: account.currency,
        accountId: account.id,
        category: 'Reconciliation Adjustment',
        date: new Date().toISOString().slice(0, 10),
        notes: `Balance reconciliation adjustment: ${notes || 'Manual correction'} (Diff: ${diff >= 0 ? '+' : ''}${diff})`,
        tags: ['Reconciliation'],
        createdAt: new Date().toISOString(),
      });
    }

    await db.accounts.update(accountId, {
      currentBalance: actualBalance,
      lastReconciledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}
