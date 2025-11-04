# FakturaApp - Professionellt faktureringssystem

En komplett, modern webbapplikation byggd med React och TypeScript för att hantera fakturor, kunder och betalningar.

## Funktioner

### ✅ Implementerade funktioner

#### 1. **Kundhantering**
- Skapa, redigera och radera kunder
- Spara kundinformation: namn, email, telefon, adress, organisationsnummer
- Gruppera kunder (t.ex. VIP, Partner, Standard)
- Filtrera kunder per grupp
- Visa antal fakturor per kund
- Skydd mot radering av kunder med befintliga fakturor

#### 2. **Fakturahantering**
- Skapa nya fakturor med färdiga mallar
- Redigera befintliga fakturor
- Lägga till flera fakturarader med:
  - Beskrivning
  - Antal
  - Pris per enhet
  - Momssats (0%, 6%, 12%, 25%)
  - Automatisk beräkning av totaler
- Automatisk generering av fakturanummer (format: INV-ÅÅÅÅMM-XXXX)
- Betalningsvillkor (anpassningsbara dagar)
- Anteckningar/meddelanden
- Automatisk beräkning av förfallodatum

#### 3. **Fakturastatus & Tidsstämplar**
- Status: Utkast, Skickad, Betald, Förfallen, Avbruten
- Automatisk datumstämpling:
  - Skapad (createdAt)
  - Senast uppdaterad (updatedAt)
  - Skickad (sentAt)
  - Betald (paidAt)
- Automatisk statusändring till "Förfallen" för fakturor efter förfallodatum

#### 4. **PDF-export**
- Professionell PDF-generering med jsPDF
- Innehåller:
  - Företagslogotyp
  - Företagsinformation
  - Kundinformation
  - Detaljerad produkttabell
  - Delsumma, moms och totalsumma
  - Betalningsinformation
  - Anteckningar
- Nedladdning direkt från fakturalistan eller fakturavy

#### 5. **Word-export**
- Exportera fakturor till .docx-format
- Professionell formatering med docx-biblioteket
- Samma information som PDF
- Perfekt för vidare redigering

#### 6. **Företagsinställningar**
- Konfigurera företagsinformation:
  - Företagsnamn
  - Logotypuppladdning (base64-kodning)
  - Kontaktinformation (email, telefon, webbplats)
  - Adress
  - Organisationsnummer
  - Momsregistreringsnummer
  - Bankgiro/Plusgiro

#### 7. **Lunar Bank API Integration**
- Koppla ditt Lunar Bank-konto
- Konfigurera API-nyckel och konto-ID
- Automatisk synkronisering av betalningar
- Matchning av transaktioner mot fakturor (via belopp och OCR-nummer)
- Uppdatera fakturastatus automatiskt vid betalning
- Visa kontosaldo

#### 8. **Email-funktionalitet**
- Struktur för att skicka fakturor via email
- Professionell HTML-email mall
- Automatisk bifogning av PDF
- Kräver backend-implementation (mock finns)

#### 9. **Dashboard & Statistik**
- Översikt med:
  - Totalt antal fakturor
  - Antal kunder
  - Total omsättning
  - Förfallna fakturor
- Senaste fakturor
- Månadsöversikt (senaste 6 månaderna)
- Topp 10-kunder baserat på omsättning
- Väntande betalningar
- Genomsnittligt fakturavärde

#### 10. **Moderna UI/UX**
- Responsiv design
- Modern färgpalett
- Intuitiv navigation med sidebar
- Status-badges med färgkodning
- Sökbara och filterbara tabeller
- Modal-dialoger för formulär
- Smooth transitions och hover-effekter

#### 11. **Datahantering**
- Persistent lagring med Zustand + localStorage
- All data sparas lokalt i webbläsaren
- Automatisk synkronisering
- Ingen databas krävs för grundfunktionalitet

## Teknisk stack

- **Frontend Framework**: React 18 med TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand med persist-middleware
- **Routing**: React Router v6
- **Styling**: Vanilla CSS med CSS-variabler
- **PDF-generering**: jsPDF
- **Word-export**: docx + file-saver
- **Datum-hantering**: date-fns
- **Icons**: Lucide React
- **HTTP-klient**: Axios (för Lunar API)

## Installation & användning

### 1. Installera dependencies
```bash
npm install
```

### 2. Starta utvecklingsserver
```bash
npm run dev
```

Applikationen öppnas på: `http://localhost:5173`

### 3. Bygg för produktion
```bash
npm run build
```

### 4. Förhandsgranska produktionsbygget
```bash
npm run preview
```

## Kom igång

### Första gången du använder appen:

1. **Konfigurera företagsinformation**
   - Gå till "Inställningar"
   - Fyll i all företagsinformation
   - Ladda upp din logotyp
   - Spara

2. **Skapa dina första kunder**
   - Gå till "Kunder"
   - Klicka "Ny kund"
   - Fyll i kundinformation
   - Valfritt: lägg till i en grupp

3. **Skapa din första faktura**
   - Gå till "Fakturor"
   - Klicka "Ny faktura"
   - Välj kund
   - Lägg till fakturarader
   - Spara som utkast eller markera som skickad

4. **Exportera och dela**
   - Ladda ner som PDF eller Word
   - (Valfritt) Skicka via email när backend är konfigurerad

## Lunar Bank Integration

För att aktivera automatisk betalningssynkronisering:

1. Skaffa API-credentials från Lunar Bank
2. Gå till "Inställningar" > "Lunar Bank Integration"
3. Aktivera integrationen
4. Ange API-nyckel och konto-ID
5. Spara inställningar

Systemet kommer nu automatiskt:
- Hämta transaktioner från ditt Lunar-konto
- Matcha betalningar mot fakturor
- Uppdatera fakturastatus till "Betald"

## Email-funktionalitet (Kräver backend)

Email-funktionen är förberedd men kräver en backend-server. Exempel på implementering finns i `src/services/emailService.ts`.

### Backend-exempel med Express.js + Nodemailer:

```javascript
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  const { to, from, subject, html, attachments } = req.body;

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
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(3001);
```

## Projektstruktur

```
src/
├── components/          # React-komponenter
│   └── Layout.tsx      # Huvudlayout med navigation
├── pages/              # Sidkomponenter
│   ├── Dashboard.tsx   # Översikt
│   ├── InvoiceList.tsx # Fakturalista
│   ├── InvoiceForm.tsx # Skapa/redigera faktura
│   ├── Customers.tsx   # Kundhantering
│   ├── Statistics.tsx  # Statistik & rapporter
│   └── Settings.tsx    # Inställningar
├── services/           # API & externa tjänster
│   ├── pdfService.ts   # PDF-generering
│   ├── wordService.ts  # Word-export
│   ├── emailService.ts # Email-funktionalitet
│   └── lunarService.ts # Lunar Bank API
├── store/              # State management
│   └── useStore.ts     # Zustand store
├── types/              # TypeScript types
│   └── index.ts        # Alla type definitions
├── utils/              # Hjälpfunktioner
│   └── invoiceCalculations.ts
├── App.tsx             # Huvudapp med routing
├── main.tsx            # Entry point
└── index.css           # Global styling
```

## Smarta funktioner

### Automatisk beräkning
- Totalsumma beräknas automatiskt när du ändrar antal eller pris
- Moms beräknas per rad baserat på vald momssats
- Förfallodatum beräknas automatiskt baserat på betalningsvillkor

### Dataskydd
- Förhindrar radering av kunder med fakturor
- Validering av formulär
- Bekräftelsedialoger vid radering

### Filtrera & söka
- Filtrera fakturor per status
- Filtrera kunder per grupp
- Sorterbara tabeller

### Gruppering
- Gruppera kunder (t.ex. VIP, Partner)
- Visa alla kunder i en grupp med ett klick

## Framtida förbättringar

Möjliga tillägg:
- Påminnelser för förfallna fakturor
- Återkommande fakturor
- Multi-valuta support
- Produktbibliotek
- Tidsregistrering
- Offerthantering
- Kvitto-scanning (OCR)
- Grafisk statistik med diagram
- Export till bokföringssystem
- Multi-språk support
- Mörkt tema

## Licens

MIT License

---

**Byggd med ❤️ för svenska småföretag och frilansare**
