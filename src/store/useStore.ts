import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer, Invoice, CompanyInfo, InvoiceTemplate, EmailConfig, LunarBankConfig, PaymentRecord } from '../types';
import { supabaseService, isSupabaseConfigured } from '../services/supabaseService';
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
