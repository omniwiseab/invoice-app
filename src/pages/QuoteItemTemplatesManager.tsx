import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { QuoteItemTemplate } from '../types';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';

export const QuoteItemTemplatesManager = () => {
  const { quoteItemTemplates, loadQuoteItemTemplates, addQuoteItemTemplate, updateQuoteItemTemplate, deleteQuoteItemTemplate } = useStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<QuoteItemTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnitPrice, setFormUnitPrice] = useState(0);
  const [formVatRate, setFormVatRate] = useState(25);
  const [formCategory, setFormCategory] = useState('');
  const [formTags, setFormTags] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await loadQuoteItemTemplates();
      setLoading(false);
    };
    loadData();
  }, [loadQuoteItemTemplates]);

  // Get all unique categories
  const categories = Array.from(new Set(quoteItemTemplates.map(t => t.category))).sort();

  // Filter templates
  const filteredTemplates = quoteItemTemplates.filter(template => {
    // Category filter
    if (filter !== 'all' && template.category !== filter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, QuoteItemTemplate[]>);

  const handleEdit = (template: QuoteItemTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description);
    setFormQuantity(template.defaultQuantity);
    setFormUnitPrice(template.defaultUnitPrice);
    setFormVatRate(template.defaultVatRate);
    setFormCategory(template.category);
    setFormTags(template.tags?.join(', ') || '');
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDescription('');
    setFormQuantity(1);
    setFormUnitPrice(0);
    setFormVatRate(25);
    setFormCategory('');
    setFormTags('');
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const templateData = {
      name: formName,
      description: formDescription,
      defaultQuantity: formQuantity,
      defaultUnitPrice: formUnitPrice,
      defaultVatRate: formVatRate,
      category: formCategory,
      tags: formTags.split(',').map(t => t.trim()).filter(t => t),
      isActive: true,
    };

    if (editingTemplate) {
      await updateQuoteItemTemplate(editingTemplate.id, templateData);
    } else {
      await addQuoteItemTemplate(templateData);
    }

    handleCancel();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      await deleteQuoteItemTemplate(id);
    }
  };

  const handleToggleActive = async (template: QuoteItemTemplate) => {
    await updateQuoteItemTemplate(template.id, {
      isActive: !template.isActive
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading templates...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quote Item Templates</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus size={20} />
          New Template
        </button>
      </div>

      {/* Form for creating/editing */}
      {(isCreating || editingTemplate) && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 className="card-header">{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Floor Renovation - Standard Room"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g., Renovation, Material, Labor"
                  list="categories"
                  required
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed description of the item/service"
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Quantity *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Unit Price (kr) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formUnitPrice}
                  onChange={(e) => setFormUnitPrice(parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default VAT Rate (%) *</label>
                <select
                  className="form-select"
                  value={formVatRate}
                  onChange={(e) => setFormVatRate(parseFloat(e.target.value))}
                  required
                >
                  <option value="0">0%</option>
                  <option value="6">6%</option>
                  <option value="12">12%</option>
                  <option value="25">25%</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g., flooring, renovation, standard"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={20} />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                <X size={20} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and search */}
      <div className="card">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              All ({quoteItemTemplates.length})
            </button>
            {categories.map(category => {
              const count = quoteItemTemplates.filter(t => t.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`btn ${filter === category ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '40px' }}>
            {searchQuery ? 'No templates found matching your search' : 'No templates yet. Create your first template!'}
          </p>
        ) : (
          <div>
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid var(--gray-200)'
                }}>
                  {category}
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {templates.map(template => (
                    <div
                      key={template.id}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '8px',
                        backgroundColor: template.isActive ? '#fff' : 'var(--gray-50)',
                        opacity: template.isActive ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                          {template.name}
                        </h4>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: template.isActive ? 'var(--success)' : 'var(--gray-400)',
                            color: '#fff'
                          }}
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                        {template.description}
                      </p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '13px',
                        marginBottom: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--gray-200)'
                      }}>
                        <div>
                          <span style={{ color: 'var(--gray-500)' }}>Quantity:</span>{' '}
                          <strong>{template.defaultQuantity}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--gray-500)' }}>Price:</span>{' '}
                          <strong>{template.defaultUnitPrice.toFixed(2)} kr</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--gray-500)' }}>VAT:</span>{' '}
                          <strong>{template.defaultVatRate}%</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--gray-500)' }}>Total:</span>{' '}
                          <strong>{(template.defaultQuantity * template.defaultUnitPrice).toFixed(2)} kr</strong>
                        </div>
                      </div>

                      {template.tags && template.tags.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          {template.tags.map(tag => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                padding: '2px 8px',
                                marginRight: '4px',
                                marginBottom: '4px',
                                backgroundColor: 'var(--gray-200)',
                                borderRadius: '12px',
                                color: 'var(--gray-700)'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(template)}
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(template)}
                          className="btn btn-secondary btn-sm"
                          title={template.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {template.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(template.id, template.name)}
                          className="btn btn-danger btn-sm"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
