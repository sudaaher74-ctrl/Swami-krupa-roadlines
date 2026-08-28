import React, { useState } from 'react';
import type { InvoiceData } from '../types/invoice';
import { X, Search, FileText, Trash2, Copy, Download, Upload, Eye } from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedInvoices: InvoiceData[];
  onSelectInvoice: (inv: InvoiceData) => void;
  onDuplicateInvoice: (inv: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onExportAll: () => void;
  onImportBackup: (importedList: InvoiceData[]) => void;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = savedInvoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const client = (inv.clientName || '').toLowerCase();
    const bill = (inv.billNo || '').toLowerCase();
    const date = (inv.date || '').toLowerCase();
    const be = (inv.beNo || '').toLowerCase();
    const vehicles = inv.items.map((i) => i.vehicleNo.toLowerCase()).join(' ');
    return (
      client.includes(term) ||
      bill.includes(term) ||
      date.includes(term) ||
      be.includes(term) ||
      vehicles.includes(term)
    );
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <FileText size={18} style={{ color: '#60a5fa' }} />
            <h2>Saved Invoices History ({savedInvoices.length})</h2>
          </div>
          <div className="modal-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-header btn-header-ghost" onClick={onExportAll} title="Download JSON backup">
              <Download size={13} /> Export Backup
            </button>
            <label className="btn-header btn-header-ghost" style={{ cursor: 'pointer' }} title="Import JSON backup">
              <Upload size={13} /> Import Backup
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="modal-search-bar">
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by Bill No, Client Name, Date, Vehicle, BE No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Invoice List */}
        <div className="modal-list-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} className="empty-icon" />
              <p className="empty-title">No saved bills found</p>
              <p className="empty-subtitle">
                {searchTerm
                  ? 'No matching invoice matches your search filter.'
                  : 'Bills you save will appear here for fast retrieval and re-printing.'}
              </p>
            </div>
          ) : (
            <div className="invoice-cards-grid">
              {filtered.map((inv) => {
                const total = inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
                const vehicles = Array.from(new Set(inv.items.map((i) => i.vehicleNo).filter(Boolean))).join(', ');

                return (
                  <div key={inv.id} className="saved-inv-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
                    <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div className="bill-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fa', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700, fontFamily: 'monospace' }}>
                        BILL: {inv.billNo || 'N/A'}
                      </div>
                      <span className="inv-date" style={{ fontSize: '12px', color: '#94a3b8' }}>{inv.date || 'No Date'}</span>
                    </div>

                    <h4 className="card-client-title" style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc', margin: '4px 0' }}>
                      {inv.clientName || 'UNKNOWN PARTY'}
                    </h4>

                    <div className="card-details-list" style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px', margin: '6px 0' }}>
                      {inv.beNo && (
                        <div className="card-detail-item">
                          <span className="lbl" style={{ color: '#cbd5e1', fontWeight: 600 }}>BE NO:</span>
                          <span className="val">{inv.beNo} (dt.{inv.beDate})</span>
                        </div>
                      )}
                      {vehicles && (
                        <div className="card-detail-item">
                          <span className="lbl" style={{ color: '#cbd5e1', fontWeight: 600 }}>Trucks:</span>
                          <span className="val">{vehicles}</span>
                        </div>
                      )}
                      <div className="card-detail-item">
                        <span className="lbl" style={{ color: '#cbd5e1', fontWeight: 600 }}>Items:</span>
                        <span className="val">{inv.items.length} line item{inv.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="card-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
                      <div className="card-amount">
                        <span className="price" style={{ fontSize: '15px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                          ₹ {formatCurrency(total)}
                        </span>
                      </div>

                      <div className="card-actions" style={{ display: 'flex', gap: '4px' }}>
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
      </div>
    </div>
  );
};
