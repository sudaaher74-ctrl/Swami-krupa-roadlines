import React, { useState } from 'react';
import type { ConsignmentNote } from '../types/invoice';
import {
  X,
  Search,
  FileText,
  Trash2,
  Copy,
  Download,
  Share2,
  ArrowRight,
  PlusCircle,
  Truck,
  Building2,
  Calendar
} from 'lucide-react';
import { downloadConsignmentNotePDF, openConsignmentWhatsAppShare } from '../utils/exportUtils';

interface SavedConsignmentNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedNotes: ConsignmentNote[];
  onSelectNote: (note: ConsignmentNote) => void;
  onDuplicateNote: (note: ConsignmentNote) => void;
  onDeleteNote: (id: string) => void;
  onConvertToInvoice: (note: ConsignmentNote) => void;
  onNewNote: () => void;
}

export const SavedConsignmentNotesModal: React.FC<SavedConsignmentNotesModalProps> = ({
  isOpen,
  onClose,
  savedNotes,
  onSelectNote,
  onDuplicateNote,
  onDeleteNote,
  onConvertToInvoice,
  onNewNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredNotes = savedNotes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.lrNo || '').toLowerCase().includes(q) ||
      (n.consigneeName || '').toLowerCase().includes(q) ||
      (n.consignorName || '').toLowerCase().includes(q) ||
      (n.vehicleNo || '').toLowerCase().includes(q) ||
      (n.containerNo || '').toLowerCase().includes(q) ||
      (n.fromLocation || '').toLowerCase().includes(q) ||
      (n.toLocation || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="trip-slip-modal-overlay" onClick={onClose}>
      <div className="trip-slip-modal-container lr-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="trip-slip-modal-header">
          <div className="ts-header-title-group">
            <FileText className="ts-header-icon" size={22} style={{ color: '#2563eb' }} />
            <div>
              <h2 className="ts-modal-title">Saved e-LR & Consignment Notes</h2>
              <p className="ts-modal-subtitle">
                Swami Krupa Roadlines • {savedNotes.length} Consignment Notes recorded
              </p>
            </div>
          </div>

          <button type="button" className="ts-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & New Button */}
        <div className="saved-invoices-controls-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by LR No, Consignee, Vehicle, Route or Container..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-header btn-header-save-next"
            onClick={() => {
              onNewNote();
              onClose();
            }}
          >
            <PlusCircle size={15} /> New e-LR
          </button>
        </div>

        {/* Saved List */}
        <div className="trip-slip-modal-body">
          {filteredNotes.length === 0 ? (
            <div className="ts-empty-state">
              <FileText size={48} style={{ opacity: 0.3 }} />
              <p>{searchQuery ? 'No matching e-LRs found' : 'No saved e-LR notes yet'}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onNewNote();
                  onClose();
                }}
              >
                <PlusCircle size={16} /> Create e-LR Note
              </button>
            </div>
          ) : (
            <div className="saved-invoices-grid">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  className="saved-invoice-card"
                  onClick={() => {
                    onSelectNote(n);
                    onClose();
                  }}
                >
                  <div className="card-top-row">
                    <div className="bill-badge" style={{ color: '#2563eb', borderColor: '#93c5fd' }}>
                      № {n.lrNo || 'LR'}
                    </div>
                    <div className="bill-date">
                      <Calendar size={12} /> {n.date}
                    </div>
                  </div>

                  <div className="card-party-title">
                    <Building2 size={14} /> {n.consigneeName || 'Consignee'}
                  </div>

                  <div className="card-vehicle-sub">
                    <Truck size={13} /> {n.vehicleNo || 'Vehicle'} • <span>{n.fromLocation || 'Origin'} ➔ {n.toLocation || 'Dest'}</span>
                  </div>

                  {n.description && (
                    <div className="card-goods-snippet">
                      📦 {n.description} {n.containerNo ? `(${n.containerNo})` : ''}
                    </div>
                  )}

                  <div className="card-footer-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-card-action"
                      title="Generate Tax Invoice from this LR"
                      style={{ color: '#10b981' }}
                      onClick={() => {
                        onConvertToInvoice(n);
                        onClose();
                      }}
                    >
                      <ArrowRight size={14} /> Make Bill
                    </button>

                    <button
                      type="button"
                      className="btn-card-action"
                      title="Share on WhatsApp"
                      onClick={() => openConsignmentWhatsAppShare(n)}
                    >
                      <Share2 size={14} color="#22c55e" />
                    </button>

                    <button
                      type="button"
                      className="btn-card-action"
                      title="Download PDF"
                      onClick={() => downloadConsignmentNotePDF(n)}
                    >
                      <Download size={14} color="#3b82f6" />
                    </button>

                    <button
                      type="button"
                      className="btn-card-action"
                      title="Duplicate LR"
                      onClick={() => onDuplicateNote(n)}
                    >
                      <Copy size={14} color="#f59e0b" />
                    </button>

                    <button
                      type="button"
                      className="btn-card-action"
                      title="Delete LR"
                      onClick={() => onDeleteNote(n.id)}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
