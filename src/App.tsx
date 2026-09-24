import React, { useState, useEffect, useCallback } from 'react';
import { db, recordTransaction, deleteTransaction, reconcileAccount, setActiveVault, getActiveVaultId, updateVaultMeta } from './db/database';
import {
  Account,
  Budget,
  CurrencyCode,
  ParsedVoiceTransaction,
  RecurringRule,
  SavingsGoal,
  SmartNotification,
  Subscription,
  Transaction,
  UserSettings,
} from './types';
import { SUPPORTED_CURRENCIES } from './db/seedData';
import { AiCoachEngine } from './services/aiCoach';

// Layout
import { AppShell } from './components/layout/AppShell';

// Screens & Modals
import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { AppLockScreen } from './components/screens/AppLockScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { TransactionsScreen } from './components/screens/TransactionsScreen';
import { TransactionDetailModal } from './components/screens/TransactionDetailModal';
import { AddTransactionModal } from './components/screens/AddTransactionModal';
import { VoiceEntryModal } from './components/screens/VoiceEntryModal';
import { AccountsScreen } from './components/screens/AccountsScreen';
import { AccountDetailModal } from './components/screens/AccountDetailModal';
import { TransferMoneyModal } from './components/screens/TransferMoneyModal';
import { ReconcileModal } from './components/screens/ReconcileModal';
import { BudgetsScreen } from './components/screens/BudgetsScreen';
import { BudgetDetailModal } from './components/screens/BudgetDetailModal';
import { GoalsScreen } from './components/screens/GoalsScreen';
import { GoalDetailModal } from './components/screens/GoalDetailModal';
import { AiCoachScreen } from './components/screens/AiCoachScreen';
import { FinancialHealthScreen } from './components/screens/FinancialHealthScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { BillsScreen } from './components/screens/BillsScreen';
import { RecurringScreen } from './components/screens/RecurringScreen';
import { SubscriptionsScreen } from './components/screens/SubscriptionsScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { BackupSyncScreen } from './components/screens/BackupSyncScreen';
import { CurrencyScreen } from './components/screens/CurrencyScreen';
import { ExportReportsModal } from './components/screens/ExportReportsModal';
import { MoreHubScreen } from './components/screens/MoreHubScreen';

export function App() {
  // Application Life-Cycle States
  const [showSplash, setShowSplash] = useState(true);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Active Screen
  const [activeScreen, setActiveScreen] = useState('dashboard');

  // Database Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Modals States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxType, setAddTxType] = useState<'expense' | 'income'>('expense');
  const [isVoiceEntryOpen, setIsVoiceEntryOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [reconcileTargetAccount, setReconcileTargetAccount] = useState<Account | null>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch all state from Dexie IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      await db.initializeSeedData();
      const [accs, txs, bdgs, gls, subs, recs, notifs, sets] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.toArray(),
        db.budgets.toArray(),
        db.savingsGoals.toArray(),
        db.subscriptions.toArray(),
        db.recurringRules.toArray(),
        db.notifications.toArray(),
        db.userSettings.toArray(),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setBudgets(bdgs);
      setGoals(gls);
      setSubscriptions(subs);
      setRecurringRules(recs);
      setNotifications(notifs);

      if (sets && sets.length > 0) {
        setUserSettings(sets[0]);
        setIsOnboarded(Boolean(sets[0].isOnboarded));
      } else {
        setIsOnboarded(false);
      }
    } catch (e) {
      console.error('Dexie database load error:', e);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Auto-lock when resuming app / switching tabs if requirePinOnResume is enabled
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && userSettings?.requirePinOnResume && userSettings?.isAppLocked !== false) {
        setIsAppLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userSettings?.requirePinOnResume, userSettings?.isAppLocked]);

  // Currency helper
  const currentBaseCurrency: CurrencyCode = userSettings?.baseCurrency || 'INR';
  const currencyConfig = SUPPORTED_CURRENCIES.find((c) => c.code === currentBaseCurrency) || SUPPORTED_CURRENCIES[0];
  const currencySymbol = currencyConfig.symbol;

  // Compute 9 measurable indicators
  const healthIndicators = AiCoachEngine.computeFinancialHealth(
    accounts,
    transactions,
    budgets,
    subscriptions,
    recurringRules,
    userSettings?.emergencyFundMonthsTarget || 6
  );

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------

  const handleQuickAction = (action: 'add_expense' | 'add_income' | 'transfer' | 'voice_entry' | 'ask_ai') => {
    switch (action) {
      case 'add_expense':
        setAddTxType('expense');
        setIsAddTxOpen(true);
        break;
      case 'add_income':
        setAddTxType('income');
        setIsAddTxOpen(true);
        break;
      case 'transfer':
        setIsTransferOpen(true);
        break;
      case 'voice_entry':
        setIsVoiceEntryOpen(true);
        break;
      case 'ask_ai':
        setActiveScreen('ai_coach');
        break;
    }
  };

  const handleSaveTransaction = async (txData: any) => {
    await recordTransaction(txData);
    await refreshAllData();
  };

  const handleVoiceConfirmSave = async (parsed: ParsedVoiceTransaction) => {
    const targetAccount = accounts.find((a) => a.name.toLowerCase().includes(parsed.account.toLowerCase())) || accounts[0];
    await recordTransaction({
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      accountId: targetAccount.id,
      category: parsed.category,
      notes: parsed.description,
      date: parsed.date,
      tags: ['VoiceEntry'],
    });
    await refreshAllData();
  };

  const handleConfirmTransfer = async (transferData: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
    date: string;
  }) => {
    const destAccount = accounts.find((a) => a.id === transferData.toAccountId);
    const isCcSettlement = destAccount?.type === 'credit_card';

    await recordTransaction({
      type: isCcSettlement ? 'credit_card_payment' : 'transfer',
      amount: transferData.amount,
      currency: currentBaseCurrency,
      accountId: transferData.fromAccountId,
      toAccountId: transferData.toAccountId,
      category: isCcSettlement ? 'Credit Card Settlement' : 'Self Transfer',
      notes: transferData.notes,
      date: transferData.date,
      tags: ['Transfer'],
    });
    await refreshAllData();
  };

  const handleConfirmReconcile = async (accountId: string, actualBalance: number, notes?: string) => {
    await reconcileAccount(accountId, actualBalance, notes);
    await refreshAllData();
  };

  const handleDeleteTransaction = async (txId: string) => {
    await deleteTransaction(txId);
    await refreshAllData();
  };

  const handleUpdateGoalAmount = async (goalId: string, delta: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const updatedCurrent = Math.max(0, goal.currentAmount + delta);
    await db.savingsGoals.update(goalId, {
      currentAmount: updatedCurrent,
      status: updatedCurrent >= goal.targetAmount ? 'completed' : 'active',
    });
    await refreshAllData();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await db.savingsGoals.delete(goalId);
    await refreshAllData();
  };

  const handleDeleteBudget = async (budgetId: string) => {
    await db.budgets.delete(budgetId);
    await refreshAllData();
  };

  const handleToggleAutoCreate = async (ruleId: string, current: boolean) => {
    await db.recurringRules.update(ruleId, { autoCreate: !current });
    await refreshAllData();
  };

  const handleDeleteRecurringRule = async (ruleId: string) => {
    await db.recurringRules.delete(ruleId);
    await refreshAllData();
  };

  const handleToggleSubscription = async (subId: string, currentActive: boolean) => {
    await db.subscriptions.update(subId, { isActive: !currentActive });
    await refreshAllData();
  };

  const handleMarkBillPaid = async (bill: RecurringRule) => {
    await recordTransaction({
      type: 'expense',
      amount: bill.amount,
      currency: currentBaseCurrency,
      accountId: bill.accountId,
      category: bill.category,
      notes: `Bill payment for ${bill.name}`,
      date: new Date().toISOString().slice(0, 10),
      tags: ['BillPaid'],
    });
    await refreshAllData();
  };

  const handleMarkAllNotifsRead = async () => {
    const allNotifs = await db.notifications.toArray();
    for (const n of allNotifs) {
      await db.notifications.update(n.id, { isRead: true });
    }
    await refreshAllData();
  };

  const handleClearNotification = async (id: string) => {
    await db.notifications.delete(id);
    await refreshAllData();
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    if (userSettings) {
      await db.userSettings.update(userSettings.id, newSettings);
      if (newSettings.pinCode) {
        updateVaultMeta(getActiveVaultId(), { pin: newSettings.pinCode });
      }
      if (newSettings.userName) {
        updateVaultMeta(getActiveVaultId(), { userName: newSettings.userName });
      }
      await refreshAllData();
    }
  };

  const handleSelectCurrency = async (code: CurrencyCode) => {
    await handleUpdateSettings({ baseCurrency: code });
  };

  const handleResetNumbersToZero = async () => {
    await db.resetAllNumbersToZero();
    await refreshAllData();
  };

  const handleResetDemoData = async () => {
    await db.resetToDemoData();
    await refreshAllData();
  };

  const handleCompleteOnboarding = async (settings: {
    baseCurrency: CurrencyCode;
    pin: string;
    userName: string;
    enableBiometrics?: boolean;
  }) => {
    try {
      if (userSettings) {
        await db.userSettings.update(userSettings.id, {
          baseCurrency: settings.baseCurrency,
          userName: settings.userName,
          pinCode: settings.pin,
          isOnboarded: true,
          isAppLocked: true,
          requirePinOnResume: true,
        });
      } else {
        await db.userSettings.add({
          id: 'user-default-1',
          baseCurrency: settings.baseCurrency,
          userName: settings.userName,
          pinCode: settings.pin,
          isOnboarded: true,
          isAppLocked: true,
          requirePinOnResume: true,
          biometricSimulated: true,
          theme: 'royal_dark',
          emergencyFundMonthsTarget: 6,
          lastCloudSync: new Date().toISOString(),
        });
      }
      setIsOnboarded(true);
      setIsAppLocked(false);
      await refreshAllData();
    } catch (e) {
      console.error('Onboarding save error:', e);
    }
  };

  const handleSwitchUser = () => {
    setIsAppLocked(true);
  };

  // -------------------------------------------------------------
  // CONDITIONAL GATES: Splash & Multi-Vault AppLock
  // -------------------------------------------------------------

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Returning User or New User: Protected by Custom PIN / Biometrics
  if (isAppLocked) {
    return (
      <AppLockScreen
        onUnlock={async (vaultId: string) => {
          setActiveVault(vaultId);
          await refreshAllData();
          setIsAppLocked(false);
        }}
        onSwitchUser={handleSwitchUser}
      />
    );
  }

  // -------------------------------------------------------------
  // MAIN VIEWPORT RENDER
  // -------------------------------------------------------------

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            accounts={accounts}
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            notifications={notifications}
            currencySymbol={currencySymbol}
            onNavigate={setActiveScreen}
            onQuickAction={handleQuickAction}
            onSelectTransaction={setSelectedTransaction}
          />
        );

      case 'transactions':
        return (
          <TransactionsScreen
            transactions={transactions}
            accounts={accounts}
            currencySymbol={currencySymbol}
            onSelectTransaction={setSelectedTransaction}
            onAddNew={() => {
              setAddTxType('expense');
              setIsAddTxOpen(true);
            }}
            onExport={() => setIsExportOpen(true)}
          />
        );

      case 'accounts':
        return (
          <AccountsScreen
            accounts={accounts}
            currencySymbol={currencySymbol}
            onSelectAccount={setSelectedAccount}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onOpenReconcile={(acc) => {
              setReconcileTargetAccount(acc);
              setIsReconcileOpen(true);
            }}
            onAddNewAccount={() => {
              const name = prompt('Enter new Account Name (e.g. Axis Bank, Chase checking):');
              if (name) {
                db.accounts.add({
                  id: `acc-${Date.now()}`,
                  name,
                  type: 'bank',
                  institution: name,
                  currency: currentBaseCurrency,
                  openingBalance: 0,
                  currentBalance: 0,
                  includeInNetWorth: true,
                  isArchived: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }).then(() => refreshAllData());
              }
            }}
          />
        );

      case 'budgets':
        return (
          <BudgetsScreen
            budgets={budgets}
            currencySymbol={currencySymbol}
            onSelectBudget={setSelectedBudget}
            onAddNewBudget={() => {
              const name = prompt('Enter Budget Name (e.g. Shopping, Weekend Trip):');
              const amt = parseFloat(prompt('Enter Budget Limit Amount:') || '0');
              if (name && amt > 0) {
                db.budgets.add({
                  id: `b-${Date.now()}`,
                  name,
                  type: 'monthly',
                  amount: amt,
                  spent: 0,
                  startDate: new Date().toISOString().slice(0, 8) + '01',
                  endDate: new Date().toISOString().slice(0, 8) + '30',
                  category: name,
                  alertThreshold: 80,
                  carryForward: false,
                }).then(() => refreshAllData());
              }
            }}
          />
        );

      case 'goals':
        return (
          <GoalsScreen
            goals={goals}
            currencySymbol={currencySymbol}
            onSelectGoal={setSelectedGoal}
            onAddNewGoal={() => {
              const name = prompt('Enter Savings Goal Name (e.g. New Car, Europe Trip):');
              const target = parseFloat(prompt('Target Amount:') || '0');
              if (name && target > 0) {
                db.savingsGoals.add({
                  id: `g-${Date.now()}`,
                  name,
                  targetAmount: target,
                  currentAmount: 0,
                  targetDate: '2027-12-31',
                  priority: 'high',
                  linkedAccountId: accounts[0]?.id || 'acc-hdfc-salary',
                  monthlyContributionTarget: Math.round(target / 12),
                  status: 'active',
                }).then(() => refreshAllData());
              }
            }}
          />
        );

      case 'ai_coach':
        return (
          <AiCoachScreen
            accounts={accounts}
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            subscriptions={subscriptions}
            healthIndicators={healthIndicators}
            currencySymbol={currencySymbol}
            onNavigate={setActiveScreen}
          />
        );

      case 'health':
        return (
          <FinancialHealthScreen
            indicators={healthIndicators}
            onTakeAction={(screen) => setActiveScreen(screen)}
          />
        );

      case 'reports':
        return (
          <ReportsScreen
            transactions={transactions}
            accounts={accounts}
            budgets={budgets}
            subscriptions={subscriptions}
            recurringRules={recurringRules}
            currencySymbol={currencySymbol}
            onOpenExportModal={() => setIsExportOpen(true)}
          />
        );

      case 'bills':
        return (
          <BillsScreen
            recurringRules={recurringRules}
            currencySymbol={currencySymbol}
            onMarkPaid={handleMarkBillPaid}
            onAddNewRule={() => {
              const name = prompt('Enter Bill Name (e.g. Electricity, Water):');
              const amt = parseFloat(prompt('Amount:') || '0');
              if (name && amt > 0) {
                db.recurringRules.add({
                  id: `rec-${Date.now()}`,
                  name,
                  type: 'expense',
                  amount: amt,
                  frequency: 'monthly',
                  nextOccurrence: '2026-10-05',
                  accountId: accounts[0]?.id || '',
                  category: 'Bills & Utilities',
                  autoCreate: false,
                  reminderDaysBefore: 3,
                  status: 'active',
                }).then(() => refreshAllData());
              }
            }}
          />
        );

      case 'recurring':
        return (
          <RecurringScreen
            recurringRules={recurringRules}
            accounts={accounts}
            currencySymbol={currencySymbol}
            onToggleAutoCreate={handleToggleAutoCreate}
            onAddNewRecurring={() => {
              const name = prompt('Enter Rule Name (e.g. Monthly Salary, Lease Rent):');
              const amt = parseFloat(prompt('Amount:') || '0');
              const isIncome = window.confirm('Is this Income? (Click OK for Income, Cancel for Expense)');
              if (name && amt > 0) {
                db.recurringRules.add({
                  id: `rec-${Date.now()}`,
                  name,
                  type: isIncome ? 'income' : 'expense',
                  amount: amt,
                  frequency: 'monthly',
                  nextOccurrence: '2026-10-01',
                  accountId: accounts[0]?.id || '',
                  category: isIncome ? 'Salary' : 'Rent & Housing',
                  autoCreate: true,
                  reminderDaysBefore: 2,
                  status: 'active',
                }).then(() => refreshAllData());
              }
            }}
            onDeleteRule={handleDeleteRecurringRule}
          />
        );

      case 'subscriptions':
        return (
          <SubscriptionsScreen
            subscriptions={subscriptions}
            accounts={accounts}
            currencySymbol={currencySymbol}
            onToggleSubscription={handleToggleSubscription}
            onAddNewSubscription={() => {
              const name = prompt('Subscription Name (e.g. YouTube Premium, Disney+):');
              const cost = parseFloat(prompt('Monthly Cost:') || '0');
              if (name && cost > 0) {
                db.subscriptions.add({
                  id: `sub-${Date.now()}`,
                  name,
                  cost,
                  frequency: 'monthly',
                  renewalDate: '2026-10-15',
                  accountId: accounts[0]?.id || '',
                  category: 'Entertainment',
                  isActive: true,
                  reminderDaysBefore: 3,
                }).then(() => refreshAllData());
              }
            }}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotifsRead}
            onClearNotification={handleClearNotification}
            onNavigate={setActiveScreen}
          />
        );

      case 'currency':
        return (
          <CurrencyScreen
            currentBaseCurrency={currentBaseCurrency}
            onSelectCurrency={handleSelectCurrency}
          />
        );

      case 'backup_sync':
        return <BackupSyncScreen onRefreshData={refreshAllData} />;

      case 'settings':
        return (
          <SettingsScreen
            userSettings={userSettings}
            onUpdateSettings={handleUpdateSettings}
            onResetNumbersToZero={handleResetNumbersToZero}
            onResetDemoData={handleResetDemoData}
            onNavigateCurrency={() => setActiveScreen('currency')}
            onLockApp={() => setIsAppLocked(true)}
            onSwitchUser={handleSwitchUser}
          />
        );

      case 'more':
      default:
        return (
          <MoreHubScreen
            userSettings={userSettings}
            onUpdateSettings={handleUpdateSettings}
            onNavigate={setActiveScreen}
            onLockApp={() => setIsAppLocked(true)}
          />
        );
    }
  };

  return (
    <AppShell
      activeScreen={activeScreen}
      onNavigate={setActiveScreen}
      onQuickAction={handleQuickAction}
      accounts={accounts}
      notifications={notifications}
      userSettings={userSettings}
      onLockApp={() => setIsAppLocked(true)}
      currencySymbol={currencySymbol}
    >
      {renderActiveScreen()}

      {/* Global Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        defaultType={addTxType}
        accounts={accounts}
        defaultCurrency={currentBaseCurrency}
        onSave={handleSaveTransaction}
      />

      <VoiceEntryModal
        isOpen={isVoiceEntryOpen}
        onClose={() => setIsVoiceEntryOpen(false)}
        accounts={accounts}
        defaultCurrency={currentBaseCurrency}
        onConfirmSave={handleVoiceConfirmSave}
      />

      <TransferMoneyModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        defaultCurrency={currentBaseCurrency}
        onConfirmTransfer={handleConfirmTransfer}
      />

      <ReconcileModal
        isOpen={isReconcileOpen}
        onClose={() => {
          setIsReconcileOpen(false);
          setReconcileTargetAccount(null);
        }}
        account={reconcileTargetAccount}
        currencySymbol={currencySymbol}
        onConfirmReconcile={handleConfirmReconcile}
      />

      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        accounts={accounts}
        currencySymbol={currencySymbol}
        onDelete={handleDeleteTransaction}
      />

      <AccountDetailModal
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount}
        transactions={transactions}
        currencySymbol={currencySymbol}
        onReconcile={(acc) => {
          setSelectedAccount(null);
          setReconcileTargetAccount(acc);
          setIsReconcileOpen(true);
        }}
      />

      <BudgetDetailModal
        isOpen={!!selectedBudget}
        onClose={() => setSelectedBudget(null)}
        budget={selectedBudget}
        transactions={transactions}
        currencySymbol={currencySymbol}
        onDeleteBudget={handleDeleteBudget}
      />

      <GoalDetailModal
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        goal={selectedGoal}
        accounts={accounts}
        currencySymbol={currencySymbol}
        onUpdateGoalAmount={handleUpdateGoalAmount}
        onDeleteGoal={handleDeleteGoal}
      />

      <ExportReportsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        transactions={transactions}
        accounts={accounts}
        currencySymbol={currencySymbol}
      />
    </AppShell>
  );
}

export default App;
