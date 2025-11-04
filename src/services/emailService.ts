import type { Invoice, EmailConfig, CompanyInfo } from '../types';
import { generateInvoicePDF } from './pdfService';

// Note: Email sending from browser requires a backend service
// This is a mock implementation that shows the structure
export const sendInvoiceEmail = async (
  invoice: Invoice,
  emailConfig: EmailConfig,
  companyInfo: CompanyInfo
): Promise<boolean> => {
  try {
    // Generate PDF as base64
    const pdf = generateInvoicePDF(invoice, companyInfo);
    const pdfBlob = pdf.output('blob');
    const pdfBase64 = await blobToBase64(pdfBlob);

    // In a real application, this would call your backend API
    // which would then send the email using nodemailer, sendgrid, etc.
    const emailData = {
      to: invoice.customer.email,
      from: {
        email: emailConfig.fromEmail,
        name: emailConfig.fromName,
      },
      subject: `Faktura ${invoice.invoiceNumber} från ${companyInfo.name}`,
      html: generateEmailHTML(invoice, companyInfo),
      attachments: [
        {
          filename: `Faktura-${invoice.invoiceNumber}.pdf`,
          content: pdfBase64,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    // Mock API call - replace with your actual backend endpoint
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const generateEmailHTML = (invoice: Invoice, companyInfo: CompanyInfo): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3B82F6;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .invoice-details {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .invoice-details table {
          width: 100%;
        }
        .invoice-details td {
          padding: 8px 0;
        }
        .invoice-details td:first-child {
          font-weight: bold;
          width: 40%;
        }
        .button {
          display: inline-block;
          background-color: #3B82F6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ny Faktura</h1>
        </div>
        <div class="content">
          <p>Hej ${invoice.customer.name},</p>
          <p>Bifogat finner du faktura från ${companyInfo.name}.</p>

          <div class="invoice-details">
            <table>
              <tr>
                <td>Fakturanummer:</td>
                <td>${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td>Fakturadatum:</td>
                <td>${new Date(invoice.invoiceDate).toLocaleDateString('sv-SE')}</td>
              </tr>
              <tr>
                <td>Förfallodatum:</td>
                <td>${new Date(invoice.dueDate).toLocaleDateString('sv-SE')}</td>
              </tr>
              <tr>
                <td>Belopp att betala:</td>
                <td><strong>${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: invoice.currency }).format(invoice.total)}</strong></td>
              </tr>
            </table>
          </div>

          <h3>Betalningsinformation:</h3>
          <p>
            <strong>Bankgiro/Plusgiro:</strong> ${companyInfo.bankAccount}<br>
            <strong>OCR/Meddelande:</strong> ${invoice.invoiceNumber}
          </p>

          ${invoice.notes ? `<p><strong>Meddelande:</strong><br>${invoice.notes}</p>` : ''}

          <p>Vid frågor, kontakta oss gärna på ${companyInfo.email} eller ${companyInfo.phone}.</p>

          <div class="footer">
            <p>
              ${companyInfo.name}<br>
              ${companyInfo.address}, ${companyInfo.postalCode} ${companyInfo.city}<br>
              Org.nr: ${companyInfo.organizationNumber}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Mock backend API endpoint structure
// You would need to implement this on your server
export const mockEmailAPIEndpoint = `
// Example Express.js backend endpoint
const nodemailer = require('nodemailer');

app.post('/api/send-email', async (req, res) => {
  const { to, from, subject, html, attachments } = req.body;

  // Configure your email transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: \`"\${from.name}" <\${from.email}>\`,
      to,
      subject,
      html,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.type,
      })),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
`;
