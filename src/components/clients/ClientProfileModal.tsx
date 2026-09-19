import React, { useState } from 'react';
import { X, Save, User, MapPin, CreditCard, FileText, Info } from 'lucide-react';
import type { CustomerRecord } from '../../types/invoice';

interface ClientProfileModalProps {
  client: CustomerRecord | null;
  onSave: (client: CustomerRecord) => void;
  onClose: () => void;
}

const emptyClient = (): CustomerRecord => ({
  id: `cust-${Date.now()}`,
  name: '',
  phone: '',
  alternatePhone: '',
  email: '',
  gstin: '',
  pan: '',
  customerCode: '',
  address: '',
  billingAddress: '',
  city: '',
  state: '',
  pincode: '',
  contactPerson: '',
  paymentTerms: '30 days',
  creditLimit: 0,
  openingBalance: 0,
  openingBalanceType: 'debit',
  status: 'active',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

type TabId = 'basic' | 'address' | 'finance' | 'notes';

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({ client, onSave, onClose }) => {
  const [form, setForm] = useState<CustomerRecord>(() => ({
    ...emptyClient(),
    ...client,
    updatedAt: new Date().toISOString(),
  }));
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof CustomerRecord, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Client name is required';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setActiveTab('basic');
      return;
    }
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: 'Basic Info', icon: <User size={14} /> },
    { id: 'address', label: 'Address', icon: <MapPin size={14} /> },
    { id: 'finance', label: 'Finance', icon: <CreditCard size={14} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={14} /> },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</h2>
            <p className="modal-subtitle">Fill in the client details below</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === 'basic' && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Company / Party Name *</label>
                <input
                  className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value.toUpperCase())}
                  placeholder="e.g. SHREE TRADERS PVT LTD"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  className="form-input"
                  value={form.contactPerson || ''}
                  onChange={(e) => set('contactPerson', e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Code</label>
                <input
                  className="form-input"
                  value={form.customerCode || ''}
                  onChange={(e) => set('customerCode', e.target.value.toUpperCase())}
                  placeholder="e.g. ST-001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input
                  className="form-input"
                  value={form.phone || ''}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alternate Mobile</label>
                <input
                  className="form-input"
                  value={form.alternatePhone || ''}
                  onChange={(e) => set('alternatePhone', e.target.value)}
                  placeholder="e.g. 9876543211"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="e.g. contact@shreetraders.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input
                  className="form-input"
                  value={form.gstin || ''}
                  onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  maxLength={15}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PAN</label>
                <input
                  className="form-input"
                  value={form.pan || ''}
                  onChange={(e) => set('pan', e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status || 'active'}
                  onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Billing Address</label>
                <textarea
                  className="form-textarea"
                  value={form.billingAddress || form.address || ''}
                  onChange={(e) => set('billingAddress', e.target.value)}
                  placeholder="Full billing address"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  value={form.city || ''}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Navi Mumbai"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  className="form-input"
                  value={form.state || ''}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  className="form-input"
                  value={form.pincode || ''}
                  onChange={(e) => set('pincode', e.target.value)}
                  placeholder="e.g. 410206"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <select
                  className="form-select"
                  value={form.paymentTerms || '30 days'}
                  onChange={(e) => set('paymentTerms', e.target.value)}
                >
                  <option value="immediate">Immediate</option>
                  <option value="7 days">7 Days</option>
                  <option value="15 days">15 Days</option>
                  <option value="30 days">30 Days</option>
                  <option value="45 days">45 Days</option>
                  <option value="60 days">60 Days</option>
                  <option value="90 days">90 Days</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Credit Limit (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.creditLimit || 0}
                  onChange={(e) => set('creditLimit', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 200000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Opening Balance (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.openingBalance || 0}
                  onChange={(e) => set('openingBalance', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Opening Balance Type</label>
                <select
                  className="form-select"
                  value={form.openingBalanceType || 'debit'}
                  onChange={(e) => set('openingBalanceType', e.target.value as 'debit' | 'credit')}
                >
                  <option value="debit">Debit (They owe us)</option>
                  <option value="credit">Credit (We owe them)</option>
                </select>
              </div>
              <div className="form-group full info-box">
                <Info size={14} />
                <span>Opening balance is used in ledger calculations. It won't affect actual invoices.</span>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Internal Notes</label>
                <textarea
                  className="form-textarea"
                  value={form.notes || ''}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Internal notes about this client (e.g. &quot;Usually pays within 30 days&quot;, &quot;Prefer WhatsApp&quot;…)&#10;&#10;These notes are internal only and will NOT appear on invoices."
                  rows={8}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>
            <Save size={15} />
            {client ? 'Update Client' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  );
};
