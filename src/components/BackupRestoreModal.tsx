import React, { useState, useRef } from 'react';
import type {
  InvoiceData,
  ConsignmentNote,
  CustomerRecord,
  VehicleRecord,
  TripSlip,
  CompanyProfile,
} from '../types/invoice';
import {
  X,
  Download,
  Database,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FileCheck,
} from 'lucide-react';
import { exportFullSystemBackup, parseBackupFile, type FullSystemBackup } from '../utils/storageUtils';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    invoices: InvoiceData[];
    consignmentNotes: ConsignmentNote[];
    customers: CustomerRecord[];
    vehicles: VehicleRecord[];
    tripSlips: TripSlip[];
    companyProfile?: CompanyProfile;
  };
  onRestoreBackup: (backup: FullSystemBackup, mode: 'replace' | 'merge') => void;
  onResetToDemo: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  data,
  onRestoreBackup,
  onResetToDemo,
}) => {
  const [importedBackup, setImportedBackup] = useState<FullSystemBackup | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportFullSystemBackup(data);
    setSuccessMessage('Full system backup downloaded successfully!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const backup = await parseBackupFile(file);
      setImportedBackup(backup);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read backup file.');
    }
  };

  const handleApplyRestore = (mode: 'replace' | 'merge') => {
    if (!importedBackup) return;
    onRestoreBackup(importedBackup, mode);
    setSuccessMessage(`Successfully restored data (${mode === 'replace' ? 'Full Overwrite' : 'Merged'})!`);
    setImportedBackup(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Database size={18} style={{ color: '#38bdf8' }} />
            <div>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Data Backup & Restore Vault</h2>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                1-Click full backup & restore for bills, e-LRs, and fleet directories
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {successMessage && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={16} /> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} /> {errorMessage}
            </div>
          )}

          {/* Section 1: Backup Download */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-app)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  📥 Download Full System Backup
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Save all current records ({data.invoices.length} Bills, {data.consignmentNotes.length} e-LRs,{' '}
                  {data.customers.length} Customers, {data.vehicles.length} Vehicles) to a portable `.json` file.
                </p>
              </div>

              <button
                type="button"
                className="btn-header btn-header-save"
                onClick={handleExport}
                style={{ padding: '6px 14px', height: '32px' }}
              >
                <Download size={14} /> Download Backup
              </button>
            </div>
          </div>

          {/* Section 2: Restore Backup */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-app)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
              📤 Restore from Backup File
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Upload a previously exported `.json` file to restore your bills and directories.
            </p>

            <div style={{ marginTop: '12px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{
                  display: 'block',
                  width: '100%',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-input)',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-app)',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Imported File Summary */}
            {importedBackup && (
              <div
                style={{
                  marginTop: '14px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#93c5fd', marginBottom: '6px' }}>
                  <FileCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Backup File Verified: {importedBackup.appName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  <span>• Invoices: <strong>{importedBackup.invoices.length}</strong></span>
                  <span>• Consignment Notes: <strong>{importedBackup.consignmentNotes.length}</strong></span>
                  <span>• Customers: <strong>{importedBackup.customers.length}</strong></span>
                  <span>• Vehicles: <strong>{importedBackup.vehicles.length}</strong></span>
                  <span>• Trip Slips: <strong>{importedBackup.tripSlips.length}</strong></span>
                  <span>• Exported: <strong>{new Date(importedBackup.exportDate).toLocaleDateString()}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-header btn-header-save-next"
                    onClick={() => handleApplyRestore('merge')}
                  >
                    Merge with Existing
                  </button>
                  <button
                    type="button"
                    className="btn-header btn-header-save"
                    onClick={() => handleApplyRestore('replace')}
                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                  >
                    Replace All Data
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Reset to Demo */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>
                Reset to Default Demo Records
              </span>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Restore initial Swami Krupa Roadlines demo template and directory.
              </p>
            </div>

            <button
              type="button"
              className="btn-header btn-header-sample"
              onClick={() => {
                if (window.confirm('Reset all data to default demo template? Any unsaved local bills will be reset.')) {
                  onResetToDemo();
                  onClose();
                }
              }}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              <RotateCcw size={12} /> Reset Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
