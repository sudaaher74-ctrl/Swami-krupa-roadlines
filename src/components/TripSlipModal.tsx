import React, { useState } from 'react';
import type { TripSlip, VehicleRecord, CompanyProfile } from '../types/invoice';
import { formatCurrency } from '../utils/numberToWords';
import { downloadTripSlipPDF } from '../utils/exportUtils';
import {
  X,
  Plus,
  Trash2,
  Printer,
  Download,
  Fuel,
  Search,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface TripSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripSlips: TripSlip[];
  onSaveTripSlip: (slip: TripSlip) => void;
  onDeleteTripSlip: (id: string) => void;
  vehicles: VehicleRecord[];
  company: CompanyProfile;
}

export const TripSlipModal: React.FC<TripSlipModalProps> = ({
  isOpen,
  onClose,
  tripSlips,
  onSaveTripSlip,
  onDeleteTripSlip,
  vehicles,
  company,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [searchHistory, setSearchHistory] = useState('');

  const todayStr = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const getNextSlipNumber = () => {
    const numbers = tripSlips
      .map(s => {
        const m = s.slipNo.match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 100;
    return `SLIP-${max + 1}`;
  };

  const [currentSlip, setCurrentSlip] = useState<TripSlip>(() => ({
    id: 'slip-' + Date.now(),
    slipNo: getNextSlipNumber(),
    date: todayStr(),
    vehicleNo: vehicles[0]?.vehicleNo || '',
    driverName: vehicles[0]?.driverName || '',
    driverPhone: vehicles[0]?.driverPhone || '',
    fromLocation: 'NHAVA SHEVA',
    toLocation: 'BHIWANDI',
    containerNo: '',
    dieselLiters: 60,
    dieselRate: 92.5,
    dieselAmount: 5550,
    dieselPumpName: 'HPCL KALAMBOLI',
    driverAdvance: 2500,
    tollCharges: 800,
    otherExpenses: 0,
    remarks: 'Driver trip cash advance & diesel slip',
    totalExpense: 8850,
    company: company,
    createdAt: new Date().toISOString(),
  }));

  if (!isOpen) return null;

  const updateSlipField = (field: keyof TripSlip, val: any) => {
    const updated = { ...currentSlip, [field]: val };
    
    // Auto-calculate diesel amount if liters and rate are provided
    if (field === 'dieselLiters' || field === 'dieselRate') {
      const liters = field === 'dieselLiters' ? Number(val) || 0 : Number(updated.dieselLiters) || 0;
      const rate = field === 'dieselRate' ? Number(val) || 0 : Number(updated.dieselRate) || 0;
      if (liters && rate) {
        updated.dieselAmount = Math.round(liters * rate);
      }
    }

    // Auto-calculate total expense
    const diesel = Number(updated.dieselAmount) || 0;
    const advance = Number(updated.driverAdvance) || 0;
    const toll = Number(updated.tollCharges) || 0;
    const other = Number(updated.otherExpenses) || 0;
    updated.totalExpense = diesel + advance + toll + other;

    setCurrentSlip(updated);
  };

  const handleSelectVehicle = (vehNo: string) => {
    const match = vehicles.find(v => v.vehicleNo.toUpperCase() === vehNo.toUpperCase());
    const updated = {
      ...currentSlip,
      vehicleNo: vehNo.toUpperCase(),
      driverName: match?.driverName || currentSlip.driverName,
      driverPhone: match?.driverPhone || currentSlip.driverPhone,
    };
    setCurrentSlip(updated);
  };

  const handleSaveSlip = () => {
    onSaveTripSlip(currentSlip);
    // Reset to a fresh slip with the next sequential number
    const nextNo = getNextSlipNumber();
    setCurrentSlip({
      id: 'slip-' + Date.now(),
      slipNo: nextNo,
      date: todayStr(),
      vehicleNo: currentSlip.vehicleNo,
      driverName: currentSlip.driverName,
      driverPhone: currentSlip.driverPhone,
      fromLocation: currentSlip.fromLocation,
      toLocation: currentSlip.toLocation,
      containerNo: '',
      dieselLiters: 0,
      dieselRate: 92.5,
      dieselAmount: 0,
      dieselPumpName: currentSlip.dieselPumpName,
      driverAdvance: 0,
      tollCharges: 0,
      otherExpenses: 0,
      remarks: '',
      totalExpense: 0,
      company: company,
      createdAt: new Date().toISOString(),
    });
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleDownloadSlipPDF = async () => {
    await downloadTripSlipPDF('printable-trip-slip-card', currentSlip.slipNo, currentSlip.vehicleNo);
  };

  const filteredHistory = tripSlips.filter(s => {
    const q = searchHistory.toLowerCase();
    return (
      s.slipNo.toLowerCase().includes(q) ||
      s.vehicleNo.toLowerCase().includes(q) ||
      s.driverName.toLowerCase().includes(q) ||
      s.date.toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content trip-slip-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Fuel size={20} style={{ color: '#0ea5e9' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', color: '#f8fafc' }}>
                Vehicle Trip & Driver Advance Slip Generator
              </h2>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
                Create, print, and track diesel chits and driver advance vouchers
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="segmented-pill-selector">
              <button
                type="button"
                className={`pill-btn ${activeSubTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('create')}
              >
                <Plus size={13} /> Create Slip
              </button>
              <button
                type="button"
                className={`pill-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('history')}
              >
                <FileText size={13} /> History ({tripSlips.length})
              </button>
            </div>
            <button className="btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CREATE TAB */}
        {activeSubTab === 'create' && (
          <div className="trip-slip-split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', overflowY: 'auto' }}>
            {/* Form Column */}
            <div className="trip-slip-form-col">
              <div className="form-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '10px' }}>
                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                  <label>Slip No *</label>
                  <input
                    type="text"
                    value={currentSlip.slipNo}
                    style={{ fontWeight: 700, fontFamily: 'monospace' }}
                    onChange={(e) => updateSlipField('slipNo', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                  <label>Date *</label>
                  <input
                    type="text"
                    value={currentSlip.date}
                    onChange={(e) => updateSlipField('date', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                  <label>Vehicle No *</label>
                  <input
                    type="text"
                    list="trip-vehicles-list"
                    value={currentSlip.vehicleNo}
                    placeholder="MH46DL7778"
                    style={{ textTransform: 'uppercase', fontWeight: 600 }}
                    onChange={(e) => handleSelectVehicle(e.target.value)}
                  />
                  <datalist id="trip-vehicles-list">
                    {vehicles.map(v => (
                      <option key={v.id} value={v.vehicleNo}>
                        {v.vehicleNo} {v.driverName ? `(${v.driverName})` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                  <label>Driver Name *</label>
                  <input
                    type="text"
                    value={currentSlip.driverName}
                    placeholder="Driver Name"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => updateSlipField('driverName', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                  <label>From (Origin)</label>
                  <input
                    type="text"
                    value={currentSlip.fromLocation}
                    placeholder="NHAVA SHEVA"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => updateSlipField('fromLocation', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                  <label>To (Destination)</label>
                  <input
                    type="text"
                    value={currentSlip.toLocation}
                    placeholder="BHIWANDI"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => updateSlipField('toLocation', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 12' }}>
                  <label>Container No / Size</label>
                  <input
                    type="text"
                    value={currentSlip.containerNo || ''}
                    placeholder="BEAU5560140 / 40 FT"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => updateSlipField('containerNo', e.target.value)}
                  />
                </div>

                {/* Diesel Breakdown Group */}
                <div style={{ gridColumn: 'span 12', background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
                    <Fuel size={14} /> Diesel Fuel Expense
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Liters (L)</label>
                      <input
                        type="number"
                        step="any"
                        value={currentSlip.dieselLiters || ''}
                        placeholder="70"
                        onChange={(e) => updateSlipField('dieselLiters', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Rate / L (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={currentSlip.dieselRate || ''}
                        placeholder="92.50"
                        onChange={(e) => updateSlipField('dieselRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>Diesel Total (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={currentSlip.dieselAmount || ''}
                        placeholder="6475.00"
                        onChange={(e) => updateSlipField('dieselAmount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Petrol / Diesel Pump Name</label>
                    <input
                      type="text"
                      value={currentSlip.dieselPumpName || ''}
                      placeholder="HPCL KALAMBOLI / BPCL PANVEL"
                      onChange={(e) => updateSlipField('dieselPumpName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 4' }}>
                  <label style={{ color: '#f59e0b', fontWeight: 700 }}>Driver Advance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={currentSlip.driverAdvance || ''}
                    placeholder="2500"
                    onChange={(e) => updateSlipField('driverAdvance', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 4' }}>
                  <label>Toll Charges (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={currentSlip.tollCharges || ''}
                    placeholder="800"
                    onChange={(e) => updateSlipField('tollCharges', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 4' }}>
                  <label>Other Expenses (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={currentSlip.otherExpenses || ''}
                    placeholder="0"
                    onChange={(e) => updateSlipField('otherExpenses', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 12' }}>
                  <label>Remarks / Trip Note</label>
                  <input
                    type="text"
                    value={currentSlip.remarks || ''}
                    placeholder="Night halting or bridge toll note"
                    onChange={(e) => updateSlipField('remarks', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-header btn-header-save"
                  style={{ flex: 1, padding: '9px 14px', justifyContent: 'center' }}
                  onClick={handleSaveSlip}
                >
                  <CheckCircle2 size={15} /> Save Trip Slip
                </button>
                <button
                  type="button"
                  className="btn-header btn-header-print"
                  onClick={handlePrintSlip}
                  title="Print Slip"
                >
                  <Printer size={15} /> Print
                </button>
                <button
                  type="button"
                  className="btn-header btn-header-pdf"
                  onClick={handleDownloadSlipPDF}
                  title="Download Slip PDF"
                >
                  <Download size={15} /> PDF
                </button>
              </div>
            </div>

            {/* Printable Slip Preview Card */}
            <div className="trip-slip-preview-col" style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div
                id="printable-trip-slip-card"
                className="trip-slip-voucher-paper"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  width: '100%',
                  maxWidth: '420px',
                  border: '2px solid #000000',
                  padding: '12px',
                  fontFamily: 'Arial, sans-serif',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #000000', paddingBottom: '6px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>{company.jurisdiction}</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#d60000', margin: '2px 0' }}>{company.companyName}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700 }}>{company.tagline}</div>
                  <div style={{ fontSize: '9px' }}>Mob: {company.mobiles}</div>
                  <div style={{ marginTop: '4px', display: 'inline-block', background: '#000000', color: '#ffffff', padding: '1px 8px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.8px' }}>
                    VEHICLE TRIP & DIESEL SLIP
                  </div>
                </div>

                {/* Meta Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '11.5px', borderBottom: '1px solid #000000', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div><strong>SLIP NO:</strong> {currentSlip.slipNo}</div>
                  <div style={{ textAlign: 'right' }}><strong>DATE:</strong> {currentSlip.date}</div>
                  <div><strong>VEHICLE:</strong> {currentSlip.vehicleNo || 'N/A'}</div>
                  <div style={{ textAlign: 'right' }}><strong>DRIVER:</strong> {currentSlip.driverName || 'N/A'}</div>
                  <div style={{ gridColumn: 'span 2', marginTop: '3px' }}>
                    <strong>ROUTE:</strong> {currentSlip.fromLocation} ➔ {currentSlip.toLocation}
                  </div>
                  {currentSlip.containerNo && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>CONTAINER:</strong> {currentSlip.containerNo}
                    </div>
                  )}
                </div>

                {/* Expenses Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #000000', background: '#f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Particulars / Item</th>
                      <th style={{ textAlign: 'right', padding: '4px' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Boolean(currentSlip.dieselAmount) && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 4px' }}>
                          Diesel: {currentSlip.dieselLiters ? `${currentSlip.dieselLiters} L @ ₹${currentSlip.dieselRate}` : 'Fuel'}
                          {currentSlip.dieselPumpName ? ` (${currentSlip.dieselPumpName})` : ''}
                        </td>
                        <td style={{ textAlign: 'right', padding: '3px 4px', fontWeight: 600 }}>
                          {formatCurrency(currentSlip.dieselAmount || 0)}
                        </td>
                      </tr>
                    )}
                    {Boolean(currentSlip.driverAdvance) && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 4px' }}>Driver Cash Advance</td>
                        <td style={{ textAlign: 'right', padding: '3px 4px', fontWeight: 600 }}>
                          {formatCurrency(currentSlip.driverAdvance || 0)}
                        </td>
                      </tr>
                    )}
                    {Boolean(currentSlip.tollCharges) && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 4px' }}>Toll & Border Expenses</td>
                        <td style={{ textAlign: 'right', padding: '3px 4px', fontWeight: 600 }}>
                          {formatCurrency(currentSlip.tollCharges || 0)}
                        </td>
                      </tr>
                    )}
                    {Boolean(currentSlip.otherExpenses) && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 4px' }}>Other Charges</td>
                        <td style={{ textAlign: 'right', padding: '3px 4px', fontWeight: 600 }}>
                          {formatCurrency(currentSlip.otherExpenses || 0)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '2px solid #000000', background: '#f8fafc', fontWeight: 800, fontSize: '12px' }}>
                      <td style={{ padding: '5px 4px' }}>TOTAL TRIP ADVANCE / EXPENSE:</td>
                      <td style={{ textAlign: 'right', padding: '5px 4px' }}>₹{formatCurrency(currentSlip.totalExpense)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '10px', fontSize: '10px', fontWeight: 700 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div>_______________________</div>
                    <div style={{ marginTop: '3px' }}>Driver Signature</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div>_______________________</div>
                    <div style={{ marginTop: '3px' }}>Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeSubTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="modal-search-bar" style={{ padding: '8px 16px', background: '#1e293b' }}>
              <Search size={15} style={{ position: 'absolute', left: '28px', top: '18px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search trip slips by Slip No, Vehicle, Driver, Date..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {filteredHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  <Fuel size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No trip slips found</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {filteredHistory.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                          {s.slipNo}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{s.date}</span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        🚛 {s.vehicleNo} <span style={{ fontWeight: 400, color: '#cbd5e1' }}>({s.driverName})</span>
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        📍 {s.fromLocation} ➔ {s.toLocation}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #334155' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                          ₹{formatCurrency(s.totalExpense)}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Load & Edit Slip"
                            onClick={() => {
                              setCurrentSlip(s);
                              setActiveSubTab('create');
                            }}
                          >
                            <FileText size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Delete Slip"
                            style={{ color: '#ef4444' }}
                            onClick={() => onDeleteTripSlip(s.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
