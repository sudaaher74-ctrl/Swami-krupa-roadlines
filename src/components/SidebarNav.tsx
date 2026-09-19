import React from 'react';
import {
  LayoutDashboard, Users, FileText, ClipboardList, Truck, Car,
  BookOpen, FolderOpen, BarChart3, Settings, ChevronRight, ChevronLeft,
  DollarSign, Package, X
} from 'lucide-react';
import type { ActiveView } from '../types/invoice';
import { useStore } from '../store/useStore';

interface SidebarNavProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClearClient: () => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
  clientRequired?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const ALL_SECTIONS: NavSection[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { id: 'clients', label: 'Clients', icon: <Users size={16} /> },
    ]
  },
  {
    label: 'BILLING',
    items: [
      { id: 'invoice', label: 'Tax Invoice', icon: <FileText size={16} /> },
      { id: 'invoice-list', label: 'Invoice History', icon: <FolderOpen size={16} /> },
    ]
  },
  {
    label: 'TRANSPORT',
    items: [
      { id: 'lr', label: 'e-LR / Bilty', icon: <ClipboardList size={16} /> },
      { id: 'lr-list', label: 'LR History', icon: <Package size={16} /> },
      { id: 'trips', label: 'Trip Slips', icon: <Truck size={16} /> },
      { id: 'vehicles', label: 'Vehicles', icon: <Car size={16} /> },
    ]
  },
  {
    label: 'ACCOUNTING',
    items: [
      { id: 'account', label: 'Account', icon: <BookOpen size={16} />, clientRequired: true },
      { id: 'expenses', label: 'Expenses', icon: <DollarSign size={16} /> },
    ]
  },
  {
    items: [
      { id: 'documents', label: 'Documents', icon: <FolderOpen size={16} /> },
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    ]
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onClearClient,
}) => {
  const { activeClient } = useStore();

  return (
    <aside className={`sidebar-nav ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div
        className={`sidebar-brand ${isCollapsed ? 'collapsed' : ''}`}
        onClick={isCollapsed ? onToggleCollapse : undefined}
        title={isCollapsed ? 'Click to expand sidebar' : undefined}
      >
        {isCollapsed ? (
          <button
            type="button"
            className="sidebar-collapse-btn sidebar-expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>
        ) : (
          <>
            <div className="sidebar-brand-inner">
              <div className="sidebar-brand-dot">
                <div className="pulse" />
                <div className="core" />
              </div>
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">SWAMI KRUPA</span>
                <span className="sidebar-brand-sub">Roadlines Studio</span>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* Active Client Banner */}
      {activeClient && !isCollapsed && (
        <div className="sidebar-active-client">
          <div className="sidebar-client-badge">
            <div className="sidebar-client-dot" />
            <div className="sidebar-client-info">
              <span className="sidebar-client-name">{activeClient.name}</span>
              {activeClient.gstin && (
                <span className="sidebar-client-gstin">{activeClient.gstin}</span>
              )}
            </div>
            <button
              className="sidebar-client-clear"
              onClick={onClearClient}
              title="Clear active client"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {activeClient && isCollapsed && (
        <div className="sidebar-client-collapsed-dot" title={activeClient.name}>
          <div className="sidebar-client-dot large" />
        </div>
      )}

      {/* Navigation Items */}
      <nav className="sidebar-nav-items">
        {ALL_SECTIONS.map((section, si) => (
          <div key={si} className="sidebar-section">
            {section.label && !isCollapsed && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const isActive = activeView === item.id;
              const isDisabled = item.clientRequired && !activeClient;

              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && onNavigate(item.id)}
                  title={isCollapsed ? item.label : (isDisabled ? 'Select a client first' : item.label)}
                  disabled={isDisabled}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="sidebar-item-label">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <span className="sidebar-item-active-dot" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {isCollapsed ? (
        <div className="sidebar-footer collapsed">
          <button
            type="button"
            className="sidebar-expand-bottom-btn"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <div className="sidebar-footer">
          <span className="sidebar-version">v2.0 — Client-Centric</span>
        </div>
      )}
    </aside>
  );
};
