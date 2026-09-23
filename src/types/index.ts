// Core Types for Finance Tracker - Personal Finance & AI Coach

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'SGD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  exchangeRateToINR: number; // For multi-currency normalized calculations
}

export type AccountType = 'bank' | 'cash' | 'credit_card' | 'upi_wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string; // e.g. "HDFC Bank", "ICICI", "Physical Cash", "Paytm / GPay"
  currency: CurrencyCode;
  openingBalance: number;
  currentBalance: number;
  creditLimit?: number; // For credit cards
  billingCycleDay?: number; // 1-31
  paymentDueDay?: number; // 1-31
  includeInNetWorth: boolean;
  isArchived: boolean;
  color?: string;
  iconName?: string;
  lastReconciledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'credit_card_payment'
  | 'refund'
  | 'loan_received'
  | 'loan_repayment'
  | 'investment'
  | 'savings_transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  accountId: string; // Source account
  toAccountId?: string; // For transfers, credit card payments, savings transfers
  category: string;
  subcategory?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  tags?: string[];
  receiptUrl?: string; // base64 or mock image url
  isRecurring?: boolean;
  recurringRuleId?: string;
  isReversible?: boolean;
  isAutoPosted?: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  type: 'monthly' | 'custom';
  amount: number; // Target monthly/total spend limit
  spent: number;
  startDate: string;
  endDate: string;
  category: string; // e.g. "Food & Dining", "Shopping", "All"
  accountId?: string;
  alertThreshold: number; // e.g. 80 for 80%
  carryForward: boolean;
  aiSuggestions?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  linkedAccountId: string;
  monthlyContributionTarget: number;
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  icon?: string;
  category?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  name: string; // "Salary", "Rent", "Netflix", "Car EMI"
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  isVariableAmount?: boolean;
  frequency: RecurringFrequency;
  nextOccurrence: string; // YYYY-MM-DD
  accountId: string;
  toAccountId?: string;
  category: string;
  autoCreate: boolean; // True = Auto-post, False = Reminder only
  reminderDaysBefore: number;
  endDate?: string;
  lastPostedDate?: string;
  status: 'active' | 'paused' | 'ended';
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  frequency: 'monthly' | 'yearly';
  renewalDate: string; // YYYY-MM-DD
  accountId: string;
  category: string;
  isActive: boolean;
  reminderDaysBefore: number;
  lastUsedDate?: string;
  icon?: string;
  notes?: string;
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'reminder' | 'insight' | 'system';
  isRead: boolean;
  actionScreen?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  baseCurrency: CurrencyCode;
  pinCode?: string; // 4-digit PIN
  isAppLocked: boolean;
  requirePinOnResume: boolean;
  biometricSimulated: boolean;
  theme: 'royal_dark' | 'pearl_light';
  userName: string;
  isOnboarded: boolean;
  lastCloudSync?: string;
  emergencyFundMonthsTarget: number; // default 6 months
}

// AI Money Coach Models
export interface IncomeAllocationItem {
  id: string;
  label: string;
  allocatedAmount: number;
  percentage: number;
  description: string;
  category: 'essentials' | 'bills' | 'savings' | 'emergency' | 'flexible';
  editable: boolean;
}

export interface IncomeAllocationProposal {
  totalIncome: number;
  date: string;
  sourceAccount: string;
  allocations: IncomeAllocationItem[];
  rationale: string;
}

export interface HealthIndicator {
  id: string;
  name: string;
  category: string;
  value: number; // e.g. 28%
  displayValue: string; // "28.5%"
  status: 'optimal' | 'good' | 'warning' | 'critical';
  benchmark: string; // e.g. "Target: > 20%"
  whatItMeasures: string;
  explanation: string;
  suggestedAction: string;
}

export interface CoachRecommendation {
  id: string;
  title: string;
  category: 'spending' | 'budget' | 'subscription' | 'risk' | 'savings';
  evidence: string;
  potentialImpact: string;
  suggestedAction: string;
  actionType: 'navigate' | 'adjust_budget' | 'cancel_sub' | 'custom';
  actionPayload?: string;
  isCompleted: boolean;
  isDismissed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ForecastScenario {
  monthlySavingsIncrease: number;
  oneTimeExpense: number;
  expenseReductionPercentage: number;
  projectionMonths: number;
  projectedNetWorth: number;
  monthsToGoal: number;
  summary: string;
  assumptions: string[];
}

export interface ParsedVoiceTransaction {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  category: string;
  account: string;
  description: string;
  date: string;
  confidence: number;
  rawTranscript: string;
}
