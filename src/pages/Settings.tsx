import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { CompanyInfo } from '../types';
import { Upload, Save } from 'lucide-react';

export const Settings = () => {
  const { companyInfo, setCompanyInfo, lunarConfig, setLunarConfig } = useStore();

  const [activeTab, setActiveTab] = useState<'company' | 'lunar'>('company');

  const [companyForm, setCompanyForm] = useState<CompanyInfo>(companyInfo || {
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sverige',
    phone: '',
    email: '',
    website: '',
    organizationNumber: '',
    vatNumber: '',
    bankAccount: '',
    logo: '',
  });

  const [lunarForm, setLunarForm] = useState({
    apiKey: lunarConfig?.apiKey || '',
    accountId: lunarConfig?.accountId || '',
    enabled: lunarConfig?.enabled || false,
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyForm({ ...companyForm, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyInfo(companyForm);
    alert('Företagsinformation sparad!');
  };

  const handleSaveLunar = (e: React.FormEvent) => {
    e.preventDefault();
    setLunarConfig(lunarForm);
    alert('Lunar Bank-inställningar sparade!');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inställningar</h1>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--gray-200)', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('company')}
            className={`btn ${activeTab === 'company' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'company' ? '2px solid var(--primary-color)' : 'none' }}
          >
            Företagsinformation
          </button>
          <button
            onClick={() => setActiveTab('lunar')}
            className={`btn ${activeTab === 'lunar' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'lunar' ? '2px solid var(--primary-color)' : 'none' }}
          >
            Lunar Bank Integration
          </button>
        </div>

        {activeTab === 'company' && (
          <form onSubmit={handleSaveCompany}>
            <div className="grid grid-cols-2 gap-2">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Företagslogotyp</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {companyForm.logo && (
                    <img
                      src={companyForm.logo}
                      alt="Logo"
                      style={{ width: '100px', height: '50px', objectFit: 'contain', border: '1px solid var(--gray-300)', borderRadius: '4px', padding: '8px' }}
                    />
                  )}
                  <label className="btn btn-secondary">
                    <Upload size={16} />
                    Ladda upp logotyp
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Företagsnamn *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefon *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Webbplats</label>
                <input
                  type="url"
                  className="form-input"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Adress *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Postnummer *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.postalCode}
                  onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stad *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Land *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.country}
                  onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Organisationsnummer *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.organizationNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, organizationNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Momsregistreringsnummer *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.vatNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, vatNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bankgiro/Plusgiro *</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyForm.bankAccount}
                  onChange={(e) => setCompanyForm({ ...companyForm, bankAccount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={20} />
                Spara företagsinformation
              </button>
            </div>
          </form>
        )}

        {activeTab === 'lunar' && (
          <form onSubmit={handleSaveLunar}>
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '8px' }}>Lunar Bank API Integration</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                Koppla ditt Lunar Bank-konto för att automatiskt synka betalningar och uppdatera fakturastatus.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={lunarForm.enabled}
                  onChange={(e) => setLunarForm({ ...lunarForm, enabled: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Aktivera Lunar Bank Integration
              </label>
            </div>

            {lunarForm.enabled && (
              <>
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    type="password"
                    className="form-input"
                    value={lunarForm.apiKey}
                    onChange={(e) => setLunarForm({ ...lunarForm, apiKey: e.target.value })}
                    placeholder="Ange din Lunar API-nyckel"
                  />
                  <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginTop: '4px' }}>
                    Hämta din API-nyckel från Lunar Bank Dashboard
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Account ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lunarForm.accountId}
                    onChange={(e) => setLunarForm({ ...lunarForm, accountId: e.target.value })}
                    placeholder="Ange ditt Lunar konto-ID"
                  />
                </div>
              </>
            )}

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={20} />
                Spara Lunar-inställningar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
