import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Account, CurrencyCode, TransactionType } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../db/seedData';
import { Tag, Calendar, Receipt, Repeat, Check, Plus, CreditCard } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
  accounts: Account[];
  defaultCurrency: CurrencyCode;
  onSave: (tx: {
    type: TransactionType;
    amount: number;
    currency: CurrencyCode;
    accountId: string;
    toAccountId?: string;
    category: string;
    subcategory?: string;
    date: string;
    notes?: string;
    tags?: string[];
    receiptUrl?: string;
    isRecurring?: boolean;
  }) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  accounts,
  defaultCurrency,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setType(defaultType);
    if (defaultType === 'expense') {
      setCategory('Food & Dining');
    } else {
      setCategory('Salary');
    }
  }, [defaultType, isOpen]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const currentCategoryObj = EXPENSE_CATEGORIES.find((c) => c.name === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const defaultAccountId = accounts[0]?.id || 'acc_primary';

    setIsSubmitting(true);
    try {
      await onSave({
        type,
        amount: parsedAmount,
        currency,
        accountId: defaultAccountId,
        category: showCustomCategory && customCategory ? customCategory : category,
        subcategory: subcategory || undefined,
        date,
        receiptUrl: receiptUploaded ? 'mock-receipt-proof-hash' : undefined,
        isRecurring,
      });

      // Reset form & close
      setAmount('');
      setReceiptUploaded(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'income' ? 'Record Incoming Capital' : 'Record Expenditure'}
      subtitle="Maintains strict single-ledger balances and offline integrity"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Switcher */}
        <div className="grid grid-cols-2 p-1 bg-navy-800/80 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('Food & Dining');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              type === 'expense'
                ? 'bg-crimson-500/20 text-crimson-300 border border-crimson-500/40 shadow-sm'
                : 'text-pearl-400 hover:text-pearl-200'
            }`}
          >
            Expense Outflow
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Salary');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-pearl-400 hover:text-pearl-200'
            }`}
          >
            Income Inflow
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-bold font-display text-gold-400">
              {defaultCurrency === 'INR' ? '₹' : '$'}
            </div>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-navy-800/90 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-2xl font-bold font-display text-pearl-50 focus:outline-none focus:border-gold-500/60 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Category Selector with Custom Category option */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-pearl-400 uppercase tracking-wider">
              Category *
            </label>
            <button
              type="button"
              onClick={() => setShowCustomCategory(!showCustomCategory)}
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> {showCustomCategory ? 'Standard Categories' : 'Custom Category'}
            </button>
          </div>

          {showCustomCategory ? (
            <input
              type="text"
              placeholder="Enter custom category name"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full bg-navy-800/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-pearl-100 focus:outline-none focus:border-gold-500"
            />
          ) : (
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              className="w-full bg-navy-800/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-pearl-100 focus:outline-none focus:border-gold-500"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Subcategories (if available) */}
        {currentCategoryObj && currentCategoryObj.subcategories && (
          <div>
            <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
              Subcategory (Optional)
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full bg-navy-800/90 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-pearl-200 focus:outline-none focus:border-gold-500"
            >
              <option value="">None / General</option>
              {currentCategoryObj.subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Transaction Date *
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-navy-800/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-pearl-100 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Receipt & Recurring Toggles */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setReceiptUploaded(!receiptUploaded)}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              receiptUploaded
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-navy-800/60 border-white/10 text-pearl-400 hover:text-pearl-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            {receiptUploaded ? 'Receipt Attached ✓' : 'Attach Receipt'}
          </button>

          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              isRecurring
                ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                : 'bg-navy-800/60 border-white/10 text-pearl-400 hover:text-pearl-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {isRecurring ? 'Recurring Rule On' : 'Mark Recurring'}
          </button>
        </div>

        {/* Submit */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-2xl font-bold font-display text-sm tracking-wide text-navy-950 flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all ${
              type === 'income'
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400'
                : 'bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isSubmitting ? 'Recording...' : `Record ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
