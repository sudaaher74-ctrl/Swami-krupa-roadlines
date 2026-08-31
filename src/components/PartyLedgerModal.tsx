import React, { useState } from 'react';
import type { InvoiceData, CustomerRecord } from '../types/invoice';
import {
  X,
  Search,
  BookOpen,
  Share2,
  Building2,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

interface PartyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceData[];
  customers: CustomerRecord[];
  onUpdatePayment: (
    invoiceId: string,
    status: 'PAID' | 'UNPAID' | 'PARTIAL',
    amountReceived?: number,
    paymentDate?: string,
    paymentMode?: string,
    paymentNotes?: string
  ) => void;
  onSelectInvoice: (invoice: InvoiceData) => void;
}

export const PartyLedgerModal: React.FC<PartyLedgerModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onUpdatePayment,
  onSelectInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to compute bill total
  const getInvoiceTotal = (inv: InvoiceData): number => {
    return inv.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  // Group invoices by Client / Customer Name
  const partyMap: { [partyName: string]: InvoiceData[] } = {};
  invoices.forEach((inv) => {
    const party = inv.clientName.trim() || 'Unassigned Client';
    if (!partyMap[party]) {
      partyMap[party] = [];
    }
    partyMap[party].push(inv);
  });

  const partySummaries = Object.keys(partyMap).map((partyName) => {
    const partyInvoices = partyMap[partyName];
    const totalBilled = partyInvoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);
    const totalReceived = partyInvoices.reduce((sum, inv) => {
      if (inv.paymentStatus === 'PAID') {
        return sum + (inv.amountReceived !== undefined ? inv.amountReceived : getInvoiceTotal(inv));
      }
      return sum + (Number(inv.amountReceived) || 0);
    }, 0);
    const balanceDue = Math.max(0, totalBilled - totalReceived);
    const unpaidCount = partyInvoices.filter((inv) => inv.paymentStatus !== 'PAID').length;

    return {
      partyName,
      invoices: partyInvoices,
      totalBilled,
      totalReceived,
      balanceDue,
      unpaidCount,
    };
  });

  // Overall Global Statistics
  const grandTotalBilled = partySummaries.reduce((sum, p) => sum + p.totalBilled, 0);
  const grandTotalReceived = partySummaries.reduce((sum, p) => sum + p.totalReceived, 0);
  const grandTotalOutstanding = Math.max(0, grandTotalBilled - grandTotalReceived);

  // Filter parties by search and status
  const filteredParties = partySummaries.filter((p) => {
    const matchesSearch = p.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'PENDING') return p.balanceDue > 0;
    if (filterMode === 'PAID') return p.balanceDue === 0;
    return true;
  });

  // Share WhatsApp Statement for a Party
  const sendPartyWhatsAppReminder = (summary: typeof partySummaries[0]) => {
    const firstInv = summary.invoices[0];
    const companyName = firstInv?.company?.companyName || 'SWAMI KRUPA ROADLINES';
    const bank = firstInv?.bank;

    let msg = `*PAYMENT STATEMENT & REMINDER*\n*${companyName}*\n\n`;
    msg += `*Party Name:* ${summary.partyName}\n`;
    msg += `*Total Invoiced:* ₹ ${formatCurrency(summary.totalBilled)}\n`;
    msg += `*Total Received:* ₹ ${formatCurrency(summary.totalReceived)}\n`;
    msg += `*PENDING BALANCE DUE:* ₹ ${formatCurrency(summary.balanceDue)}\n\n`;
    msg += `*Bill Breakdown:*\n`;

    summary.invoices.forEach((inv, idx) => {
      const invTotal = getInvoiceTotal(inv);
      const isPaid = inv.paymentStatus === 'PAID';
      const statusText = isPaid ? '✅ PAID' : `⏳ PENDING (₹ ${formatCurrency(invTotal - (inv.amountReceived || 0))})`;
      msg += `${idx + 1}. Bill No: ${inv.billNo} (${inv.date}) - Total: ₹${formatCurrency(invTotal)} [${statusText}]\n`;
    });

    if (bank && bank.accountNo) {
      msg += `\n*Bank Details for Payment:*\n`;
      msg += `Bank: ${bank.bankName}\n`;
      msg += `Branch: ${bank.branch}\n`;
      msg += `A/C No: ${bank.accountNo}\n`;
      msg += `IFSC: ${bank.ifscCode}\n`;
    }

    msg += `\nKindly verify and arrange the pending balance payment at your earliest convenience. Thank you!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1080px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <BookOpen size={18} style={{ color: '#10b981' }} />
            <div>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Party Ledger & Payment Khata</h2>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Customer-wise outstanding balances & WhatsApp statements
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Global Financial KPI Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid var(--border-app)',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-app)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Invoiced ({invoices.length} Bills)
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
              ₹ {formatCurrency(grandTotalBilled)}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-app)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Received / Collected
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
              ₹ {formatCurrency(grandTotalReceived)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <span style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Balance Outstanding Due
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
              ₹ {formatCurrency(grandTotalOutstanding)}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="saved-invoices-controls-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search Party Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="segmented-pill-selector">
            <button
              type="button"
              className={`pill-btn ${filterMode === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterMode('ALL')}
            >
              All Parties ({partySummaries.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterMode === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilterMode('PENDING')}
              style={{ color: filterMode === 'PENDING' ? '#ffffff' : '#f87171' }}
            >
              Pending Dues
            </button>
            <button
              type="button"
              className={`pill-btn ${filterMode === 'PAID' ? 'active' : ''}`}
              onClick={() => setFilterMode('PAID')}
              style={{ color: filterMode === 'PAID' ? '#ffffff' : '#34d399' }}
            >
              Fully Settled
            </button>
          </div>
        </div>

        {/* Party Ledger Accordion List */}
        <div className="saved-invoices-grid-container" style={{ padding: '16px' }}>
          {filteredParties.length === 0 ? (
            <div className="empty-saved-state">
              <BookOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <h3>No Party Records Found</h3>
              <p>No customer ledgers match the selected filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredParties.map((summary) => {
                const isExpanded = expandedParty === summary.partyName;
                const hasPending = summary.balanceDue > 0;

                return (
                  <div
                    key={summary.partyName}
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${hasPending ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-app)'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Party Header Row */}
                    <div
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : undefined,
                      }}
                      onClick={() => setExpandedParty(isExpanded ? null : summary.partyName)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: hasPending ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: hasPending ? '#ef4444' : '#10b981',
                          }}
                        >
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>
                            {summary.partyName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {summary.invoices.length} Bills Total • {summary.unpaidCount} Pending
                          </div>
                        </div>
                      </div>

                      {/* Party Financial Summary Numbers */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                            Total Billed
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                            ₹ {formatCurrency(summary.totalBilled)}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                            Received
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#34d399' }}>
                            ₹ {formatCurrency(summary.totalReceived)}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '110px' }}>
                          <span style={{ fontSize: '10px', color: hasPending ? '#f87171' : 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                            Balance Due
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '14px',
                              color: hasPending ? '#ef4444' : '#10b981',
                            }}
                          >
                            ₹ {formatCurrency(summary.balanceDue)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn-header btn-header-whatsapp"
                          style={{ padding: '4px 10px', fontSize: '11.5px', height: '28px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            sendPartyWhatsAppReminder(summary);
                          }}
                          title="Send WhatsApp Statement & Reminder"
                        >
                          <Share2 size={12} /> Statement
                        </button>
                      </div>
                    </div>

                    {/* Expanded Invoices Table */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-app)',
                          background: 'rgba(11, 17, 32, 0.7)',
                          padding: '12px 18px',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-app)', color: 'var(--text-muted)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 6px' }}>Bill No</th>
                              <th style={{ padding: '8px 6px' }}>Date</th>
                              <th style={{ padding: '8px 6px' }}>Vehicles / Particulars</th>
                              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Total (₹)</th>
                              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Received (₹)</th>
                              <th style={{ padding: '8px 6px' }}>Status</th>
                              <th style={{ padding: '8px 6px', textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.invoices.map((inv) => {
                              const billTotal = getInvoiceTotal(inv);
                              const isPaid = inv.paymentStatus === 'PAID';
                              const isPartial = inv.paymentStatus === 'PARTIAL';

                              return (
                                <tr
                                  key={inv.id}
                                  style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <td style={{ padding: '10px 6px', fontWeight: 700, color: '#38bdf8' }}>
                                    {inv.billNo}
                                  </td>
                                  <td style={{ padding: '10px 6px', color: 'var(--text-secondary)' }}>
                                    {inv.date}
                                  </td>
                                  <td style={{ padding: '10px 6px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                                    {inv.items.map((it) => it.vehicleNo || it.particulars).filter(Boolean).slice(0, 2).join(', ') || '-'}
                                  </td>
                                  <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>
                                    ₹ {formatCurrency(billTotal)}
                                  </td>
                                  <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                                    <input
                                      type="number"
                                      value={inv.amountReceived !== undefined ? inv.amountReceived : isPaid ? billTotal : ''}
                                      placeholder="0.00"
                                      style={{
                                        width: '80px',
                                        textAlign: 'right',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border-app)',
                                        color: '#ffffff',
                                        padding: '3px 6px',
                                        borderRadius: '4px',
                                        fontSize: '11.5px',
                                      }}
                                      onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : 0;
                                        const newStatus = val >= billTotal ? 'PAID' : val > 0 ? 'PARTIAL' : 'UNPAID';
                                        onUpdatePayment(inv.id, newStatus, val);
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px 6px' }}>
                                    <select
                                      value={inv.paymentStatus || 'UNPAID'}
                                      onChange={(e) => {
                                        const status = e.target.value as 'PAID' | 'UNPAID' | 'PARTIAL';
                                        const received = status === 'PAID' ? billTotal : status === 'UNPAID' ? 0 : inv.amountReceived;
                                        onUpdatePayment(inv.id, status, received);
                                      }}
                                      style={{
                                        background: isPaid
                                          ? 'rgba(16, 185, 129, 0.2)'
                                          : isPartial
                                          ? 'rgba(245, 158, 11, 0.2)'
                                          : 'rgba(239, 68, 68, 0.2)',
                                        color: isPaid ? '#34d399' : isPartial ? '#fbbf24' : '#f87171',
                                        border: `1px solid ${isPaid ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444'}`,
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <option value="UNPAID">⏳ UNPAID</option>
                                      <option value="PARTIAL">🟡 PARTIAL</option>
                                      <option value="PAID">✅ PAID</option>
                                    </select>
                                  </td>
                                  <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      className="action-btn-mini"
                                      style={{ padding: '3px 8px', fontSize: '11px' }}
                                      onClick={() => {
                                        onSelectInvoice(inv);
                                        onClose();
                                      }}
                                    >
                                      <FileText size={12} /> Open
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
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
