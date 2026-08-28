import React, { useState } from 'react';
import type { InvoiceData, LineItem } from '../types/invoice';
import { Plus, Trash2, Copy, Building2, User, FileSpreadsheet, Landmark, Sparkles, RefreshCw } from 'lucide-react';
import { numberToIndianWords } from '../utils/numberToWords';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onSaveAsDefaultProfile?: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  onSaveAsDefaultProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'bill' | 'items' | 'company' | 'bank'>('items');

  // Quick preset particulars common in transport billing
  const quickParticulars = [
    'CONTINENTAL TO VASAI',
    'EMPTY OFFLOADING',
    'PORT TO FACTORY',
    'FACTORY TO PORT',
    'NHAVA SHEVA TO BHIWANDI',
    'JNPT TO KALAMBOLI',
    'DETENTION CHARGES',
    'TOLL CHARGES',
    'LIFT ON / LIFT OFF CHARGES',
    'HALTING CHARGES',
  ];

  const quickWeights = ['FIXED', '20 MT', '24 MT', '28 MT', '30 MT', '32 MT'];

  // Handle nested updates
  const updateInvoice = (field: string, value: any) => {
    const copy = { ...invoice };
    if (field.startsWith('company.')) {
      const sub = field.replace('company.', '');
      copy.company = { ...copy.company, [sub]: value };
    } else if (field.startsWith('bank.')) {
      const sub = field.replace('bank.', '');
      copy.bank = { ...copy.bank, [sub]: value };
    } else {
      (copy as any)[field] = value;
    }
    copy.updatedAt = new Date().toISOString();
    onChange(copy);
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...invoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    onChange({
      ...invoice,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const addItemRow = (presetParticular?: string) => {
    const lastItem = invoice.items[invoice.items.length - 1];
    const nextSN = invoice.items.length === 0 ? '1' : '';
    const nextDate = lastItem?.date || invoice.date.replace(/-/g, '/').slice(0, 8);
    const nextVehicle = lastItem?.vehicleNo || '';
    const nextContainer = '';

    const newItem: LineItem = {
      id: 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sn: nextSN,
      date: nextDate,
      vehicleNo: nextVehicle,
      containerNo: nextContainer,
      particulars: presetParticular || '',
      weight: 'FIXED',
      advance: '',
      amount: '',
    };

    onChange({
      ...invoice,
      items: [...invoice.items, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const duplicateItemRow = (index: number) => {
    const itemToClone = invoice.items[index];
    const cloned: LineItem = {
      ...itemToClone,
      id: 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sn: '',
    };
    const updated = [...invoice.items];
    updated.splice(index + 1, 0, cloned);
    onChange({
      ...invoice,
      items: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeItemRow = (index: number) => {
    if (invoice.items.length <= 1) {
      // Clear single row instead of 0 rows
      onChange({
        ...invoice,
        items: [
          {
            id: 'row-' + Date.now(),
            sn: '1',
            date: '',
            vehicleNo: '',
            containerNo: '',
            particulars: '',
            weight: 'FIXED',
            advance: '',
            amount: '',
          },
        ],
      });
      return;
    }
    const updated = invoice.items.filter((_, idx) => idx !== index);
    onChange({
      ...invoice,
      items: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const billTotal = invoice.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const balanceTotal = billTotal - (Number(invoice.advanceDeduction) || 0);

  return (
    <div className="editor-container">
      {/* Editor Tab Navigation */}
      <div className="editor-tabs">
        <button
          className={`editor-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          <FileSpreadsheet size={16} />
          <span>Particulars ({invoice.items.length})</span>
        </button>

        <button
          className={`editor-tab-btn ${activeTab === 'bill' ? 'active' : ''}`}
          onClick={() => setActiveTab('bill')}
        >
          <User size={16} />
          <span>Bill & Party Info</span>
        </button>

        <button
          className={`editor-tab-btn ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <Building2 size={16} />
          <span>Company Header</span>
        </button>

        <button
          className={`editor-tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <Landmark size={16} />
          <span>Bank & Terms</span>
        </button>
      </div>

      {/* TAB CONTENT: ITEMS & PARTICULARS */}
      {activeTab === 'items' && (
        <div className="tab-pane">
          <div className="pane-header">
            <div>
              <h3 className="pane-title">Particulars & Trip Items</h3>
              <p className="pane-subtitle">Enter container, vehicle, destination, and billing amounts.</p>
            </div>
            <div className="pane-actions">
              <button className="btn-primary-sm" onClick={() => addItemRow()}>
                <Plus size={15} /> Add Line Row
              </button>
            </div>
          </div>

          {/* Quick Preset Badges */}
          <div className="quick-presets-box">
            <span className="preset-label"><Sparkles size={13} /> Quick Add:</span>
            <div className="preset-chips">
              {quickParticulars.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => addItemRow(qp)}
                >
                  + {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Line Items List */}
          <div className="items-editor-list">
            {invoice.items.map((item, idx) => (
              <div key={item.id || idx} className="item-card">
                <div className="item-card-header">
                  <span className="item-badge">Row #{idx + 1}</span>
                  <div className="item-card-controls">
                    <button
                      type="button"
                      title="Duplicate row"
                      className="btn-icon"
                      onClick={() => duplicateItemRow(idx)}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      title="Remove row"
                      className="btn-icon text-danger"
                      onClick={() => removeItemRow(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="item-grid-form">
                  <div className="input-group col-span-2">
                    <label>S.N.</label>
                    <input
                      type="text"
                      value={item.sn}
                      placeholder="1"
                      onChange={(e) => handleItemChange(idx, 'sn', e.target.value)}
                    />
                  </div>

                  <div className="input-group col-span-3">
                    <label>Date</label>
                    <input
                      type="text"
                      value={item.date}
                      placeholder="22/08/26"
                      onChange={(e) => handleItemChange(idx, 'date', e.target.value)}
                    />
                  </div>

                  <div className="input-group col-span-4">
                    <label>Vehicle No.</label>
                    <input
                      type="text"
                      value={item.vehicleNo}
                      placeholder="MH46DL7778"
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => handleItemChange(idx, 'vehicleNo', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="input-group col-span-3">
                    <label>Weight</label>
                    <input
                      type="text"
                      list={`weight-list-${idx}`}
                      value={item.weight}
                      placeholder="FIXED"
                      onChange={(e) => handleItemChange(idx, 'weight', e.target.value)}
                    />
                    <datalist id={`weight-list-${idx}`}>
                      {quickWeights.map((w, wi) => (
                        <option key={wi} value={w} />
                      ))}
                    </datalist>
                  </div>

                  <div className="input-group col-span-6">
                    <label>Container No (e.g. BEAU5560140 1X40)</label>
                    <textarea
                      rows={2}
                      value={item.containerNo}
                      placeholder="BEAU5560140&#10;1X40"
                      style={{ textTransform: 'uppercase', resize: 'vertical' }}
                      onChange={(e) => handleItemChange(idx, 'containerNo', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="input-group col-span-6">
                    <label>P A R T I C U L A R S</label>
                    <textarea
                      rows={2}
                      value={item.particulars}
                      placeholder="CONTINENTAL TO VASAI"
                      style={{ textTransform: 'uppercase', resize: 'vertical' }}
                      onChange={(e) => handleItemChange(idx, 'particulars', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="input-group col-span-6">
                    <label>Advance (Optional)</label>
                    <input
                      type="text"
                      value={item.advance}
                      placeholder="e.g. 5,000.00"
                      onChange={(e) => handleItemChange(idx, 'advance', e.target.value)}
                    />
                  </div>

                  <div className="input-group col-span-6">
                    <label className="text-highlight">Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={item.amount}
                      placeholder="19000.00"
                      className="input-highlight"
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          'amount',
                          e.target.value === '' ? '' : parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Summary Strip */}
          <div className="editor-summary-strip">
            <div className="summary-col">
              <span className="lbl">Bill Total</span>
              <span className="val">₹ {billTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-col">
              <span className="lbl">Advance Less</span>
              <span className="val">₹ {(Number(invoice.advanceDeduction) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-col highlight">
              <span className="lbl">Net Balance</span>
              <span className="val">₹ {balanceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BILL & PARTY DETAILS */}
      {activeTab === 'bill' && (
        <div className="tab-pane">
          <div className="pane-header">
            <div>
              <h3 className="pane-title">Invoice & Customer Details</h3>
              <p className="pane-subtitle">Set bill number, date, consignee, and advance deductions.</p>
            </div>
          </div>

          <div className="form-section-grid">
            <div className="input-group col-span-12">
              <label>M/S Consignee / Transport Party Name</label>
              <input
                type="text"
                value={invoice.clientName}
                placeholder="ADNISHA TRANSPORT"
                style={{ textTransform: 'uppercase', fontWeight: 600 }}
                onChange={(e) => updateInvoice('clientName', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Bill No</label>
              <input
                type="text"
                value={invoice.billNo}
                placeholder="122/ 2026-27"
                onChange={(e) => updateInvoice('billNo', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Invoice Date</label>
              <input
                type="text"
                value={invoice.date}
                placeholder="22-08-2026"
                onChange={(e) => updateInvoice('date', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>BE No (Bill of Entry / Booking No)</label>
              <input
                type="text"
                value={invoice.beNo}
                placeholder="3188241"
                onChange={(e) => updateInvoice('beNo', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>BE Date</label>
              <input
                type="text"
                value={invoice.beDate}
                placeholder="17/08/2026"
                onChange={(e) => updateInvoice('beDate', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Advance Deduction (₹)</label>
              <input
                type="number"
                step="any"
                value={invoice.advanceDeduction}
                placeholder="0.00"
                onChange={(e) => updateInvoice('advanceDeduction', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Invoice Title Tag</label>
              <input
                type="text"
                value={invoice.title}
                placeholder="TAX INVOICE"
                onChange={(e) => updateInvoice('title', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-12">
              <div className="flex-between">
                <label>Amount in Words (Auto-generated)</label>
                <button
                  type="button"
                  className="btn-link-xs"
                  onClick={() => updateInvoice('customAmountInWords', numberToIndianWords(balanceTotal || billTotal))}
                >
                  <RefreshCw size={11} /> Reset to Auto
                </button>
              </div>
              <input
                type="text"
                value={invoice.customAmountInWords || ''}
                placeholder={numberToIndianWords(balanceTotal || billTotal)}
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('customAmountInWords', e.target.value.toUpperCase())}
              />
              <span className="field-hint">Default: {numberToIndianWords(balanceTotal || billTotal)}</span>
            </div>

            <div className="input-group col-span-12">
              <label>GST Tax Payable By Text</label>
              <input
                type="text"
                value={invoice.customGstPayableBy || ''}
                placeholder={invoice.clientName || 'ADNISHA TRANSPORT'}
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('customGstPayableBy', e.target.value.toUpperCase())}
              />
              <span className="field-hint">Appears in: "GST TAX PAYABLE BY [Party Name]"</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <div className="tab-pane">
          <div className="pane-header">
            <div>
              <h3 className="pane-title">Company Header & Letterhead</h3>
              <p className="pane-subtitle">Modify the company name (red bold title), tagline, addresses, and contacts.</p>
            </div>
            {onSaveAsDefaultProfile && (
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={onSaveAsDefaultProfile}
              >
                Save as Default
              </button>
            )}
          </div>

          <div className="form-section-grid">
            <div className="input-group col-span-12">
              <label>Top Jurisdiction Line</label>
              <input
                type="text"
                value={invoice.company.jurisdiction}
                placeholder="Subject To Navi Mumbai Jurisdiction"
                onChange={(e) => updateInvoice('company.jurisdiction', e.target.value)}
              />
            </div>

            <div className="input-group col-span-12">
              <label className="text-danger">Company Main Name (Red Header)</label>
              <input
                type="text"
                value={invoice.company.companyName}
                placeholder="SWAMI KRUPA ROADLINES"
                style={{ color: '#d60000', fontWeight: 800, textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.companyName', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-12">
              <label>Tagline (Underlined)</label>
              <input
                type="text"
                value={invoice.company.tagline}
                placeholder="FLEET OWNERS & TRANSPORT CONTRACTORS"
                style={{ textTransform: 'uppercase', fontWeight: 600 }}
                onChange={(e) => updateInvoice('company.tagline', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-12">
              <label>Address Line 1</label>
              <input
                type="text"
                value={invoice.company.addressLine1}
                placeholder="SHOP NO 5 GROUND FLOOR MAHESHWER VILLA PLOT NO 30 SECTOR 5A NEW PANVEL"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.addressLine1', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-12">
              <label>Address Line 2 (City & Pincode)</label>
              <input
                type="text"
                value={invoice.company.addressLine2}
                placeholder="NAVI MUMBAI-410206"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.addressLine2', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Email Address</label>
              <input
                type="text"
                value={invoice.company.email}
                placeholder="Swamikruparoadlines@gmail.com"
                onChange={(e) => updateInvoice('company.email', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Mobile Numbers</label>
              <input
                type="text"
                value={invoice.company.mobiles}
                placeholder="9987010013 / 8888522803"
                onChange={(e) => updateInvoice('company.mobiles', e.target.value)}
              />
            </div>

            <div className="input-group col-span-12">
              <label>PAN No</label>
              <input
                type="text"
                value={invoice.company.panNo}
                placeholder="CAYPG4986P"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.panNo', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BANK & TERMS */}
      {activeTab === 'bank' && (
        <div className="tab-pane">
          <div className="pane-header">
            <div>
              <h3 className="pane-title">Bank Details & Terms of Service</h3>
              <p className="pane-subtitle">Configure banking information and invoice terms.</p>
            </div>
            {onSaveAsDefaultProfile && (
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={onSaveAsDefaultProfile}
              >
                Save as Default
              </button>
            )}
          </div>

          <div className="form-section-grid">
            <div className="input-group col-span-12">
              <label>Bank Name</label>
              <input
                type="text"
                value={invoice.bank.bankName}
                placeholder="GS MAHANAGER CO BANK"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('bank.bankName', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-12">
              <label>Branch Name</label>
              <input
                type="text"
                value={invoice.bank.branch}
                placeholder="KHANDACONLNY"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('bank.branch', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Account Number</label>
              <input
                type="text"
                value={invoice.bank.accountNo}
                placeholder="032011200000548"
                onChange={(e) => updateInvoice('bank.accountNo', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>IFSC Code</label>
              <input
                type="text"
                value={invoice.bank.ifscCode}
                placeholder="MCBL0960032"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('bank.ifscCode', e.target.value.toUpperCase())}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Signature Text (Red)</label>
              <input
                type="text"
                value={invoice.company.signatureForText}
                placeholder="For SWAMI KRUPA ROADLINES"
                onChange={(e) => updateInvoice('company.signatureForText', e.target.value)}
              />
            </div>

            <div className="input-group col-span-6">
              <label>Designation Text</label>
              <input
                type="text"
                value={invoice.company.proprietorText}
                placeholder="Proprietor"
                onChange={(e) => updateInvoice('company.proprietorText', e.target.value)}
              />
            </div>

            <div className="input-group col-span-12">
              <label>Terms & Conditions</label>
              {invoice.company.terms.map((term, tIdx) => (
                <div key={tIdx} className="term-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, alignSelf: 'center', minWidth: '20px' }}>{tIdx + 1}.</span>
                  <input
                    type="text"
                    value={term}
                    style={{ flex: 1 }}
                    onChange={(e) => {
                      const newTerms = [...invoice.company.terms];
                      newTerms[tIdx] = e.target.value;
                      updateInvoice('company.terms', newTerms);
                    }}
                  />
                  <button
                    type="button"
                    className="btn-icon text-danger"
                    onClick={() => {
                      const newTerms = invoice.company.terms.filter((_, idx) => idx !== tIdx);
                      updateInvoice('company.terms', newTerms);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary-sm"
                style={{ marginTop: '6px' }}
                onClick={() => {
                  updateInvoice('company.terms', [...invoice.company.terms, 'New term condition']);
                }}
              >
                <Plus size={14} /> Add Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
