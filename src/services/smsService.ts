import { getActiveVaultId } from '../db/database';

export interface SmsReminderRecord {
  id: string;
  vaultId: string;
  personName: string;
  phoneNumber: string;
  amount: number;
  type: 'to_receive' | 'to_pay'; // 'to_receive' = പണം ലഭിക്കാൻ (You owe me), 'to_pay' = പണം നൽകാൻ (I owe you)
  notes?: string;
  dueDate?: string;
  status: 'pending' | 'settled';
  createdAt: string;
  lastSentAt?: string;
}

const SMS_STORAGE_KEY_PREFIX = 'finance_tracker_sms_dues_';

function getStorageKey(vaultId?: string): string {
  const vId = vaultId || getActiveVaultId() || 'vault_0000';
  return `${SMS_STORAGE_KEY_PREFIX}${vId}`;
}

export class SmsService {
  static getReminders(vaultId?: string): SmsReminderRecord[] {
    try {
      const raw = localStorage.getItem(getStorageKey(vaultId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading SMS reminders:', e);
    }
    return [];
  }

  static saveReminder(reminder: Omit<SmsReminderRecord, 'id' | 'createdAt' | 'status'> & { id?: string }): SmsReminderRecord {
    const list = this.getReminders(reminder.vaultId);
    const id = reminder.id || `sms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const record: SmsReminderRecord = {
      ...reminder,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const existingIndex = list.findIndex((r) => r.id === id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.unshift(record);
    }

    localStorage.setItem(getStorageKey(reminder.vaultId), JSON.stringify(list));
    return record;
  }

  static updateReminderStatus(id: string, status: 'pending' | 'settled', vaultId?: string): void {
    const list = this.getReminders(vaultId);
    const index = list.findIndex((r) => r.id === id);
    if (index >= 0) {
      list[index].status = status;
      localStorage.setItem(getStorageKey(vaultId), JSON.stringify(list));
    }
  }

  static deleteReminder(id: string, vaultId?: string): void {
    const list = this.getReminders(vaultId);
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem(getStorageKey(vaultId), JSON.stringify(filtered));
  }

  static markSent(id: string, vaultId?: string): void {
    const list = this.getReminders(vaultId);
    const index = list.findIndex((r) => r.id === id);
    if (index >= 0) {
      list[index].lastSentAt = new Date().toISOString();
      localStorage.setItem(getStorageKey(vaultId), JSON.stringify(list));
    }
  }

  /**
   * Generates formatted SMS text
   */
  static generateSmsMessage(params: {
    type: 'to_receive' | 'to_pay';
    personName: string;
    amount: number;
    senderName?: string;
    notes?: string;
    currencySymbol?: string;
  }): string {
    const symbol = params.currencySymbol || '₹';
    const sender = params.senderName || 'Me';
    const noteText = params.notes?.trim() ? ` (${params.notes.trim()})` : '';

    if (params.type === 'to_receive') {
      // Someone owes us money (പണം ലഭിക്കാൻ ഉള്ളത്)
      return `Hi ${params.personName || 'Sir/Madam'}, this is a gentle reminder from ${sender} that a payment of ${symbol}${params.amount.toLocaleString('en-IN')}${noteText} is pending. Kindly arrange to clear this at your earliest convenience. Thank you!`;
    } else {
      // We owe someone money (പണം നൽകാൻ ഉള്ളത്)
      return `Hi ${params.personName || 'Sir/Madam'}, this is from ${sender}. Confirming that an amount of ${symbol}${params.amount.toLocaleString('en-IN')}${noteText} is pending from my side to you. I will clear it shortly. Thank you!`;
    }
  }

  /**
   * Generates Malayalam SMS message
   */
  static generateMalayalamMessage(params: {
    type: 'to_receive' | 'to_pay';
    personName: string;
    amount: number;
    senderName?: string;
    notes?: string;
    currencySymbol?: string;
  }): string {
    const symbol = params.currencySymbol || '₹';
    const sender = params.senderName || '';
    const noteText = params.notes?.trim() ? ` (${params.notes.trim()})` : '';

    if (params.type === 'to_receive') {
      return `നമസ്കാരം ${params.personName || ''}, ${sender ? sender + '-ലേക്ക് ' : ''}നൽകാനുള്ള ${symbol}${params.amount.toLocaleString('en-IN')}${noteText} ഓർമ്മിപ്പിക്കുന്നു. ദയവായി തുക നൽകുമല്ലോ. നന്ദി!`;
    } else {
      return `നമസ്കാരം ${params.personName || ''}, ${sender ? sender + ' ' : ''}നിങ്ങൾക്ക് നൽകാനുള്ള ${symbol}${params.amount.toLocaleString('en-IN')}${noteText} ഉടൻ നൽകുന്നതാണ്. നന്ദി!`;
    }
  }

  /**
   * Opens the device native SMS application with pre-filled number & body
   */
  static sendNativeSms(phoneNumber: string, message: string): void {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // iOS uses &body= while Android/Desktop use ?body=
    const separator = isIOS ? '&' : '?';
    const smsUrl = `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
    
    // Trigger SMS protocol
    window.location.href = smsUrl;
  }

  /**
   * Opens WhatsApp with pre-filled message
   */
  static sendWhatsApp(phoneNumber: string, message: string): void {
    // Keep numbers only for WhatsApp URL
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    // If 10 digits (India standard), prefix with 91
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }
}
