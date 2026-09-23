import { Account, CurrencyCode, ParsedVoiceTransaction, TransactionType } from '../types';

export class VoiceParser {
  /**
   * Parse natural speech transcript into a structured transaction payload.
   * Example: "Spent 250 rupees for lunch using cash."
   */
  static parseTranscript(transcript: string, accounts: Account[], defaultCurrency: CurrencyCode = 'INR'): ParsedVoiceTransaction {
    const raw = transcript.trim();
    const lower = raw.toLowerCase();

    // 1. Determine Transaction Type
    let type: TransactionType = 'expense';
    if (lower.includes('credit card bill') || (lower.includes('paid') && lower.includes('card') && lower.includes('bill'))) {
      type = 'credit_card_payment';
    } else if (lower.includes('transfer') || lower.includes('moved to') || lower.includes('sent to my')) {
      type = 'transfer';
    } else if (lower.includes('received') || lower.includes('earned') || lower.includes('salary') || lower.includes('got paid') || lower.includes('income')) {
      type = 'income';
    } else if (lower.includes('refund') || lower.includes('cashback')) {
      type = 'refund';
    } else {
      type = 'expense';
    }

    // 2. Extract Amount
    let amount = 0;
    // Look for numbers or currency symbols: "250 rupees", "₹250", "rs 250", "250.00"
    const numberMatches = lower.match(/(?:(?:rs\.?|inr|₹|\$|€|£)\s*(\d+(?:[.,]\d+)?))|(?:(\d+(?:[.,]\d+)?)\s*(?:rupees|rs|inr|dollars|bucks|eur|pounds)?)/i);
    if (numberMatches) {
      const matchedNum = numberMatches[1] || numberMatches[2];
      if (matchedNum) {
        amount = parseFloat(matchedNum.replace(/,/g, ''));
      }
    }

    // Word to number fallbacks for common numbers if no digit matched
    if (!amount) {
      if (lower.includes('two hundred fifty') || lower.includes('250')) amount = 250;
      else if (lower.includes('one thousand') || lower.includes('1000')) amount = 1000;
      else if (lower.includes('five hundred') || lower.includes('500')) amount = 500;
      else if (lower.includes('fifty thousand') || lower.includes('50000')) amount = 50000;
    }

    // 3. Extract Currency
    let currency: CurrencyCode = defaultCurrency;
    if (lower.includes('dollar') || lower.includes('$')) currency = 'USD';
    else if (lower.includes('euro') || lower.includes('€')) currency = 'EUR';
    else if (lower.includes('pound') || lower.includes('£')) currency = 'GBP';
    else if (lower.includes('rupee') || lower.includes('rs') || lower.includes('inr') || lower.includes('₹')) currency = 'INR';

    // 4. Extract Account
    let accountName = accounts[0]?.name || 'HDFC Salary Account';
    const cashAcc = accounts.find((a) => a.type === 'cash');
    const upiAcc = accounts.find((a) => a.type === 'upi_wallet');
    const ccAcc = accounts.find((a) => a.type === 'credit_card');
    const bankAcc = accounts.find((a) => a.type === 'bank');

    if (lower.includes('cash')) {
      accountName = cashAcc?.name || 'Physical Cash Wallet';
    } else if (lower.includes('upi') || lower.includes('paytm') || lower.includes('gpay') || lower.includes('phonepe')) {
      accountName = upiAcc?.name || 'Paytm & UPI Wallet';
    } else if (lower.includes('credit card') || lower.includes('regalia') || lower.includes('card')) {
      accountName = ccAcc?.name || 'Regalia Gold Card';
    } else if (lower.includes('icici')) {
      const icici = accounts.find((a) => a.name.toLowerCase().includes('icici'));
      if (icici) accountName = icici.name;
    } else if (lower.includes('hdfc') || lower.includes('salary') || lower.includes('bank')) {
      accountName = bankAcc?.name || 'HDFC Salary Account';
    }

    // 5. Extract Category and Description
    let category = 'Food & Dining';
    let description = 'General Transaction';

    if (type === 'income') {
      category = 'Salary';
      description = 'Salary Income';
      if (lower.includes('freelance') || lower.includes('client')) {
        category = 'Freelance & Consulting';
        description = 'Freelance Payment';
      }
    } else if (type === 'credit_card_payment') {
      category = 'Credit Card Payment';
      description = 'Credit Card Bill Payment';
    } else if (type === 'transfer') {
      category = 'Transfer';
      description = 'Account Transfer';
    } else {
      // Expense categories
      if (lower.includes('lunch')) {
        category = 'Food & Dining';
        description = 'Lunch';
      } else if (lower.includes('dinner')) {
        category = 'Food & Dining';
        description = 'Dinner';
      } else if (lower.includes('breakfast') || lower.includes('coffee') || lower.includes('tea') || lower.includes('snack')) {
        category = 'Food & Dining';
        description = 'Coffee & Snacks';
      } else if (lower.includes('grocery') || lower.includes('vegetable') || lower.includes('supermarket')) {
        category = 'Food & Dining';
        description = 'Groceries';
      } else if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('delivery')) {
        category = 'Food & Dining';
        description = 'Food Delivery';
      } else if (lower.includes('cab') || lower.includes('uber') || lower.includes('ola') || lower.includes('taxi')) {
        category = 'Transport';
        description = 'Cab Ride';
      } else if (lower.includes('petrol') || lower.includes('fuel') || lower.includes('diesel')) {
        category = 'Transport';
        description = 'Fuel';
      } else if (lower.includes('movie') || lower.includes('cinema') || lower.includes('netflix') || lower.includes('spotify')) {
        category = 'Entertainment';
        description = 'Entertainment & Leisure';
      } else if (lower.includes('rent')) {
        category = 'Rent & Housing';
        description = 'Apartment Rent';
      } else if (lower.includes('electricity') || lower.includes('power') || lower.includes('wifi') || lower.includes('internet') || lower.includes('bill')) {
        category = 'Bills & Utilities';
        description = 'Utility Bill';
      } else if (lower.includes('shirt') || lower.includes('shoes') || lower.includes('zara') || lower.includes('shopping') || lower.includes('amazon')) {
        category = 'Shopping';
        description = 'Shopping Purchase';
      } else if (lower.includes('medicine') || lower.includes('doctor') || lower.includes('hospital')) {
        category = 'Health';
        description = 'Health & Medical';
      } else {
        // Fallback description based on trailing words
        category = 'Food & Dining';
        description = 'Voice Recorded Expense';
      }
    }

    return {
      type,
      amount: amount || 250,
      currency,
      category,
      account: accountName,
      description,
      date: new Date().toISOString().slice(0, 10),
      confidence: amount > 0 ? 0.95 : 0.7,
      rawTranscript: raw,
    };
  }
}
