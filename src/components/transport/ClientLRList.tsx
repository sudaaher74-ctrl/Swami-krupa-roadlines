import React, { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import { formatCurrencyINR } from '../../utils/accountingService';

interface ClientLRListProps {
  client: CustomerRecord;
  onCreateLR: () => void;
}

export const ClientLRList: React.FC<ClientLRListProps> = ({ client, onCreateLR }) => {
  const { consignmentNotes } = useStore();
  const [searchQ, setSearchQ] = useState('');

  const clientLRs = useMemo(() => {
    return consignmentNotes
      .filter((lr) =>
        lr.customerId === client.id ||
        lr.consigneeName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
      )
      .filter((lr) => {
        const q = searchQ.toLowerCase();
        return (
          !q ||
          lr.lrNo?.toLowerCase().includes(q) ||
          lr.vehicleNo?.toLowerCase().includes(q) ||
          lr.containerNo?.toLowerCase().includes(q) ||
          lr.fromLocation?.toLowerCase().includes(q) ||
          lr.toLocation?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [consignmentNotes, client, searchQ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">e-LR / Bilty — {client.name}</h1>
          <p className="page-subtitle">All consignment notes linked to this client</p>
        </div>
        <button className="btn-primary" onClick={onCreateLR}>
          <Plus size={15} /> Create e-LR
        </button>
      </div>

      {/* Summary */}
      <div className="mini-stats-row">
        <div className="mini-stat">
          <span className="mini-stat-label">Total e-LRs</span>
          <span className="mini-stat-value">{clientLRs.length}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Total Freight</span>
          <span className="mini-stat-value">
            {formatCurrencyINR(clientLRs.reduce((s, lr) => s + (Number(lr.totalFreightAmount) || 0), 0))}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="tab-toolbar">
        <div className="search-bar-row">
          <Search size={14} className="search-bar-icon" />
          <input
            className="search-bar-input"
            placeholder="Search by LR no, vehicle, container…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>LR NUMBER</th>
              <th>DATE</th>
              <th>VEHICLE</th>
              <th>CONTAINER</th>
              <th>ROUTE</th>
              <th>FREIGHT</th>
              <th>FREIGHT TYPE</th>
            </tr>
          </thead>
          <tbody>
            {clientLRs.map((lr) => (
              <tr key={lr.id} className="data-table-row">
                <td className="cell-primary">{lr.lrNo}</td>
                <td>{lr.date}</td>
                <td>
                  <div className="cell-primary">{lr.vehicleNo}</div>
                </td>
                <td className="cell-secondary">{lr.containerNo || '—'}</td>
                <td>
                  <span className="route-text">
                    {lr.fromLocation || '—'} → {lr.toLocation || '—'}
                  </span>
                </td>
                <td>
                  <span className="cell-amount">
                    {lr.totalFreightAmount ? formatCurrencyINR(Number(lr.totalFreightAmount)) : '—'}
                  </span>
                </td>
                <td>
                  <span className={`freight-type-badge freight-${lr.freightType?.replace(' ', '-').toLowerCase()}`}>
                    {lr.freightType}
                  </span>
                </td>
              </tr>
            ))}
            {clientLRs.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  <ClipboardList size={28} />
                  <div>No e-LR records for {client.name}</div>
                  <button className="btn-primary" onClick={onCreateLR}>
                    <Plus size={14} /> Create e-LR
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
