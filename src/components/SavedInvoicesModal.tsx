import React, { useState } from 'react';
import type { InvoiceData } from '../types/invoice';
import {
  X,
  Search,
  FileText,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';
import { exportInvoicesToCSV } from '../utils/exportUtils';

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedInvoices: InvoiceData[];
  onSelectInvoice: (inv: InvoiceData) => void;
  onDuplicateInvoice: (inv: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onExportAll: () => void;
  onImportBackup: (importedList: InvoiceData[]) => void;
  onUpdateInvoicePayment?: (
    invoiceId: string,
    status: 'PAID' | 'UNPAID' | 'PARTIAL',
    amountReceived?: number,
    paymentDate?: string,
    paymentMode?: string,
    paymentNotes?: string
  ) => void;
}

export const SavedInvoicesModal: React.FC<SavedInvoicesModalProps> = ({
  isOpen,
  onClose,
  savedInvoices,
  onSelectInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onExportAll,
  onImportBackup,
  onUpdateInvoicePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'PARTIAL'>('ALL');
  
  // Payment edit dialog state
  const [editingPaymentInv, setEditingPaymentInv] = useState<InvoiceData | null>(null);
  const [payStatus, setPayStatus] = useState<'PAID' | 'UNPAID' | 'PARTIAL'>('PAID');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDate, setPayDate] = useState<string>('');
  const [payMode, setPayMode] = useState<string>('BANK_TRANSFER');
  const [payNotes, setPayNotes] = useState<string>('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingPaymentInv) {
          setEditingPaymentInv(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingPaymentInv, onClose]);

  if (!isOpen) return null;

  // Calculate metrics
  let totalBilledSum = 0;
  let totalReceivedSum = 0;

  savedInvoices.forEach((inv) => {
    const gross = inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const net = gross - (Number(inv.advanceDeduction) || 0);
    totalBilledSum += net;

    const received =
      inv.paymentStatus === 'PAID'
        ? net
        : Number(inv.amountReceived) || 0;
    totalReceivedSum += received;
  });

  const totalPendingSum = Math.max(0, totalBilledSum - totalReceivedSum);

  const filtered = savedInvoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const client = (inv.clientName || '').toLowerCase();
    const bill = (inv.billNo || '').toLowerCase();
    const date = (inv.date || '').toLowerCase();
    const be = (inv.beNo || '').toLowerCase();
    const vehicles = inv.items.map((i) => i.vehicleNo.toLowerCase()).join(' ');

    const matchesSearch =
      client.includes(term) ||
      bill.includes(term) ||
      date.includes(term) ||
      be.includes(term) ||
      vehicles.includes(term);

    if (!matchesSearch) return false;

    const net =
      inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) -
      (Number(inv.advanceDeduction) || 0);
    const rec = Number(inv.amountReceived) || (inv.paymentStatus === 'PAID' ? net : 0);
    const currentStatus =
      inv.paymentStatus || (rec >= net && net > 0 ? 'PAID' : rec > 0 ? 'PARTIAL' : 'UNPAID');

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'UNPAID') return currentStatus === 'UNPAID';
    if (statusFilter === 'PAID') return currentStatus === 'PAID';
    if (statusFilter === 'PARTIAL') return currentStatus === 'PARTIAL';
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          alert(`Successfully imported ${parsed.length} invoices!`);
        } else if (parsed && typeof parsed === 'object' && parsed.id) {
          onImportBackup([parsed]);
          alert(`Successfully imported 1 invoice!`);
        }
      } catch (err) {
        alert('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const openPaymentDialog = (inv: InvoiceData) => {
    const gross = inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const net = gross - (Number(inv.advanceDeduction) || 0);
    const initialRec = Number(inv.amountReceived) || (inv.paymentStatus === 'PAID' ? net : 0);

    setEditingPaymentInv(inv);
    setPayStatus(inv.paymentStatus || (initialRec >= net && net > 0 ? 'PAID' : initialRec > 0 ? 'PARTIAL' : 'PAID'));
    setPayAmount(initialRec > 0 ? initialRec : net);
    
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setPayDate(inv.paymentDate || `${dd}-${mm}-${yyyy}`);
    setPayMode(inv.paymentMode || 'BANK_TRANSFER');
    setPayNotes(inv.paymentNotes || '');
  };

  const handleSavePayment = () => {
    if (!editingPaymentInv || !onUpdateInvoicePayment) return;
    onUpdateInvoicePayment(
      editingPaymentInv.id,
      payStatus,
      payAmount === '' ? 0 : Number(payAmount),
      payDate,
      payMode,
      payNotes
    );
    setEditingPaymentInv(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <FileText size={18} style={{ color: '#60a5fa' }} />
            <h2>Saved Invoices & Payment Ledger ({savedInvoices.length})</h2>
          </div>
          <div className="modal-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-header btn-header-save"
              onClick={() => exportInvoicesToCSV(savedInvoices)}
              title="Download Excel CSV report"
              style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}
            >
              <FileSpreadsheet size={13} /> Export Excel (CSV)
            </button>
            <button className="btn-header btn-header-ghost" onClick={onExportAll} title="Download JSON backup">
              <Download size={13} /> Backup JSON
            </button>
            <label className="btn-header btn-header-ghost" style={{ cursor: 'pointer' }} title="Import JSON backup">
              <Upload size={13} /> Import JSON
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Financial Metrics Summary Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '12px 20px', background: '#0b1329', borderBottom: '1px solid #1e293b' }}>
          <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Billed</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', marginTop: '2px' }}>
              ₹ {formatCurrency(totalBilledSum)}
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 600, textTransform: 'uppercase' }}>Collected / Paid</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', marginTop: '2px' }}>
              ₹ {formatCurrency(totalReceivedSum)}
            </div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 600, textTransform: 'uppercase' }}>Pending / Balance Due</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', fontFamily: 'monospace', marginTop: '2px' }}>
              ₹ {formatCurrency(totalPendingSum)}
            </div>
          </div>

          <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Bills Count</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
              {savedInvoices.length} Bills
            </div>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-app)', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by Bill No, Client Name, Date, Vehicle, BE No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '13px'
              }}
              autoFocus
            />
          </div>

          <div className="segmented-pill-selector">
            <button
              type="button"
              className={`pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All ({savedInvoices.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${statusFilter === 'UNPAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('UNPAID')}
              style={{ color: statusFilter === 'UNPAID' ? '#fff' : '#fca5a5' }}
            >
              Pending
            </button>
            <button
              type="button"
              className={`pill-btn ${statusFilter === 'PAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PAID')}
              style={{ color: statusFilter === 'PAID' ? '#fff' : '#86efac' }}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Invoice List */}
        <div className="modal-list-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} className="empty-icon" />
              <p className="empty-title">No saved bills found</p>
              <p className="empty-subtitle">
                {searchTerm
                  ? 'No matching invoice matches your filter.'
                  : 'Bills you save will appear here for fast retrieval and accounting.'}
              </p>
            </div>
          ) : (
            <div className="invoice-cards-grid">
              {filtered.map((inv) => {
                const total = inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
                const advance = Number(inv.advanceDeduction) || 0;
                const net = total - advance;
                const vehicles = Array.from(new Set(inv.items.map((i) => i.vehicleNo).filter(Boolean))).join(', ');
                
                const rec = Number(inv.amountReceived) || (inv.paymentStatus === 'PAID' ? net : 0);
                const isPaid = inv.paymentStatus === 'PAID' || (rec >= net && net > 0);
                const isPartial = inv.paymentStatus === 'PARTIAL' || (rec > 0 && rec < net);
                const currentStatus = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID';

                return (
                  <div key={inv.id} className="saved-inv-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
                    <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="bill-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fa', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700, fontFamily: 'monospace' }}>
                          BILL: {inv.billNo || 'N/A'}
                        </div>

                        {/* Payment Status Badge */}
                        <button
                          type="button"
                          onClick={() => openPaymentDialog(inv)}
                          title="Click to update payment status"
                          style={{
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isPaid
                              ? 'rgba(34, 197, 94, 0.2)'
                              : isPartial
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                            color: isPaid
                              ? '#4ade80'
                              : isPartial
                              ? '#fcd34d'
                              : '#f87171',
                          }}
                        >
                          {isPaid ? <CheckCircle2 size={11} /> : isPartial ? <Clock size={11} /> : <AlertCircle size={11} />}
                          {currentStatus}
                        </button>
                      </div>
                      <span className="inv-date" style={{ fontSize: '12px', color: '#94a3b8' }}>{inv.date || 'No Date'}</span>
                    </div>

                    <h4 className="card-client-title" style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc', margin: '4px 0' }}>
                      {inv.clientName || 'UNKNOWN PARTY'}
                    </h4>

                    <div className="card-details-list" style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px', margin: '6px 0' }}>
                      {inv.beNo && (
                        <div className="card-detail-item">
                          <span className="lbl" style={{ color: '#cbd5e1', fontWeight: 600 }}>{inv.refDocType || 'BE NO'}:</span>
                          <span className="val">{inv.beNo} (dt.{inv.beDate})</span>
                        </div>
                      )}
                      {vehicles && (
                        <div className="card-detail-item">
                          <span className="lbl" style={{ color: '#cbd5e1', fontWeight: 600 }}>Trucks:</span>
                          <span className="val">{vehicles}</span>
                        </div>
                      )}
                      {inv.paymentDate && (
                        <div className="card-detail-item">
                          <span className="lbl" style={{ color: '#cbd5e1', fontWeight: 600 }}>Paid Date:</span>
                          <span className="val">{inv.paymentDate} ({inv.paymentMode || 'Bank'})</span>
                        </div>
                      )}
                    </div>

                    <div className="card-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
                      <div className="card-amount">
                        <span className="price" style={{ fontSize: '15px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                          ₹ {formatCurrency(net)}
                        </span>
                        {advance > 0 && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                            (Adv: ₹{formatCurrency(advance)})
                          </span>
                        )}
                      </div>

                      <div className="card-actions" style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          title="Record Payment"
                          style={{ color: '#38bdf8' }}
                          onClick={() => openPaymentDialog(inv)}
                        >
                          <CreditCard size={13} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Duplicate as new bill"
                          onClick={() => onDuplicateInvoice(inv)}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          className="btn-icon text-danger"
                          title="Delete invoice"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete Bill ${inv.billNo}?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          className="btn-header btn-header-print"
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                          onClick={() => onSelectInvoice(inv)}
                        >
                          <Eye size={13} /> Open
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAYMENT EDIT DIALOG MODAL */}
        {editingPaymentInv && (
          <div
            className="modal-backdrop"
            style={{ zIndex: 1100, background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setEditingPaymentInv(null)}
          >
            <div
              className="modal-content"
              style={{ maxWidth: '440px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-group">
                  <CreditCard size={18} style={{ color: '#38bdf8' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>Record Bill Payment</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                      Bill #{editingPaymentInv.billNo} • {editingPaymentInv.clientName}
                    </p>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setEditingPaymentInv(null)}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Payment Status *</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-app)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff'
                    }}
                  >
                    <option value="PAID">🟢 PAID IN FULL</option>
                    <option value="PARTIAL">🟡 PARTIALLY PAID</option>
                    <option value="UNPAID">🔴 UNPAID / PENDING</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount Received (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={payAmount}
                    placeholder="0.00"
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date</label>
                  <input
                    type="text"
                    value={payDate}
                    placeholder="DD-MM-YYYY"
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Mode / Channel</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-app)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff'
                    }}
                  >
                    <option value="BANK_TRANSFER">Bank NEFT / RTGS / IMPS</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CHEQUE">Cheque Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Notes / Transaction Ref</label>
                  <input
                    type="text"
                    value={payNotes}
                    placeholder="UTR / Cheque No / Remarks"
                    onChange={(e) => setPayNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-header btn-header-save"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={handleSavePayment}
                  >
                    <CheckCircle2 size={14} /> Save Payment
                  </button>
                  <button
                    type="button"
                    className="btn-header btn-header-ghost"
                    onClick={() => setEditingPaymentInv(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

