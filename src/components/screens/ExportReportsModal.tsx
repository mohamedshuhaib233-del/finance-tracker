import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Account, Transaction } from '../../types';
import { ExportService } from '../../services/exportService';
import { Download, Printer, Filter, Check, FileSpreadsheet, FileText } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../db/seedData';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  currencySymbol: string;
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  currencySymbol,
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (format === 'csv') {
        ExportService.exportTransactionsToCSV(transactions, accounts, {
          startDate,
          endDate,
          accountId: selectedAccount,
          category: selectedCategory,
        });
      } else {
        ExportService.printFinancialStatement();
      }
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Financial Reports"
      subtitle="Generate audited CSV records or printable PDF statements"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Format Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat('csv')}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              format === 'csv'
                ? 'bg-gold-500/20 border-gold-500 text-gold-300 shadow-gold'
                : 'bg-navy-800/60 border-white/10 text-pearl-400 hover:text-pearl-200'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-gold-400 shrink-0" />
            <div>
              <div className="font-bold text-xs">CSV Spreadsheet</div>
              <div className="text-[10px] text-pearl-400">Excel, Google Sheets, Tax</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat('pdf')}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              format === 'pdf'
                ? 'bg-gold-500/20 border-gold-500 text-gold-300 shadow-gold'
                : 'bg-navy-800/60 border-white/10 text-pearl-400 hover:text-pearl-200'
            }`}
          >
            <FileText className="w-5 h-5 text-gold-400 shrink-0" />
            <div>
              <div className="font-bold text-xs">Printable PDF Statement</div>
              <div className="text-[10px] text-pearl-400">Formal wealth statement</div>
            </div>
          </button>
        </div>

        {/* Filters: Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1">
            Filter by Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
          >
            <option value="all">All Accounts Included</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
          >
            <option value="all">All Categories Included</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-pearl-300 font-semibold text-xs hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-gold hover:opacity-95 transition-all"
          >
            {format === 'csv' ? <Download className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
            {isExporting ? 'Generating...' : format === 'csv' ? 'Download CSV' : 'Print PDF Statement'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
