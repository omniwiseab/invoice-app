import { supabaseService } from '../services/supabaseService';
import type { Customer, Invoice, CompanyInfo } from '../types';

export const migrateLocalStorageToSupabase = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Läs data från localStorage
    const localData = localStorage.getItem('invoice-app-storage');

    if (!localData) {
      return { success: false, message: 'Ingen data hittades i localStorage' };
    }

    console.log('LocalStorage data:', localData);
    const parsedData = JSON.parse(localData);
    console.log('Parsed data:', parsedData);

    // Hantera olika localStorage-strukturer
    let customers: Customer[] = [];
    let invoices: Invoice[] = [];
    let companyInfo: CompanyInfo | null = null;

    // Zustand persist kan lagra data på olika sätt
    if (parsedData.state) {
      customers = parsedData.state.customers || [];
      invoices = parsedData.state.invoices || [];
      companyInfo = parsedData.state.companyInfo || null;
    } else {
      customers = parsedData.customers || [];
      invoices = parsedData.invoices || [];
      companyInfo = parsedData.companyInfo || null;
    }

    console.log('Customers to migrate:', customers);
    console.log('Invoices to migrate:', invoices);

    // Säkerställ att customers är en array
    if (!Array.isArray(customers)) {
      console.error('Customers is not an array:', customers);
      return { success: false, message: 'Ogiltig datastruktur: customers är inte en array' };
    }

    if (!Array.isArray(invoices)) {
      console.error('Invoices is not an array:', invoices);
      return { success: false, message: 'Ogiltig datastruktur: invoices är inte en array' };
    }

    let customersCreated = 0;
    let invoicesCreated = 0;
    let errors: string[] = [];

    // Migrera företagsinformation först
    if (companyInfo) {
      const success = await supabaseService.saveCompanyInfo(userId, companyInfo);
      if (!success) {
        errors.push('Kunde inte spara företagsinformation');
      }
    }

    // Migrera kunder
    const customerIdMap = new Map<string, string>(); // Old ID -> New ID mapping

    for (const customer of customers) {
      const { id, createdAt, updatedAt, ...customerData } = customer;
      const newCustomer = await supabaseService.createCustomer(userId, customerData);

      if (newCustomer) {
        customerIdMap.set(id, newCustomer.id);
        customersCreated++;
        console.log(`Created customer: ${newCustomer.name} (${id} -> ${newCustomer.id})`);
      } else {
        errors.push(`Kunde inte skapa kund: ${customer.name}`);
      }
    }

    // Migrera fakturor
    for (const invoice of invoices) {
      const { id, createdAt, updatedAt, customer, ...invoiceData } = invoice;

      // Använd den nya kund-ID:t från mappningen
      const newCustomerId = customerIdMap.get(invoice.customerId);
      if (!newCustomerId) {
        errors.push(`Kunde inte hitta kund för faktura: ${invoice.invoiceNumber}`);
        continue;
      }

      const newInvoice = await supabaseService.createInvoice(userId, {
        ...invoiceData,
        customerId: newCustomerId,
      });

      if (newInvoice) {
        invoicesCreated++;
        console.log(`Created invoice: ${newInvoice.invoiceNumber}`);
      } else {
        errors.push(`Kunde inte skapa faktura: ${invoice.invoiceNumber}`);
      }
    }

    const message = `${customersCreated} kunder och ${invoicesCreated} fakturor migrerade.${errors.length > 0 ? ` Fel: ${errors.join(', ')}` : ''}`;

    return { success: true, message };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, message: `Migration misslyckades: ${error}` };
  }
};
