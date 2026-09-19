import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord, ActiveView } from '../../types/invoice';
import { getCustomerSummary, formatCurrencyINR } from '../../utils/accountingService';
import { ClientProfileModal } from './ClientProfileModal';
import { saveCustomer, deleteCustomer } from '../../utils/supabaseService';

interface ClientsListPageProps {
  onSelectClient: (client: CustomerRecord) => void;
  onNavigate?: (view: ActiveView) => void;
}

export const ClientsListPage: React.FC<ClientsListPageProps> = ({ onSelectClient, onNavigate: _onNavigate }) => {
  const { customers, setCustomers, savedInvoices, payments } = useStore();
  const [searchQ, setSearchQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<CustomerRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQ.toLowerCase();
      const matchSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || c.status === filterStatus || (!c.status && filterStatus === 'active');
      return matchSearch && matchStatus;
    });
  }, [customers, searchQ, filterStatus]);

  const handleSaveClient = (client: CustomerRecord) => {
    const exists = customers.find((c) => c.id === client.id);
    const updated = exists
      ? customers.map((c) => (c.id === client.id ? client : c))
      : [client, ...customers];
    setCustomers(updated);
    saveCustomer(client);
    setShowModal(false);
    setEditingClient(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this client? Their invoice history will be preserved.')) return;
    setCustomers(customers.filter((c) => c.id !== id));
    deleteCustomer(id);
  };

  const handleEdit = (c: CustomerRecord) => {
    setEditingClient(c);
    setShowModal(true);
  };

  const globalStats = useMemo(() => {
    let totalOutstanding = 0;
    let totalInvoiced = 0;
    customers.forEach((c) => {
      const s = getCustomerSummary(c.id, c, savedInvoices, payments);
      totalOutstanding += s.outstanding;
      totalInvoiced += s.totalInvoiced;
    });
    return { totalOutstanding, totalInvoiced, totalClients: customers.length };
  }, [customers, savedInvoices, payments]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients & Parties</h1>
          <p className="page-subtitle">Manage your client directory and accounting relationships</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditingClient(null); setShowModal(true); }}
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><Users size={20} /></div>
          <div>
            <div className="stat-value">{globalStats.totalClients}</div>
            <div className="stat-label">Total Clients</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-value">{formatCurrencyINR(globalStats.totalInvoiced)}</div>
            <div className="stat-label">Total Invoiced</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><AlertCircle size={20} /></div>
          <div>
            <div className="stat-value outstanding-text">{formatCurrencyINR(globalStats.totalOutstanding)}</div>
            <div className="stat-label">Total Outstanding</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="table-controls">
        <div className="search-bar-row">
          <Search size={15} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search by name, GSTIN, phone…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>CLIENT NAME</th>
              <th>GSTIN / PAN</th>
              <th>CONTACT</th>
              <th>INVOICED</th>
              <th>OUTSTANDING</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => {
              const summary = getCustomerSummary(client.id, client, savedInvoices, payments);
              const isActive = client.status !== 'inactive';
              return (
                <tr
                  key={client.id}
                  className="data-table-row clickable"
                  onClick={() => onSelectClient(client)}
                >
                  <td>
                    <div className="client-name-cell">
                      <div className="client-avatar">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="cell-primary">{client.name}</div>
                        {client.city && <div className="cell-secondary">{client.city}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-primary">{client.gstin || '—'}</div>
                    {client.pan && <div className="cell-secondary">PAN: {client.pan}</div>}
                  </td>
                  <td>
                    <div className="cell-primary">{client.phone || '—'}</div>
                    {client.email && (
                      <div className="cell-secondary truncate">{client.email}</div>
                    )}
                  </td>
                  <td>
                    <span className="cell-amount">{formatCurrencyINR(summary.totalInvoiced)}</span>
                    <div className="cell-secondary">{summary.invoiceCount} invoice{summary.invoiceCount !== 1 ? 's' : ''}</div>
                  </td>
                  <td>
                    <span className={`cell-amount ${summary.outstanding > 0 ? 'outstanding-text' : 'paid-text'}`}>
                      {formatCurrencyINR(summary.outstanding)}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      <button
                        className="icon-btn icon-btn-blue"
                        onClick={() => handleEdit(client)}
                        title="Edit Client"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="icon-btn icon-btn-red"
                        onClick={() => handleDelete(client.id)}
                        title="Remove Client"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  <Users size={32} />
                  <div>{searchQ ? `No clients found for "${searchQ}"` : 'No clients yet. Add your first client!'}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ClientProfileModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
        />
      )}
    </div>
  );
};
