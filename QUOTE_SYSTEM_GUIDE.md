# 📋 Offertsystem - Komplett Guide

## ✅ Vad som är Klart (Backend & Logic - 100%)

Jag har implementerat ett komplett offertsystem med all backend-logik och databasstruktur. Här är vad som finns:

### 1. **Database Schema** (supabase-quotes-schema.sql)
Kör denna SQL i Supabase SQL Editor för att skapa tabellerna:

#### Tabeller:
- **quotes** - Huvudtabellen för offerter
  - Spårar status (draft, sent, accepted, rejected, expired, converted)
  - Giltighetsdatum och utgångskontroll
  - Rabatter (procent eller fast belopp)
  - Koppling till faktura vid konvertering
  - Interna anteckningar

- **quote_items** - Rader i offerten
  - Beskrivning, kvantitet, pris, moms
  - Kategori och anteckningar per rad
  - Position för sortering

- **quote_item_templates** - Återanvändbara mallar
  - Produkter/tjänster som kan återanvändas
  - Standardvärden för pris, kvantitet, moms
  - Kategorisering och taggar
  - Aktivera/inaktivera mallar

#### Säkerhet:
- Row Level Security (RLS) på alla tabeller
- Användare kan bara se sina egna offerter
- Superadmins kan se allt

#### Funktioner:
- Automatisk uppdatering av `updated_at`
- Funktion för att markera utgångna offerter: `update_expired_quotes()`

### 2. **TypeScript Types** (src/types/index.ts)

```typescript
// Quote - Huvudtyp för offert
interface Quote {
  id: string;
  quoteNumber: string;          // QUO-202401-1234
  customer: Customer;
  items: QuoteItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  quoteDate: Date;
  validUntil: Date;             // Giltig till datum
  deliveryTime?: string;        // "2-3 veckor"
  paymentTerms?: string;        // "50% förskott, 50% vid leverans"
  notes?: string;               // Synlig för kund
  internalNotes?: string;       // Bara för internt bruk
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  discount?: number;            // Procentrabatt
  discountAmount?: number;      // Fast rabatt i kronor
  convertedToInvoiceId?: string;
}

// QuoteItem - Rad i offerten
interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  category?: string;            // "Installation", "Material", etc.
  notes?: string;
}

// QuoteItemTemplate - Återanvändbar mall
interface QuoteItemTemplate {
  id: string;
  name: string;                 // "Golvrenovering 100m²"
  description: string;
  defaultQuantity: number;
  defaultUnitPrice: number;
  defaultVatRate: number;
  category: string;
  tags?: string[];
  isActive: boolean;
}
```

### 3. **Supabase Service** (src/services/quoteService.ts)

Alla API-operationer är implementerade:

```typescript
// Offerter
- getQuotes(userId): Promise<Quote[]>
- createQuote(userId, quote): Promise<Quote | null>
- updateQuote(id, updates): Promise<boolean>
- deleteQuote(id): Promise<boolean>

// Mallar
- getQuoteItemTemplates(userId): Promise<QuoteItemTemplate[]>
- createQuoteItemTemplate(userId, template): Promise<QuoteItemTemplate | null>
- updateQuoteItemTemplate(id, updates): Promise<boolean>
- deleteQuoteItemTemplate(id): Promise<boolean>

// Utilities
- updateExpiredQuotes(): Promise<void>
```

### 4. **State Management** (src/store/useStore.ts)

Zustand store med komplett state management:

```typescript
// State
quotes: Quote[]
quoteItemTemplates: QuoteItemTemplate[]

// Actions
loadQuotes()
addQuote(quote)
updateQuote(id, updates)
deleteQuote(id)
getQuoteById(id)
loadQuoteItemTemplates()
addQuoteItemTemplate(template)
updateQuoteItemTemplate(id, updates)
deleteQuoteItemTemplate(id)
```

### 5. **Utility Functions** (src/utils/quoteCalculations.ts)

Hjälpfunktioner för beräkningar och validering:

```typescript
// Beräkningar
calculateQuoteItemTotal(quantity, unitPrice)
calculateQuoteItemVat(total, vatRate)
calculateQuoteTotals(items, discount, discountAmount)
formatCurrency(amount, currency)

// Status & Validering
getQuoteStatus(quote)           // Returnerar status med färg
isQuoteExpired(quote)           // Kontrollera om utgången
canEditQuote(quote)             // Endast draft
canDeleteQuote(quote)           // Draft, rejected, expired
canConvertToInvoice(quote)      // Accepted och ej konverterad
getDaysUntilExpiration(quote)   // Dagar kvar

// Generering
generateQuoteNumber()           // QUO-YYYYMM-XXXX
```

## 🎨 Vad som Återstår (Frontend UI)

### UI-komponenter som behövs:

#### 1. **QuoteList.tsx** (Lista offerter)
Liknande InvoiceList.tsx men för offerter:
- Tabell med alla offerter
- Filtrera per status (draft, sent, accepted, etc.)
- Sök bland offerter
- Actions: Visa, Redigera, Radera, Skicka, Acceptera
- Statusfärger och badges
- Countdown för utgående offerter

#### 2. **QuoteForm.tsx** (Skapa/Redigera offert)
Liknande InvoiceForm.tsx:
- Välj kund
- Lägg till rader manuellt eller från mallar
- **Mallgalleri** - Visa alla aktiva mallar grupperade per kategori
- Dra-och-släpp eller klicka för att lägga till mall
- Beräkna totaler automatiskt
- Rabatt (procent eller fast belopp)
- Giltighetsdatum (default 30 dagar)
- Leveranstid och betalningsvillkor
- Anteckningar (public och internal)
- Spara som draft eller skicka direkt

#### 3. **QuoteView.tsx** (Visa offert)
Liknande InvoiceView.tsx:
- Visa komplett offert
- Status och giltighetstid
- Actions baserat på status:
  - Draft: Redigera, Radera, Skicka
  - Sent: Acceptera, Avvisa, Påminn
  - Accepted: Konvertera till faktura
- Generera PDF
- Skicka via email
- Historik/aktivitetslogg

#### 4. **QuoteItemTemplatesManager.tsx** (Hantera mallar)
Ny komponent för att hantera återanvändbara mallar:
- Lista alla mallar
- Gruppera per kategori
- Lägg till/Redigera/Radera mallar
- Aktivera/Inaktivera
- Sökfunktion
- Importera från tidigare offerter
- **Kategorier förslag:**
  - Material
  - Arbete/Tjänster
  - Installation
  - Transport
  - Övrigt

#### 5. **QuotePreview.tsx** (Förhandsvisning)
Liknande InvoicePreview.tsx:
- Visa offert som den kommer se ut i PDF
- Företagsinfo + kundinfo
- Tabell med alla rader
- Totaler med rabatt
- Leveranstid och betalningsvillkor
- Giltighetsdatum prominent

#### 6. **QuotePDFService** (PDF-generering)
Skapa `src/services/quotePdfService.ts`:
- Baserad på pdfService.ts
- Anpassad layout för offerter
- Inkludera "Valid until" datum
- Leveranstid och betalningsvillkor
- "Accepted/Rejected" stämpel om relevant

#### 7. **Convert Quote to Invoice** (Konvertering)
Funktion för att konvertera accepterad offert till faktura:
```typescript
async function convertQuoteToInvoice(quoteId: string): Promise<Invoice | null> {
  const quote = getQuoteById(quoteId);
  if (!canConvertToInvoice(quote)) return null;

  const invoice = {
    invoiceNumber: generateInvoiceNumber(),
    customerId: quote.customerId,
    customer: quote.customer,
    items: quote.items.map(item => ({...item, id: generateId()})),
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    total: quote.total,
    currency: quote.currency,
    invoiceDate: new Date(),
    dueDate: calculateDueDate(paymentTerms),
    paymentTerms: parsePaymentTerms(quote.paymentTerms),
    notes: quote.notes,
    status: 'draft'
  };

  await addInvoice(invoice);
  await updateQuote(quoteId, {
    status: 'converted',
    convertedToInvoiceId: invoice.id
  });

  return invoice;
}
```

### Navigation & Routing

Lägg till i App.tsx (routing):

```typescript
// I Navigation/Layout - lägg till:
<Link to="/quotes">
  <FileText size={20} />
  <span>Quotes</span>
</Link>

// I Routes:
<Route path="quotes" element={<QuoteList />} />
<Route path="quotes/new" element={<QuoteForm />} />
<Route path="quotes/:id" element={<QuoteView />} />
<Route path="quotes/:id/edit" element={<QuoteForm />} />
<Route path="quote-templates" element={<QuoteItemTemplatesManager />} />
```

## 🚀 Implementationsordning (Rekommenderad)

1. **Steg 1: QuoteList** (2-3 timmar)
   - Skapa grundläggande lista
   - Status-filter
   - Basic actions

2. **Steg 2: QuoteForm** (4-5 timmar)
   - Formulär för att skapa offert
   - Lägg till rader manuellt
   - Beräkningar

3. **Steg 3: Mallsystem** (2-3 timmar)
   - QuoteItemTemplatesManager
   - Integrera i QuoteForm
   - Galleri med mallar

4. **Steg 4: QuoteView** (2-3 timmar)
   - Visa offert
   - Actions baserat på status
   - QuotePreview komponent

5. **Steg 5: PDF & Email** (2-3 timmar)
   - quotePdfService
   - Email-integration
   - Send quote functionality

6. **Steg 6: Konvertering** (1-2 timmar)
   - Convert to invoice funktion
   - UI för konvertering
   - Testing

## 💡 Best Practices & Tips

### Mallsystemet
- Skapa några standardmallar vid första användning
- Låt användare importera från tidigare offerter
- Visa mest använda mallar först
- Snabbtangenter för att lägga till mallar (t.ex. Ctrl+K för att söka)

### Status Flow
```
draft → sent → accepted → converted (to invoice)
              ↓
            rejected
              ↓
            expired (auto after validUntil)
```

### Rabatter
- Visa både procent och belopp
- Applicera rabatt på subtotal före moms
- Visa "Sparat: XX kr" för kunden

### UX Förbättringar
- Auto-save till draft var 30:e sekund
- Varning innan offert går ut (3 dagar kvar)
- Notifikationer när offert accepteras/avvisas
- Duplicera offert-funktion för snabb ny offert

### Email Templates
Skapa email-mallar för:
- Skicka ny offert
- Påminnelse om utgående offert
- Tack för accepterad offert
- Follow-up efter avvisad offert

## 📦 Exempel på Mallar att Skapa

```typescript
const exampleTemplates: QuoteItemTemplate[] = [
  {
    name: "Golvrenovering - Standardrum",
    description: "Komplett golvrenovering inkl. material och arbete",
    category: "Renovering",
    defaultQuantity: 1,
    defaultUnitPrice: 25000,
    defaultVatRate: 25,
    tags: ["golv", "renovering", "standard"]
  },
  {
    name: "Målning - Per m²",
    description: "Målning inkl. grundning, 2 lager",
    category: "Målning",
    defaultQuantity: 50,
    defaultUnitPrice: 150,
    defaultVatRate: 25,
    tags: ["målning", "färg"]
  },
  {
    name: "Konsultation - Timme",
    description: "Konsultationstimme",
    category: "Tjänster",
    defaultQuantity: 1,
    defaultUnitPrice: 1200,
    defaultVatRate: 25,
    tags: ["konsult", "rådgivning"]
  }
];
```

## 🧪 Testing Checklist

- [ ] Skapa ny offert från scratch
- [ ] Skapa offert med mallar
- [ ] Redigera draft-offert
- [ ] Skicka offert (status → sent)
- [ ] Acceptera offert (status → accepted)
- [ ] Konvertera till faktura
- [ ] Avvisa offert (status → rejected)
- [ ] Test automatisk utgång efter validUntil
- [ ] Radera offert (endast vissa statusar)
- [ ] PDF-generering
- [ ] Email-utskick
- [ ] Rabatt-beräkningar (procent & fast belopp)
- [ ] Moms-beräkningar

## 📝 Nästa Steg

1. Kör SQL-schemat i Supabase
2. Implementera UI-komponenter i ordning ovan
3. Testa varje komponent noggrant
4. Lägg till email-integration
5. Skapa PDF-templates
6. User acceptance testing

## 🎯 Framtida Förbättringar

- Versionshantering av offerter
- Digital signering av offerter
- Offert-mallar (inte bara items, utan kompletta offerter)
- Statistik över acceptrate
- AI-förslag på priser baserat på historik
- Multivaluta-stöd
- Integration med bokföringssystem
- Automatiska påminnelser
- Custom branding per offert

---

**Status**: Backend & Logic ✅ Komplett | Frontend UI ⏳ Återstår

**Uppskattad tid för UI**: 15-20 timmar för komplett implementation

**Kontakta mig** om du har frågor eller vill att jag hjälper till att implementera UI-delarna!
