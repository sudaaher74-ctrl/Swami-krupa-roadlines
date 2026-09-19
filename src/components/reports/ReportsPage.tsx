import React, { useState, useMemo } from 'react';
import {
  FileText, ClipboardList, CreditCard, AlertCircle,
  Download, Printer, Search, ExternalLink
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord, ActiveView } from '../../types/invoice';
import { getCustomerSummary, formatCurrencyINR, getDaysOverdue } from '../../utils/accountingService';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';

interface ReportsPageProps {
  onSelectClient: (client: CustomerRecord) => void;
  onNavigate: (view: ActiveView) => void;
}

type ReportTab = 'outstanding' | 'sales' | 'transport' | 'collections';

export const ReportsPage: React.FC<ReportsPageProps> = ({ onSelectClient, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('outstanding');
  const [searchQ, setSearchQ] = useState('');
  const { customers, savedInvoices, consignmentNotes, payments } = useStore();

  // 1. OUTSTANDING SUMMARY
  const outstandingSummary = useMemo(() => {
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalBilled = 0;
    let totalReceived = 0;

    const partyRows = customers.map((c) => {
      const summary = getCustomerSummary(c.id, c, savedInvoices, payments);
      totalOutstanding += summary.outstanding;
      totalOverdue += summary.overdueAmount;
      totalBilled += summary.totalInvoiced;
      totalReceived += summary.totalReceived;
      return {
        customer: c,
        ...summary,
      };
    }).filter((r) => r.outstanding > 0 || r.totalInvoiced > 0)
      .sort((a, b) => b.outstanding - a.outstanding);

    return {
      totalOutstanding,
      totalOverdue,
      totalBilled,
      totalReceived,
      partyRows,
    };
  }, [customers, savedInvoices, payments]);

  // 2. SALES REGISTER
  const salesRegister = useMemo(() => {
    return savedInvoices
      .filter((inv) => {
        if (!searchQ.trim()) return true;
        const q = searchQ.toLowerCase();
        return (
          inv.billNo?.toLowerCase().includes(q) ||
          inv.clientName?.toLowerCase().includes(q) ||
          inv.date?.includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [savedInvoices, searchQ]);

  // 3. TRANSPORT REGISTER
  const transportRegister = useMemo(() => {
    return consignmentNotes
      .filter((lr) => {
        if (!searchQ.trim()) return true;
        const q = searchQ.toLowerCase();
        return (
          lr.lrNo?.toLowerCase().includes(q) ||
          lr.consignorName?.toLowerCase().includes(q) ||
          lr.consigneeName?.toLowerCase().includes(q) ||
          lr.vehicleNo?.toLowerCase().includes(q) ||
          lr.fromLocation?.toLowerCase().includes(q) ||
          lr.toLocation?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [consignmentNotes, searchQ]);

  // 4. COLLECTIONS REGISTER
  const collectionsRegister = useMemo(() => {
    return payments
      .filter((p) => {
        if (!searchQ.trim()) return true;
        const q = searchQ.toLowerCase();
        const cust = customers.find((c) => c.id === p.customerId);
        return (
          cust?.name?.toLowerCase().includes(q) ||
          p.referenceNumber?.toLowerCase().includes(q) ||
          p.paymentMode?.toLowerCase().includes(q) ||
          p.paymentDate?.includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [payments, customers, searchQ]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (filename: string, rows: (string | number)[][], headers: string[]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Executive Reports & Statements</h1>
          <p className="page-subtitle">Transport operations, accounts receivable, and revenue intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost-sm" onClick={handlePrint}>
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="account-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`account-tab-btn ${activeTab === 'outstanding' ? 'active' : ''}`}
          onClick={() => setActiveTab('outstanding')}
        >
          <AlertCircle size={15} /> Outstanding Aging Report
        </button>
        <button
          className={`account-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <FileText size={15} /> Sales & Billing Register
        </button>
        <button
          className={`account-tab-btn ${activeTab === 'transport' ? 'active' : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          <ClipboardList size={15} /> e-LR Movement Register
        </button>
        <button
          className={`account-tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <CreditCard size={15} /> Collection Register
        </button>
      </div>

      {/* 1. OUTSTANDING TAB */}
      {activeTab === 'outstanding' && (
        <div>
          <div className="fin-summary-grid" style={{ marginBottom: '16px' }}>
            <div className="fin-card fin-card-amber">
              <div className="fin-card-label">TOTAL OUTSTANDING</div>
              <div className="fin-card-value outstanding-text">{formatCurrencyINR(outstandingSummary.totalOutstanding)}</div>
              <div className="fin-card-sub">From {outstandingSummary.partyRows.filter((p) => p.outstanding > 0).length} parties</div>
            </div>
            <div className="fin-card fin-card-red">
              <div className="fin-card-label">TOTAL OVERDUE</div>
              <div className="fin-card-value">{formatCurrencyINR(outstandingSummary.totalOverdue)}</div>
              <div className="fin-card-sub">Past allowed payment terms</div>
            </div>
            <div className="fin-card fin-card-blue">
              <div className="fin-card-label">LIFETIME BILLED</div>
              <div className="fin-card-value">{formatCurrencyINR(outstandingSummary.totalBilled)}</div>
              <div className="fin-card-sub">{savedInvoices.length} total invoices</div>
            </div>
            <div className="fin-card fin-card-green">
              <div className="fin-card-label">TOTAL COLLECTED</div>
              <div className="fin-card-value">{formatCurrencyINR(outstandingSummary.totalReceived)}</div>
              <div className="fin-card-sub">Overall collection rate</div>
            </div>
          </div>

          <div className="card-panel">
            <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="card-panel-title">Party-wise Outstanding & Aging Statement</span>
              <button
                className="btn-ghost-sm"
                onClick={() => {
                  const headers = ['Party Name', 'City', 'Phone', 'Total Invoiced', 'Received', 'Outstanding', 'Overdue'];
                  const rows = outstandingSummary.partyRows.map((r) => [
                    r.customer.name,
                    r.customer.city || '',
                    r.customer.phone || '',
                    r.totalInvoiced,
                    r.totalReceived,
                    r.outstanding,
                    r.overdueAmount,
                  ]);
                  handleExportCSV('outstanding_statement', rows, headers);
                }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>

            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Party Name</th>
                    <th>City / State</th>
                    <th>Contact</th>
                    <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                    <th style={{ textAlign: 'right' }}>Received</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                    <th style={{ textAlign: 'right' }}>Overdue</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingSummary.partyRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-state">No party billing data recorded yet.</td>
                    </tr>
                  ) : (
                    outstandingSummary.partyRows.map((row) => (
                      <tr key={row.customer.id}>
                        <td>
                          <strong>{row.customer.name}</strong>
                          {row.customer.gstin && <div style={{ fontSize: '11px', color: '#64748b' }}>GST: {row.customer.gstin}</div>}
                        </td>
                        <td>{[row.customer.city, row.customer.state].filter(Boolean).join(', ') || '—'}</td>
                        <td>{row.customer.phone || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrencyINR(row.totalInvoiced)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrencyINR(row.totalReceived)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: row.outstanding > 0 ? '#f59e0b' : '#64748b' }}>
                          {formatCurrencyINR(row.outstanding)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: row.overdueAmount > 0 ? '#ef4444' : '#64748b' }}>
                          {formatCurrencyINR(row.overdueAmount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-ghost-sm"
                            title="Open Client Account & Ledger"
                            onClick={() => {
                              onSelectClient(row.customer);
                              onNavigate('account');
                            }}
                          >
                            <ExternalLink size={13} /> Ledger
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALES REGISTER */}
      {activeTab === 'sales' && (
        <div className="card-panel">
          <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="card-panel-title">Sales & Billing Register ({salesRegister.length} Invoices)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="search-box-wrap" style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter by bill no, client, date..."
                  className="input-field"
                  style={{ paddingLeft: '32px', height: '32px', fontSize: '12px', width: '220px' }}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
              </div>
              <button
                className="btn-ghost-sm"
                onClick={() => {
                  const headers = ['Bill No', 'Date', 'Party Name', 'Bill Total', 'Advance', 'Balance Payable', 'Status'];
                  const rows = salesRegister.map((inv) => {
                    const totals = getInvoiceTotals(inv);
                    return [
                      inv.billNo,
                      inv.date,
                      inv.clientName,
                      totals.billTotal,
                      totals.advanceAmount,
                      totals.balanceAmount,
                      inv.paymentStatus || 'PENDING',
                    ];
                  });
                  handleExportCSV('sales_register', rows, headers);
                }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Client / Party</th>
                  <th style={{ textAlign: 'right' }}>Bill Total</th>
                  <th style={{ textAlign: 'right' }}>Advance</th>
                  <th style={{ textAlign: 'right' }}>Balance Payable</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesRegister.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">No invoices match your search.</td>
                  </tr>
                ) : (
                  salesRegister.map((inv) => {
                    const totals = getInvoiceTotals(inv);
                    const received = inv.amountReceived || 0;
                    const status = inv.paymentStatus === 'PAID' ? 'PAID'
                      : received > 0 ? 'PARTIAL'
                      : getDaysOverdue(inv.date, '30 days') > 0 ? 'OVERDUE'
                      : 'PENDING';
                    return (
                      <tr key={inv.id}>
                        <td><strong>#{inv.billNo}</strong></td>
                        <td>{inv.date}</td>
                        <td>{inv.clientName || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrencyINR(totals.billTotal)}</td>
                        <td style={{ textAlign: 'right', color: '#f59e0b' }}>{totals.advanceAmount > 0 ? formatCurrencyINR(totals.advanceAmount) : '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrencyINR(totals.balanceAmount)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge-sm status-${status.toLowerCase()}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TRANSPORT REGISTER */}
      {activeTab === 'transport' && (
        <div className="card-panel">
          <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="card-panel-title">e-LR Consignment Register ({transportRegister.length} e-LRs)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="search-box-wrap" style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter by LR, party, vehicle..."
                  className="input-field"
                  style={{ paddingLeft: '32px', height: '32px', fontSize: '12px', width: '220px' }}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
              </div>
              <button
                className="btn-ghost-sm"
                onClick={() => {
                  const headers = ['LR No', 'Date', 'Consignor', 'Consignee', 'From', 'To', 'Vehicle No', 'Weight', 'Freight'];
                  const rows = transportRegister.map((lr) => [
                    lr.lrNo,
                    lr.date,
                    lr.consignorName,
                    lr.consigneeName,
                    lr.fromLocation,
                    lr.toLocation,
                    lr.vehicleNo,
                    lr.senderWeight || '',
                    lr.totalFreightAmount || lr.freightAmount || '',
                  ]);
                  handleExportCSV('transport_register', rows, headers);
                }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>LR #</th>
                  <th>Date</th>
                  <th>Consignor</th>
                  <th>Consignee</th>
                  <th>Route</th>
                  <th>Vehicle No</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ textAlign: 'right' }}>Freight</th>
                </tr>
              </thead>
              <tbody>
                {transportRegister.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">No consignment notes match your search.</td>
                  </tr>
                ) : (
                  transportRegister.map((lr) => (
                    <tr key={lr.id}>
                      <td><strong>#{lr.lrNo}</strong></td>
                      <td>{lr.date}</td>
                      <td>{lr.consignorName || '—'}</td>
                      <td>{lr.consigneeName || '—'}</td>
                      <td>{lr.fromLocation || '—'} → {lr.toLocation || '—'}</td>
                      <td><code>{lr.vehicleNo || '—'}</code></td>
                      <td style={{ textAlign: 'right' }}>{lr.senderWeight || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {lr.totalFreightAmount || lr.freightAmount ? formatCurrencyINR(Number(lr.totalFreightAmount || lr.freightAmount)) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. COLLECTIONS REGISTER */}
      {activeTab === 'collections' && (
        <div className="card-panel">
          <div className="card-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="card-panel-title">Payment Collection Register ({collectionsRegister.length} Receipts)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="search-box-wrap" style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter collections..."
                  className="input-field"
                  style={{ paddingLeft: '32px', height: '32px', fontSize: '12px', width: '200px' }}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
              </div>
              <button
                className="btn-ghost-sm"
                onClick={() => {
                  const headers = ['Date', 'Party', 'Mode', 'Ref No', 'Amount', 'Notes'];
                  const rows = collectionsRegister.map((p) => {
                    const cust = customers.find((c) => c.id === p.customerId);
                    return [
                      p.paymentDate,
                      cust?.name || '',
                      p.paymentMode,
                      p.referenceNumber || '',
                      p.amount,
                      p.notes || '',
                    ];
                  });
                  handleExportCSV('collection_register', rows, headers);
                }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Payment Mode</th>
                  <th>Ref / Cheque / UTR</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {collectionsRegister.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">No payment collection records found.</td>
                  </tr>
                ) : (
                  collectionsRegister.map((p) => {
                    const cust = customers.find((c) => c.id === p.customerId);
                    return (
                      <tr key={p.id}>
                        <td>{p.paymentDate}</td>
                        <td><strong>{cust?.name || '—'}</strong></td>
                        <td>
                          <span className="payment-mode-pill">{p.paymentMode?.replace('_', ' ')}</span>
                        </td>
                        <td><code>{p.referenceNumber || '—'}</code></td>
                        <td>{p.notes || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                          +{formatCurrencyINR(p.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
