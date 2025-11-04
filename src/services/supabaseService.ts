import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Customer, Invoice, CompanyInfo, PaymentRecord } from '../types';

export class SupabaseService {
  // Customers
  async getCustomers(userId: string): Promise<Customer[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return data.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      postalCode: c.postal_code,
      country: c.country,
      organizationNumber: c.organization_number,
      group: c.group_name,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
    }));
  }

  async createCustomer(userId: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postal_code: customer.postalCode,
        country: customer.country,
        organization_number: customer.organizationNumber,
        group_name: customer.group,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
      organizationNumber: data.organization_number,
      group: data.group_name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
        city: updates.city,
        postal_code: updates.postalCode,
        country: updates.country,
        organization_number: updates.organizationNumber,
        group_name: updates.group,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating customer:', error);
      return false;
    }

    return true;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return false;
    }

    return true;
  }

  // Invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    if (!supabase) return [];

    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        items:invoice_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return [];
    }

    return invoicesData.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerId: inv.customer_id,
      customer: {
        id: inv.customer.id,
        name: inv.customer.name,
        email: inv.customer.email,
        phone: inv.customer.phone,
        address: inv.customer.address,
        city: inv.customer.city,
        postalCode: inv.customer.postal_code,
        country: inv.customer.country,
        organizationNumber: inv.customer.organization_number,
        group: inv.customer.group_name,
        createdAt: new Date(inv.customer.created_at),
        updatedAt: new Date(inv.customer.updated_at),
      },
      items: inv.items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unit_price),
        vatRate: parseFloat(item.vat_rate),
        total: parseFloat(item.total),
      })),
      subtotal: parseFloat(inv.subtotal),
      vatAmount: parseFloat(inv.vat_amount),
      total: parseFloat(inv.total),
      currency: inv.currency,
      invoiceDate: new Date(inv.invoice_date),
      dueDate: new Date(inv.due_date),
      paymentTerms: inv.payment_terms,
      notes: inv.notes,
      status: inv.status,
      createdAt: new Date(inv.created_at),
      updatedAt: new Date(inv.updated_at),
      sentAt: inv.sent_at ? new Date(inv.sent_at) : undefined,
      paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
      reminderSentAt: inv.reminder_sent_at ? new Date(inv.reminder_sent_at) : undefined,
    }));
  }

  async createInvoice(userId: string, invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice | null> {
    if (!supabase) return null;

    // Insert invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        invoice_number: invoice.invoiceNumber,
        customer_id: invoice.customerId,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vatAmount,
        total: invoice.total,
        currency: invoice.currency,
        invoice_date: invoice.invoiceDate.toISOString().split('T')[0],
        due_date: invoice.dueDate.toISOString().split('T')[0],
        payment_terms: invoice.paymentTerms,
        notes: invoice.notes,
        status: invoice.status,
        sent_at: invoice.sentAt?.toISOString(),
        paid_at: invoice.paidAt?.toISOString(),
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return null;
    }

    // Insert invoice items
    const itemsToInsert = invoice.items.map((item, index) => ({
      invoice_id: invoiceData.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
      total: item.total,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError);
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoiceData.id);
      return null;
    }

    // Fetch complete invoice with relations
    const invoices = await this.getInvoices(userId);
    return invoices.find(inv => inv.id === invoiceData.id) || null;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.sentAt) updateData.sent_at = updates.sentAt.toISOString();
    if (updates.paidAt) updateData.paid_at = updates.paidAt.toISOString();
    if (updates.reminderSentAt) updateData.reminder_sent_at = updates.reminderSentAt.toISOString();

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating invoice:', error);
      return false;
    }

    return true;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    if (!supabase) return false;

    // Items will be deleted automatically due to CASCADE
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }

    return true;
  }

  // Company Info
  async getCompanyInfo(userId: string): Promise<CompanyInfo | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows

    if (error) {
      console.error('Error fetching company info:', error);
      return null;
    }

    if (!data) return null; // No company info found

    return {
      name: data.name,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
      phone: data.phone,
      email: data.email,
      website: data.website,
      organizationNumber: data.organization_number,
      vatNumber: data.vat_number,
      bankAccount: data.bank_account,
      logo: data.logo_url,
    };
  }

  async saveCompanyInfo(userId: string, info: CompanyInfo): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('company_info')
      .upsert({
        user_id: userId,
        name: info.name,
        address: info.address,
        city: info.city,
        postal_code: info.postalCode,
        country: info.country,
        phone: info.phone,
        email: info.email,
        website: info.website,
        organization_number: info.organizationNumber,
        vat_number: info.vatNumber,
        bank_account: info.bankAccount,
        logo_url: info.logo,
      });

    if (error) {
      console.error('Error saving company info:', error);
      return false;
    }

    return true;
  }
}

export const supabaseService = new SupabaseService();
export { isSupabaseConfigured };
