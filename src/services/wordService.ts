import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import type { Invoice, CompanyInfo } from '../types';
import { formatCurrency } from '../utils/invoiceCalculations';
import { format } from 'date-fns';

export const generateInvoiceWord = async (invoice: Invoice, companyInfo: CompanyInfo): Promise<void> => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Company Name
          new Paragraph({
            children: [
              new TextRun({
                text: companyInfo.name,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Company Details
          new Paragraph({
            children: [new TextRun({ text: companyInfo.address })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `${companyInfo.postalCode} ${companyInfo.city}` })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Org.nr: ${companyInfo.organizationNumber}` })],
          }),
          new Paragraph({
            children: [new TextRun({ text: companyInfo.email })],
            spacing: { after: 400 },
          }),

          // Invoice Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'FAKTURA',
                bold: true,
                size: 48,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Invoice Info
          new Paragraph({
            children: [new TextRun({ text: `Fakturanummer: ${invoice.invoiceNumber}`, bold: true })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Fakturadatum: ${format(new Date(invoice.invoiceDate), 'yyyy-MM-dd')}`,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Förfallodatum: ${format(new Date(invoice.dueDate), 'yyyy-MM-dd')}`,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Betalningsvillkor: ${invoice.paymentTerms} dagar` })],
            spacing: { after: 400 },
          }),

          // Customer Info
          new Paragraph({
            children: [new TextRun({ text: 'Till:', bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: invoice.customer.name })],
          }),
          new Paragraph({
            children: [new TextRun({ text: invoice.customer.address })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `${invoice.customer.postalCode} ${invoice.customer.city}` })],
          }),
          ...(invoice.customer.organizationNumber
            ? [
                new Paragraph({
                  children: [new TextRun({ text: `Org.nr: ${invoice.customer.organizationNumber}` })],
                }),
              ]
            : []),
          new Paragraph({
            text: '',
            spacing: { after: 400 },
          }),

          // Items Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Header
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Beskrivning', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Antal', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Pris', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Moms %', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Summa', bold: true })] })],
                  }),
                ],
              }),
              // Items
              ...invoice.items.map(
                (item) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph(item.description)],
                      }),
                      new TableCell({
                        children: [new Paragraph(item.quantity.toString())],
                      }),
                      new TableCell({
                        children: [new Paragraph(formatCurrency(item.unitPrice, invoice.currency))],
                      }),
                      new TableCell({
                        children: [new Paragraph(`${item.vatRate}%`)],
                      }),
                      new TableCell({
                        children: [new Paragraph(formatCurrency(item.quantity * item.unitPrice, invoice.currency))],
                      }),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({
            text: '',
            spacing: { after: 200 },
          }),

          // Totals
          new Paragraph({
            children: [
              new TextRun({ text: 'Delsumma: ' }),
              new TextRun({ text: formatCurrency(invoice.subtotal, invoice.currency), bold: true }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Moms: ' }),
              new TextRun({ text: formatCurrency(invoice.vatAmount, invoice.currency), bold: true }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Att betala: ', size: 28 }),
              new TextRun({
                text: formatCurrency(invoice.total, invoice.currency),
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),

          // Payment Info
          new Paragraph({
            children: [new TextRun({ text: 'Betalningsinformation:', bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Bankgiro/Plusgiro: ${companyInfo.bankAccount}` })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `OCR/Meddelande: ${invoice.invoiceNumber}` })],
            spacing: { after: 400 },
          }),

          // Notes
          ...(invoice.notes
            ? [
                new Paragraph({
                  children: [new TextRun({ text: 'Meddelande:', bold: true })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: invoice.notes })],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Faktura-${invoice.invoiceNumber}.docx`);
};
