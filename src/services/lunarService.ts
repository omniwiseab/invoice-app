import axios from 'axios';
import type { LunarBankConfig, PaymentRecord } from '../types';
import { generateId } from '../utils/generateId';

const LUNAR_API_BASE = 'https://api.lunar.app/v1';

interface LunarTransaction {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  reference?: string;
  counterparty?: {
    name: string;
  };
}

export class LunarBankService {
  private apiKey: string;
  private accountId: string;

  constructor(config: LunarBankConfig) {
    this.apiKey = config.apiKey;
    this.accountId = config.accountId;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getRecentTransactions(days: number = 30): Promise<LunarTransaction[]> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await axios.get(`${LUNAR_API_BASE}/accounts/${this.accountId}/transactions`, {
        headers: this.getHeaders(),
        params: {
          from: fromDate.toISOString(),
          limit: 100,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Lunar transactions:', error);
      throw error;
    }
  }

  async matchPaymentToInvoice(invoiceNumber: string, amount: number): Promise<LunarTransaction | null> {
    try {
      const transactions = await this.getRecentTransactions(90);

      // Try to match by reference (OCR number) or amount
      const match = transactions.find((tx) => {
        const amountMatches = Math.abs(tx.amount - amount) < 0.01;
        const referenceMatches = tx.reference?.includes(invoiceNumber);
        return amountMatches || referenceMatches;
      });

      return match || null;
    } catch (error) {
      console.error('Error matching payment:', error);
      return null;
    }
  }

  async createPaymentRecord(transaction: LunarTransaction, invoiceId: string): Promise<PaymentRecord> {
    return {
      id: generateId(),
      invoiceId,
      amount: transaction.amount,
      currency: transaction.currency,
      date: new Date(transaction.createdAt),
      method: 'bank_transfer',
      reference: transaction.reference,
      lunarTransactionId: transaction.id,
    };
  }

  async syncPayments(invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>) {
    const payments: PaymentRecord[] = [];

    try {
      const transactions = await this.getRecentTransactions(90);

      for (const invoice of invoices) {
        if (invoice.status === 'paid') continue;

        const match = transactions.find((tx) => {
          const amountMatches = Math.abs(tx.amount - invoice.total) < 0.01;
          const referenceMatches = tx.reference?.includes(invoice.invoiceNumber);
          return amountMatches || referenceMatches;
        });

        if (match) {
          const payment = await this.createPaymentRecord(match, invoice.id);
          payments.push(payment);
        }
      }

      return payments;
    } catch (error) {
      console.error('Error syncing payments:', error);
      return payments;
    }
  }

  async getAccountBalance(): Promise<{ balance: number; currency: string } | null> {
    try {
      const response = await axios.get(`${LUNAR_API_BASE}/accounts/${this.accountId}`, {
        headers: this.getHeaders(),
      });

      return {
        balance: response.data.data.balance,
        currency: response.data.data.currency,
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return null;
    }
  }
}

// Example usage:
// const lunarService = new LunarBankService(lunarConfig);
// const payments = await lunarService.syncPayments(unpaidInvoices);

export const createLunarService = (config: LunarBankConfig | null): LunarBankService | null => {
  if (!config || !config.enabled || !config.apiKey || !config.accountId) {
    return null;
  }
  return new LunarBankService(config);
};
