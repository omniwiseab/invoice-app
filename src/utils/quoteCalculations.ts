import type { Quote, QuoteItem, QuoteStatus } from '../types';

/**
 * Calculate the total for a quote item
 */
export function calculateQuoteItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * Calculate VAT amount for a quote item
 */
export function calculateQuoteItemVat(total: number, vatRate: number): number {
  return (total * vatRate) / 100;
}

/**
 * Calculate quote totals (subtotal, VAT, total)
 */
export function calculateQuoteTotals(items: QuoteItem[], discount?: number, discountAmount?: number): {
  subtotal: number;
  vatAmount: number;
  total: number;
  discountApplied: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // Apply discount
  let discountApplied = 0;
  if (discountAmount) {
    discountApplied = discountAmount;
  } else if (discount) {
    discountApplied = (subtotal * discount) / 100;
  }

  const subtotalAfterDiscount = subtotal - discountApplied;

  const vatAmount = items.reduce((sum, item) => {
    const itemVat = calculateQuoteItemVat(item.total, item.vatRate);
    return sum + itemVat;
  }, 0);

  // Adjust VAT if discount is applied
  const vatAfterDiscount = discountApplied > 0
    ? (vatAmount * subtotalAfterDiscount) / subtotal
    : vatAmount;

  const total = subtotalAfterDiscount + vatAfterDiscount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAfterDiscount * 100) / 100,
    total: Math.round(total * 100) / 100,
    discountApplied: Math.round(discountApplied * 100) / 100,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get quote status with color
 */
export function getQuoteStatus(quote: Quote): {
  status: QuoteStatus;
  label: string;
  color: string;
} {
  const now = new Date();
  const validUntil = new Date(quote.validUntil);

  // Check if quote is expired but status hasn't been updated
  if (quote.status === 'sent' && validUntil < now) {
    return {
      status: 'expired',
      label: 'Expired',
      color: '#6B7280', // gray
    };
  }

  switch (quote.status) {
    case 'draft':
      return {
        status: 'draft',
        label: 'Draft',
        color: '#9CA3AF', // gray
      };
    case 'sent':
      return {
        status: 'sent',
        label: 'Sent',
        color: '#3B82F6', // blue
      };
    case 'accepted':
      return {
        status: 'accepted',
        label: 'Accepted',
        color: '#10B981', // green
      };
    case 'rejected':
      return {
        status: 'rejected',
        label: 'Rejected',
        color: '#EF4444', // red
      };
    case 'expired':
      return {
        status: 'expired',
        label: 'Expired',
        color: '#6B7280', // gray
      };
    case 'converted':
      return {
        status: 'converted',
        label: 'Converted',
        color: '#8B5CF6', // purple
      };
    default:
      return {
        status: 'draft',
        label: 'Draft',
        color: '#9CA3AF',
      };
  }
}

/**
 * Generate quote number
 */
export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `QUO-${year}${month}-${random}`;
}

/**
 * Check if quote is expired
 */
export function isQuoteExpired(quote: Quote): boolean {
  if (quote.status !== 'sent') return false;
  const now = new Date();
  const validUntil = new Date(quote.validUntil);
  return validUntil < now;
}

/**
 * Check if quote can be edited
 */
export function canEditQuote(quote: Quote): boolean {
  return quote.status === 'draft';
}

/**
 * Check if quote can be deleted
 */
export function canDeleteQuote(quote: Quote): boolean {
  return quote.status === 'draft' || quote.status === 'rejected' || quote.status === 'expired';
}

/**
 * Check if quote can be converted to invoice
 */
export function canConvertToInvoice(quote: Quote): boolean {
  return quote.status === 'accepted' && !quote.convertedToInvoiceId;
}

/**
 * Get days until expiration
 */
export function getDaysUntilExpiration(quote: Quote): number {
  const now = new Date();
  const validUntil = new Date(quote.validUntil);
  const diffTime = validUntil.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
