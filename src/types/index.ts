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

// Quote/Proposal System Types
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // Percentage (25, 12, 6, 0)
  total: number;
  category?: string; // For organizing items
  notes?: string; // Optional notes for this line item
}

export interface QuoteItemTemplate {
  id: string;
  name: string;
  description: string;
  defaultQuantity: number;
  defaultUnitPrice: number;
  defaultVatRate: number;
  category: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer: Customer;
  items: QuoteItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  validUntil: Date; // Quote expiration date
  quoteDate: Date;
  deliveryTime?: string; // e.g., "2-3 weeks"
  paymentTerms?: string; // e.g., "50% upfront, 50% on delivery"
  notes?: string;
  internalNotes?: string; // Notes not visible to customer
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  respondedAt?: Date;
  convertedToInvoiceId?: string; // If converted to invoice
  discount?: number; // Percentage discount
  discountAmount?: number; // Fixed discount amount
}

export type QuoteStatus = Quote['status'];
