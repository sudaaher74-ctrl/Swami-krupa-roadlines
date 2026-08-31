import React, { useState } from 'react';
import type { ConsignmentNote, ConsignmentCopyType, CustomerRecord, VehicleRecord } from '../types/invoice';
import { ConsignmentNoteDocument } from './ConsignmentNoteDocument';
import { downloadConsignmentNotePDF, openConsignmentWhatsAppShare } from '../utils/exportUtils';
import { createNewConsignmentNote } from '../utils/defaultData';
import {
  X,
  Printer,
  Download,
  Share2,
  Save,
  PlusCircle,
  FolderOpen,
  FileText,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Truck,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react';

interface ConsignmentNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedNotes: ConsignmentNote[];
  onSaveNote: (note: ConsignmentNote) => void;
  onDeleteNote: (id: string) => void;
  customers: CustomerRecord[];
  vehicles: VehicleRecord[];
  onCreateInvoiceFromLR?: (note: ConsignmentNote) => void;
}

export const ConsignmentNoteModal: React.FC<ConsignmentNoteModalProps> = ({
  isOpen,
  onClose,
  savedNotes,
  onSaveNote,
  onDeleteNote,
  customers,
  vehicles,
  onCreateInvoiceFromLR,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history'>('editor');
  const [currentNote, setCurrentNote] = useState<ConsignmentNote>(() => {
    return savedNotes.length > 0 ? savedNotes[0] : createNewConsignmentNote();
  });
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const updateField = (field: string, value: any) => {
    setCurrentNote((prev) => {
      const copy = { ...prev };
      if (field.includes('.')) {
        const parts = field.split('.');
        (copy as any)[parts[0]] = {
          ...(copy as any)[parts[0]],
          [parts[1]]: value,
        };
      } else {
        (copy as any)[field] = value;
      }
      return copy;
    });
  };

  const handleSave = () => {
    const updated = { ...currentNote, updatedAt: new Date().toISOString() };
    onSaveNote(updated);
    showToast(`Saved e-LR #${updated.lrNo} successfully!`);
  };

  const handleNewNote = () => {
    const fresh = createNewConsignmentNote();
    setCurrentNote(fresh);
    setActiveTab('editor');
    showToast('Created new blank e-LR note');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      showToast('Generating high-res e-LR PDF...');
      await downloadConsignmentNotePDF(currentNote);
      showToast('e-LR PDF downloaded successfully!');
    } catch (e) {
      console.error(e);
      alert('Could not download PDF. You can also print the document.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsApp = () => {
    openConsignmentWhatsAppShare(currentNote);
  };

  const copyOptions: ConsignmentCopyType[] = [
    'CONSIGNEE COPY',
    'CONSIGNOR COPY',
    'DRIVER COPY',
    'OFFICE COPY',
    'TRANSPORTER COPY',
  ];

  return (
    <div className="trip-slip-modal-overlay" onClick={onClose}>
      <div className="trip-slip-modal-container lr-modal-wide" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="trip-slip-modal-header">
          <div className="ts-header-title-group">
            <FileText className="ts-header-icon" size={22} style={{ color: '#2563eb' }} />
            <div>
              <h2 className="ts-modal-title">e-LR & Goods Consignment Note Generator</h2>
              <p className="ts-modal-subtitle">
                Swami Krupa Roadlines • Official Lorry Receipt / Bilty Management
              </p>
            </div>
          </div>

          <div className="ts-modal-tabs">
            <button
              type="button"
              className={`ts-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <FileText size={15} /> Edit e-LR
            </button>
            <button
              type="button"
              className={`ts-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Layers size={15} /> Live Document
            </button>
            <button
              type="button"
              className={`ts-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FolderOpen size={15} /> Saved LRs ({savedNotes.length})
            </button>
          </div>

          <button type="button" className="ts-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Copy Selector Bar */}
        <div className="lr-copy-selector-bar">
          <span className="lr-copy-label">Select Document Copy:</span>
          <div className="lr-copy-pills">
            {copyOptions.map((copy) => (
              <button
                key={copy}
                type="button"
                className={`lr-copy-pill ${currentNote.copyType === copy ? 'active' : ''}`}
                onClick={() => updateField('copyType', copy)}
              >
                {copy}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="trip-slip-modal-body">
          {toastMsg && (
            <div className="trip-slip-toast">
              <CheckCircle2 size={16} /> {toastMsg}
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="ts-editor-form lr-editor-grid">
              {/* Card 1: LR Meta */}
              <div className="ts-form-card">
                <h3 className="ts-card-title">
                  <FileText size={16} /> Consignment Note Info
                </h3>
                <div className="ts-form-grid">
                  <div className="form-group col-4">
                    <label>G. C. / LR No.</label>
                    <input
                      type="text"
                      value={currentNote.lrNo}
                      placeholder="025992"
                      style={{ fontWeight: 700, color: '#dc2626' }}
                      onChange={(e) => updateField('lrNo', e.target.value)}
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Date</label>
                    <input
                      type="text"
                      value={currentNote.date}
                      placeholder="DD/MM/YYYY"
                      onChange={(e) => updateField('date', e.target.value)}
                    />
                  </div>
                  <div className="form-group col-4">
                    <label>Vehicle No.</label>
                    <input
                      type="text"
                      value={currentNote.vehicleNo}
                      placeholder="MH46CL8146"
                      list="lr-vehicles-list"
                      style={{ textTransform: 'uppercase', fontWeight: 600 }}
                      onChange={(e) => updateField('vehicleNo', e.target.value.toUpperCase())}
                    />
                    <datalist id="lr-vehicles-list">
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.vehicleNo} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Card 2: Consignor & Consignee */}
              <div className="ts-form-card">
                <h3 className="ts-card-title">
                  <Building2 size={16} /> Consignor & Consignee Parties
                </h3>
                <div className="ts-form-grid">
                  <div className="form-group col-6">
                    <label>Consignor (Sender)</label>
                    <input
                      type="text"
                      value={currentNote.consignorName}
                      placeholder="M/s Alembic Pharmaceuticals LTD"
                      list="lr-customers-list"
                      onChange={(e) => updateField('consignorName', e.target.value)}
                    />
                    <datalist id="lr-customers-list">
                      {customers.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group col-6">
                    <label>Consignee (Receiver)</label>
                    <input
                      type="text"
                      value={currentNote.consigneeName}
                      placeholder="M/s Alembic Pharmaceuticals LTD"
                      list="lr-customers-list"
                      onChange={(e) => updateField('consigneeName', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>Consignor Address & Details</label>
                    <input
                      type="text"
                      value={currentNote.consignorAddress}
                      placeholder="Nhava Sheva Mumbai Allcargo CFS"
                      onChange={(e) => updateField('consignorAddress', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-6">
                    <label>Consignee Address & Details</label>
                    <input
                      type="text"
                      value={currentNote.consigneeAddress}
                      placeholder="F4 Jarod, Vadodara, Gujarat"
                      onChange={(e) => updateField('consigneeAddress', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label>From (Origin)</label>
                    <input
                      type="text"
                      value={currentNote.fromLocation}
                      placeholder="N/Shiva"
                      onChange={(e) => updateField('fromLocation', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label>Consignor GSTIN</label>
                    <input
                      type="text"
                      value={currentNote.consignorGst}
                      placeholder="GSTIN (Optional)"
                      onChange={(e) => updateField('consignorGst', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label>To (Destination)</label>
                    <input
                      type="text"
                      value={currentNote.toLocation}
                      placeholder="Jarod"
                      onChange={(e) => updateField('toLocation', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label>Consignee GSTIN</label>
                    <input
                      type="text"
                      value={currentNote.consigneeGst}
                      placeholder="24AAATCA5591M1Z9"
                      onChange={(e) => updateField('consigneeGst', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Goods & Package Details */}
              <div className="ts-form-card">
                <h3 className="ts-card-title">
                  <Truck size={16} /> Package & Goods Details
                </h3>
                <div className="ts-form-grid">
                  <div className="form-group col-3">
                    <label>No. of Pkgs</label>
                    <input
                      type="text"
                      value={currentNote.packagesCount}
                      placeholder="1X20 / 500 Bags"
                      onChange={(e) => updateField('packagesCount', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-5">
                    <label>Description (Said to Contain)</label>
                    <input
                      type="text"
                      value={currentNote.description}
                      placeholder="Flowlac-100 Lactose"
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Container No.</label>
                    <input
                      type="text"
                      value={currentNote.containerNo}
                      placeholder="MSKU3653724"
                      onChange={(e) => updateField('containerNo', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>PO / Reference No.</label>
                    <input
                      type="text"
                      value={currentNote.poNumber}
                      placeholder="PO No. 3200009020"
                      onChange={(e) => updateField('poNumber', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Sender Weight</label>
                    <input
                      type="text"
                      value={currentNote.senderWeight}
                      placeholder="1X20 Container Load / 24 MT"
                      onChange={(e) => updateField('senderWeight', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Weight Charges</label>
                    <input
                      type="text"
                      value={currentNote.weightCharges}
                      placeholder="Optional"
                      onChange={(e) => updateField('weightCharges', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Documents & Compliance */}
              <div className="ts-form-card">
                <h3 className="ts-card-title">
                  <Sparkles size={16} /> Attached Documents & Delivery Mode
                </h3>
                <div className="ts-form-grid">
                  <div className="form-group col-4">
                    <label>E-Waybill No.</label>
                    <input
                      type="text"
                      value={currentNote.ewayBillNo}
                      placeholder="612169013377"
                      onChange={(e) => updateField('ewayBillNo', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Invoice No.</label>
                    <input
                      type="text"
                      value={currentNote.invoiceNo}
                      placeholder="3081744"
                      onChange={(e) => updateField('invoiceNo', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Invoice Date</label>
                    <input
                      type="text"
                      value={currentNote.invoiceDate}
                      placeholder="11/08/2026"
                      onChange={(e) => updateField('invoiceDate', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Invoice Value (₹)</label>
                    <input
                      type="text"
                      value={currentNote.invoiceValue}
                      placeholder="As per Invoice"
                      onChange={(e) => updateField('invoiceValue', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Delivery Type</label>
                    <select
                      value={currentNote.deliveryType || 'Godown'}
                      onChange={(e) => updateField('deliveryType', e.target.value)}
                    >
                      <option value="Godown">Godown</option>
                      <option value="Door Delivery">Door Delivery</option>
                      <option value="Unloading By Consignee">Unloading By Consignee</option>
                      <option value="Unloading By Transport">Unloading By Transport</option>
                    </select>
                  </div>

                  <div className="form-group col-4">
                    <label>GST Payable By</label>
                    <select
                      value={currentNote.gstPayableBy}
                      onChange={(e) => updateField('gstPayableBy', e.target.value)}
                    >
                      <option value="CONSIGNEE">CONSIGNEE</option>
                      <option value="CONSIGNOR">CONSIGNOR</option>
                      <option value="CARRIER">CARRIER</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 5: Freight Breakdown */}
              <div className="ts-form-card">
                <h3 className="ts-card-title">
                  <FileText size={16} /> Freight Charges Breakdown
                </h3>
                <div className="ts-form-grid">
                  <div className="form-group col-4">
                    <label>Freight Type</label>
                    <select
                      value={currentNote.freightType}
                      onChange={(e) => updateField('freightType', e.target.value)}
                    >
                      <option value="TBB">TBB (To Be Billed)</option>
                      <option value="TO PAY">TO PAY</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>

                  <div className="form-group col-4">
                    <label>Freight Amount (₹)</label>
                    <input
                      type="number"
                      value={currentNote.freightAmount}
                      placeholder="0.00"
                      onChange={(e) => updateField('freightAmount', e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Bilty Charge (₹ / Note)</label>
                    <input
                      type="text"
                      value={currentNote.biltyCharges !== undefined ? currentNote.biltyCharges : currentNote.freightRemark}
                      placeholder="ABB A/C Alembic"
                      onChange={(e) => updateField('freightRemark', e.target.value)}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Door Delivery / Labour (₹)</label>
                    <input
                      type="number"
                      value={currentNote.doorDeliveryCharges}
                      placeholder="0.00"
                      onChange={(e) => updateField('doorDeliveryCharges', e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>

                  <div className="form-group col-4">
                    <label>Total Freight (₹)</label>
                    <input
                      type="number"
                      value={currentNote.totalFreightAmount}
                      placeholder="0.00"
                      onChange={(e) => updateField('totalFreightAmount', e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="ts-preview-container">
              <ConsignmentNoteDocument note={currentNote} isEditableInline={false} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="ts-history-list">
              {savedNotes.length === 0 ? (
                <div className="ts-empty-state">
                  <FileText size={48} style={{ opacity: 0.3 }} />
                  <p>No saved e-LR notes found</p>
                  <button type="button" className="btn-primary" onClick={handleNewNote}>
                    <PlusCircle size={16} /> Create First e-LR
                  </button>
                </div>
              ) : (
                savedNotes.map((n) => (
                  <div
                    key={n.id}
                    className={`ts-history-card ${n.id === currentNote.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentNote(n);
                      setActiveTab('preview');
                    }}
                  >
                    <div className="ts-hc-left">
                      <div className="ts-hc-badge">№ {n.lrNo}</div>
                      <div className="ts-hc-details">
                        <h4>
                          {n.consigneeName || 'Consignee'} • <span>{n.vehicleNo}</span>
                        </h4>
                        <p>
                          From: <strong>{n.fromLocation || 'Origin'}</strong> ➔ To:{' '}
                          <strong>{n.toLocation || 'Dest'}</strong> | Goods: {n.description || 'General Cargo'}
                        </p>
                        <span className="ts-hc-date">{n.date}</span>
                      </div>
                    </div>
                    <div className="ts-hc-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Delete LR Note"
                        onClick={() => onDeleteNote(n.id)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="trip-slip-modal-footer">
          <div className="ts-footer-left">
            <button type="button" className="btn-header btn-header-ghost" onClick={handleNewNote}>
              <PlusCircle size={15} /> New e-LR
            </button>
            <button type="button" className="btn-header btn-header-save" onClick={handleSave}>
              <Save size={15} /> Save e-LR
            </button>
            {onCreateInvoiceFromLR && (
              <button
                type="button"
                className="btn-header btn-header-ghost"
                style={{ color: '#10b981', borderColor: '#10b981' }}
                onClick={() => {
                  onCreateInvoiceFromLR(currentNote);
                  onClose();
                }}
                title="Generate sequential Tax Invoice pre-filled from this LR"
              >
                <ArrowRight size={15} /> Create Bill from LR
              </button>
            )}
          </div>

          <div className="ts-footer-right">
            <button
              type="button"
              className="btn-header btn-header-whatsapp"
              onClick={handleWhatsApp}
            >
              <Share2 size={15} /> WhatsApp
            </button>
            <button
              type="button"
              className="btn-header btn-header-pdf"
              disabled={isExporting}
              onClick={handleDownloadPDF}
            >
              <Download size={15} /> {isExporting ? 'Generating...' : 'Download PDF'}
            </button>
            <button type="button" className="btn-header btn-header-print" onClick={handlePrint}>
              <Printer size={15} /> Print e-LR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
