import { supabase } from '../lib/supabase';
import type { Quote, QuoteItemTemplate } from '../types';

export class QuoteService {
  // Get all quotes for a user
  async getQuotes(userId: string): Promise<Quote[]> {
    if (!supabase) return [];

    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(*),
        items:quote_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      return [];
    }

    return quotesData.map(quote => ({
      id: quote.id,
      quoteNumber: quote.quote_number,
      customerId: quote.customer_id,
      customer: {
        id: quote.customer.id,
        name: quote.customer.name,
        email: quote.customer.email,
        phone: quote.customer.phone,
        address: quote.customer.address,
        city: quote.customer.city,
        postalCode: quote.customer.postal_code,
        country: quote.customer.country,
        organizationNumber: quote.customer.organization_number,
        group: quote.customer.group_name,
        createdAt: new Date(quote.customer.created_at),
        updatedAt: new Date(quote.customer.updated_at),
      },
      items: quote.items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unit_price),
        vatRate: parseFloat(item.vat_rate),
        total: parseFloat(item.total),
        category: item.category,
        notes: item.notes,
      })),
      subtotal: parseFloat(quote.subtotal),
      vatAmount: parseFloat(quote.vat_amount),
      total: parseFloat(quote.total),
      currency: quote.currency,
      quoteDate: new Date(quote.quote_date),
      validUntil: new Date(quote.valid_until),
      deliveryTime: quote.delivery_time,
      paymentTerms: quote.payment_terms,
      notes: quote.notes,
      internalNotes: quote.internal_notes,
      status: quote.status,
      discount: quote.discount ? parseFloat(quote.discount) : undefined,
      discountAmount: quote.discount_amount ? parseFloat(quote.discount_amount) : undefined,
      createdAt: new Date(quote.created_at),
      updatedAt: new Date(quote.updated_at),
      sentAt: quote.sent_at ? new Date(quote.sent_at) : undefined,
      respondedAt: quote.responded_at ? new Date(quote.responded_at) : undefined,
      convertedToInvoiceId: quote.converted_to_invoice_id,
    }));
  }

  // Create a new quote
  async createQuote(userId: string, quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote | null> {
    if (!supabase) return null;

    // Insert quote
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id: userId,
        quote_number: quote.quoteNumber,
        customer_id: quote.customerId,
        subtotal: quote.subtotal,
        vat_amount: quote.vatAmount,
        total: quote.total,
        currency: quote.currency,
        quote_date: quote.quoteDate.toISOString().split('T')[0],
        valid_until: quote.validUntil.toISOString().split('T')[0],
        delivery_time: quote.deliveryTime,
        payment_terms: quote.paymentTerms,
        notes: quote.notes,
        internal_notes: quote.internalNotes,
        status: quote.status,
        discount: quote.discount,
        discount_amount: quote.discountAmount,
        sent_at: quote.sentAt?.toISOString(),
        responded_at: quote.respondedAt?.toISOString(),
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return null;
    }

    // Insert quote items
    const itemsToInsert = quote.items.map((item, index) => ({
      quote_id: quoteData.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
      total: item.total,
      category: item.category,
      notes: item.notes,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating quote items:', itemsError);
      // Rollback quote creation
      await supabase.from('quotes').delete().eq('id', quoteData.id);
      return null;
    }

    // Fetch complete quote with relations
    const quotes = await this.getQuotes(userId);
    return quotes.find(q => q.id === quoteData.id) || null;
  }

  // Update a quote
  async updateQuote(id: string, updates: Partial<Quote>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.internalNotes !== undefined) updateData.internal_notes = updates.internalNotes;
    if (updates.sentAt) updateData.sent_at = updates.sentAt.toISOString();
    if (updates.respondedAt) updateData.responded_at = updates.respondedAt.toISOString();
    if (updates.convertedToInvoiceId) updateData.converted_to_invoice_id = updates.convertedToInvoiceId;
    if (updates.deliveryTime !== undefined) updateData.delivery_time = updates.deliveryTime;
    if (updates.paymentTerms !== undefined) updateData.payment_terms = updates.paymentTerms;
    if (updates.discount !== undefined) updateData.discount = updates.discount;
    if (updates.discountAmount !== undefined) updateData.discount_amount = updates.discountAmount;

    const { error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating quote:', error);
      return false;
    }

    return true;
  }

  // Delete a quote
  async deleteQuote(id: string): Promise<boolean> {
    if (!supabase) return false;

    // Items will be deleted automatically due to CASCADE
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quote:', error);
      return false;
    }

    return true;
  }

  // Get quote item templates
  async getQuoteItemTemplates(userId: string): Promise<QuoteItemTemplate[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('quote_item_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching quote item templates:', error);
      return [];
    }

    return data.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      defaultQuantity: parseFloat(template.default_quantity),
      defaultUnitPrice: parseFloat(template.default_unit_price),
      defaultVatRate: parseFloat(template.default_vat_rate),
      category: template.category,
      tags: template.tags || [],
      isActive: template.is_active,
      createdAt: new Date(template.created_at),
      updatedAt: new Date(template.updated_at),
    }));
  }

  // Create a quote item template
  async createQuoteItemTemplate(
    userId: string,
    template: Omit<QuoteItemTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<QuoteItemTemplate | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('quote_item_templates')
      .insert({
        user_id: userId,
        name: template.name,
        description: template.description,
        default_quantity: template.defaultQuantity,
        default_unit_price: template.defaultUnitPrice,
        default_vat_rate: template.defaultVatRate,
        category: template.category,
        tags: template.tags,
        is_active: template.isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote item template:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      defaultQuantity: parseFloat(data.default_quantity),
      defaultUnitPrice: parseFloat(data.default_unit_price),
      defaultVatRate: parseFloat(data.default_vat_rate),
      category: data.category,
      tags: data.tags || [],
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Update a quote item template
  async updateQuoteItemTemplate(id: string, updates: Partial<QuoteItemTemplate>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.defaultQuantity) updateData.default_quantity = updates.defaultQuantity;
    if (updates.defaultUnitPrice) updateData.default_unit_price = updates.defaultUnitPrice;
    if (updates.defaultVatRate) updateData.default_vat_rate = updates.defaultVatRate;
    if (updates.category) updateData.category = updates.category;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('quote_item_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating quote item template:', error);
      return false;
    }

    return true;
  }

  // Delete a quote item template
  async deleteQuoteItemTemplate(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('quote_item_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quote item template:', error);
      return false;
    }

    return true;
  }

  // Update expired quotes
  async updateExpiredQuotes(): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.rpc('update_expired_quotes');

    if (error) {
      console.error('Error updating expired quotes:', error);
    }
  }
}

export const quoteService = new QuoteService();
