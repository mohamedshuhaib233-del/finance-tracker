import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Send,
  MessageSquare,
  Phone,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  Sparkles,
  Zap,
  Bell,
  Search,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { FundScheduleService, ScheduledFundPromise } from '../../services/fundScheduleService';
import { getActiveVaultId } from '../../db/database';

interface FundScheduleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderName?: string;
  currencySymbol?: string;
}

export const FundScheduleCalendarModal: React.FC<FundScheduleCalendarModalProps> = ({
  isOpen,
  onClose,
  senderName = 'Me',
  currencySymbol = '₹',
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'calendar' | 'create' | 'ledger'>('calendar');

  // Month & Year state for Calendar
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // All promises from storage
  const [promises, setPromises] = useState<ScheduledFundPromise[]>([]);

  // Form State for creating a new promise
  const [formPersonName, setFormPersonName] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPromisedDate, setFormPromisedDate] = useState(todayStr);
  const [formType, setFormType] = useState<'to_receive' | 'to_pay'>('to_receive');
  const [formChannel, setFormChannel] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
  const [formNotes, setFormNotes] = useState('');
  const [formAutoSend, setFormAutoSend] = useState(true);
  const [formLang, setFormLang] = useState<'en' | 'ml'>('en');
  const [validationError, setValidationError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-send runner modal state
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [autoSendIndex, setAutoSendIndex] = useState(0);

  // Ledger search and filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'pending' | 'settled'>('all');

  // Load promises
  const loadData = () => {
    const list = FundScheduleService.getPromises(getActiveVaultId());
    setPromises(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Request notification permission if not yet decided
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isOpen]);

  // Due today list
  const dueTodayList = useMemo(() => {
    return promises.filter((p) => p.status === 'pending' && p.promisedDate <= todayStr);
  }, [promises, todayStr]);

  // When date changes in calendar, keep formPromisedDate aligned
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setFormPromisedDate(dateStr);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    handleSelectDate(todayStr);
  };

  // Month days computation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  }, [currentYear, currentMonth]);

  // Map promises by date for rapid calendar lookup
  const promisesByDate = useMemo(() => {
    const map = new Map<string, ScheduledFundPromise[]>();
    promises.forEach((p) => {
      const arr = map.get(p.promisedDate) || [];
      arr.push(p);
      map.set(p.promisedDate, arr);
    });
    return map;
  }, [promises]);

  // Schedules on currently selected date
  const selectedDatePromises = useMemo(() => {
    return promisesByDate.get(selectedDate) || [];
  }, [promisesByDate, selectedDate]);

  const selectedDateStats = useMemo(() => {
    let toReceive = 0;
    let toPay = 0;
    selectedDatePromises.forEach((p) => {
      if (p.status !== 'settled') {
        if (p.type === 'to_receive') toReceive += p.amount;
        else toPay += p.amount;
      }
    });
    return { toReceive, toPay, net: toReceive - toPay };
  }, [selectedDatePromises]);

  // Form Live Message Preview
  const previewMessage = useMemo(() => {
    const numAmount = parseFloat(formAmount) || 0;
    return FundScheduleService.generateMessage({
      type: formType,
      personName: formPersonName.trim() || 'Sir/Madam',
      amount: numAmount,
      promisedDate: formPromisedDate,
      senderName,
      notes: formNotes.trim(),
      currencySymbol,
      lang: formLang,
    });
  }, [formType, formPersonName, formAmount, formPromisedDate, senderName, formNotes, currencySymbol, formLang]);

  // Handle Save Promise
  const handleSavePromise = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formPersonName.trim()) {
      setValidationError('Please enter contact / person name.');
      return;
    }
    if (!formPhoneNumber.trim()) {
      setValidationError('Please enter a valid mobile number for reminders.');
      return;
    }
    const numAmount = parseFloat(formAmount);
    if (!numAmount || numAmount <= 0) {
      setValidationError('Please enter a valid amount.');
      return;
    }
    if (!formPromisedDate) {
      setValidationError('Please choose a promised date.');
      return;
    }

    setValidationError('');

    FundScheduleService.savePromise({
      vaultId: getActiveVaultId(),
      personName: formPersonName.trim(),
      phoneNumber: formPhoneNumber.trim(),
      amount: numAmount,
      type: formType,
      promisedDate: formPromisedDate,
      notes: formNotes.trim(),
      preferredChannel: formChannel,
      autoSendEnabled: formAutoSend,
    });

    loadData();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('calendar');
      setSelectedDate(formPromisedDate);
    }, 1200);

    // Reset fields
    setFormPersonName('');
    setFormPhoneNumber('');
    setFormAmount('');
    setFormNotes('');
  };

  // Quick Send Single Promise
  const handleSendWhatsApp = (item: ScheduledFundPromise) => {
    const msg = FundScheduleService.generateMessage({
      type: item.type,
      personName: item.personName,
      amount: item.amount,
      promisedDate: item.promisedDate,
      senderName,
      notes: item.notes,
      currencySymbol,
    });
    FundScheduleService.sendWhatsApp(item.phoneNumber, msg);
    FundScheduleService.markSent(item.id, 'whatsapp', getActiveVaultId());
    loadData();
  };

  const handleSendSms = (item: ScheduledFundPromise) => {
    const msg = FundScheduleService.generateMessage({
      type: item.type,
      personName: item.personName,
      amount: item.amount,
      promisedDate: item.promisedDate,
      senderName,
      notes: item.notes,
      currencySymbol,
    });
    FundScheduleService.sendNativeSms(item.phoneNumber, msg);
    FundScheduleService.markSent(item.id, 'sms', getActiveVaultId());
    loadData();
  };

  const handleToggleSettle = (id: string, currentStatus: 'pending' | 'settled') => {
    const nextStatus = currentStatus === 'pending' ? 'settled' : 'pending';
    FundScheduleService.updateStatus(id, nextStatus, getActiveVaultId());
    loadData();
  };

  const handleDeletePromise = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled fund promise?')) {
      FundScheduleService.deletePromise(id, getActiveVaultId());
      loadData();
    }
  };

  // Month Name Formatter
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F8FAF8] w-full max-w-4xl rounded-3xl shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-emerald-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-emerald-950 flex items-center gap-2">
                Promised Fund Date Reminders
                {dueTodayList.length > 0 && (
                  <span className="text-[11px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {dueTodayList.length} Due Today
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Calendar tracking & automated SMS / WhatsApp reminders for promised funds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-emerald-50/50 px-5 pt-3 pb-2 border-b border-emerald-100 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'calendar'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-emerald-100/60'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar & Dates
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                setFormPromisedDate(selectedDate);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'create'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-emerald-100/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule New Fund
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'ledger'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-emerald-100/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              All Schedules ({promises.length})
            </button>
          </div>

          {/* Quick jump to today */}
          <button
            onClick={handleJumpToToday}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold px-2.5 py-1 bg-white rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-all shrink-0"
          >
            Today ({todayStr})
          </button>
        </div>

        {/* TOP ALERT: If any reminders are due today */}
        {dueTodayList.length > 0 && activeTab === 'calendar' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-emerald-50 border-b border-amber-200/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  {dueTodayList.length} Fund Promise{dueTodayList.length > 1 ? 's' : ''} Scheduled for Today!
                </div>
                <div className="text-[11px] text-amber-800">
                  Send automated WhatsApp or SMS reminders with 1-click.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAutoSending(true);
                setAutoSendIndex(0);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              ⚡ Auto-Send All Due Reminders Now
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Calendar Card */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-sm">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-100/80 text-slate-700 transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-base sm:text-lg font-bold font-display text-emerald-950">
                      {monthName}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-100/80 text-slate-700 transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> To Receive
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> To Pay
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Settled
                    </span>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Monthly Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Empty cells before first day of month */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 opacity-40" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateFormatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateFormatted;
                    const isToday = todayStr === dateFormatted;
                    const dayPromises = promisesByDate.get(dateFormatted) || [];

                    const hasPendingToReceive = dayPromises.some(
                      (p) => p.status === 'pending' && p.type === 'to_receive'
                    );
                    const hasPendingToPay = dayPromises.some(
                      (p) => p.status === 'pending' && p.type === 'to_pay'
                    );
                    const allSettled = dayPromises.length > 0 && dayPromises.every((p) => p.status === 'settled');

                    // Compute sum for day
                    const dayTotalReceive = dayPromises
                      .filter((p) => p.type === 'to_receive' && p.status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0);

                    return (
                      <div
                        key={dateFormatted}
                        onClick={() => handleSelectDate(dateFormatted)}
                        className={`h-16 sm:h-20 rounded-2xl p-1 sm:p-2 cursor-pointer transition-all flex flex-col justify-between border relative select-none ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02] z-10'
                            : isToday
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-400 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50/50 text-slate-700 border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              isSelected ? 'text-white' : isToday ? 'text-emerald-700' : 'text-slate-800'
                            }`}
                          >
                            {dayNum}
                          </span>
                          {isToday && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1 rounded-sm ${
                                isSelected ? 'bg-white/30 text-white' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              Today
                            </span>
                          )}
                        </div>

                        {/* Dot Badges / Pills */}
                        {dayPromises.length > 0 && (
                          <div className="flex flex-col gap-0.5 items-start overflow-hidden">
                            <div className="flex items-center gap-1">
                              {hasPendingToReceive && (
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isSelected ? 'bg-white' : 'bg-emerald-500'
                                  }`}
                                  title="Has funds to receive"
                                />
                              )}
                              {hasPendingToPay && (
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isSelected ? 'bg-amber-200' : 'bg-rose-500'
                                  }`}
                                  title="Has funds to pay"
                                />
                              )}
                              {allSettled && (
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isSelected ? 'bg-white/60' : 'bg-slate-300'
                                  }`}
                                  title="All settled"
                                />
                              )}
                            </div>

                            {/* Amount preview pill for larger screen or active day */}
                            {dayTotalReceive > 0 && (
                              <span
                                className={`text-[9px] font-bold truncate max-w-full ${
                                  isSelected ? 'text-emerald-100' : 'text-emerald-700 font-semibold'
                                }`}
                              >
                                +{currencySymbol}{dayTotalReceive > 999 ? `${(dayTotalReceive / 1000).toFixed(0)}k` : dayTotalReceive}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DATE INSPECTOR: Scheduled Funds for Selected Date */}
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Date Breakdown
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      {formattedSelectedDate}
                    </h3>
                  </div>

                  {/* Add promise for this selected date button */}
                  <button
                    onClick={() => {
                      setFormPromisedDate(selectedDate);
                      setActiveTab('create');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Schedule Fund for this Date
                  </button>
                </div>

                {/* Selected Date Summary Metrics */}
                {selectedDatePromises.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-emerald-800">To Receive</div>
                        <div className="text-base font-bold text-emerald-950">
                          {currencySymbol}{selectedDateStats.toReceive.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-rose-800">To Pay</div>
                        <div className="text-base font-bold text-rose-950">
                          {currencySymbol}{selectedDateStats.toPay.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-600">Net Expected</div>
                        <div
                          className={`text-base font-bold ${
                            selectedDateStats.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {currencySymbol}{Math.abs(selectedDateStats.net).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <Sparkles className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                )}

                {/* List of promises on this date */}
                {selectedDatePromises.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700 mb-1">
                      No Fund Promises Scheduled on this Date
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Add someone who promised to pay you or someone you promised to pay on {formattedSelectedDate}.
                    </p>
                    <button
                      onClick={() => {
                        setFormPromisedDate(selectedDate);
                        setActiveTab('create');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Schedule Fund for this Date
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDatePromises.map((item) => {
                      const isReceive = item.type === 'to_receive';
                      const isSettled = item.status === 'settled';

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isSettled
                              ? 'bg-slate-50/70 border-slate-200 opacity-60'
                              : isReceive
                              ? 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs'
                              : 'bg-amber-50/40 border-amber-200/90 shadow-2xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  isReceive ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                                }`}
                              >
                                {isReceive ? (
                                  <ArrowDownLeft className="w-5 h-5" />
                                ) : (
                                  <ArrowUpRight className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                                    {item.personName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      isSettled
                                        ? 'bg-slate-200 text-slate-700'
                                        : isReceive
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {isSettled ? 'Settled' : isReceive ? 'To Receive (You Owe Me)' : 'To Pay (I Owe You)'}
                                  </span>
                                </div>

                                <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{item.phoneNumber}</span>
                                  {item.notes && (
                                    <>
                                      <span>•</span>
                                      <span className="italic text-slate-500">{item.notes}</span>
                                    </>
                                  )}
                                </div>

                                {/* Status / Meta */}
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                                  {item.autoSendEnabled && (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                      <Zap className="w-3 h-3" /> Auto-Remind: Active
                                    </span>
                                  )}
                                  {item.lastSentAt && (
                                    <span className="text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      Reminded via {item.lastSentChannel?.toUpperCase() || 'SMS'}{' '}
                                      {new Date(item.lastSentAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 gap-2">
                              <div
                                className={`text-lg font-bold font-display ${
                                  isReceive ? 'text-emerald-700' : 'text-amber-800'
                                }`}
                              >
                                {currencySymbol}{item.amount.toLocaleString('en-IN')}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsApp(item)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all"
                                  title="Send WhatsApp Reminder"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendSms(item)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all"
                                  title="Send Normal SMS"
                                >
                                  <Send className="w-3.5 h-3.5" /> SMS
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSettle(item.id, item.status)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isSettled
                                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300'
                                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
                                  }`}
                                  title={isSettled ? 'Mark as Pending' : 'Mark as Settled / Cleared'}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePromise(item.id)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 transition-all"
                                  title="Delete promise"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE NEW FUND PROMISE FORM */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm max-w-2xl mx-auto space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Schedule Fund Promise for Specific Date
                </h3>
                <p className="text-xs text-slate-500">
                  Set up a date-specific fund commitment. The system automatically prompts and dispatches WhatsApp/SMS on that date.
                </p>
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{validationError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Fund promise successfully scheduled! Opening Calendar...</span>
                </div>
              )}

              <form onSubmit={handleSavePromise} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Fund Commitment Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormType('to_receive')}
                      className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        formType === 'to_receive'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      They Will Pay Me (To Receive)
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormType('to_pay')}
                      className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        formType === 'to_pay'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      I Will Pay Them (To Pay)
                    </button>
                  </div>
                </div>

                {/* Contact Name & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact / Person Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={formPersonName}
                        onChange={(e) => setFormPersonName(e.target.value)}
                        placeholder="e.g. Rahul, Anas, Shop Owner"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm text-slate-800 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={formPhoneNumber}
                        onChange={(e) => setFormPhoneNumber(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm text-slate-800 font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Amount & Promised Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount ({currencySymbol}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Promised Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formPromisedDate}
                      onChange={(e) => setFormPromisedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Channel & Auto-Send Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Reminder Channel
                    </label>
                    <select
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm font-medium text-slate-800 bg-white"
                    >
                      <option value="whatsapp">💬 WhatsApp (Direct Link)</option>
                      <option value="sms">📱 Normal SMS (App Protocol)</option>
                      <option value="both">⚡ Both (SMS + WhatsApp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Purpose / Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Loan return, Rent, Project deposit"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm text-slate-800"
                    />
                  </div>
                </div>

                {/* Auto-Send on Due Date Toggle */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        Auto-Remind on Promised Date
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Automatically prompts reminder on the scheduled date
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAutoSend}
                    onChange={(e) => setFormAutoSend(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                {/* Reminder Message Live Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Automated Reminder Preview
                    </label>

                    {/* Language Switch */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setFormLang('en')}
                        className={`px-2 py-0.5 rounded ${
                          formLang === 'en' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormLang('ml')}
                        className={`px-2 py-0.5 rounded ${
                          formLang === 'ml' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        മലയാളം
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic leading-relaxed font-sans">
                    {previewMessage}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('calendar')}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" /> Save & Schedule Fund
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ALL SCHEDULES LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Ledger Controls */}
              <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search contact or phone..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {(['all', 'pending', 'settled'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLedgerFilter(filter)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                        ledgerFilter === filter
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ledger Table / List */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {promises
                  .filter((p) => {
                    if (ledgerFilter === 'pending') return p.status === 'pending';
                    if (ledgerFilter === 'settled') return p.status === 'settled';
                    return true;
                  })
                  .filter((p) => {
                    if (!ledgerSearch.trim()) return true;
                    const q = ledgerSearch.toLowerCase();
                    return (
                      p.personName.toLowerCase().includes(q) ||
                      p.phoneNumber.includes(q) ||
                      (p.notes && p.notes.toLowerCase().includes(q))
                    );
                  })
                  .map((item) => {
                    const isReceive = item.type === 'to_receive';
                    const isSettled = item.status === 'settled';
                    const isOverdue = item.status === 'pending' && item.promisedDate < todayStr;
                    const isToday = item.promisedDate === todayStr;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 transition-colors ${
                          isSettled ? 'opacity-60 bg-slate-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isReceive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isReceive ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {item.personName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isReceive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {isReceive ? 'To Receive' : 'To Pay'}
                              </span>
                              {isToday && (
                                <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  Due Today
                                </span>
                              )}
                              {isOverdue && (
                                <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>📅 Promised: {item.promisedDate}</span>
                              <span>•</span>
                              <span>📱 {item.phoneNumber}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="text-right">
                            <div
                              className={`text-sm sm:text-base font-bold font-display ${
                                isReceive ? 'text-emerald-700' : 'text-amber-800'
                              }`}
                            >
                              {currencySymbol}{item.amount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">{item.status}</div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(item)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                              title="Send WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendSms(item)}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-all"
                              title="Send SMS"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSettle(item.id, item.status)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSettled
                                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
                              }`}
                              title={isSettled ? 'Mark Pending' : 'Mark Settled'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePromise(item.id)}
                              className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUTO-SEND SEQUENTIAL RUNNER MODAL ("automatic ayit ponm athan main") */}
      {isAutoSending && dueTodayList.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-emerald-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Zap className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Auto-Send Due Reminders Today
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contact {autoSendIndex + 1} of {dueTodayList.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoSending(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Target Contact Card */}
            {dueTodayList[autoSendIndex] && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-emerald-800">
                      {dueTodayList[autoSendIndex].type === 'to_receive'
                        ? 'To Receive (You Owe Me)'
                        : 'To Pay (I Owe You)'}
                    </span>
                    <span className="text-lg font-bold font-display text-emerald-950">
                      {currencySymbol}{dueTodayList[autoSendIndex].amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-800">
                    {dueTodayList[autoSendIndex].personName}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dueTodayList[autoSendIndex].phoneNumber}</span>
                  </div>

                  {dueTodayList[autoSendIndex].notes && (
                    <div className="text-xs text-slate-500 italic">
                      Note: {dueTodayList[autoSendIndex].notes}
                    </div>
                  )}
                </div>

                {/* Prepared Message Preview */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Auto-Prepared Polite Message
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                    {FundScheduleService.generateMessage({
                      type: dueTodayList[autoSendIndex].type,
                      personName: dueTodayList[autoSendIndex].personName,
                      amount: dueTodayList[autoSendIndex].amount,
                      promisedDate: dueTodayList[autoSendIndex].promisedDate,
                      senderName,
                      notes: dueTodayList[autoSendIndex].notes,
                      currencySymbol,
                    })}
                  </div>
                </div>

                {/* Dispatch Trigger Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSendWhatsApp(dueTodayList[autoSendIndex]);
                      if (autoSendIndex + 1 < dueTodayList.length) {
                        setAutoSendIndex((i) => i + 1);
                      } else {
                        setIsAutoSending(false);
                      }
                    }}
                    className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> Send via WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSendSms(dueTodayList[autoSendIndex]);
                      if (autoSendIndex + 1 < dueTodayList.length) {
                        setAutoSendIndex((i) => i + 1);
                      } else {
                        setIsAutoSending(false);
                      }
                    }}
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-slate-800/20 transition-all"
                  >
                    <Send className="w-4 h-4" /> Send via SMS
                  </button>
                </div>

                {/* Skip / Next */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (autoSendIndex + 1 < dueTodayList.length) {
                        setAutoSendIndex((i) => i + 1);
                      } else {
                        setIsAutoSending(false);
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Skip this contact &gt;&gt;
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAutoSending(false)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Close Auto-Sender
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
