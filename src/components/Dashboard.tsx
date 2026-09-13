import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Clock 
} from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';
import { getInvoiceTotals } from '../utils/invoiceCalculations';

export const Dashboard: React.FC = () => {
  const { savedInvoices, consignmentNotes, tripSlips } = useStore();

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalBilledThisMonth = 0;
    let totalOutstanding = 0;
    
    savedInvoices.forEach(inv => {
      const totals = getInvoiceTotals(inv);
      
      // Calculate this month's billing
      // Note: Assumes date format DD/MM/YYYY or DD-MM-YYYY
      const parts = inv.date.split(/[-/]/);
      if (parts.length === 3) {
        const invMonth = parseInt(parts[1], 10) - 1;
        const invYear = parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2], 10);
        if (invMonth === currentMonth && invYear === currentYear) {
          totalBilledThisMonth += totals.billTotal;
        }
      }

      // Calculate outstanding
      if (inv.paymentStatus !== 'PAID') {
        const received = inv.amountReceived || 0;
        totalOutstanding += (totals.balanceAmount - received);
      }
    });

    return {
      totalBilledThisMonth,
      totalOutstanding,
      totalInvoices: savedInvoices.length,
      totalLRs: consignmentNotes.length,
      totalTrips: tripSlips.length
    };
  }, [savedInvoices, consignmentNotes, tripSlips]);

  // Get 5 most recent unpaid or recent invoices
  const recentInvoices = useMemo(() => {
    return [...savedInvoices]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [savedInvoices]);

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>Billing Overview</h1>
        <p style={{ color: '#94a3b8' }}>Welcome to Swami Krupa Roadlines Studio. Here is your summary.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* Metric Card 1 */}
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Billed This Month</h3>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px' }}>
              <TrendingUp size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f1f5f9' }}>
            ₹ {formatCurrency(metrics.totalBilledThisMonth)}
          </div>
        </div>

        {/* Metric Card 2 */}
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Outstanding Payments</h3>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px' }}>
              <AlertCircle size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            ₹ {formatCurrency(metrics.totalOutstanding)}
          </div>
        </div>

        {/* Metric Card 3 */}
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Total e-LR Notes</h3>
            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px' }}>
              <FileText size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f1f5f9' }}>
            {metrics.totalLRs}
          </div>
        </div>

      </div>

      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>Recent Bills</h2>
          <Clock size={18} color="#94a3b8" />
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>BILL NO</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>DATE</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>CLIENT</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>AMOUNT</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => {
                const totals = getInvoiceTotals(inv);
                const isPaid = inv.paymentStatus === 'PAID';
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{inv.billNo}</td>
                    <td style={{ padding: '16px', color: '#cbd5e1' }}>{inv.date}</td>
                    <td style={{ padding: '16px', color: '#cbd5e1' }}>{inv.clientName}</td>
                    <td style={{ padding: '16px', fontWeight: 700 }}>₹ {formatCurrency(totals.balanceAmount)}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isPaid ? '#34d399' : '#fbbf24'
                      }}>
                        {inv.paymentStatus || 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No recent bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
