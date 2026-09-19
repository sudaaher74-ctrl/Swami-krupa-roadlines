import React, { useState, useMemo } from 'react';
import { X, Save, Link, Layers, CheckSquare, Sparkles, Percent, Scissors } from 'lucide-react';
import type { CustomerRecord, Payment, PaymentAllocation } from '../../types/invoice';
import { useStore } from '../../store/useStore';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';
import { formatCurrencyINR } from '../../utils/accountingService';

interface PaymentModalProps {
  client: CustomerRecord;
  onSave: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  defaultInvoiceId?: string;
}

type PaymentModeTab = 'single' | 'multi';

const DEDUCTION_REASONS = [
  'Detention / Halting Dispute',
  'Weight Shortage / Damage Penalty',
  'Freight Rate Difference',
  'Toll / Diesel Advance Adjustment',
  'Late Delivery Penalty',
  'Client Discount / Round-off',
  'Other Reason',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  client,
  onSave,
  onClose,
  defaultInvoiceId,
}) => {
  const { savedInvoices, payments } = useStore();

  // Get all unpaid invoices for this client
  const clientUnpaidInvoices = useMemo(() => {
    return savedInvoices
      .filter((inv) => {
        const match =
          inv.customerId === client.id ||
          inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim();
        if (!match) return false;
        if (inv.paymentStatus === 'PAID') return false;
        const totals = getInvoiceTotals(inv);
        // Calculate received including previous payments
        const invPayments = payments.filter((p) => {
          if (p.customerId !== client.id) return false;
          if (p.invoiceId === inv.id) return true;
          if (p.allocations && p.allocations.some((a) => a.invoiceId === inv.id)) return true;
          return false;
        });
        const prevReceived = invPayments.reduce((s, p) => {
          if (p.allocations) {
            const a = p.allocations.find((al) => al.invoiceId === inv.id);
            if (a) return s + (a.amount || 0) + (a.tdsAmount || 0) + (a.deductionAmount || 0);
          }
          return s + (p.totalSettled || p.amount || 0);
        }, 0);
        const outstanding = Math.max(0, totals.balanceAmount - Math.max(inv.amountReceived || 0, prevReceived));
        return outstanding > 0;
      })
      .map((inv) => {
        const totals = getInvoiceTotals(inv);
        const invPayments = payments.filter((p) => {
          if (p.customerId !== client.id) return false;
          if (p.invoiceId === inv.id) return true;
          if (p.allocations && p.allocations.some((a) => a.invoiceId === inv.id)) return true;
          return false;
        });
        const prevReceived = invPayments.reduce((s, p) => {
          if (p.allocations) {
            const a = p.allocations.find((al) => al.invoiceId === inv.id);
            if (a) return s + (a.amount || 0) + (a.tdsAmount || 0) + (a.deductionAmount || 0);
          }
          return s + (p.totalSettled || p.amount || 0);
        }, 0);
        const outstanding = Math.max(0, totals.balanceAmount - Math.max(inv.amountReceived || 0, prevReceived));
        return {
          ...inv,
          totalAmount: totals.balanceAmount,
          outstanding,
        };
      })
      .sort((a, b) => a.billNo.localeCompare(b.billNo));
  }, [savedInvoices, payments, client]);

  const today = new Date().toISOString().slice(0, 10).split('-').reverse().join('-');

  // Mode: single invoice vs multi invoice
  const [activeMode, setActiveMode] = useState<PaymentModeTab>(
    defaultInvoiceId ? 'single' : clientUnpaidInvoices.length > 1 ? 'multi' : 'single'
  );

  // Form State
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState<Payment['paymentMode']>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Single Invoice State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(defaultInvoiceId || '');
  const [amount, setAmount] = useState('');
  const [tdsPercent, setTdsPercent] = useState<number | ''>('');
  const [tdsAmount, setTdsAmount] = useState<string>('');
  const [deductionAmount, setDeductionAmount] = useState<string>('');
  const [deductionReason, setDeductionReason] = useState<string>(DEDUCTION_REASONS[0]);

  // Multi-Invoice State
  const [multiTotalReceived, setMultiTotalReceived] = useState<string>('');
  const [multiTdsRate, setMultiTdsRate] = useState<number | ''>('');
  const [allocations, setAllocations] = useState<
    Record<string, { selected: boolean; amount: string; tds: string; deduction: string }>
  >(() => {
    const init: Record<string, { selected: boolean; amount: string; tds: string; deduction: string }> = {};
    clientUnpaidInvoices.forEach((inv) => {
      init[inv.id] = { selected: true, amount: '', tds: '', deduction: '' };
    });
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // When single invoice is selected
  const handleSingleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) {
      setAmount('');
      setTdsAmount('');
      setTdsPercent('');
      setDeductionAmount('');
      return;
    }
    const inv = clientUnpaidInvoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(inv.outstanding.toString());
      setTdsAmount('');
      setTdsPercent('');
      setDeductionAmount('');
    }
  };

  // Quick TDS button calculation for single invoice
  const applySingleTDS = (rate: number) => {
    const inv = clientUnpaidInvoices.find((i) => i.id === selectedInvoiceId);
    const baseAmount = inv ? inv.outstanding : parseFloat(amount) || 0;
    if (baseAmount <= 0) return;

    if (rate === 0) {
      setTdsPercent('');
      setTdsAmount('');
      if (inv) setAmount(inv.outstanding.toString());
      return;
    }

    const calculatedTds = Math.round(baseAmount * (rate / 100));
    setTdsPercent(rate);
    setTdsAmount(calculatedTds.toString());
    const netBank = Math.max(0, baseAmount - calculatedTds - (parseFloat(deductionAmount) || 0));
    setAmount(netBank.toString());
  };

  // FIFO Auto-allocation for Multi-Invoice
  const handleAutoAllocateFIFO = () => {
    const totalToAllocate = parseFloat(multiTotalReceived);
    if (isNaN(totalToAllocate) || totalToAllocate <= 0) {
      setErrors({ multiTotal: 'Enter a valid total received amount first' });
      return;
    }

    const nextAlloc = { ...allocations };
    let remaining = totalToAllocate;
    const rate = typeof multiTdsRate === 'number' ? multiTdsRate : 0;

    // Reset all amounts first
    Object.keys(nextAlloc).forEach((id) => {
      nextAlloc[id] = { ...nextAlloc[id], amount: '', tds: '', deduction: '' };
    });

    for (const inv of clientUnpaidInvoices) {
      if (!nextAlloc[inv.id]?.selected) continue;
      if (remaining <= 0) break;

      const billOutstanding = inv.outstanding;
      // Calculate TDS if rate specified
      const expectedTds = rate > 0 ? Math.round(billOutstanding * (rate / 100)) : 0;
      const expectedBank = Math.max(0, billOutstanding - expectedTds);

      if (remaining >= expectedBank) {
        nextAlloc[inv.id] = {
          selected: true,
          amount: expectedBank.toString(),
          tds: expectedTds > 0 ? expectedTds.toString() : '',
          deduction: '',
        };
        remaining -= expectedBank;
      } else {
        // Partial allocation
        const partialBank = Math.round(remaining);
        const partialTds = rate > 0 ? Math.round(partialBank * (rate / (100 - rate))) : 0;
        nextAlloc[inv.id] = {
          selected: true,
          amount: partialBank.toString(),
          tds: partialTds > 0 ? partialTds.toString() : '',
          deduction: '',
        };
        remaining = 0;
      }
    }

    setAllocations(nextAlloc);
    setErrors({});
  };

  // Multi-invoice calculation summaries
  const multiSummary = useMemo(() => {
    let totalAllocatedBank = 0;
    let totalAllocatedTds = 0;
    let totalAllocatedDeduction = 0;
    let selectedCount = 0;

    Object.entries(allocations).forEach(([_, alloc]) => {
      if (alloc.selected) {
        selectedCount++;
        totalAllocatedBank += parseFloat(alloc.amount) || 0;
        totalAllocatedTds += parseFloat(alloc.tds) || 0;
        totalAllocatedDeduction += parseFloat(alloc.deduction) || 0;
      }
    });

    const targetBank = parseFloat(multiTotalReceived) || 0;
    const diff = targetBank - totalAllocatedBank;

    return {
      totalAllocatedBank,
      totalAllocatedTds,
      totalAllocatedDeduction,
      totalSettled: totalAllocatedBank + totalAllocatedTds + totalAllocatedDeduction,
      diff,
      selectedCount,
    };
  }, [allocations, multiTotalReceived]);

  const handleSubmit = () => {
    setErrors({});

    if (!paymentDate) {
      setErrors({ paymentDate: 'Payment date is required' });
      return;
    }

    if (activeMode === 'single') {
      const netAmount = parseFloat(amount);
      if (isNaN(netAmount) || netAmount <= 0) {
        setErrors({ amount: 'Enter a valid payment amount' });
        return;
      }

      const tds = parseFloat(tdsAmount) || 0;
      const ded = parseFloat(deductionAmount) || 0;
      const totalSettled = netAmount + tds + ded;

      onSave({
        customerId: client.id,
        invoiceId: selectedInvoiceId || undefined,
        paymentDate,
        amount: netAmount,
        tdsAmount: tds > 0 ? tds : undefined,
        tdsPercent: typeof tdsPercent === 'number' ? tdsPercent : undefined,
        deductionAmount: ded > 0 ? ded : undefined,
        deductionReason: ded > 0 ? deductionReason : undefined,
        totalSettled,
        paymentMode,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        createdBy: 'system',
      });
    } else {
      // Multi-invoice mode
      const totalBank = parseFloat(multiTotalReceived);
      if (isNaN(totalBank) || totalBank <= 0) {
        setErrors({ multiTotal: 'Enter total received amount' });
        return;
      }

      const validAllocations: PaymentAllocation[] = [];
      let sumBank = 0;
      let sumTds = 0;
      let sumDed = 0;

      Object.entries(allocations).forEach(([invId, alloc]) => {
        if (!alloc.selected) return;
        const b = parseFloat(alloc.amount) || 0;
        const t = parseFloat(alloc.tds) || 0;
        const d = parseFloat(alloc.deduction) || 0;

        if (b > 0 || t > 0 || d > 0) {
          const inv = clientUnpaidInvoices.find((i) => i.id === invId);
          validAllocations.push({
            invoiceId: invId,
            billNo: inv?.billNo,
            amount: b,
            tdsAmount: t > 0 ? t : undefined,
            deductionAmount: d > 0 ? d : undefined,
          });
          sumBank += b;
          sumTds += t;
          sumDed += d;
        }
      });

      if (validAllocations.length === 0) {
        setErrors({ multiTotal: 'Allocate amounts to at least one invoice' });
        return;
      }

      onSave({
        customerId: client.id,
        paymentDate,
        amount: sumBank,
        tdsAmount: sumTds > 0 ? sumTds : undefined,
        deductionAmount: sumDed > 0 ? sumDed : undefined,
        totalSettled: sumBank + sumTds + sumDed,
        allocations: validAllocations,
        paymentMode,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        createdBy: 'system',
      });
    }
  };

  const selectedSingleInvoice = selectedInvoiceId
    ? clientUnpaidInvoices.find((i) => i.id === selectedInvoiceId)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel payment-modal-wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Record Payment / Receipt</h2>
            <p className="modal-subtitle">
              Client: <strong>{client.name}</strong> · Unpaid Bills: <strong>{clientUnpaidInvoices.length}</strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="payment-mode-switch">
          <button
            type="button"
            className={`pms-btn ${activeMode === 'single' ? 'active' : ''}`}
            onClick={() => setActiveMode('single')}
          >
            <Link size={14} />
            <span>Single Invoice / On-Account</span>
          </button>
          <button
            type="button"
            className={`pms-btn ${activeMode === 'multi' ? 'active' : ''}`}
            onClick={() => setActiveMode('multi')}
          >
            <Layers size={14} />
            <span>Multi-Invoice Settlement (Lump-Sum NEFT)</span>
            {clientUnpaidInvoices.length > 0 && (
              <span className="pms-badge">{clientUnpaidInvoices.length} Bills</span>
            )}
          </button>
        </div>

        <div className="modal-body">
          {/* Common Top Details: Date, Mode, Reference */}
          <div className="form-grid mb-16">
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                className={`form-input ${errors.paymentDate ? 'form-input-error' : ''}`}
                type="date"
                value={paymentDate.split('-').reverse().join('-')}
                onChange={(e) => setPaymentDate(e.target.value.split('-').reverse().join('-'))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                className="form-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
              >
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">UTR / Cheque No. / Ref</label>
              <input
                className="form-input"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR9876543210"
              />
            </div>
          </div>

          {/* MODE A: Single Invoice */}
          {activeMode === 'single' && (
            <div className="single-payment-container">
              <div className="form-group full mb-16">
                <label className="form-label">
                  <Link size={13} /> Select Invoice to Clear (Optional)
                </label>
                <select
                  className="form-select"
                  value={selectedInvoiceId}
                  onChange={(e) => handleSingleInvoiceSelect(e.target.value)}
                >
                  <option value="">— General On-Account Payment (No Specific Bill) —</option>
                  {clientUnpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Bill #{inv.billNo} · {inv.date} · Outstanding: {formatCurrencyINR(inv.outstanding)}
                    </option>
                  ))}
                </select>
                {selectedSingleInvoice && (
                  <div className="form-hint flex-between">
                    <span>
                      Original Bill Total: <strong>{formatCurrencyINR(selectedSingleInvoice.totalAmount)}</strong>
                    </span>
                    <span className="outstanding-text">
                      Current Outstanding: <strong>{formatCurrencyINR(selectedSingleInvoice.outstanding)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Amount & TDS Grid */}
              <div className="payment-amounts-card">
                <div className="form-grid">
                  {/* Bank Received */}
                  <div className="form-group">
                    <label className="form-label">Amount Received in Bank (₹) *</label>
                    <input
                      className={`form-input text-lg font-bold ${errors.amount ? 'form-input-error' : ''}`}
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setTdsPercent('');
                      }}
                      placeholder="e.g. 49000"
                    />
                    {errors.amount && <span className="form-error">{errors.amount}</span>}
                  </div>

                  {/* TDS Section (Phase 1) */}
                  <div className="form-group">
                    <div className="form-label flex-between">
                      <span className="flex-center gap-4">
                        <Percent size={13} /> TDS Deducted under Sec 194C
                      </span>
                      <div className="tds-quick-pills">
                        <button
                          type="button"
                          className={`pill-btn-sm ${tdsPercent === '' && !tdsAmount ? 'active' : ''}`}
                          onClick={() => applySingleTDS(0)}
                        >
                          0%
                        </button>
                        <button
                          type="button"
                          className={`pill-btn-sm ${tdsPercent === 1 ? 'active' : ''}`}
                          onClick={() => applySingleTDS(1)}
                          title="1% TDS for Individual / Proprietor"
                        >
                          1%
                        </button>
                        <button
                          type="button"
                          className={`pill-btn-sm ${tdsPercent === 2 ? 'active' : ''}`}
                          onClick={() => applySingleTDS(2)}
                          title="2% TDS for Company / LLP"
                        >
                          2%
                        </button>
                      </div>
                    </div>
                    <input
                      className="form-input"
                      type="number"
                      value={tdsAmount}
                      onChange={(e) => {
                        setTdsAmount(e.target.value);
                        setTdsPercent('');
                      }}
                      placeholder="TDS amount in ₹ (e.g. 1000)"
                    />
                  </div>

                  {/* Deductions / Penalty Section */}
                  <div className="form-group">
                    <label className="form-label flex-center gap-4">
                      <Scissors size={13} /> Freight Deductions / Shortage (₹)
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      placeholder="Optional deduction (e.g. 500)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deduction Reason</label>
                    <select
                      className="form-select"
                      value={deductionReason}
                      onChange={(e) => setDeductionReason(e.target.value)}
                      disabled={!deductionAmount || parseFloat(deductionAmount) <= 0}
                    >
                      {DEDUCTION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Real-time Total Settlement Banner */}
                <div className="settlement-summary-box">
                  <div className="ssb-row">
                    <span className="ssb-label">Bank Received:</span>
                    <span className="ssb-val">{formatCurrencyINR(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="ssb-plus">+</div>
                  <div className="ssb-row">
                    <span className="ssb-label">TDS (194C):</span>
                    <span className="ssb-val text-amber">{formatCurrencyINR(parseFloat(tdsAmount) || 0)}</span>
                  </div>
                  <div className="ssb-plus">+</div>
                  <div className="ssb-row">
                    <span className="ssb-label">Deductions:</span>
                    <span className="ssb-val text-red">{formatCurrencyINR(parseFloat(deductionAmount) || 0)}</span>
                  </div>
                  <div className="ssb-equals">=</div>
                  <div className="ssb-row total">
                    <span className="ssb-label">Total Bill Settled:</span>
                    <span className="ssb-val total-settled">
                      {formatCurrencyINR(
                        (parseFloat(amount) || 0) +
                        (parseFloat(tdsAmount) || 0) +
                        (parseFloat(deductionAmount) || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: Multi-Invoice Allocation (Phase 4) */}
          {activeMode === 'multi' && (
            <div className="multi-payment-container">
              {clientUnpaidInvoices.length === 0 ? (
                <div className="empty-state py-20">
                  <p>No unpaid invoices available for this client.</p>
                </div>
              ) : (
                <>
                  <div className="multi-top-controls">
                    <div className="form-group flex-1">
                      <label className="form-label font-bold">
                        Total Lump-Sum Received in Bank (₹) *
                      </label>
                      <input
                        className={`form-input text-lg font-bold ${errors.multiTotal ? 'form-input-error' : ''}`}
                        type="number"
                        value={multiTotalReceived}
                        onChange={(e) => setMultiTotalReceived(e.target.value)}
                        placeholder="e.g. 250000"
                      />
                      {errors.multiTotal && <span className="form-error">{errors.multiTotal}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Auto TDS Rate</label>
                      <div className="tds-quick-pills">
                        <button
                          type="button"
                          className={`pill-btn-sm ${multiTdsRate === '' ? 'active' : ''}`}
                          onClick={() => setMultiTdsRate('')}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          className={`pill-btn-sm ${multiTdsRate === 1 ? 'active' : ''}`}
                          onClick={() => setMultiTdsRate(1)}
                        >
                          1%
                        </button>
                        <button
                          type="button"
                          className={`pill-btn-sm ${multiTdsRate === 2 ? 'active' : ''}`}
                          onClick={() => setMultiTdsRate(2)}
                        >
                          2%
                        </button>
                      </div>
                    </div>

                    <div className="flex-end">
                      <button
                        type="button"
                        className="btn-auto-allocate"
                        onClick={handleAutoAllocateFIFO}
                        title="Automatically allocate funds starting from oldest pending bill"
                      >
                        <Sparkles size={14} />
                        Auto-Allocate (Oldest First)
                      </button>
                    </div>
                  </div>

                  {/* Multi-Invoice Allocation Table */}
                  <div className="data-table-wrapper allocation-table-wrapper mb-16">
                    <table className="data-table allocation-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>
                            <CheckSquare size={14} />
                          </th>
                          <th>BILL #</th>
                          <th>DATE</th>
                          <th className="text-right">OUTSTANDING (₹)</th>
                          <th className="text-right" style={{ width: 140 }}>ALLOCATED BANK (₹)</th>
                          <th className="text-right" style={{ width: 100 }}>TDS (₹)</th>
                          <th className="text-right" style={{ width: 100 }}>DED (₹)</th>
                          <th className="text-right">REMAINING</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientUnpaidInvoices.map((inv) => {
                          const alloc = allocations[inv.id] || { selected: false, amount: '', tds: '', deduction: '' };
                          const b = parseFloat(alloc.amount) || 0;
                          const t = parseFloat(alloc.tds) || 0;
                          const d = parseFloat(alloc.deduction) || 0;
                          const totalApplied = b + t + d;
                          const rem = Math.max(0, inv.outstanding - totalApplied);

                          return (
                            <tr key={inv.id} className={alloc.selected ? 'row-selected' : 'row-dimmed'}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={alloc.selected}
                                  onChange={(e) => {
                                    setAllocations((prev) => ({
                                      ...prev,
                                      [inv.id]: {
                                        ...alloc,
                                        selected: e.target.checked,
                                        amount: e.target.checked ? alloc.amount : '',
                                      },
                                    }));
                                  }}
                                />
                              </td>
                              <td className="font-bold">{inv.billNo}</td>
                              <td>{inv.date}</td>
                              <td className="text-right font-semibold text-amber">
                                {formatCurrencyINR(inv.outstanding)}
                              </td>
                              <td className="text-right">
                                <input
                                  type="number"
                                  className="table-mini-input"
                                  disabled={!alloc.selected}
                                  value={alloc.amount}
                                  onChange={(e) => {
                                    setAllocations((prev) => ({
                                      ...prev,
                                      [inv.id]: { ...alloc, amount: e.target.value },
                                    }));
                                  }}
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-right">
                                <input
                                  type="number"
                                  className="table-mini-input"
                                  disabled={!alloc.selected}
                                  value={alloc.tds}
                                  onChange={(e) => {
                                    setAllocations((prev) => ({
                                      ...prev,
                                      [inv.id]: { ...alloc, tds: e.target.value },
                                    }));
                                  }}
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-right">
                                <input
                                  type="number"
                                  className="table-mini-input"
                                  disabled={!alloc.selected}
                                  value={alloc.deduction}
                                  onChange={(e) => {
                                    setAllocations((prev) => ({
                                      ...prev,
                                      [inv.id]: { ...alloc, deduction: e.target.value },
                                    }));
                                  }}
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-right">
                                <span className={rem === 0 ? 'badge-cleared' : 'font-mono'}>
                                  {rem === 0 ? 'FULL PAID' : formatCurrencyINR(rem)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Multi-Allocation Status Footer */}
                  <div className="multi-alloc-status-bar">
                    <div className="mas-item">
                      <span>Total Received Target:</span>
                      <strong>{formatCurrencyINR(parseFloat(multiTotalReceived) || 0)}</strong>
                    </div>
                    <div className="mas-item">
                      <span>Bank Allocated:</span>
                      <strong className="text-blue">{formatCurrencyINR(multiSummary.totalAllocatedBank)}</strong>
                    </div>
                    <div className="mas-item">
                      <span>Total TDS:</span>
                      <strong className="text-amber">{formatCurrencyINR(multiSummary.totalAllocatedTds)}</strong>
                    </div>
                    <div className="mas-item">
                      <span>Total Settled:</span>
                      <strong className="text-green">{formatCurrencyINR(multiSummary.totalSettled)}</strong>
                    </div>
                    <div className="mas-item">
                      <span>Remaining to Allocate:</span>
                      <strong className={multiSummary.diff === 0 ? 'text-green' : multiSummary.diff < 0 ? 'text-red' : 'text-amber'}>
                        {formatCurrencyINR(multiSummary.diff)}
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="form-group full mt-16">
            <label className="form-label">Internal Remarks / Notes</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via NEFT from Continental Logistics account"
              rows={2}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>
            <Save size={15} />
            Save & Post Payment
          </button>
        </div>
      </div>
    </div>
  );
};
