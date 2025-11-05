import jsPDF from 'jspdf';
import type { Quote, CompanyInfo } from '../types';
import { formatCurrency, calculateQuoteTotals } from '../utils/quoteCalculations';
import { format } from 'date-fns';

export const generateQuotePDF = (quote: Quote, companyInfo: CompanyInfo): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Add logo if available
  if (companyInfo.logo) {
    try {
      doc.addImage(companyInfo.logo, 'PNG', 15, yPos, 40, 20);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
    yPos += 25;
  }

  // Company Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.address, 15, yPos);
  yPos += 5;
  doc.text(`${companyInfo.postalCode} ${companyInfo.city}`, 15, yPos);
  yPos += 5;
  doc.text(`Org.nr: ${companyInfo.organizationNumber}`, 15, yPos);
  yPos += 5;
  doc.text(`${companyInfo.email}`, 15, yPos);
  yPos += 10;

  // Quote Title (in blue)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text('QUOTE', pageWidth - 15, 30, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Reset to black

  // Quote Info Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoBoxX = pageWidth - 70;
  let infoY = 40;
  doc.text(`Quote Number: ${quote.quoteNumber}`, infoBoxX, infoY);
  infoY += 5;
  doc.text(`Quote Date: ${format(new Date(quote.quoteDate), 'yyyy-MM-dd')}`, infoBoxX, infoY);
  infoY += 5;
  // Valid Until in red/orange to emphasize
  doc.setTextColor(239, 68, 68); // Red color
  doc.setFont('helvetica', 'bold');
  doc.text(`Valid Until: ${format(new Date(quote.validUntil), 'yyyy-MM-dd')}`, infoBoxX, infoY);
  doc.setTextColor(0, 0, 0); // Reset to black
  doc.setFont('helvetica', 'normal');
  infoY += 5;

  if (quote.deliveryTime) {
    doc.text(`Delivery Time: ${quote.deliveryTime}`, infoBoxX, infoY);
    infoY += 5;
  }

  yPos = Math.max(yPos, infoY + 10);

  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text('To:', 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(quote.customer.name, 15, yPos);
  yPos += 5;
  doc.text(quote.customer.address, 15, yPos);
  yPos += 5;
  doc.text(`${quote.customer.postalCode} ${quote.customer.city}`, 15, yPos);
  if (quote.customer.organizationNumber) {
    yPos += 5;
    doc.text(`Org.nr: ${quote.customer.organizationNumber}`, 15, yPos);
  }
  yPos += 15;

  // Items Table Header
  const hasCategories = quote.items.some(item => item.category);
  const tableStartY = yPos;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, tableStartY, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');

  if (hasCategories) {
    doc.text('Description', 17, tableStartY + 5);
    doc.text('Cat.', pageWidth - 105, tableStartY + 5, { align: 'right' });
    doc.text('Qty', pageWidth - 80, tableStartY + 5, { align: 'right' });
    doc.text('Price', pageWidth - 60, tableStartY + 5, { align: 'right' });
    doc.text('VAT %', pageWidth - 40, tableStartY + 5, { align: 'right' });
    doc.text('Total', pageWidth - 17, tableStartY + 5, { align: 'right' });
  } else {
    doc.text('Description', 17, tableStartY + 5);
    doc.text('Qty', pageWidth - 90, tableStartY + 5, { align: 'right' });
    doc.text('Price', pageWidth - 65, tableStartY + 5, { align: 'right' });
    doc.text('VAT %', pageWidth - 40, tableStartY + 5, { align: 'right' });
    doc.text('Total', pageWidth - 17, tableStartY + 5, { align: 'right' });
  }

  yPos = tableStartY + 12;
  doc.setFont('helvetica', 'normal');

  // Items
  quote.items.forEach((item) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const descMaxWidth = hasCategories ? 85 : 105;
    const descLines = doc.splitTextToSize(item.description, descMaxWidth);

    if (hasCategories) {
      doc.text(descLines, 17, yPos);
      if (item.category) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(item.category.substring(0, 10), pageWidth - 105, yPos, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(item.quantity.toString(), pageWidth - 80, yPos, { align: 'right' });
      doc.text(formatCurrency(item.unitPrice, quote.currency), pageWidth - 60, yPos, { align: 'right' });
      doc.text(`${item.vatRate}%`, pageWidth - 40, yPos, { align: 'right' });
      doc.text(formatCurrency(item.total, quote.currency), pageWidth - 17, yPos, { align: 'right' });
    } else {
      doc.text(descLines, 17, yPos);
      doc.text(item.quantity.toString(), pageWidth - 90, yPos, { align: 'right' });
      doc.text(formatCurrency(item.unitPrice, quote.currency), pageWidth - 65, yPos, { align: 'right' });
      doc.text(`${item.vatRate}%`, pageWidth - 40, yPos, { align: 'right' });
      doc.text(formatCurrency(item.total, quote.currency), pageWidth - 17, yPos, { align: 'right' });
    }

    yPos += descLines.length * 5 + 2;
  });

  // Calculate totals
  const totals = calculateQuoteTotals(quote.items, quote.discount, quote.discountAmount);

  // Totals
  yPos += 5;
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 70, yPos);
  doc.text(formatCurrency(totals.subtotal, quote.currency), pageWidth - 17, yPos, { align: 'right' });
  yPos += 6;

  // Show discount if applied
  if (totals.discountApplied > 0) {
    doc.setTextColor(16, 185, 129); // Green color
    doc.text(`Discount ${quote.discount ? `(${quote.discount}%)` : ''}:`, pageWidth - 70, yPos);
    doc.text(`-${formatCurrency(totals.discountApplied, quote.currency)}`, pageWidth - 17, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    yPos += 6;
  }

  doc.text('VAT:', pageWidth - 70, yPos);
  doc.text(formatCurrency(totals.vatAmount, quote.currency), pageWidth - 17, yPos, { align: 'right' });
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text('Total:', pageWidth - 70, yPos);
  doc.text(formatCurrency(totals.total, quote.currency), pageWidth - 17, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Reset to black

  // Payment Terms
  if (quote.paymentTerms) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const splitTerms = doc.splitTextToSize(quote.paymentTerms, pageWidth - 30);
    doc.text(splitTerms, 15, yPos);
    yPos += splitTerms.length * 5;
  }

  // Notes
  if (quote.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - 30);
    doc.text(splitNotes, 15, yPos);
    yPos += splitNotes.length * 5;
  }

  // Footer with validity reminder
  yPos += 10;
  if (yPos > 270) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `This quote is valid until ${format(new Date(quote.validUntil), 'yyyy-MM-dd')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 5;
  doc.text(
    `For questions, contact us at ${companyInfo.email} or ${companyInfo.phone}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  return doc;
};

export const downloadQuotePDF = (quote: Quote, companyInfo: CompanyInfo): void => {
  const doc = generateQuotePDF(quote, companyInfo);
  doc.save(`Quote-${quote.quoteNumber}.pdf`);
};
