import React from 'react';
import {
  Printer, PlusCircle, ZoomIn, ZoomOut, RotateCcw,
  Layout, Maximize2, Download, Share2, FileText,
  Phone, X, Edit2, PanelLeft
} from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import type { ActiveView, CustomerRecord } from '../types/invoice';
import { useStore } from '../store/useStore';
import { formatCurrencyINR, getCustomerSummary } from '../utils/accountingService';

interface HeaderBarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onNewInvoice: () => void;
  onSaveInvoice?: () => void;
  onSaveAndNextInvoice?: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onDownloadAllLRCopiesPDF?: () => void;
  onWhatsAppShare: () => void;
  onOpenSavedModal: () => void;
  onOpenDirectoryModal: () => void;
  onOpenTripSlipModal?: () => void;
  onOpenLedgerModal?: () => void;
  onOpenBackupModal?: () => void;
  savedCount: number;
  savedLRCount?: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onLoadOriginalSample: () => void;
  viewMode: 'split' | 'preview' | 'editor';
  onViewModeChange: (mode: 'split' | 'preview' | 'editor') => void;
  isDownloadingPDF?: boolean;
  onSelectClient: (client: CustomerRecord) => void;
  onClearClient: () => void;
  onViewClientProfile: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeView,
  onNavigate,
  onNewInvoice,
  onSaveInvoice: _onSaveInvoice,
  onSaveAndNextInvoice: _onSaveAndNextInvoice,
  onPrint,
  onDownloadPDF,
  onDownloadAllLRCopiesPDF,
  onWhatsAppShare,
  onOpenSavedModal: _onOpenSavedModal,
  onOpenDirectoryModal: _onOpenDirectoryModal,
  onOpenTripSlipModal: _onOpenTripSlipModal,
  onOpenLedgerModal: _onOpenLedgerModal,
  onOpenBackupModal,
  savedCount: _savedCount,
  savedLRCount: _savedLRCount = 0,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onLoadOriginalSample: _onLoadOriginalSample,
  viewMode,
  onViewModeChange,
  isDownloadingPDF = false,
  onSelectClient,
  onClearClient,
  onViewClientProfile,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const isLR = activeView === 'lr';
  const isEditorView = activeView === 'invoice' || activeView === 'lr';
  const { activeClient, savedInvoices, payments } = useStore();

  const clientSummary = activeClient
    ? getCustomerSummary(activeClient.id, activeClient, savedInvoices, payments)
    : null;

  return (
    <>
      <header className="app-header no-print">
        {/* Left: Sidebar Toggle + Search */}
        <div className="header-left">
          {onToggleSidebar && (
            <button
              type="button"
              className={`btn-sidebar-toggle ${isSidebarCollapsed ? 'is-collapsed' : ''}`}
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft size={16} />
            </button>
          )}
          <GlobalSearch onSelectClient={onSelectClient} onNavigate={onNavigate} />
        </div>

        {/* Center: Editor Controls (only in invoice/LR editor views) */}
        <div className="header-center">
          {isEditorView && (
            <>
              <div className="segmented-pill-selector">
                <button
                  type="button"
                  className={`pill-btn split-view-btn ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => onViewModeChange('split')}
                  title="Split Editor & Preview"
                >
                  <Layout size={13} />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${viewMode === 'editor' ? 'active' : ''}`}
                  onClick={() => onViewModeChange('editor')}
                  title="Form Editor"
                >
                  <FileText size={13} />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${viewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => onViewModeChange('preview')}
                  title="Full A4 Preview"
                >
                  <Maximize2 size={13} />
                  <span>Preview</span>
                </button>
              </div>

              <div className="zoom-widget">
                <button type="button" className="zoom-btn" onClick={onZoomOut} title="Zoom Out">
                  <ZoomOut size={12} />
                </button>
                <span className="zoom-value" onClick={onZoomReset} title="Reset Zoom">
                  {Math.round(zoom * 100)}%
                </span>
                <button type="button" className="zoom-btn" onClick={onZoomIn} title="Zoom In">
                  <ZoomIn size={12} />
                </button>
                <button type="button" className="zoom-btn" onClick={onZoomReset} title="Reset">
                  <RotateCcw size={11} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="header-right">
          {isEditorView && (
            <div className="header-actions-group primary-actions">
              <button
                type="button"
                className="btn-header btn-header-ghost"
                onClick={onNewInvoice}
                title={isLR ? 'Create Blank e-LR' : 'Create Blank Bill'}
              >
                <PlusCircle size={13} />
                <span>{isLR ? 'New LR' : 'New Bill'}</span>
              </button>

              <button
                type="button"
                className="btn-header btn-header-whatsapp"
                onClick={onWhatsAppShare}
                title="Share on WhatsApp"
              >
                <Share2 size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                className="btn-header btn-header-pdf"
                onClick={onDownloadPDF}
                disabled={isDownloadingPDF}
                title={isLR ? 'Download e-LR PDF' : 'Download Invoice PDF'}
              >
                <Download size={13} />
                <span>{isDownloadingPDF ? 'Exporting…' : 'PDF'}</span>
              </button>

              {isLR && onDownloadAllLRCopiesPDF && (
                <button
                  type="button"
                  className="btn-header btn-header-save-next"
                  onClick={onDownloadAllLRCopiesPDF}
                  disabled={isDownloadingPDF}
                  title="Download 3-page: Consignor + Consignee + Driver"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
                >
                  <Download size={13} />
                  <span>3-in-1 PDF</span>
                </button>
              )}


              <button
                type="button"
                className="btn-header btn-header-print"
                onClick={onPrint}
                title="Print Document"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
            </div>
          )}

          {!isEditorView && (
            <div className="header-actions-group">
              {onOpenBackupModal && (
                <button
                  type="button"
                  className="btn-header btn-header-ghost"
                  onClick={onOpenBackupModal}
                  title="Backup & Restore"
                >
                  <span>💾 Backup</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Active Client Bar */}
      {activeClient && (
        <div className="active-client-bar no-print">
          <div className="active-client-bar-inner">
            <div className="acb-status-dot" />
            <div className="acb-client-info">
              <span className="acb-label">CLIENT</span>
              <span className="acb-name">{activeClient.name}</span>
              {activeClient.gstin && <span className="acb-gstin">{activeClient.gstin}</span>}
              {activeClient.phone && (
                <span className="acb-phone">
                  <Phone size={11} />
                  {activeClient.phone}
                </span>
              )}
            </div>

            {clientSummary && (
              <div className="acb-financials">
                <div className="acb-fin-item">
                  <span className="acb-fin-label">Outstanding</span>
                  <span className="acb-fin-value outstanding">
                    {formatCurrencyINR(clientSummary.outstanding)}
                  </span>
                </div>
                <div className="acb-fin-item">
                  <span className="acb-fin-label">Invoiced</span>
                  <span className="acb-fin-value">{formatCurrencyINR(clientSummary.totalInvoiced)}</span>
                </div>
                <div className="acb-fin-item">
                  <span className="acb-fin-label">Received</span>
                  <span className="acb-fin-value received">{formatCurrencyINR(clientSummary.totalReceived)}</span>
                </div>
              </div>
            )}

            <div className="acb-actions">
              <button
                className="acb-btn acb-btn-primary"
                onClick={onViewClientProfile}
                title="View Client Profile"
              >
                <Edit2 size={12} />
                View Profile
              </button>
              <button
                className="acb-btn acb-btn-ghost"
                onClick={onClearClient}
                title="Change Client"
              >
                <X size={12} />
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
