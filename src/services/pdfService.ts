import jsPDF from 'jspdf';
import type { Invoice, CompanyInfo } from '../types';
import { formatCurrency } from '../utils/invoiceCalculations';
import { format } from 'date-fns';

export const generateInvoicePDF = (invoice: Invoice, companyInfo: CompanyInfo): jsPDF => {
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

  // Invoice Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FAKTURA', pageWidth - 15, 30, { align: 'right' });

  // Invoice Info Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoBoxX = pageWidth - 70;
  let infoY = 40;
  doc.text(`Fakturanummer: ${invoice.invoiceNumber}`, infoBoxX, infoY);
  infoY += 5;
  doc.text(`Fakturadatum: ${format(new Date(invoice.invoiceDate), 'yyyy-MM-dd')}`, infoBoxX, infoY);
  infoY += 5;
  doc.text(`Förfallodatum: ${format(new Date(invoice.dueDate), 'yyyy-MM-dd')}`, infoBoxX, infoY);
  infoY += 5;
  doc.text(`Betalningsvillkor: ${invoice.paymentTerms} dagar`, infoBoxX, infoY);

  yPos = Math.max(yPos, infoY + 10);

  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text('Till:', 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customer.name, 15, yPos);
  yPos += 5;
  doc.text(invoice.customer.address, 15, yPos);
  yPos += 5;
  doc.text(`${invoice.customer.postalCode} ${invoice.customer.city}`, 15, yPos);
  if (invoice.customer.organizationNumber) {
    yPos += 5;
    doc.text(`Org.nr: ${invoice.customer.organizationNumber}`, 15, yPos);
  }
  yPos += 15;

  // Items Table Header
  const tableStartY = yPos;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, tableStartY, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Beskrivning', 17, tableStartY + 5);
  doc.text('Antal', pageWidth - 90, tableStartY + 5, { align: 'right' });
  doc.text('Pris', pageWidth - 65, tableStartY + 5, { align: 'right' });
  doc.text('Moms %', pageWidth - 40, tableStartY + 5, { align: 'right' });
  doc.text('Summa', pageWidth - 17, tableStartY + 5, { align: 'right' });

  yPos = tableStartY + 12;
  doc.setFont('helvetica', 'normal');

  // Items
  invoice.items.forEach((item) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const itemTotal = item.quantity * item.unitPrice;
    doc.text(item.description, 17, yPos);
    doc.text(item.quantity.toString(), pageWidth - 90, yPos, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice, invoice.currency), pageWidth - 65, yPos, { align: 'right' });
    doc.text(`${item.vatRate}%`, pageWidth - 40, yPos, { align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), pageWidth - 17, yPos, { align: 'right' });
    yPos += 7;
  });

  // Totals
  yPos += 5;
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Delsumma:', pageWidth - 70, yPos);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 17, yPos, { align: 'right' });
  yPos += 6;

  doc.text('Moms:', pageWidth - 70, yPos);
  doc.text(formatCurrency(invoice.vatAmount, invoice.currency), pageWidth - 17, yPos, { align: 'right' });
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Att betala:', pageWidth - 70, yPos);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 17, yPos, { align: 'right' });

  // Payment Info
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Betalningsinformation:', 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Bankgiro/Plusgiro: ${companyInfo.bankAccount}`, 15, yPos);
  yPos += 5;
  doc.text(`OCR/Meddelande: ${invoice.invoiceNumber}`, 15, yPos);

  // Notes
  if (invoice.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Meddelande:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(splitNotes, 15, yPos);
  }

  return doc;
};

export const downloadInvoicePDF = (invoice: Invoice, companyInfo: CompanyInfo): void => {
  const doc = generateInvoicePDF(invoice, companyInfo);
  doc.save(`Faktura-${invoice.invoiceNumber}.pdf`);
};
