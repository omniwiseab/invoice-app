import type { Quote, Invoice, InvoiceItem } from '../types';
import { generateInvoiceNumber } from './invoiceCalculations';
import { generateId } from './generateId';

/**
 * Convert a quote to an invoice
 * @param quote - The accepted quote to convert
 * @param existingInvoices - List of existing invoices to generate next invoice number
 * @param defaultPaymentTerms - Default payment terms in days (default: 30)
 * @returns Invoice object ready to be created
 */
export function convertQuoteToInvoice(
  quote: Quote,
  existingInvoices: Invoice[],
  defaultPaymentTerms: number = 30
): Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> {
  // Parse payment terms from quote if available (e.g., "50% upfront, 50% on delivery" -> 30 days)
  let paymentTermsDays = defaultPaymentTerms;

  // Try to extract number of days from payment terms text
  if (quote.paymentTerms) {
    const daysMatch = quote.paymentTerms.match(/(\d+)\s*(days?|dagar?)/i);
    if (daysMatch) {
      paymentTermsDays = parseInt(daysMatch[1], 10);
    }
  }

  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  // Convert quote items to invoice items (regenerate IDs)
  const invoiceItems: InvoiceItem[] = quote.items.map(item => ({
    id: generateId(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
    total: item.total,
  }));

  // Generate next invoice number
  const lastInvoice = existingInvoices[existingInvoices.length - 1];
  const invoiceNumber = generateInvoiceNumber(lastInvoice?.invoiceNumber);

  // Build invoice notes from quote
  let invoiceNotes = quote.notes || '';

  // Add reference to original quote
  if (invoiceNotes) {
    invoiceNotes = `Quote: ${quote.quoteNumber}\n\n${invoiceNotes}`;
  } else {
    invoiceNotes = `Created from quote ${quote.quoteNumber}`;
  }

  // Add delivery time if specified
  if (quote.deliveryTime) {
    invoiceNotes += `\n\nExpected delivery: ${quote.deliveryTime}`;
  }

  const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
    invoiceNumber,
    customerId: quote.customerId,
    customer: quote.customer,
    items: invoiceItems,
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    total: quote.total,
    currency: quote.currency,
    invoiceDate,
    dueDate,
    paymentTerms: paymentTermsDays,
    notes: invoiceNotes,
    status: 'draft',
  };

  return invoice;
}
