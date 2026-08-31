import React, { useState } from 'react';
import type { InvoiceData, LineItem, CustomerRecord, VehicleRecord } from '../types/invoice';
import {
  Plus,
  Trash2,
  Copy,
  Building2,
  User,
  FileSpreadsheet,
  Landmark,
  Sparkles,
  RefreshCw,
  Phone,
  BookmarkPlus,
  Share2,
  Zap,
  PlusCircle
} from 'lucide-react';
import { numberToIndianWords, formatCurrency } from '../utils/numberToWords';
import { openWhatsAppShare } from '../utils/exportUtils';
import { calculateNextBillNumber } from '../utils/billNumberUtils';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onSaveAsDefaultProfile?: () => void;
  customers?: CustomerRecord[];
  vehicles?: VehicleRecord[];
  savedInvoices?: InvoiceData[];
  onSaveAndNext?: () => void;
  onQuickSaveCustomer?: (name: string, phone?: string) => void;
  onQuickSaveVehicle?: (vehicleNo: string) => void;
  onOpenDirectoryModal?: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  onSaveAsDefaultProfile,
  customers = [],
  vehicles = [],
  savedInvoices = [],
  onSaveAndNext,
  onQuickSaveCustomer,
  onQuickSaveVehicle,
  onOpenDirectoryModal,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'bill' | 'company' | 'bank'>('items');
  const nextAutoBillNo = calculateNextBillNumber(savedInvoices, invoice);

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

  const handleSelectCustomer = (partyName: string) => {
    const found = customers.find((c) => c.name.toUpperCase() === partyName.toUpperCase());
    const copy = { ...invoice, clientName: partyName.toUpperCase() };
    if (found && found.phone) {
      copy.clientPhone = found.phone;
    }
    if (found && found.address) {
      copy.clientAddress = found.address;
    }
    copy.updatedAt = new Date().toISOString();
    onChange(copy);
  };

  const billTotal = invoice.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const advanceAmount = Number(invoice.advanceDeduction) || 0;
  const balanceTotal = billTotal - advanceAmount;

  return (
    <div className="editor-container">
      {/* Tab Navigation */}
      <div className="editor-tabs-bar">
        <button
          className={`editor-tab-item ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          <FileSpreadsheet size={15} />
          <span>Particulars</span>
          <span className="tab-counter-badge">{invoice.items.length}</span>
        </button>

        <button
          className={`editor-tab-item ${activeTab === 'bill' ? 'active' : ''}`}
          onClick={() => setActiveTab('bill')}
        >
          <User size={15} />
          <span>Party & Bill</span>
        </button>

        <button
          className={`editor-tab-item ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <Building2 size={15} />
          <span>Header</span>
        </button>

        <button
          className={`editor-tab-item ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <Landmark size={15} />
          <span>Bank & Terms</span>
        </button>
      </div>

      {/* TAB CONTENT: ITEMS & PARTICULARS */}
      {activeTab === 'items' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Trip Items & Charges</h3>
              <p className="tab-subheading">Enter vehicles, container numbers, destinations, and freight rates.</p>
            </div>
            <button className="btn-header btn-header-print" onClick={() => addItemRow()}>
              <Plus size={14} /> Add Row
            </button>
          </div>

          {/* Quick Add Chips */}
          <div className="quick-add-box">
            <span className="quick-add-label"><Sparkles size={13} className="text-amber" /> 1-Click Common Charges</span>
            <div className="chips-cloud">
              {quickParticulars.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="action-chip"
                  onClick={() => addItemRow(qp)}
                >
                  + {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Autocomplete Datalist */}
          <datalist id="vehicles-master-list">
            {vehicles.map((v) => (
              <option key={v.id} value={v.vehicleNo}>
                {v.driverName ? `${v.vehicleNo} (${v.driverName})` : v.vehicleNo}
              </option>
            ))}
          </datalist>

          {/* Items List */}
          <div className="items-list-wrapper">
            {invoice.items.map((item, idx) => (
              <div key={item.id || idx} className="item-editor-card">
                <div className="item-editor-card-header">
                  <span className="item-row-badge">Item #{idx + 1} {item.particulars ? `• ${item.particulars}` : ''}</span>
                  <div className="item-card-toolbar">
                    {item.vehicleNo && onQuickSaveVehicle && (
                      <button
                        type="button"
                        title="Save Vehicle to Directory"
                        className="btn-icon"
                        onClick={() => onQuickSaveVehicle(item.vehicleNo)}
                      >
                        <BookmarkPlus size={13} className="text-primary" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Duplicate Row"
                      className="btn-icon"
                      onClick={() => duplicateItemRow(idx)}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      title="Remove Row"
                      className="btn-icon text-danger"
                      onClick={() => removeItemRow(idx)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="form-grid-layout">
                  <div className="form-group col-2">
                    <label>S.N.</label>
                    <input
                      type="text"
                      value={item.sn}
                      placeholder="1"
                      onChange={(e) => handleItemChange(idx, 'sn', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label>Date</label>
                    <input
                      type="text"
                      value={item.date}
                      placeholder="22/08/26"
                      onChange={(e) => handleItemChange(idx, 'date', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Vehicle No.</label>
                    <input
                      type="text"
                      list="vehicles-master-list"
                      value={item.vehicleNo}
                      placeholder="MH46DL7778"
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                      onChange={(e) => handleItemChange(idx, 'vehicleNo', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group col-3">
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

                  <div className="form-group col-6">
                    <label>Container No (e.g. BEAU5560140 1X40)</label>
                    <textarea
                      rows={2}
                      value={item.containerNo}
                      placeholder="BEAU5560140&#10;1X40"
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => handleItemChange(idx, 'containerNo', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>P A R T I C U L A R S</label>
                    <textarea
                      rows={2}
                      value={item.particulars}
                      placeholder="CONTINENTAL TO VASAI"
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => handleItemChange(idx, 'particulars', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>Advance (Optional)</label>
                    <input
                      type="text"
                      value={item.advance}
                      placeholder="e.g. 5,000.00"
                      onChange={(e) => handleItemChange(idx, 'advance', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-6">
                    <label style={{ color: '#34d399', fontWeight: 700 }}>Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={item.amount}
                      placeholder="19000.00"
                      className="amount-input-highlight"
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
        </div>
      )}

      {/* TAB CONTENT: BILL & PARTY DETAILS */}
      {activeTab === 'bill' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Consignee & Invoice Metadata</h3>
              <p className="tab-subheading">Set customer name, bill numbering, advance deduction, and dates.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {onOpenDirectoryModal && (
                <button type="button" className="btn-header btn-header-ghost" onClick={onOpenDirectoryModal}>
                  <User size={14} /> Directory
                </button>
              )}
              {onSaveAndNext && (
                <button
                  type="button"
                  className="btn-header btn-header-save-next"
                  onClick={onSaveAndNext}
                  title="Save current bill and auto-prepare next sequential bill"
                >
                  <PlusCircle size={14} /> Save & Next
                </button>
              )}
            </div>
          </div>

          <datalist id="customers-master-list">
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.phone ? `${c.name} (${c.phone})` : c.name}
              </option>
            ))}
          </datalist>

          <div className="form-grid-layout">
            <div className="form-group col-8">
              <div className="flex-between">
                <label>M/S Transport Party / Consignee Name *</label>
                {invoice.clientName && onQuickSaveCustomer && (
                  <button
                    type="button"
                    className="btn-link-xs"
                    onClick={() => onQuickSaveCustomer(invoice.clientName, invoice.clientPhone)}
                  >
                    <BookmarkPlus size={12} /> Save to Directory
                  </button>
                )}
              </div>
              <input
                type="text"
                list="customers-master-list"
                value={invoice.clientName}
                placeholder="ADNISHA TRANSPORT"
                style={{ textTransform: 'uppercase', fontWeight: 700 }}
                onChange={(e) => handleSelectCustomer(e.target.value)}
              />
            </div>

            <div className="form-group col-4">
              <label>WhatsApp / Phone</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={13} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="9876543210"
                  value={invoice.clientPhone || ''}
                  style={{ paddingLeft: '28px' }}
                  onChange={(e) => updateInvoice('clientPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group col-12">
              <label>Customer Address (shown on bill)</label>
              <input
                type="text"
                value={invoice.clientAddress || ''}
                placeholder="Enter customer address"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('clientAddress', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-6">
              <div className="flex-between">
                <label>Bill No *</label>
                <button
                  type="button"
                  className="btn-link-xs"
                  title={`Set to next automatic sequence (${nextAutoBillNo})`}
                  onClick={() => updateInvoice('billNo', nextAutoBillNo)}
                >
                  <Zap size={11} /> Auto Next ({nextAutoBillNo.split('/')[0]})
                </button>
              </div>
              <input
                type="text"
                value={invoice.billNo}
                placeholder={nextAutoBillNo}
                style={{ fontWeight: 600, fontFamily: 'monospace' }}
                onChange={(e) => updateInvoice('billNo', e.target.value)}
              />
            </div>

            <div className="form-group col-6">
              <label>Invoice Date</label>
              <input
                type="text"
                value={invoice.date}
                placeholder="22-08-2026"
                onChange={(e) => updateInvoice('date', e.target.value)}
              />
            </div>

            {/* Reference Document Type Selection: BE NO vs INVOICE NO */}
            <div className="form-group col-12" style={{ marginBottom: '6px' }}>
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Document Reference Type *
                </label>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Selected on Bill: <strong style={{ color: '#38bdf8' }}>{invoice.refDocType || 'BE NO'}</strong>
                </span>
              </div>
              
              <div className="ref-doc-selector-group">
                <button
                  type="button"
                  className={`ref-doc-option-btn ${(invoice.refDocType || 'BE NO') === 'BE NO' ? 'active' : ''}`}
                  onClick={() => updateInvoice('refDocType', 'BE NO')}
                >
                  <span className="ref-radio-dot"></span>
                  <div className="ref-option-text">
                    <span className="ref-option-title">BE NO</span>
                    <span className="ref-option-desc">Bill of Entry / Import Reference</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`ref-doc-option-btn ${(invoice.refDocType || 'BE NO') === 'INVOICE NO' ? 'active' : ''}`}
                  onClick={() => updateInvoice('refDocType', 'INVOICE NO')}
                >
                  <span className="ref-radio-dot"></span>
                  <div className="ref-option-text">
                    <span className="ref-option-title">INVOICE NO</span>
                    <span className="ref-option-desc">Party / Commercial Invoice No</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="form-group col-6">
              <label>
                {(invoice.refDocType || 'BE NO') === 'INVOICE NO' ? 'Invoice No (Party / Ref No)' : 'BE No (Bill of Entry / Booking No)'}
              </label>
              <input
                type="text"
                value={invoice.beNo}
                placeholder={(invoice.refDocType || 'BE NO') === 'INVOICE NO' ? 'SSEPL/1741/2627' : '3188241'}
                onChange={(e) => updateInvoice('beNo', e.target.value)}
              />
            </div>

            <div className="form-group col-6">
              <label>
                {(invoice.refDocType || 'BE NO') === 'INVOICE NO' ? 'Invoice Date (Party Ref dt.)' : 'BE Date'}
              </label>
              <input
                type="text"
                value={invoice.beDate}
                placeholder="17/08/2026"
                onChange={(e) => updateInvoice('beDate', e.target.value)}
              />
            </div>

            <div className="form-group col-6">
              <label style={{ color: '#f59e0b', fontWeight: 600 }}>Advance Deduction (₹)</label>
              <input
                type="number"
                step="any"
                value={invoice.advanceDeduction}
                placeholder="0.00"
                onChange={(e) => updateInvoice('advanceDeduction', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group col-6">
              <label>Invoice Title Tag</label>
              <input
                type="text"
                value={invoice.title}
                placeholder="TAX INVOICE"
                onChange={(e) => updateInvoice('title', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-12">
              <div className="flex-between">
                <label>Amount in Words (Auto-generated)</label>
                <button
                  type="button"
                  className="btn-link-xs"
                  onClick={() => updateInvoice('customAmountInWords', numberToIndianWords(balanceTotal || billTotal))}
                >
                  <RefreshCw size={11} /> Reset Auto
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

            <div className="form-group col-12">
              <label>GST Tax Payable By Statement</label>
              <input
                type="text"
                value={invoice.customGstPayableBy || ''}
                placeholder={invoice.clientName || 'ADNISHA TRANSPORT'}
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('customGstPayableBy', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Letterhead & Brand Information</h3>
              <p className="tab-subheading">Customize company header, jurisdiction, and official contacts.</p>
            </div>
            {onSaveAsDefaultProfile && (
              <button
                type="button"
                className="btn-header btn-header-save"
                onClick={onSaveAsDefaultProfile}
              >
                Save as Default
              </button>
            )}
          </div>

          <div className="form-grid-layout">
            <div className="form-group col-12">
              <label>Top Jurisdiction Line</label>
              <input
                type="text"
                value={invoice.company.jurisdiction}
                placeholder="Subject To Navi Mumbai Jurisdiction"
                onChange={(e) => updateInvoice('company.jurisdiction', e.target.value)}
              />
            </div>

            <div className="form-group col-12">
              <label style={{ color: '#ef4444', fontWeight: 700 }}>Company Name (Main Red Heading)</label>
              <input
                type="text"
                value={invoice.company.companyName}
                placeholder="SWAMI KRUPA ROADLINES"
                style={{ color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.companyName', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-12">
              <label>Tagline (Underlined)</label>
              <input
                type="text"
                value={invoice.company.tagline}
                placeholder="FLEET OWNERS & TRANSPORT CONTRACTORS"
                style={{ textTransform: 'uppercase', fontWeight: 600 }}
                onChange={(e) => updateInvoice('company.tagline', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-12">
              <label>Address Line 1</label>
              <input
                type="text"
                value={invoice.company.addressLine1}
                placeholder="SHOP NO 5, GROUND FLOOR, MAHESHWAR VILLA, PLOT NO 30, SECTOR 5A, NEW PANVEL"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.addressLine1', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-12">
              <label>Address Line 2 (City & Pincode)</label>
              <input
                type="text"
                value={invoice.company.addressLine2}
                placeholder="NAVI MUMBAI - 410206"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('company.addressLine2', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-6">
              <label>Email Address</label>
              <input
                type="text"
                value={invoice.company.email}
                placeholder="Swamikruparoadlines@gmail.com"
                onChange={(e) => updateInvoice('company.email', e.target.value)}
              />
            </div>

            <div className="form-group col-6">
              <label>Mobile Numbers</label>
              <input
                type="text"
                value={invoice.company.mobiles}
                placeholder="9987010013 / 8888522803"
                onChange={(e) => updateInvoice('company.mobiles', e.target.value)}
              />
            </div>

            <div className="form-group col-12">
              <label>PAN No</label>
              <input
                type="text"
                value={invoice.company.panNo}
                placeholder="CAYPG4986P"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                onChange={(e) => updateInvoice('company.panNo', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BANK & TERMS */}
      {activeTab === 'bank' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Banking & Legal Terms</h3>
              <p className="tab-subheading">Set bank account details for RTGS/NEFT and invoice legal conditions.</p>
            </div>
            {onSaveAsDefaultProfile && (
              <button
                type="button"
                className="btn-header btn-header-save"
                onClick={onSaveAsDefaultProfile}
              >
                Save as Default
              </button>
            )}
          </div>

          <div className="form-grid-layout">
            <div className="form-group col-12">
              <label>Bank Name</label>
              <input
                type="text"
                value={invoice.bank.bankName}
                placeholder="GS MAHANAGER CO BANK"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('bank.bankName', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-12">
              <label>Branch Name</label>
              <input
                type="text"
                value={invoice.bank.branch}
                placeholder="KHANDA COLONY"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => updateInvoice('bank.branch', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-6">
              <label>Account Number</label>
              <input
                type="text"
                value={invoice.bank.accountNo}
                placeholder="032011200000548"
                style={{ fontFamily: 'monospace', fontWeight: 600 }}
                onChange={(e) => updateInvoice('bank.accountNo', e.target.value)}
              />
            </div>

            <div className="form-group col-6">
              <label>IFSC Code</label>
              <input
                type="text"
                value={invoice.bank.ifscCode}
                placeholder="MCBL0960032"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                onChange={(e) => updateInvoice('bank.ifscCode', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group col-6">
              <label style={{ color: '#ef4444' }}>Signature Line (Red)</label>
              <input
                type="text"
                value={invoice.company.signatureForText}
                placeholder="For SWAMI KRUPA ROADLINES"
                onChange={(e) => updateInvoice('company.signatureForText', e.target.value)}
              />
            </div>

            <div className="form-group col-6">
              <label>Designation Label</label>
              <input
                type="text"
                value={invoice.company.proprietorText}
                placeholder="Proprietor"
                onChange={(e) => updateInvoice('company.proprietorText', e.target.value)}
              />
            </div>

            <div className="form-group col-12">
              <label>Transport Terms & Conditions</label>
              {invoice.company.terms.map((term, tIdx) => (
                <div key={tIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, alignSelf: 'center', minWidth: '20px', color: '#94a3b8' }}>{tIdx + 1}.</span>
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
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-header btn-header-ghost"
                style={{ marginTop: '4px', alignSelf: 'flex-start' }}
                onClick={() => {
                  updateInvoice('company.terms', [...invoice.company.terms, 'New transport condition']);
                }}
              >
                <Plus size={13} /> Add Condition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary Strip */}
      <div className="editor-footer-summary">
        <div className="metric-box">
          <span className="metric-label">Total Amount</span>
          <span className="metric-value">₹ {formatCurrency(billTotal)}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Advance Less</span>
          <span className="metric-value" style={{ color: '#f59e0b' }}>₹ {formatCurrency(advanceAmount)}</span>
        </div>
        <div className="metric-box highlight">
          <span className="metric-label">Net Balance</span>
          <span className="metric-value">₹ {formatCurrency(balanceTotal)}</span>
        </div>
        <div>
          <button
            type="button"
            className="btn-header btn-header-whatsapp"
            onClick={() => openWhatsAppShare(invoice)}
            title="Share Bill Breakdown on WhatsApp"
          >
            <Share2 size={13} /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
