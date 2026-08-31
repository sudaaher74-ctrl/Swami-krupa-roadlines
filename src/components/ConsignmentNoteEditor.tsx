import React, { useState } from 'react';
import type {
  ConsignmentNote,
  ConsignmentCopyType,
  CustomerRecord,
  VehicleRecord,
  CompanyProfile,
} from '../types/invoice';
import {
  Package,
  Building2,
  FileCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  Users,
} from 'lucide-react';

interface ConsignmentNoteEditorProps {
  note: ConsignmentNote;
  onChange: (note: ConsignmentNote) => void;
  customers: CustomerRecord[];
  vehicles: VehicleRecord[];
  onSaveAsDefaultProfile?: (company: CompanyProfile) => void;
  onConvertToInvoice?: (note: ConsignmentNote) => void;
  onOpenDirectoryModal?: () => void;
}

const COMMON_GOODS_PRESETS = [
  'FLOWLAC-100 LACTOSE',
  'PHARMACEUTICAL RAW MATERIAL',
  'INDUSTRIAL MACHINERY',
  'CHEMICAL DRUMS IN CONTAINER',
  'COTTON YARN BALES',
  'GENERAL COMMERCIAL CARGO',
  'EMPTY OFFLOADING',
  'FULL CONTAINER LOAD (FCL)',
];

const COMMON_ROUTES_PRESETS = [
  { from: 'N/SHIVA', to: 'JAROD' },
  { from: 'JNPT PORT', to: 'KALAMBOLI' },
  { from: 'NHAVA SHEVA', to: 'BHIWANDI' },
  { from: 'CONTINENTAL CFS', to: 'VASAI' },
  { from: 'PANVEL', to: 'VAPI / SURAT' },
  { from: 'MUMBAI PORT', to: 'PUNE' },
];

export const ConsignmentNoteEditor: React.FC<ConsignmentNoteEditorProps> = ({
  note,
  onChange,
  customers,
  vehicles,
  onConvertToInvoice,
  onOpenDirectoryModal,
}) => {
  const [activeTab, setActiveTab] = useState<'goods' | 'parties' | 'docs' | 'branch'>('goods');

  const updateField = (field: string, value: any) => {
    const copy = { ...note };
    if (field.includes('.')) {
      const parts = field.split('.');
      (copy as any)[parts[0]] = {
        ...(copy as any)[parts[0]],
        [parts[1]]: value,
      };
    } else {
      (copy as any)[field] = value;
    }
    onChange(copy);
  };

  const copyOptions: ConsignmentCopyType[] = [
    'CONSIGNEE COPY',
    'CONSIGNOR COPY',
    'DRIVER COPY',
    'OFFICE COPY',
    'TRANSPORTER COPY',
  ];

  return (
    <div className="invoice-editor-sidebar">
      {/* Top Tab Navigation identical to InvoiceEditor */}
      <div className="editor-tabs-nav">
        <button
          type="button"
          className={`editor-tab-item ${activeTab === 'goods' ? 'active' : ''}`}
          onClick={() => setActiveTab('goods')}
        >
          <Package size={15} />
          <span>Goods & Freight</span>
        </button>

        <button
          type="button"
          className={`editor-tab-item ${activeTab === 'parties' ? 'active' : ''}`}
          onClick={() => setActiveTab('parties')}
        >
          <Building2 size={15} />
          <span>Parties & Route</span>
        </button>

        <button
          type="button"
          className={`editor-tab-item ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <FileCheck size={15} />
          <span>Docs & Mode</span>
        </button>

        <button
          type="button"
          className={`editor-tab-item ${activeTab === 'branch' ? 'active' : ''}`}
          onClick={() => setActiveTab('branch')}
        >
          <MapPin size={15} />
          <span>Header</span>
        </button>
      </div>

      {/* TAB 1: GOODS & FREIGHT */}
      {activeTab === 'goods' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Consignment Cargo & Rates</h3>
              <p className="tab-subheading">Enter packages, description, container & freight rate.</p>
            </div>
            {onConvertToInvoice && (
              <button
                type="button"
                className="btn-header btn-header-save"
                onClick={() => onConvertToInvoice(note)}
                title="Create Bill from this LR"
              >
                <ArrowRight size={13} /> Make Bill
              </button>
            )}
          </div>

          {/* Quick Presets Cloud */}
          <div className="quick-add-box">
            <span className="quick-add-label">
              <Sparkles size={13} className="text-amber" /> 1-Click Common Goods
            </span>
            <div className="chips-cloud">
              {COMMON_GOODS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="action-chip"
                  onClick={() => updateField('description', preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Card 1: G.C. Note & Vehicle */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">LR / Note Info</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-4">
                <label>G. C. / LR No.</label>
                <input
                  type="text"
                  value={note.lrNo}
                  placeholder="025992"
                  style={{ color: '#ef4444', fontWeight: 700 }}
                  onChange={(e) => updateField('lrNo', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Date</label>
                <input
                  type="text"
                  value={note.date}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Vehicle No.</label>
                <input
                  type="text"
                  value={note.vehicleNo}
                  placeholder="MH46CL8146"
                  list="lr-vehicles-list-main"
                  style={{ textTransform: 'uppercase', fontWeight: 600 }}
                  onChange={(e) => updateField('vehicleNo', e.target.value.toUpperCase())}
                />
                <datalist id="lr-vehicles-list-main">
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.vehicleNo} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Card 2: Cargo & Container */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Cargo & Weight Details</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-4">
                <label>No. of Pkgs</label>
                <input
                  type="text"
                  value={note.packagesCount}
                  placeholder="1X20"
                  onChange={(e) => updateField('packagesCount', e.target.value)}
                />
              </div>

              <div className="form-group col-8">
                <label>Description (Said to Contain)</label>
                <input
                  type="text"
                  value={note.description}
                  placeholder="Flowlac-100 Lactose"
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Container No.</label>
                <input
                  type="text"
                  value={note.containerNo || ''}
                  placeholder="MSKU3653724"
                  onChange={(e) => updateField('containerNo', e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group col-4">
                <label>PO / Ref No.</label>
                <input
                  type="text"
                  value={note.poNumber || ''}
                  placeholder="PO No. 3200009020"
                  onChange={(e) => updateField('poNumber', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Sender Weight</label>
                <input
                  type="text"
                  value={note.senderWeight}
                  placeholder="1X20 Container Load"
                  onChange={(e) => updateField('senderWeight', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Freight Charges */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Freight Breakdown</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-12">
                <label>Freight Payment Mode</label>
                <div className="chips-cloud" style={{ marginTop: '4px' }}>
                  {(['TBB', 'TO PAY', 'PAID'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`action-chip ${note.freightType === type ? 'active' : ''}`}
                      style={{
                        background: note.freightType === type ? '#2563eb' : undefined,
                        color: note.freightType === type ? '#ffffff' : undefined,
                        borderColor: note.freightType === type ? '#2563eb' : undefined,
                      }}
                      onClick={() => updateField('freightType', type)}
                    >
                      {type === 'TBB' ? '☑ TBB (To Be Billed)' : type === 'TO PAY' ? '☑ TO PAY' : '☑ PAID'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group col-4">
                <label>Freight Amount (₹)</label>
                <input
                  type="number"
                  value={note.freightAmount}
                  placeholder="0.00"
                  onChange={(e) => updateField('freightAmount', e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div className="form-group col-4">
                <label>Bilty Charge / Note</label>
                <input
                  type="text"
                  value={note.biltyCharges !== undefined && note.biltyCharges !== '' ? note.biltyCharges : (note.freightRemark || '')}
                  placeholder="ABB A/C Alembic"
                  onChange={(e) => updateField('freightRemark', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Total Freight (₹)</label>
                <input
                  type="number"
                  value={note.totalFreightAmount}
                  placeholder="0.00"
                  onChange={(e) => updateField('totalFreightAmount', e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTIES & ROUTE */}
      {activeTab === 'parties' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Parties & Transit Route</h3>
              <p className="tab-subheading">Consignor, consignee, origin, and destination.</p>
            </div>
            {onOpenDirectoryModal && (
              <button
                type="button"
                className="btn-header btn-header-ghost"
                onClick={onOpenDirectoryModal}
              >
                <Users size={14} /> Directory
              </button>
            )}
          </div>

          {/* Quick Route Presets */}
          <div className="quick-add-box">
            <span className="quick-add-label">
              <Sparkles size={13} className="text-amber" /> 1-Click Common Routes
            </span>
            <div className="chips-cloud">
              {COMMON_ROUTES_PRESETS.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="action-chip"
                  onClick={() => {
                    updateField('fromLocation', r.from);
                    updateField('toLocation', r.to);
                  }}
                >
                  + {r.from} ➔ {r.to}
                </button>
              ))}
            </div>
          </div>

          {/* Consignor Card */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Consignor (Sender)</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-8">
                <label>Consignor Name</label>
                <input
                  type="text"
                  value={note.consignorName}
                  placeholder="M/s Alembic Pharmaceuticals LTD"
                  list="lr-consignor-list-main"
                  onChange={(e) => updateField('consignorName', e.target.value)}
                />
                <datalist id="lr-consignor-list-main">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group col-4">
                <label>From (Origin)</label>
                <input
                  type="text"
                  value={note.fromLocation}
                  placeholder="N/Shiva"
                  onChange={(e) => updateField('fromLocation', e.target.value)}
                />
              </div>

              <div className="form-group col-8">
                <label>Consignor Address / CFS</label>
                <input
                  type="text"
                  value={note.consignorAddress}
                  placeholder="Nhava Sheva Mumbai Allcargo CFS"
                  onChange={(e) => updateField('consignorAddress', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Consignor GSTIN</label>
                <input
                  type="text"
                  value={note.consignorGst || ''}
                  placeholder="Optional"
                  onChange={(e) => updateField('consignorGst', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Consignee Card */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Consignee (Receiver)</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-8">
                <label>Consignee Name</label>
                <input
                  type="text"
                  value={note.consigneeName}
                  placeholder="M/s Alembic Pharmaceuticals LTD"
                  list="lr-consignee-list-main"
                  onChange={(e) => updateField('consigneeName', e.target.value)}
                />
                <datalist id="lr-consignee-list-main">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group col-4">
                <label>To (Destination)</label>
                <input
                  type="text"
                  value={note.toLocation}
                  placeholder="Jarod"
                  onChange={(e) => updateField('toLocation', e.target.value)}
                />
              </div>

              <div className="form-group col-8">
                <label>Consignee Delivery Address</label>
                <input
                  type="text"
                  value={note.consigneeAddress}
                  placeholder="F4 Jarod, Vadodara, Gujarat"
                  onChange={(e) => updateField('consigneeAddress', e.target.value)}
                />
              </div>

              <div className="form-group col-4">
                <label>Consignee GSTIN</label>
                <input
                  type="text"
                  value={note.consigneeGst || ''}
                  placeholder="24AAATCA5591M1Z9"
                  onChange={(e) => updateField('consigneeGst', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCS & DELIVERY */}
      {activeTab === 'docs' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Documents & Compliance</h3>
              <p className="tab-subheading">Copy type, E-Way Bill, Delivery mode & GST.</p>
            </div>
          </div>

          {/* Copy Selector */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Document Copy Watermark</span>
            </div>
            <div className="chips-cloud" style={{ marginTop: '8px' }}>
              {copyOptions.map((copy) => (
                <button
                  key={copy}
                  type="button"
                  className={`action-chip ${note.copyType === copy ? 'active' : ''}`}
                  style={{
                    background: note.copyType === copy ? '#1e3a8a' : undefined,
                    color: note.copyType === copy ? '#ffffff' : undefined,
                    borderColor: note.copyType === copy ? '#3b82f6' : undefined,
                    fontWeight: 700,
                  }}
                  onClick={() => updateField('copyType', copy)}
                >
                  {copy}
                </button>
              ))}
            </div>
          </div>

          {/* Attached Documents */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Attached Invoices & E-Waybill</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-6">
                <label>E-Waybill No.</label>
                <input
                  type="text"
                  value={note.ewayBillNo || ''}
                  placeholder="612169013377"
                  onChange={(e) => updateField('ewayBillNo', e.target.value)}
                />
              </div>

              <div className="form-group col-6">
                <label>Invoice No.</label>
                <input
                  type="text"
                  value={note.invoiceNo || ''}
                  placeholder="3081744"
                  onChange={(e) => updateField('invoiceNo', e.target.value)}
                />
              </div>

              <div className="form-group col-6">
                <label>Invoice Date</label>
                <input
                  type="text"
                  value={note.invoiceDate || ''}
                  placeholder="11/08/2026"
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                />
              </div>

              <div className="form-group col-6">
                <label>Invoice Value (₹)</label>
                <input
                  type="text"
                  value={note.invoiceValue || ''}
                  placeholder="As per Invoice"
                  onChange={(e) => updateField('invoiceValue', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Mode & GST Payer */}
          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Delivery & Tax Liability</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-6">
                <label>Delivery Mode</label>
                <select
                  value={note.deliveryType || 'Godown'}
                  onChange={(e) => updateField('deliveryType', e.target.value)}
                >
                  <option value="Godown">Godown Delivery</option>
                  <option value="Door Delivery">Door Delivery</option>
                  <option value="Unloading By Consignee">Unloading By Consignee</option>
                  <option value="Unloading By Transport">Unloading By Transport</option>
                </select>
              </div>

              <div className="form-group col-6">
                <label>GST Payable By</label>
                <div className="chips-cloud" style={{ marginTop: '4px' }}>
                  {(['CONSIGNEE', 'CONSIGNOR', 'CARRIER'] as const).map((payer) => (
                    <button
                      key={payer}
                      type="button"
                      className={`action-chip ${note.gstPayableBy === payer ? 'active' : ''}`}
                      style={{
                        background: note.gstPayableBy === payer ? '#1e3a8a' : undefined,
                        color: note.gstPayableBy === payer ? '#ffffff' : undefined,
                      }}
                      onClick={() => updateField('gstPayableBy', payer)}
                    >
                      {payer}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HEADER & BRANCH */}
      {activeTab === 'branch' && (
        <div className="tab-pane-content">
          <div className="tab-pane-header">
            <div>
              <h3 className="tab-heading">Company & Branch Settings</h3>
              <p className="tab-subheading">Branch header name, jurisdiction & PAN.</p>
            </div>
          </div>

          <div className="item-editor-card">
            <div className="item-editor-card-header">
              <span className="item-row-badge">Branch & Jurisdiction</span>
            </div>

            <div className="form-grid-layout">
              <div className="form-group col-12">
                <label>Issuing Branch Name</label>
                <input
                  type="text"
                  value={note.branchName || ''}
                  placeholder="NAVI MUMBAI (PANVEL) BRANCH"
                  onChange={(e) => updateField('branchName', e.target.value)}
                />
              </div>

              <div className="form-group col-12">
                <label>Jurisdiction Clause</label>
                <input
                  type="text"
                  value={note.company.jurisdiction}
                  placeholder="Subject To Navi Mumbai Jurisdiction"
                  onChange={(e) => updateField('company.jurisdiction', e.target.value)}
                />
              </div>

              <div className="form-group col-6">
                <label>Company Name</label>
                <input
                  type="text"
                  value={note.company.companyName}
                  onChange={(e) => updateField('company.companyName', e.target.value)}
                />
              </div>

              <div className="form-group col-6">
                <label>PAN No</label>
                <input
                  type="text"
                  value={note.company.panNo}
                  onChange={(e) => updateField('company.panNo', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Summary Bar identical to InvoiceEditor */}
      <div className="editor-footer-summary">
        <div className="metric-box">
          <span className="metric-label">COPY</span>
          <span className="metric-value" style={{ color: '#60a5fa', fontSize: '12px' }}>
            {note.copyType.replace(' COPY', '')}
          </span>
        </div>
        <div className="metric-box">
          <span className="metric-label">GST BY</span>
          <span className="metric-value" style={{ fontSize: '12px' }}>
            {note.gstPayableBy}
          </span>
        </div>
        <div className="metric-box highlight">
          <span className="metric-label">FREIGHT</span>
          <span className="metric-value" style={{ fontSize: '13px' }}>
            {note.totalFreightAmount ? `₹${note.totalFreightAmount}` : note.freightType}
          </span>
        </div>

        {onConvertToInvoice && (
          <button
            type="button"
            className="btn-create-invoice-bridge"
            onClick={() => onConvertToInvoice(note)}
            title="Create Tax Invoice pre-populated from this LR"
          >
            <ArrowRight size={13} /> Make Bill
          </button>
        )}
      </div>
    </div>
  );
};
