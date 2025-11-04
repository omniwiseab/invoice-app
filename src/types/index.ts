export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  organizationNumber?: string;
  group?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // Percentage (25, 12, 6, 0)
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  dueDate: Date;
  invoiceDate: Date;
  paymentTerms: number; // Days
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  paidAt?: Date;
  reminderSentAt?: Date;
}

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  organizationNumber: string;
  vatNumber: string;
  bankAccount: string;
  logo?: string; // Base64 encoded image
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  layout: 'modern' | 'classic' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

export interface LunarBankConfig {
  apiKey: string;
  accountId: string;
  enabled: boolean;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  date: Date;
  method: 'bank_transfer' | 'card' | 'cash' | 'other';
  reference?: string;
  lunarTransactionId?: string;
}
