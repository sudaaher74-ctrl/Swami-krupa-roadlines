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
            <FileText size={20} className="text-primary" />
            <h2>Saved Invoices ({savedInvoices.length})</h2>
          </div>
          <div className="modal-header-actions">
            <button className="btn-secondary-sm" onClick={onExportAll} title="Download JSON backup">
              <Download size={14} /> Export Backup
            </button>
            <label className="btn-secondary-sm" style={{ cursor: 'pointer' }} title="Import JSON backup">
              <Upload size={14} /> Import Backup
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="modal-search-bar">
          <Search size={16} className="search-icon" />
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
                  <div key={inv.id} className="saved-inv-card">
                    <div className="card-top-row">
                      <div className="bill-badge">BILL: {inv.billNo || 'N/A'}</div>
                      <span className="inv-date">{inv.date || 'No Date'}</span>
                    </div>

                    <h4 className="card-client-title">{inv.clientName || 'UNKNOWN PARTY'}</h4>

                    <div className="card-details-list">
                      {inv.beNo && (
                        <div className="card-detail-item">
                          <span className="lbl">BE NO:</span>
                          <span className="val">{inv.beNo} (dt.{inv.beDate})</span>
                        </div>
                      )}
                      {vehicles && (
                        <div className="card-detail-item">
                          <span className="lbl">Vehicles:</span>
                          <span className="val">{vehicles}</span>
                        </div>
                      )}
                      <div className="card-detail-item">
                        <span className="lbl">Items:</span>
                        <span className="val">{inv.items.length} line{inv.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="card-bottom-row">
                      <div className="card-amount">
                        <span className="lbl">Total:</span>
                        <span className="price">₹ {formatCurrency(total)}</span>
                      </div>

                      <div className="card-actions">
                        <button
                          className="btn-icon"
                          title="Duplicate as new bill"
                          onClick={() => onDuplicateInvoice(inv)}
                        >
                          <Copy size={15} />
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
                          <Trash2 size={15} />
                        </button>
                        <button
                          className="btn-primary-sm"
                          onClick={() => onSelectInvoice(inv)}
                        >
                          <Eye size={14} /> Open
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
