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
  CheckSquare,
  Square,
  Layers
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
  onConvertMultipleLRsToInvoice?: (notes: ConsignmentNote[]) => void;
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
  onConvertMultipleLRsToInvoice,
  onNewNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLRIds, setSelectedLRIds] = useState<string[]>([]);
  const [partyFilter, setPartyFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  // Extract unique parties for quick filtering
  const uniqueParties = Array.from(
    new Set(
      savedNotes
        .map((n) => n.consigneeName || n.consignorName)
        .filter(Boolean)
    )
  );

  const filteredNotes = savedNotes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (n.lrNo || '').toLowerCase().includes(q) ||
      (n.consigneeName || '').toLowerCase().includes(q) ||
      (n.consignorName || '').toLowerCase().includes(q) ||
      (n.vehicleNo || '').toLowerCase().includes(q) ||
      (n.containerNo || '').toLowerCase().includes(q) ||
      (n.fromLocation || '').toLowerCase().includes(q) ||
      (n.toLocation || '').toLowerCase().includes(q);

    const matchesParty =
      partyFilter === 'ALL' ||
      n.consigneeName === partyFilter ||
      n.consignorName === partyFilter;

    return matchesSearch && matchesParty;
  });

  const toggleSelectLR = (id: string) => {
    setSelectedLRIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredNotes.map((n) => n.id);
    setSelectedLRIds(allFilteredIds);
  };

  const clearSelection = () => {
    setSelectedLRIds([]);
  };

  const handleBatchCreateInvoice = () => {
    if (!onConvertMultipleLRsToInvoice || selectedLRIds.length === 0) return;
    const selected = savedNotes.filter((n) => selectedLRIds.includes(n.id));
    onConvertMultipleLRsToInvoice(selected);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1040px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <FileText size={18} style={{ color: '#2563eb' }} />
            <div>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Saved e-LR & Consignment Notes</h2>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Swami Krupa Roadlines • {savedNotes.length} Consignment Notes recorded
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Search Bar & Controls */}
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {uniqueParties.length > 0 && (
              <select
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="party-filter-select"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-app)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <option value="ALL">All Parties ({savedNotes.length})</option>
                {uniqueParties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn-header btn-header-save-next"
              onClick={() => {
                onNewNote();
                onClose();
              }}
            >
              <PlusCircle size={14} /> New e-LR
            </button>
          </div>
        </div>

        {/* Multi-selection Toolbar */}
        {filteredNotes.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 14px',
              background: 'rgba(30, 41, 59, 0.4)',
              borderBottom: '1px solid var(--border-app)',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn-header btn-header-ghost"
                style={{ padding: '3px 8px', fontSize: '11.5px', height: '26px' }}
                onClick={selectedLRIds.length === filteredNotes.length ? clearSelection : selectAllFiltered}
              >
                {selectedLRIds.length === filteredNotes.length ? (
                  <>
                    <CheckSquare size={13} style={{ color: '#38bdf8' }} /> Deselect All
                  </>
                ) : (
                  <>
                    <Square size={13} /> Select All ({filteredNotes.length})
                  </>
                )}
              </button>

              <span style={{ color: 'var(--text-muted)' }}>
                {selectedLRIds.length > 0
                  ? `${selectedLRIds.length} of ${filteredNotes.length} LRs selected`
                  : 'Select multiple LRs to combine into 1 Tax Invoice'}
              </span>
            </div>

            {selectedLRIds.length > 0 && onConvertMultipleLRsToInvoice && (
              <button
                type="button"
                className="btn-create-invoice-bridge"
                style={{ padding: '4px 12px', fontSize: '12px', height: '28px' }}
                onClick={handleBatchCreateInvoice}
              >
                <Layers size={13} /> Create Consolidated Bill ({selectedLRIds.length} LRs)
              </button>
            )}
          </div>
        )}

        {/* Notes Grid */}
        <div className="modal-list-body" style={{ padding: '16px 20px' }}>
          {filteredNotes.length === 0 ? (
            <div className="empty-saved-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <h3 style={{ fontSize: '15px', color: '#ffffff', marginTop: '10px' }}>No e-LRs Found</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                No consignment notes match your search. Create a new e-LR to start.
              </p>
              <button
                type="button"
                className="btn-header btn-header-save-next"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  onNewNote();
                  onClose();
                }}
              >
                <PlusCircle size={14} /> Create Blank e-LR
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
              {filteredNotes.map((note) => {
                const isSelected = selectedLRIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    className={`saved-inv-card ${isSelected ? 'selected-batch-card' : ''}`}
                    onClick={() => {
                      onSelectNote(note);
                      onClose();
                    }}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59, 130, 246, 0.12)' : '#131d33',
                      border: `1px solid ${isSelected ? '#3b82f6' : '#223254'}`,
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Top Row: Checkbox, LR No, Date, Copy Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectLR(note.id);
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          {isSelected ? (
                            <CheckSquare size={18} style={{ color: '#38bdf8' }} />
                          ) : (
                            <Square size={18} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            fontWeight: 800,
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                          }}
                        >
                          LR: {note.lrNo || 'UNNUMBERED'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {note.date || 'No Date'}
                        </span>
                      </div>

                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {note.copyType ? note.copyType.replace(' COPY', '') : 'LR'}
                      </span>
                    </div>

                    {/* Party & Route Info */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} style={{ color: '#94a3b8' }} />
                        <span>{note.consigneeName || note.consignorName || 'Consignee Not Set'}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', paddingLeft: '19px' }}>
                        <strong style={{ color: '#93c5fd' }}>{note.fromLocation || '-'}</strong> ➔{' '}
                        <strong style={{ color: '#93c5fd' }}>{note.toLocation || '-'}</strong>
                      </div>
                    </div>

                    {/* Cargo and Vehicle Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '4px 0' }}>
                      {note.vehicleNo && (
                        <span style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>
                          <Truck size={10} style={{ display: 'inline', marginRight: '3px' }} />
                          {note.vehicleNo}
                        </span>
                      )}
                      {note.containerNo && (
                        <span style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
                          {note.containerNo}
                        </span>
                      )}
                      {note.packagesCount && (
                        <span style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                          {note.packagesCount}
                        </span>
                      )}
                    </div>

                    {/* Footer: Freight + Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', marginTop: '2px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                        FREIGHT: {note.totalFreightAmount ? `₹${note.totalFreightAmount}` : note.freightType || 'TBB'}
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-create-invoice-bridge"
                          style={{ padding: '3px 8px', fontSize: '11px', height: '24px' }}
                          title="Create Tax Invoice from this LR"
                          onClick={() => {
                            onConvertToInvoice(note);
                            onClose();
                          }}
                        >
                          <ArrowRight size={11} /> Bill
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: '4px', height: '24px', width: '24px' }}
                          title="Share on WhatsApp"
                          onClick={() => openConsignmentWhatsAppShare(note)}
                        >
                          <Share2 size={12} style={{ color: '#22c55e' }} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: '4px', height: '24px', width: '24px' }}
                          title="Download PDF"
                          onClick={() => downloadConsignmentNotePDF(note)}
                        >
                          <Download size={12} style={{ color: '#38bdf8' }} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: '4px', height: '24px', width: '24px' }}
                          title="Duplicate LR"
                          onClick={() => onDuplicateNote(note)}
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: '4px', height: '24px', width: '24px', color: '#f87171' }}
                          title="Delete LR"
                          onClick={() => onDeleteNote(note.id)}
                        >
                          <Trash2 size={12} />
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
