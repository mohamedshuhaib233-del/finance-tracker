import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  User,
  IndianRupee,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Share2,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { SmsService, SmsReminderRecord } from '../../services/smsService';
import { getActiveVaultId } from '../../db/database';

interface SmsReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderName?: string;
  currencySymbol?: string;
}

export const SmsReminderModal: React.FC<SmsReminderModalProps> = ({
  isOpen,
  onClose,
  senderName = 'Me',
  currencySymbol = '₹',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form State
  const [type, setType] = useState<'to_receive' | 'to_pay'>('to_receive');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState<'en' | 'ml'>('en');
  const [customMessage, setCustomMessage] = useState('');
  const [isMessageEdited, setIsMessageEdited] = useState(false);

  // Feedback states
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Dues list state
  const [reminders, setReminders] = useState<SmsReminderRecord[]>([]);

  const loadReminders = () => {
    setReminders(SmsService.getReminders(getActiveVaultId()));
  };

  useEffect(() => {
    if (isOpen) {
      loadReminders();
    }
  }, [isOpen]);

  // Update default message whenever form inputs change unless user manually edited it
  useEffect(() => {
    if (!isMessageEdited) {
      const numAmount = parseFloat(amount) || 0;
      const generator = language === 'ml' ? SmsService.generateMalayalamMessage : SmsService.generateSmsMessage;
      const generated = generator({
        type,
        personName: personName.trim() || (language === 'ml' ? 'സുഹൃത്തേ' : 'Sir/Madam'),
        amount: numAmount,
        senderName: senderName || 'Me',
        notes: notes.trim(),
        currencySymbol,
      });
      setCustomMessage(generated);
    }
  }, [type, personName, amount, notes, language, isMessageEdited, senderName, currencySymbol]);

  if (!isOpen) return null;

  const handleSendSms = () => {
    const numAmount = parseFloat(amount);
    if (!phoneNumber.trim()) {
      setValidationError('ദയവായി ഫോൺ നമ്പർ നൽകുക (Please enter phone number).');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setValidationError('സാധുവായ തുക നൽകുക (Please enter a valid amount).');
      return;
    }

    setValidationError('');

    // 1. Auto-save this reminder record
    const saved = SmsService.saveReminder({
      vaultId: getActiveVaultId(),
      personName: personName.trim() || 'Contact',
      phoneNumber: phoneNumber.trim(),
      amount: numAmount,
      type,
      notes: notes.trim(),
    });

    SmsService.markSent(saved.id, getActiveVaultId());
    loadReminders();

    // 2. Trigger native SMS application
    SmsService.sendNativeSms(phoneNumber.trim(), customMessage);
  };

  const handleSendWhatsApp = () => {
    const numAmount = parseFloat(amount);
    if (!phoneNumber.trim()) {
      setValidationError('ദയവായി ഫോൺ നമ്പർ നൽകുക (Please enter phone number).');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setValidationError('സാധുവായ തുക നൽകുക (Please enter a valid amount).');
      return;
    }

    setValidationError('');

    const saved = SmsService.saveReminder({
      vaultId: getActiveVaultId(),
      personName: personName.trim() || 'Contact',
      phoneNumber: phoneNumber.trim(),
      amount: numAmount,
      type,
      notes: notes.trim(),
    });

    SmsService.markSent(saved.id, getActiveVaultId());
    loadReminders();

    SmsService.sendWhatsApp(phoneNumber.trim(), customMessage);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveOnly = () => {
    const numAmount = parseFloat(amount);
    if (!phoneNumber.trim()) {
      setValidationError('ദയവായി ഫോൺ നമ്പർ നൽകുക (Please enter phone number).');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setValidationError('സാധുവായ തുക നൽകുക (Please enter a valid amount).');
      return;
    }

    SmsService.saveReminder({
      vaultId: getActiveVaultId(),
      personName: personName.trim() || 'Contact',
      phoneNumber: phoneNumber.trim(),
      amount: numAmount,
      type,
      notes: notes.trim(),
    });

    loadReminders();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('list');
    }, 1200);
  };

  // Calculations for summary
  const totalToReceive = reminders
    .filter((r) => r.type === 'to_receive' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalToPay = reminders
    .filter((r) => r.type === 'to_pay' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900">
                SMS Payment Reminders
              </h3>
              <p className="text-xs text-slate-500">പണം ഇടപാടുകൾ & SMS ഓർമ്മപ്പെടുത്തൽ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-3 border-b border-slate-100 bg-slate-50/70 gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> പുതിയ SMS അയക്കുക
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> കണക്കുകൾ / ലിസ്റ്റ് ({reminders.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              {/* Type Switcher: Paisa Kittanano / Paisa Kodukkanano */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  ഇടപാട് തരം തിരഞ്ഞെടുക്കുക (Transaction Type)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setType('to_receive');
                      setIsMessageEdited(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      type === 'to_receive'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        type === 'to_receive' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">പണം ലഭിക്കാൻ</div>
                      <div className="text-[10px] text-slate-500">You Owe Me (To Receive)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType('to_pay');
                      setIsMessageEdited(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      type === 'to_pay'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        type === 'to_pay' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">പണം നൽകാൻ</div>
                      <div className="text-[10px] text-slate-500">I Owe You (To Pay)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone Number & Person Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    ഫോൺ നമ്പർ (Phone Number) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    വ്യക്തിയുടെ പേര് (Person Name)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="e.g. Rahul, Friend"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Amount & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    തുക (Amount in {currencySymbol}) *
                  </label>
                  <div className="relative">
                    <span className="text-slate-400 font-bold absolute left-3 top-2.5 text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    കാരണം / വിവരണം (Note / Purpose)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Lunch split, Shop bill"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Error Notice */}
              {validationError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Live SMS Preview Box */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> SMS മെസ്സേജ് പ്രിവ്യൂ (Message Preview)
                  </span>

                  {/* Language switch */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setIsMessageEdited(false);
                      }}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        language === 'en' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('ml');
                        setIsMessageEdited(false);
                      }}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        language === 'ml' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      മലയാളം
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => {
                      setCustomMessage(e.target.value);
                      setIsMessageEdited(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-xs sm:text-sm text-slate-800 leading-relaxed outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 shadow-xs text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSendSms}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Phone className="w-4 h-4" /> 📱 Send Normal SMS (SMS ആപ്പിലേക്ക് അയക്കുക)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp വഴി അയക്കുക
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOnly}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{savedSuccess ? 'സേവ് ചെയ്തു!' : 'കണക്കിൽ സേവ് ചെയ്യുക'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Tab: Dues History / Saved records */
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                  <span className="text-[11px] font-semibold text-emerald-800 block">ആകെ ലഭിക്കാൻ (To Receive)</span>
                  <span className="text-lg font-bold font-display text-emerald-700">
                    {currencySymbol}{totalToReceive.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
                  <span className="text-[11px] font-semibold text-rose-800 block">ആകെ നൽകാൻ (To Pay)</span>
                  <span className="text-lg font-bold font-display text-rose-700">
                    {currencySymbol}{totalToPay.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Records List */}
              {reminders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs">ഇതുവരെ SMS ഇടപാടുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                  >
                    + ആദ്യത്തെ SMS തയ്യാറാക്കുക
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {reminders.map((r) => {
                    const isToReceive = r.type === 'to_receive';
                    const isSettled = r.status === 'settled';

                    return (
                      <div key={r.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isToReceive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isToReceive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                              <span>{r.personName}</span>
                              {isSettled && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                                  Settled
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{r.phoneNumber}</span>
                              {r.notes && <span>• {r.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div
                              className={`font-bold text-xs sm:text-sm font-display ${
                                isToReceive ? 'text-emerald-700' : 'text-rose-700'
                              } ${isSettled ? 'line-through opacity-50' : ''}`}
                            >
                              {currencySymbol}{r.amount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {isToReceive ? 'ലഭിക്കാൻ' : 'നൽകാൻ'}
                            </span>
                          </div>

                          {/* Quick SMS Resend */}
                          <button
                            type="button"
                            onClick={() => {
                              const msg = SmsService.generateSmsMessage({
                                type: r.type,
                                personName: r.personName,
                                amount: r.amount,
                                senderName,
                                notes: r.notes,
                                currencySymbol,
                              });
                              SmsService.sendNativeSms(r.phoneNumber, msg);
                            }}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Send SMS Again"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Settled */}
                          <button
                            type="button"
                            onClick={() => {
                              SmsService.updateReminderStatus(
                                r.id,
                                isSettled ? 'pending' : 'settled',
                                getActiveVaultId()
                              );
                              loadReminders();
                            }}
                            className={`p-2 rounded-xl border transition-colors ${
                              isSettled
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border-slate-200'
                            }`}
                            title={isSettled ? 'Mark Pending' : 'Mark Settled'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              SmsService.deleteReminder(r.id, getActiveVaultId());
                              loadReminders();
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
