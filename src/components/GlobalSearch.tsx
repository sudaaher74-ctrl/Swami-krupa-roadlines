import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Users, FileText, ClipboardList, Car, CreditCard, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { CustomerRecord, InvoiceData, ConsignmentNote, ActiveView } from '../types/invoice';
import { getInvoiceTotals } from '../utils/invoiceCalculations';
import { formatCurrencyINR } from '../utils/accountingService';

interface SearchResult {
  type: 'client' | 'invoice' | 'lr' | 'vehicle' | 'payment';
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  data: CustomerRecord | InvoiceData | ConsignmentNote | any;
}

interface GlobalSearchProps {
  onSelectClient: (client: CustomerRecord) => void;
  onNavigate: (view: ActiveView) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSelectClient, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { customers, savedInvoices, consignmentNotes, vehicles, payments } = useStore();

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 1) return [];
    const q = query.toLowerCase().trim();
    const hits: SearchResult[] = [];

    // CLIENTS
    customers.forEach((c) => {
      if (
        c.name?.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      ) {
        hits.push({
          type: 'client',
          id: c.id,
          title: c.name,
          subtitle: c.gstin ? `GSTIN: ${c.gstin}` : c.phone || '',
          meta: c.phone,
          data: c,
        });
      }
    });

    // INVOICES
    savedInvoices.forEach((inv) => {
      if (
        inv.billNo?.toLowerCase().includes(q) ||
        inv.clientName?.toLowerCase().includes(q) ||
        inv.beNo?.toLowerCase().includes(q)
      ) {
        const totals = getInvoiceTotals(inv);
        hits.push({
          type: 'invoice',
          id: inv.id,
          title: `Bill #${inv.billNo}`,
          subtitle: inv.clientName,
          meta: formatCurrencyINR(totals.balanceAmount),
          data: inv,
        });
      }
    });

    // e-LRs
    consignmentNotes.forEach((lr) => {
      if (
        lr.lrNo?.toLowerCase().includes(q) ||
        lr.consigneeName?.toLowerCase().includes(q) ||
        lr.consignorName?.toLowerCase().includes(q) ||
        lr.containerNo?.toLowerCase().includes(q) ||
        lr.vehicleNo?.toLowerCase().includes(q)
      ) {
        hits.push({
          type: 'lr',
          id: lr.id,
          title: `e-LR #${lr.lrNo}`,
          subtitle: `${lr.fromLocation || ''} → ${lr.toLocation || ''}`,
          meta: lr.vehicleNo,
          data: lr,
        });
      }
    });

    // VEHICLES
    vehicles.forEach((v) => {
      if (v.vehicleNo?.toLowerCase().includes(q) || v.driverName?.toLowerCase().includes(q)) {
        hits.push({
          type: 'vehicle',
          id: v.id,
          title: v.vehicleNo,
          subtitle: v.driverName || '',
          meta: v.type,
          data: v,
        });
      }
    });

    return hits.slice(0, 12);
  }, [query, customers, savedInvoices, consignmentNotes, vehicles, payments]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [results]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'client') {
      onSelectClient(result.data as CustomerRecord);
    } else if (result.type === 'invoice') {
      onNavigate('invoice-list');
    } else if (result.type === 'lr') {
      onNavigate('lr-list');
    } else if (result.type === 'vehicle') {
      onNavigate('vehicles');
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const typeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return <Users size={14} />;
      case 'invoice': return <FileText size={14} />;
      case 'lr': return <ClipboardList size={14} />;
      case 'vehicle': return <Car size={14} />;
      case 'payment': return <CreditCard size={14} />;
    }
  };

  const typeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return '#38bdf8';
      case 'invoice': return '#a78bfa';
      case 'lr': return '#34d399';
      case 'vehicle': return '#fbbf24';
      case 'payment': return '#f87171';
    }
  };

  const typeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'CLIENT';
      case 'invoice': return 'INVOICE';
      case 'lr': return 'e-LR';
      case 'vehicle': return 'VEHICLE';
      case 'payment': return 'PAYMENT';
    }
  };

  return (
    <div className="global-search-wrapper">
      <div className="global-search-input-row">
        <Search size={15} className="global-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="global-search-input"
          placeholder="Search client, invoice, vehicle, GSTIN…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            className="global-search-clear"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="global-search-dropdown" ref={dropdownRef}>
          {results.map((result, idx) => (
            <button
              key={`${result.type}-${result.id}`}
              className={`search-result-item ${idx === selectedIdx ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIdx(idx)}
              onClick={() => handleSelect(result)}
            >
              <span
                className="search-result-type-icon"
                style={{ color: typeColor(result.type) }}
              >
                {typeIcon(result.type)}
              </span>
              <div className="search-result-content">
                <div className="search-result-title">{result.title}</div>
                {result.subtitle && (
                  <div className="search-result-subtitle">{result.subtitle}</div>
                )}
              </div>
              <div className="search-result-right">
                <span
                  className="search-result-type-badge"
                  style={{ background: `${typeColor(result.type)}22`, color: typeColor(result.type) }}
                >
                  {typeLabel(result.type)}
                </span>
                {result.meta && (
                  <span className="search-result-meta">{result.meta}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && results.length === 0 && (
        <div className="global-search-dropdown" ref={dropdownRef}>
          <div className="search-no-results">
            <Search size={20} />
            <span>No results for "{query}"</span>
          </div>
        </div>
      )}
    </div>
  );
};
