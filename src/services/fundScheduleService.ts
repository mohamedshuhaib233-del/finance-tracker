import { getActiveVaultId } from '../db/database';

export interface ScheduledFundPromise {
  id: string;
  vaultId: string;
  personName: string;
  phoneNumber: string;
  amount: number;
  type: 'to_receive' | 'to_pay'; // 'to_receive' = പണം ലഭിക്കാൻ (Owed to me), 'to_pay' = പണം നൽകാൻ (I owe)
  promisedDate: string; // 'YYYY-MM-DD'
  notes?: string;
  preferredChannel: 'whatsapp' | 'sms' | 'both';
  autoSendEnabled: boolean;
  status: 'pending' | 'settled';
  createdAt: string;
  lastSentAt?: string;
  lastSentChannel?: 'whatsapp' | 'sms';
  reminderCount?: number;
}

const SCHEDULED_FUNDS_STORAGE_PREFIX = 'finance_tracker_scheduled_funds_';

function getStorageKey(vaultId?: string): string {
  const vId = vaultId || getActiveVaultId() || 'vault_0000';
  return `${SCHEDULED_FUNDS_STORAGE_PREFIX}${vId}`;
}

export class FundScheduleService {
  /**
   * Get all scheduled fund promises for the active vault
   */
  static getPromises(vaultId?: string): ScheduledFundPromise[] {
    try {
      const raw = localStorage.getItem(getStorageKey(vaultId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading scheduled fund promises:', e);
    }
    return [];
  }

  /**
   * Save or update a scheduled promise
   */
  static savePromise(
    data: Omit<ScheduledFundPromise, 'id' | 'createdAt' | 'status'> & { id?: string }
  ): ScheduledFundPromise {
    const list = this.getPromises(data.vaultId);
    const id = data.id || `promise-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const record: ScheduledFundPromise = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reminderCount: 0,
      autoSendEnabled: data.autoSendEnabled ?? true,
      preferredChannel: data.preferredChannel || 'whatsapp',
    };

    const existingIndex = list.findIndex((r) => r.id === id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.unshift(record);
    }

    localStorage.setItem(getStorageKey(data.vaultId), JSON.stringify(list));
    return record;
  }

  /**
   * Mark a promise as settled or pending
   */
  static updateStatus(id: string, status: 'pending' | 'settled', vaultId?: string): void {
    const list = this.getPromises(vaultId);
    const index = list.findIndex((r) => r.id === id);
    if (index >= 0) {
      list[index].status = status;
      localStorage.setItem(getStorageKey(vaultId), JSON.stringify(list));
    }
  }

  /**
   * Delete a scheduled promise
   */
  static deletePromise(id: string, vaultId?: string): void {
    const list = this.getPromises(vaultId);
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem(getStorageKey(vaultId), JSON.stringify(filtered));
  }

  /**
   * Record that a reminder was sent today
   */
  static markSent(id: string, channel: 'whatsapp' | 'sms', vaultId?: string): void {
    const list = this.getPromises(vaultId);
    const index = list.findIndex((r) => r.id === id);
    if (index >= 0) {
      list[index].lastSentAt = new Date().toISOString();
      list[index].lastSentChannel = channel;
      list[index].reminderCount = (list[index].reminderCount || 0) + 1;
      localStorage.setItem(getStorageKey(vaultId), JSON.stringify(list));
    }
  }

  /**
   * Get all promises for a specific date (YYYY-MM-DD)
   */
  static getPromisesForDate(dateStr: string, vaultId?: string): ScheduledFundPromise[] {
    const list = this.getPromises(vaultId);
    return list.filter((p) => p.promisedDate === dateStr);
  }

  /**
   * Get promises that are due today or overdue and not yet settled
   */
  static getDuePromisesToday(vaultId?: string): ScheduledFundPromise[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const list = this.getPromises(vaultId);
    return list.filter((p) => p.status === 'pending' && p.promisedDate <= todayStr);
  }

  /**
   * Format message in English
   */
  static generateMessage(params: {
    type: 'to_receive' | 'to_pay';
    personName: string;
    amount: number;
    promisedDate: string;
    senderName?: string;
    notes?: string;
    currencySymbol?: string;
    lang?: 'en' | 'ml';
  }): string {
    const symbol = params.currencySymbol || '₹';
    const sender = params.senderName || 'Me';
    const noteText = params.notes?.trim() ? ` (for ${params.notes.trim()})` : '';
    const formattedAmount = `${symbol}${params.amount.toLocaleString('en-IN')}`;

    if (params.lang === 'ml') {
      if (params.type === 'to_receive') {
        return `നമസ്കാരം ${params.personName || ''}, ${sender ? sender + '-ലേക്ക് ' : ''}ഇന്ന് (${params.promisedDate}) നൽകാം എന്ന് പറഞ്ഞ ${formattedAmount}${noteText} ഓർമ്മിപ്പിക്കുന്നു. ദയവായി തുക നൽകുമല്ലോ. നന്ദി!`;
      } else {
        return `നമസ്കാരം ${params.personName || ''}, ${sender ? sender + ' ' : ''}നിങ്ങൾക്ക് ഇന്ന് (${params.promisedDate}) നൽകാം എന്ന് പറഞ്ഞ ${formattedAmount}${noteText} ഉടൻ കൈമാറുന്നതാണ്. നന്ദി!`;
      }
    }

    if (params.type === 'to_receive') {
      return `Hi ${params.personName || 'Sir/Madam'}, this is a gentle reminder from ${sender} regarding the promised payment of ${formattedAmount}${noteText} scheduled for today (${params.promisedDate}). Kindly arrange to transfer this at your earliest convenience. Thank you!`;
    } else {
      return `Hi ${params.personName || 'Sir/Madam'}, this is from ${sender}. Confirming that your payment of ${formattedAmount}${noteText} scheduled for today (${params.promisedDate}) will be processed shortly. Thank you!`;
    }
  }

  /**
   * Send WhatsApp message via wa.me link
   */
  static sendWhatsApp(phoneNumber: string, message: string): void {
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }

  /**
   * Send Native SMS via sms: protocol
   */
  static sendNativeSms(phoneNumber: string, message: string): void {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const smsUrl = `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  }

  /**
   * Trigger Desktop / Mobile Push Notification if supported & granted
   */
  static triggerDueNotificationIfSupported(dueCount: number): void {
    if (dueCount <= 0) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Finance Tracker — Fund Reminder Due Today', {
          body: `You have ${dueCount} promised fund reminder${dueCount > 1 ? 's' : ''} scheduled for today! Tap to send SMS/WhatsApp.`,
          icon: '/logo.png',
        });
      } catch (e) {
        console.warn('Notification failed:', e);
      }
    }
  }
}
