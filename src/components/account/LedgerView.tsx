import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import { getCustomerLedger, formatCurrencyINR } from '../../utils/accountingService';

interface LedgerViewProps {
  client: CustomerRecord;
}

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

  const ledger = useMemo(
    () => getCustomerLedger(client.id, client, savedInvoices, payments, ledgerTransactions),
    [client, savedInvoices, payments, ledgerTransactions]
  );

  const totals = useMemo(() => {
    return ledger.reduce(
      (acc, entry) => ({
        debit: acc.debit + entry.debit,
        credit: acc.credit + entry.credit,
      }),
      { debit: 0, credit: 0 }
    );
  }, [ledger]);

  const closingBalance = totals.debit - totals.credit;

  if (ledger.length === 0) {
    return (
      <div className="empty-state">
        <BookOpen size={40} />
        <h3>No Ledger Entries</h3>
        <p>Create invoices or record payments to see the ledger.</p>
      </div>
    );
  }

  return (
    <div className="ledger-container">
      {/* Header */}
      <div className="ledger-header">
        <div className="ledger-header-info">
          <BookOpen size={18} />
          <h2>Account Ledger — {client.name}</h2>
        </div>
        <div className="ledger-balance-summary">
          <div className="lbs-item">
            <span className="lbs-label">Total Debit</span>
            <span className="lbs-value dr">{formatCurrencyINR(totals.debit)}</span>
          </div>
          <div className="lbs-item">
            <span className="lbs-label">Total Credit</span>
            <span className="lbs-value cr">{formatCurrencyINR(totals.credit)}</span>
          </div>
          <div className="lbs-item">
            <span className="lbs-label">Closing Balance</span>
            <span className={`lbs-value ${closingBalance > 0 ? 'outstanding-text' : 'received-text'}`}>
              {formatCurrencyINR(Math.abs(closingBalance))}
              {closingBalance > 0 ? ' Dr' : ' Cr'}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
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
            {ledger.map((entry, idx) => (
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
                  <span className={`ledger-balance ${entry.runningBalance > 0 ? 'dr' : 'cr'}`}>
                    {formatCurrencyINR(Math.abs(entry.runningBalance))}
                    <span className="balance-dr-cr">{entry.runningBalance > 0 ? ' Dr' : ' Cr'}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="ledger-totals-row">
              <td colSpan={4}><strong>TOTALS</strong></td>
              <td className="text-right"><strong className="ledger-debit">{formatCurrencyINR(totals.debit)}</strong></td>
              <td className="text-right"><strong className="ledger-credit">{formatCurrencyINR(totals.credit)}</strong></td>
              <td className="text-right">
                <strong className={closingBalance > 0 ? 'outstanding-text' : 'received-text'}>
                  {formatCurrencyINR(Math.abs(closingBalance))}
                  {closingBalance > 0 ? ' Dr' : ' Cr'}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="ledger-readonly-note">
        <span>🔒 Ledger entries are auto-generated from invoices and payments. They cannot be manually edited.</span>
      </div>
    </div>
  );
};
