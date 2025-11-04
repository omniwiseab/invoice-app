import type { InvoiceItem, Invoice } from '../types';

export const calculateItemTotal = (item: InvoiceItem): number => {
  return item.quantity * item.unitPrice;
};

export const calculateItemVat = (item: InvoiceItem): number => {
  const total = calculateItemTotal(item);
  return (total * item.vatRate) / 100;
};

export const calculateInvoiceTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const vatAmount = items.reduce((sum, item) => sum + calculateItemVat(item), 0);
  const total = subtotal + vatAmount;

  return {
    subtotal,
    vatAmount,
    total,
  };
};

export const generateInvoiceNumber = (lastInvoiceNumber?: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  if (!lastInvoiceNumber) {
    return `INV-${year}${month}-0001`;
  }

  const parts = lastInvoiceNumber.split('-');
  const lastNumber = parseInt(parts[2] || '0', 10);
  const newNumber = String(lastNumber + 1).padStart(4, '0');

  return `INV-${year}${month}-${newNumber}`;
};

export const formatCurrency = (amount: number, currency: string = 'SEK'): string => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const getInvoiceStatus = (invoice: Invoice): Invoice['status'] => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return invoice.status;
  }

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);

  if (invoice.status === 'sent' && now > dueDate) {
    return 'overdue';
  }

  return invoice.status;
};
