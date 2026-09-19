import React, { useState, useMemo } from 'react';
import { BookOpen, Printer, Download, Calendar, ArrowRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import {
  getFilteredCustomerLedger,
  formatCurrencyINR,
} from '../../utils/accountingService';
import { defaultCompanyProfile } from '../../utils/defaultData';

interface LedgerViewProps {
  client: CustomerRecord;
}

type DatePreset = 'all' | 'this-month' | 'last-month' | 'fy' | 'custom';

const TYPE_COLORS: Record<string, string> = {
  INVOICE: '#a78bfa',
  PAYMENT: '#34d399',
  OPENING_BALANCE: '#38bdf8',
  CREDIT_NOTE: '#10b981',
  DEBIT_NOTE: '#f87171',
  ADJUSTMENT: '#fbbf24',
};

const TYPE_LABELS: Record<string, string> = {
  INVOICE: 'Invoice',
  PAYMENT: 'Payment',
  OPENING_BALANCE: 'Opening Balance',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE: 'Debit Note',
  ADJUSTMENT: 'Adjustment',
};

export const LedgerView: React.FC<LedgerViewProps> = ({ client }) => {
  const { savedInvoices, payments, ledgerTransactions } = useStore();

  // Date Preset State
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showPrintStatementModal, setShowPrintStatementModal] = useState(false);

  // Compute date range from preset
  const dateRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (activePreset === 'this-month') {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        label: `${start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
      };
    }

    if (activePreset === 'last-month') {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        label: `${start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
      };
    }

    if (activePreset === 'fy') {
      // Indian Financial Year: April 1 to March 31
      const fyStartYear = month >= 3 ? year : year - 1;
      const start = new Date(fyStartYear, 3, 1); // 1st April
      const end = new Date(fyStartYear + 1, 2, 31); // 31st March
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        label: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`,
      };
    }

    if (activePreset === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        label: `${customStartDate || 'Start'} to ${customEndDate || 'End'}`,
      };
    }

    return {
      startDate: undefined,
      endDate: undefined,
      label: 'All Time',
    };
  }, [activePreset, customStartDate, customEndDate]);

  // Compute filtered ledger
  const ledgerResult = useMemo(() => {
    return getFilteredCustomerLedger(
      client.id,
      client,
      savedInvoices,
      payments,
      ledgerTransactions,
      dateRange.startDate,
      dateRange.endDate
    );
  }, [client, savedInvoices, payments, ledgerTransactions, dateRange]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (Rs)', 'Credit (Rs)', 'Balance (Rs)'];
    const rows: string[][] = [];

    if (ledgerResult.openingBalance > 0) {
      rows.push([
        dateRange.startDate || '—',
        'OPENING_BALANCE',
        'OB',
        'Opening Balance b/f',
        ledgerResult.openingBalanceType === 'Dr' ? ledgerResult.openingBalance.toString() : '0',
        ledgerResult.openingBalanceType === 'Cr' ? ledgerResult.openingBalance.toString() : '0',
        `${ledgerResult.openingBalance} ${ledgerResult.openingBalanceType}`,
      ]);
    }

    ledgerResult.entries.forEach((e) => {
      rows.push([
        e.transactionDate,
        e.transactionType,
        e.referenceNumber || '',
        `"${e.description.replace(/"/g, '""')}"`,
        e.debit.toString(),
        e.credit.toString(),
        `${Math.abs(e.runningBalance)} ${e.runningBalance >= 0 ? 'Dr' : 'Cr'}`,
      ]);
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ledger_${client.name.replace(/\s+/g, '_')}_${dateRange.label.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasEntries = ledgerResult.entries.length > 0 || ledgerResult.openingBalance > 0;

  return (
    <div className="ledger-container">
      {/* Top Filter Bar & Actions */}
      <div className="ledger-top-toolbar">
        {/* Preset Filter Chips */}
        <div className="ledger-filter-chips">
          <button
            type="button"
            className={`lfc-btn ${activePreset === 'all' ? 'active' : ''}`}
            onClick={() => setActivePreset('all')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`lfc-btn ${activePreset === 'this-month' ? 'active' : ''}`}
            onClick={() => setActivePreset('this-month')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`lfc-btn ${activePreset === 'last-month' ? 'active' : ''}`}
            onClick={() => setActivePreset('last-month')}
          >
            Last Month
          </button>
          <button
            type="button"
            className={`lfc-btn ${activePreset === 'fy' ? 'active' : ''}`}
            onClick={() => setActivePreset('fy')}
          >
            FY 2026-27
          </button>
          <button
            type="button"
            className={`lfc-btn ${activePreset === 'custom' ? 'active' : ''}`}
            onClick={() => setActivePreset('custom')}
          >
            <Calendar size={13} />
            Custom
          </button>
        </div>

        {/* Action Buttons */}
        <div className="ledger-actions-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Export Ledger to CSV"
            disabled={!hasEntries}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowPrintStatementModal(true)}
            title="Download / Print Branded Statement of Account"
            disabled={!hasEntries}
          >
            <Printer size={14} />
            Print Statement
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {activePreset === 'custom' && (
        <div className="ledger-custom-date-bar">
          <div className="flex-center gap-8">
            <span className="text-muted text-xs">From:</span>
            <input
              type="date"
              className="date-mini-picker"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span className="text-muted text-xs">To:</span>
            <input
              type="date"
              className="date-mini-picker"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="ledger-header">
        <div className="ledger-header-info">
          <BookOpen size={18} />
          <h2>Account Ledger — {client.name}</h2>
          <span className="ledger-period-tag">{dateRange.label}</span>
        </div>
        <div className="ledger-balance-summary">
          {ledgerResult.openingBalance > 0 && (
            <div className="lbs-item">
              <span className="lbs-label">Opening Balance</span>
              <span className="lbs-value text-blue">
                {formatCurrencyINR(ledgerResult.openingBalance)} {ledgerResult.openingBalanceType}
              </span>
            </div>
          )}
          <div className="lbs-item">
            <span className="lbs-label">Period Debit</span>
            <span className="lbs-value dr">{formatCurrencyINR(ledgerResult.totalPeriodDebit)}</span>
          </div>
          <div className="lbs-item">
            <span className="lbs-label">Period Credit</span>
            <span className="lbs-value cr">{formatCurrencyINR(ledgerResult.totalPeriodCredit)}</span>
          </div>
          <div className="lbs-item">
            <span className="lbs-label">Closing Balance</span>
            <span
              className={`lbs-value ${
                ledgerResult.closingBalanceType === 'Dr' ? 'outstanding-text' : 'received-text'
              }`}
            >
              {formatCurrencyINR(ledgerResult.closingBalance)}
              {' '}{ledgerResult.closingBalanceType}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      {!hasEntries ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <h3>No Ledger Entries</h3>
          <p>No transactions found for the selected period ({dateRange.label}).</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table ledger-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>TYPE</th>
                <th>REFERENCE</th>
                <th>DESCRIPTION</th>
                <th className="text-right">DEBIT (₹)</th>
                <th className="text-right">CREDIT (₹)</th>
                <th className="text-right">BALANCE (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row if date-filtered */}
              {ledgerResult.openingBalance > 0 && (
                <tr className="ledger-ob-row">
                  <td className="ledger-date">{dateRange.startDate || '—'}</td>
                  <td>
                    <span className="type-badge" style={{ background: '#38bdf822', color: '#38bdf8' }}>
                      Opening Balance
                    </span>
                  </td>
                  <td className="ledger-ref">OB</td>
                  <td className="ledger-desc font-semibold">Opening Balance b/f</td>
                  <td className="text-right">
                    {ledgerResult.openingBalanceType === 'Dr' ? (
                      <span className="ledger-debit">{formatCurrencyINR(ledgerResult.openingBalance)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-right">
                    {ledgerResult.openingBalanceType === 'Cr' ? (
                      <span className="ledger-credit">{formatCurrencyINR(ledgerResult.openingBalance)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-right">
                    <span className={`ledger-balance ${ledgerResult.openingBalanceType.toLowerCase()}`}>
                      {formatCurrencyINR(ledgerResult.openingBalance)} {ledgerResult.openingBalanceType}
                    </span>
                  </td>
                </tr>
              )}

              {/* Transaction Entries */}
              {ledgerResult.entries.map((entry, idx) => (
                <tr key={entry.id} className={`data-table-row ${idx % 2 === 0 ? '' : 'row-alt'}`}>
                  <td className="ledger-date">{entry.transactionDate}</td>
                  <td>
                    <span
                      className="type-badge"
                      style={{
                        background: `${TYPE_COLORS[entry.transactionType] || '#94a3b8'}22`,
                        color: TYPE_COLORS[entry.transactionType] || '#94a3b8',
                      }}
                    >
                      {TYPE_LABELS[entry.transactionType] || entry.transactionType}
                    </span>
                  </td>
                  <td className="ledger-ref">{entry.referenceNumber || '—'}</td>
                  <td className="ledger-desc">{entry.description}</td>
                  <td className="text-right">
                    {entry.debit > 0 ? (
                      <span className="ledger-debit">{formatCurrencyINR(entry.debit)}</span>
                    ) : (
                      <span className="ledger-nil">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    {entry.credit > 0 ? (
                      <span className="ledger-credit">{formatCurrencyINR(entry.credit)}</span>
                    ) : (
                      <span className="ledger-nil">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <span className={`ledger-balance ${entry.runningBalance >= 0 ? 'dr' : 'cr'}`}>
                      {formatCurrencyINR(Math.abs(entry.runningBalance))}
                      <span className="balance-dr-cr">{entry.runningBalance >= 0 ? ' Dr' : ' Cr'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="ledger-totals-row">
                <td colSpan={4}><strong>TOTALS ({dateRange.label})</strong></td>
                <td className="text-right">
                  <strong className="ledger-debit">{formatCurrencyINR(ledgerResult.totalPeriodDebit)}</strong>
                </td>
                <td className="text-right">
                  <strong className="ledger-credit">{formatCurrencyINR(ledgerResult.totalPeriodCredit)}</strong>
                </td>
                <td className="text-right">
                  <strong
                    className={ledgerResult.closingBalanceType === 'Dr' ? 'outstanding-text' : 'received-text'}
                  >
                    {formatCurrencyINR(ledgerResult.closingBalance)} {ledgerResult.closingBalanceType}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Readonly Notice */}
      <div className="ledger-readonly-note">
        <span>🔒 Ledger entries are auto-generated from invoices and payments. Filter by date above to view custom period statements.</span>
      </div>

      {/* PHASE 3: Statement of Account Print Modal */}
      {showPrintStatementModal && (
        <div className="modal-overlay" onClick={() => setShowPrintStatementModal(false)}>
          <div
            className="modal-panel statement-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Actions Bar (No Print) */}
            <div className="statement-modal-actions no-print">
              <div>
                <h3 className="font-bold text-white text-base">Statement of Account Preview</h3>
                <p className="text-xs text-muted">Ready for client print or PDF export</p>
              </div>
              <div className="flex-center gap-8">
                <button
                  type="button"
                  className="btn-primary btn-print-statement"
                  onClick={() => window.print()}
                >
                  <Printer size={15} />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowPrintStatementModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Statement Document */}
            <div className="statement-document printable-statement-sheet" id="printable-statement">
              {/* Header Letterhead */}
              <div className="stmt-letterhead">
                <div className="stmt-company-title">{defaultCompanyProfile.companyName}</div>
                <div className="stmt-tagline">{defaultCompanyProfile.tagline}</div>
                <div className="stmt-address">
                  {defaultCompanyProfile.addressLine1}, {defaultCompanyProfile.addressLine2}
                </div>
                <div className="stmt-contact">
                  <span><strong>PAN:</strong> {defaultCompanyProfile.panNo}</span>
                  <span><strong>Mob:</strong> {defaultCompanyProfile.mobiles}</span>
                  <span><strong>Email:</strong> {defaultCompanyProfile.email}</span>
                </div>
              </div>

              <div className="stmt-divider" />

              {/* Title & Period Banner */}
              <div className="stmt-banner">
                <div className="stmt-doc-title">STATEMENT OF ACCOUNT</div>
                <div className="stmt-period-badge">
                  <span>Period: <strong>{dateRange.label}</strong></span>
                  {dateRange.startDate && dateRange.endDate && (
                    <span className="stmt-date-span">
                      ({dateRange.startDate} <ArrowRight size={11} /> {dateRange.endDate})
                    </span>
                  )}
                </div>
              </div>

              {/* Client & Date Info Block */}
              <div className="stmt-meta-grid">
                <div className="stmt-meta-box">
                  <div className="stmt-box-label">STATEMENT TO (CLIENT)</div>
                  <div className="stmt-client-name">{client.name}</div>
                  {client.address && <div className="stmt-client-text">{client.address}</div>}
                  {client.gstin && <div className="stmt-client-text"><strong>GSTIN:</strong> {client.gstin}</div>}
                  {client.phone && <div className="stmt-client-text"><strong>Phone:</strong> {client.phone}</div>}
                </div>

                <div className="stmt-meta-box right">
                  <div className="stmt-box-label">STATEMENT SUMMARY</div>
                  <table className="stmt-summary-mini-table">
                    <tbody>
                      <tr>
                        <td>Opening Balance:</td>
                        <td className="text-right font-bold">
                          {formatCurrencyINR(ledgerResult.openingBalance)} {ledgerResult.openingBalanceType}
                        </td>
                      </tr>
                      <tr>
                        <td>Total Invoiced (Debit):</td>
                        <td className="text-right text-purple font-bold">
                          {formatCurrencyINR(ledgerResult.totalPeriodDebit)}
                        </td>
                      </tr>
                      <tr>
                        <td>Total Received (Credit):</td>
                        <td className="text-right text-green font-bold">
                          {formatCurrencyINR(ledgerResult.totalPeriodCredit)}
                        </td>
                      </tr>
                      <tr className="stmt-sum-total-row">
                        <td>Net Closing Balance:</td>
                        <td className="text-right font-bold">
                          {formatCurrencyINR(ledgerResult.closingBalance)} {ledgerResult.closingBalanceType}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statement Ledger Table */}
              <table className="stmt-table">
                <thead>
                  <tr>
                    <th style={{ width: 85 }}>DATE</th>
                    <th style={{ width: 85 }}>VCH TYPE</th>
                    <th style={{ width: 100 }}>REF / BILL #</th>
                    <th>PARTICULARS / DESCRIPTION</th>
                    <th style={{ width: 100 }} className="text-right">DEBIT (₹)</th>
                    <th style={{ width: 100 }} className="text-right">CREDIT (₹)</th>
                    <th style={{ width: 110 }} className="text-right">BALANCE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerResult.openingBalance > 0 && (
                    <tr className="stmt-ob-row">
                      <td>{dateRange.startDate || '—'}</td>
                      <td>Opening</td>
                      <td>OB</td>
                      <td>Opening Balance b/f</td>
                      <td className="text-right">
                        {ledgerResult.openingBalanceType === 'Dr' ? formatCurrencyINR(ledgerResult.openingBalance) : '—'}
                      </td>
                      <td className="text-right">
                        {ledgerResult.openingBalanceType === 'Cr' ? formatCurrencyINR(ledgerResult.openingBalance) : '—'}
                      </td>
                      <td className="text-right font-bold">
                        {formatCurrencyINR(ledgerResult.openingBalance)} {ledgerResult.openingBalanceType}
                      </td>
                    </tr>
                  )}

                  {ledgerResult.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.transactionDate}</td>
                      <td>{TYPE_LABELS[entry.transactionType] || entry.transactionType}</td>
                      <td className="font-bold">{entry.referenceNumber || '—'}</td>
                      <td>{entry.description}</td>
                      <td className="text-right">{entry.debit > 0 ? formatCurrencyINR(entry.debit) : '—'}</td>
                      <td className="text-right">{entry.credit > 0 ? formatCurrencyINR(entry.credit) : '—'}</td>
                      <td className="text-right font-bold">
                        {formatCurrencyINR(Math.abs(entry.runningBalance))}
                        {' '}{entry.runningBalance >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="stmt-table-totals">
                    <td colSpan={4}><strong>TOTALS</strong></td>
                    <td className="text-right"><strong>{formatCurrencyINR(ledgerResult.totalPeriodDebit)}</strong></td>
                    <td className="text-right"><strong>{formatCurrencyINR(ledgerResult.totalPeriodCredit)}</strong></td>
                    <td className="text-right">
                      <strong>
                        {formatCurrencyINR(ledgerResult.closingBalance)} {ledgerResult.closingBalanceType}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Statement Sign-off Footer */}
              <div className="stmt-footer-block">
                <div className="stmt-footer-terms">
                  <span>• This is a computer generated Statement of Account.</span>
                  <span>• Kindly verify and notify us within 7 days in case of any discrepancy.</span>
                </div>
                <div className="stmt-sign-box">
                  <div className="stmt-sign-for">{defaultCompanyProfile.signatureForText}</div>
                  <div className="stmt-sign-line" />
                  <div className="stmt-sign-label">{defaultCompanyProfile.proprietorText} / Authorised Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
