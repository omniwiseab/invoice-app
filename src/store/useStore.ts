import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer, Invoice, CompanyInfo, InvoiceTemplate, EmailConfig, LunarBankConfig, PaymentRecord, Quote, QuoteItemTemplate } from '../types';
import { supabaseService, isSupabaseConfigured } from '../services/supabaseService';
import { quoteService } from '../services/quoteService';
import { supabase } from '../lib/supabase';

interface AppState {
  // User ID (for Supabase integration)
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Company Info
  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo) => Promise<void>;
  loadCompanyInfo: () => Promise<void>;

  // Customers
  customers: Customer[];
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;

  // Invoices
  invoices: Invoice[];
  loadInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;

  // Templates
  templates: InvoiceTemplate[];
  selectedTemplate: InvoiceTemplate | null;
  setSelectedTemplate: (template: InvoiceTemplate) => void;

  // Email Config
  emailConfig: EmailConfig | null;
  setEmailConfig: (config: EmailConfig) => void;

  // Lunar Bank Config
  lunarConfig: LunarBankConfig | null;
  setLunarConfig: (config: LunarBankConfig) => void;

  // Payments
  payments: PaymentRecord[];
  addPayment: (payment: PaymentRecord) => void;

  // Quotes
  quotes: Quote[];
  loadQuotes: () => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  getQuoteById: (id: string) => Quote | undefined;

  // Quote Item Templates
  quoteItemTemplates: QuoteItemTemplate[];
  loadQuoteItemTemplates: () => Promise<void>;
  addQuoteItemTemplate: (template: Omit<QuoteItemTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateQuoteItemTemplate: (id: string, template: Partial<QuoteItemTemplate>) => Promise<void>;
  deleteQuoteItemTemplate: (id: string) => Promise<void>;
}

// Helper function to get current user ID from Supabase auth
const getCurrentUserId = async (): Promise<string | null> => {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User ID
      userId: null,
      setUserId: (id) => set({ userId: id }),

      // Loading state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Company Info
      companyInfo: null,
      setCompanyInfo: async (info) => {
        if (isSupabaseConfigured()) {
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            console.error('No authenticated user found');
            return;
          }
          const success = await supabaseService.saveCompanyInfo(userId, info);
          if (success) {
            set({ companyInfo: info });
          }
        } else {
          set({ companyInfo: info });
        }
      },
      loadCompanyInfo: async () => {
        if (isSupabaseConfigured()) {
          set({ isLoading: true });
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            set({ isLoading: false });
            return;
          }
          const info = await supabaseService.getCompanyInfo(userId);
          set({ companyInfo: info, isLoading: false });
        }
      },

      // Customers
      customers: [],
      loadCustomers: async () => {
        if (isSupabaseConfigured()) {
          set({ isLoading: true });
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            set({ isLoading: false });
            return;
          }
          const customers = await supabaseService.getCustomers(userId);
          set({ customers, isLoading: false });
        }
      },
      addCustomer: async (customer) => {
        if (isSupabaseConfigured()) {
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            console.error('No authenticated user found');
            return;
          }
          const newCustomer = await supabaseService.createCustomer(userId, customer);
          if (newCustomer) {
            set((state) => ({
              customers: [...state.customers, newCustomer],
            }));
          }
        } else {
          // Fallback to localStorage
          const newCustomer = {
            ...customer,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({
            customers: [...state.customers, newCustomer],
          }));
        }
      },
      updateCustomer: async (id, customerUpdate) => {
        if (isSupabaseConfigured()) {
          const success = await supabaseService.updateCustomer(id, customerUpdate);
          if (success) {
            set((state) => ({
              customers: state.customers.map((c) =>
                c.id === id ? { ...c, ...customerUpdate, updatedAt: new Date() } : c
              ),
            }));
          }
        } else {
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...customerUpdate, updatedAt: new Date() } : c
            ),
          }));
        }
      },
      deleteCustomer: async (id) => {
        if (isSupabaseConfigured()) {
          const success = await supabaseService.deleteCustomer(id);
          if (success) {
            set((state) => ({
              customers: state.customers.filter((c) => c.id !== id),
            }));
          }
        } else {
          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
          }));
        }
      },
      getCustomerById: (id) => get().customers.find((c) => c.id === id),

      // Invoices
      invoices: [],
      loadInvoices: async () => {
        if (isSupabaseConfigured()) {
          set({ isLoading: true });
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            set({ isLoading: false });
            return;
          }
          const invoices = await supabaseService.getInvoices(userId);
          set({ invoices, isLoading: false });
        }
      },
      addInvoice: async (invoice) => {
        if (isSupabaseConfigured()) {
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            console.error('No authenticated user found');
            return;
          }
          const newInvoice = await supabaseService.createInvoice(userId, invoice);
          if (newInvoice) {
            set((state) => ({
              invoices: [...state.invoices, newInvoice],
            }));
          }
        } else {
          // Fallback to localStorage
          const newInvoice = {
            ...invoice,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Invoice;
          set((state) => ({
            invoices: [...state.invoices, newInvoice],
          }));
        }
      },
      updateInvoice: async (id, invoiceUpdate) => {
        if (isSupabaseConfigured()) {
          const success = await supabaseService.updateInvoice(id, invoiceUpdate);
          if (success) {
            set((state) => ({
              invoices: state.invoices.map((inv) =>
                inv.id === id ? { ...inv, ...invoiceUpdate, updatedAt: new Date() } : inv
              ),
            }));
          }
        } else {
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv.id === id ? { ...inv, ...invoiceUpdate, updatedAt: new Date() } : inv
            ),
          }));
        }
      },
      deleteInvoice: async (id) => {
        if (isSupabaseConfigured()) {
          const success = await supabaseService.deleteInvoice(id);
          if (success) {
            set((state) => ({
              invoices: state.invoices.filter((inv) => inv.id !== id),
            }));
          }
        } else {
          set((state) => ({
            invoices: state.invoices.filter((inv) => inv.id !== id),
          }));
        }
      },
      getInvoiceById: (id) => get().invoices.find((inv) => inv.id === id),

      // Quotes
      quotes: [],
      loadQuotes: async () => {
        if (isSupabaseConfigured()) {
          set({ isLoading: true });
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            set({ isLoading: false });
            return;
          }
          const quotes = await quoteService.getQuotes(userId);
          set({ quotes, isLoading: false });
        }
      },
      addQuote: async (quote) => {
        if (isSupabaseConfigured()) {
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            console.error('No authenticated user found');
            return;
          }
          const newQuote = await quoteService.createQuote(userId, quote);
          if (newQuote) {
            set((state) => ({
              quotes: [...state.quotes, newQuote],
            }));
          }
        } else {
          // Fallback to localStorage
          const newQuote = {
            ...quote,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Quote;
          set((state) => ({
            quotes: [...state.quotes, newQuote],
          }));
        }
      },
      updateQuote: async (id, quoteUpdate) => {
        if (isSupabaseConfigured()) {
          const success = await quoteService.updateQuote(id, quoteUpdate);
          if (success) {
            set((state) => ({
              quotes: state.quotes.map((q) =>
                q.id === id ? { ...q, ...quoteUpdate, updatedAt: new Date() } : q
              ),
            }));
          }
        } else {
          set((state) => ({
            quotes: state.quotes.map((q) =>
              q.id === id ? { ...q, ...quoteUpdate, updatedAt: new Date() } : q
            ),
          }));
        }
      },
      deleteQuote: async (id) => {
        if (isSupabaseConfigured()) {
          const success = await quoteService.deleteQuote(id);
          if (success) {
            set((state) => ({
              quotes: state.quotes.filter((q) => q.id !== id),
            }));
          }
        } else {
          set((state) => ({
            quotes: state.quotes.filter((q) => q.id !== id),
          }));
        }
      },
      getQuoteById: (id) => get().quotes.find((q) => q.id === id),

      // Quote Item Templates
      quoteItemTemplates: [],
      loadQuoteItemTemplates: async () => {
        if (isSupabaseConfigured()) {
          set({ isLoading: true });
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            set({ isLoading: false });
            return;
          }
          const templates = await quoteService.getQuoteItemTemplates(userId);
          set({ quoteItemTemplates: templates, isLoading: false });
        }
      },
      addQuoteItemTemplate: async (template) => {
        if (isSupabaseConfigured()) {
          const userId = get().userId || await getCurrentUserId();
          if (!userId) {
            console.error('No authenticated user found');
            return;
          }
          const newTemplate = await quoteService.createQuoteItemTemplate(userId, template);
          if (newTemplate) {
            set((state) => ({
              quoteItemTemplates: [...state.quoteItemTemplates, newTemplate],
            }));
          }
        } else {
          // Fallback to localStorage
          const newTemplate = {
            ...template,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({
            quoteItemTemplates: [...state.quoteItemTemplates, newTemplate],
          }));
        }
      },
      updateQuoteItemTemplate: async (id, templateUpdate) => {
        if (isSupabaseConfigured()) {
          const success = await quoteService.updateQuoteItemTemplate(id, templateUpdate);
          if (success) {
            set((state) => ({
              quoteItemTemplates: state.quoteItemTemplates.map((t) =>
                t.id === id ? { ...t, ...templateUpdate, updatedAt: new Date() } : t
              ),
            }));
          }
        } else {
          set((state) => ({
            quoteItemTemplates: state.quoteItemTemplates.map((t) =>
              t.id === id ? { ...t, ...templateUpdate, updatedAt: new Date() } : t
            ),
          }));
        }
      },
      deleteQuoteItemTemplate: async (id) => {
        if (isSupabaseConfigured()) {
          const success = await quoteService.deleteQuoteItemTemplate(id);
          if (success) {
            set((state) => ({
              quoteItemTemplates: state.quoteItemTemplates.filter((t) => t.id !== id),
            }));
          }
        } else {
          set((state) => ({
            quoteItemTemplates: state.quoteItemTemplates.filter((t) => t.id !== id),
          }));
        }
      },

      // Templates
      templates: [
        { id: '1', name: 'Modern', layout: 'modern', primaryColor: '#3B82F6', secondaryColor: '#1E40AF' },
        { id: '2', name: 'Classic', layout: 'classic', primaryColor: '#1F2937', secondaryColor: '#374151' },
        { id: '3', name: 'Minimal', layout: 'minimal', primaryColor: '#10B981', secondaryColor: '#059669' },
      ],
      selectedTemplate: null,
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      // Email Config
      emailConfig: null,
      setEmailConfig: (config) => set({ emailConfig: config }),

      // Lunar Bank Config
      lunarConfig: null,
      setLunarConfig: (config) => set({ lunarConfig: config }),

      // Payments
      payments: [],
      addPayment: (payment) =>
        set((state) => ({
          payments: [...state.payments, payment],
        })),
    }),
    {
      name: 'invoice-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Save everything as backup/cache even when using Supabase for offline support
      // Note: Supabase data takes precedence when loaded
    }
  )
);
