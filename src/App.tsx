import React, { useState, useEffect } from 'react';
import type { InvoiceData, CustomerRecord, VehicleRecord, TripSlip, ConsignmentNote, ActiveView } from './types/invoice';
import {
  defaultInvoice,
  createNewInvoice,
  defaultConsignmentNote,
  createNewConsignmentNote,
} from './utils/defaultData';
import { calculateNextBillNumber, recordBillSequenceNumber } from './utils/billNumberUtils';
import { HeaderBar } from './components/HeaderBar';
import { SidebarNav } from './components/SidebarNav';
import { InvoiceDocument } from './components/InvoiceDocument';
import { ModernInvoiceDocument } from './components/ModernInvoiceDocument';
import { InvoiceEditor } from './components/InvoiceEditor';
import { SavedInvoicesModal } from './components/SavedInvoicesModal';
import { DirectoryModal } from './components/DirectoryModal';
import { TripSlipModal } from './components/TripSlipModal';
import { PartyLedgerModal } from './components/PartyLedgerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { type FullSystemBackup } from './utils/storageUtils';
import { ConsignmentNoteEditor } from './components/ConsignmentNoteEditor';
import { ConsignmentNoteDocument } from './components/ConsignmentNoteDocument';
import { SavedConsignmentNotesModal } from './components/SavedConsignmentNotesModal';
import { Dashboard } from './components/Dashboard';
import { ClientsListPage } from './components/clients/ClientsListPage';
import { ClientDashboard } from './components/clients/ClientDashboard';
import { ClientProfileModal } from './components/clients/ClientProfileModal';
import { AccountPage } from './components/account/AccountPage';
import { PaymentModal } from './components/account/PaymentModal';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import {
  downloadInvoicePDF,
  openWhatsAppShare,
  downloadConsignmentNotePDF,
  downloadAllLRCopiesPDF,
  openConsignmentWhatsAppShare,
} from './utils/exportUtils';
import { CheckCircle2 } from 'lucide-react';
import './styles/app.css';
import './styles/sidebar.css';
import './styles/accounting.css';
import { useStore } from './store/useStore';
import { saveCustomer as saveCustomerSvc } from './utils/supabaseService';

import {
  saveInvoice, deleteInvoice,
  saveConsignmentNote, deleteConsignmentNote,
  saveCustomer, deleteCustomer,
  saveVehicle, deleteVehicle,
  saveTripSlip, deleteTripSlip,
  savePayment,
} from './utils/supabaseService';
import { createPaymentId } from './utils/accountingService';
import type { Payment } from './types/invoice';


const LOCAL_STORAGE_KEY_INVOICES = 'swami_krupa_saved_invoices_v1';
const LOCAL_STORAGE_KEY_COMPANY = 'swami_krupa_company_profile_v1';
const LOCAL_STORAGE_KEY_BANK = 'swami_krupa_bank_details_v1';
const LOCAL_STORAGE_KEY_LR_NOTES = 'swami_krupa_consignment_notes_v1';

export const App: React.FC = () => {
  // Active view in the sidebar navigation
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Editing a client profile
  const [editingClientForModal, setEditingClientForModal] = useState<CustomerRecord | null>(null);
  const [showClientProfileModal, setShowClientProfileModal] = useState(false);
  // Payment modal shortcut from header
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Derive 'activeDocType' for existing editor components
  const activeDocType: 'dashboard' | 'invoice' | 'lr' =
    activeView === 'invoice' ? 'invoice'
    : activeView === 'lr' ? 'lr'
    : 'dashboard';

  // Current active invoice
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_INVOICES);
      if (stored) {
         const list = JSON.parse(stored);
         if (list.length > 0) {
            const nextBillNo = calculateNextBillNumber(list);
            const newInv = createNewInvoice(nextBillNo);
            const savedComp = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
            if (savedComp) newInv.company = JSON.parse(savedComp);
            const savedBank = localStorage.getItem(LOCAL_STORAGE_KEY_BANK);
            if (savedBank) newInv.bank = JSON.parse(savedBank);
            return newInv;
         }
      }
    } catch (e) {}
    return defaultInvoice;
  });

  // Current active e-LR Note
  const [currentConsignmentNote, setCurrentConsignmentNote] = useState<ConsignmentNote>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LR_NOTES);
      if (stored) {
         const list = JSON.parse(stored);
         if (list.length > 0) {
            const newLR = createNewConsignmentNote();
            const savedComp = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
            if (savedComp) newLR.company = JSON.parse(savedComp);
            return newLR;
         }
      }
    } catch (e) {}
    return defaultConsignmentNote;
  });

  const {
    savedInvoices, setSavedInvoices,
    consignmentNotes, setConsignmentNotes,
    customers, setCustomers,
    vehicles, setVehicles,
    tripSlips, setTripSlips,
    payments, setPayments,
    activeClient, setActiveClient,
    fetchInitialData, resetToDemo
  } = useStore();

  // Handler: select a client (from search, directory, or clients page)
  const handleSelectClient = (client: CustomerRecord) => {
    setActiveClient(client);
    setActiveView('client-dashboard');
    showToast(`Active client set: ${client.name}`);
  };

  // Handler: clear active client
  const handleClearClient = () => {
    setActiveClient(null);
    if (activeView === 'client-dashboard' || activeView === 'account') {
      setActiveView('dashboard');
    }
  };

  // Handler: view active client profile
  const handleViewClientProfile = () => {
    if (activeClient) {
      setEditingClientForModal(activeClient);
      setShowClientProfileModal(true);
    }
  };

  // Handler: record a payment from the payment modal
  const handleSavePayment = (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: createPaymentId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newPayment, ...payments];
    setPayments(updated);
    savePayment(newPayment);
    setShowPaymentModal(false);
    showToast(`Payment of ₹${newPayment.amount} recorded!`);
  };

  // UI modals & view states
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isSavedLRModalOpen, setIsSavedLRModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isTripSlipModalOpen, setIsTripSlipModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>(
    typeof window !== 'undefined' && window.innerWidth <= 1024 ? 'editor' : 'split'
  );
  const [zoom, setZoom] = useState<number>(0.92);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);


// Supabase Initial Fetch
  useEffect(() => {
    const initData = async () => {
      const { invs } = await fetchInitialData();
      if (invs.length > 0) {
          setCurrentInvoice(prev => {
            if (!invs.find(i => i.id === prev.id) && prev.id.startsWith('inv-')) {
                return { ...prev, billNo: calculateNextBillNumber(invs) };
            }
            return prev;
          });
      }
    };
    initData();
  }, [fetchInitialData]);










  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // --- INVOICE ACTIONS ---
  const handleSaveInvoice = () => {
    let updated = { ...currentInvoice, updatedAt: new Date().toISOString() };
    if (!updated.customerId) {
      if (activeClient && activeClient.name?.toLowerCase().trim() === updated.clientName?.toLowerCase().trim()) {
        updated.customerId = activeClient.id;
      } else {
        const found = customers.find(c => c.name?.toLowerCase().trim() === updated.clientName?.toLowerCase().trim());
        if (found) updated.customerId = found.id;
      }
    }
    recordBillSequenceNumber(updated.billNo);
    const existingIndex = savedInvoices.findIndex((inv) => inv.id === updated.id);

    if (existingIndex >= 0) {
      const copy = [...savedInvoices];
      copy[existingIndex] = updated;
      setSavedInvoices(copy);
      saveInvoice(updated);
      showToast(`Updated Bill #${updated.billNo} successfully!`);
    } else {
      setSavedInvoices([updated, ...savedInvoices]);
      saveInvoice(updated);
      showToast(`Saved Bill #${updated.billNo} to records!`);
    }
  };

  const handleSaveAndNextInvoice = () => {
    let updated = { ...currentInvoice, updatedAt: new Date().toISOString() };
    if (!updated.customerId) {
      if (activeClient && activeClient.name?.toLowerCase().trim() === updated.clientName?.toLowerCase().trim()) {
        updated.customerId = activeClient.id;
      } else {
        const found = customers.find(c => c.name?.toLowerCase().trim() === updated.clientName?.toLowerCase().trim());
        if (found) updated.customerId = found.id;
      }
    }
    recordBillSequenceNumber(updated.billNo);

    let updatedList = [...savedInvoices];
    const existingIndex = savedInvoices.findIndex((inv) => inv.id === updated.id);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = updated;
    } else {
      updatedList = [updated, ...savedInvoices];
    }
    setSavedInvoices(updatedList);
    saveInvoice(updated);

    const nextBillNo = calculateNextBillNumber(updatedList, updated);
    recordBillSequenceNumber(nextBillNo);

    const newInv = createNewInvoice(nextBillNo);
    newInv.company = { ...currentInvoice.company };
    newInv.bank = { ...currentInvoice.bank };
    if (activeClient) {
      newInv.customerId = activeClient.id;
      newInv.clientName = activeClient.name;
      newInv.clientAddress = activeClient.billingAddress || activeClient.address || '';
      newInv.clientPhone = activeClient.phone || '';
    }

    setCurrentInvoice(newInv);
    showToast(`Saved #${updated.billNo}! Created Next Bill #${nextBillNo}`);
  };

  const handleNewInvoice = () => {
    const newBillNo = calculateNextBillNumber(savedInvoices, currentInvoice);
    recordBillSequenceNumber(newBillNo);

    const newInv = createNewInvoice(newBillNo);
    try {
      const savedComp = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
      if (savedComp) newInv.company = JSON.parse(savedComp);

      const savedBank = localStorage.getItem(LOCAL_STORAGE_KEY_BANK);
      if (savedBank) newInv.bank = JSON.parse(savedBank);
    } catch (e) {}

    if (currentInvoice.refDocType) {
      newInv.refDocType = currentInvoice.refDocType;
    }

    if (activeClient) {
      newInv.customerId = activeClient.id;
      newInv.clientName = activeClient.name;
      newInv.clientAddress = activeClient.billingAddress || activeClient.address || '';
      newInv.clientPhone = activeClient.phone || '';
    }

    setCurrentInvoice(newInv);
    showToast(`Created new Bill #${newBillNo}${activeClient ? ` for ${activeClient.name}` : ''}`);
  };

  // --- CONSIGNMENT NOTE (e-LR) ACTIONS ---
  const handleSaveLR = () => {
    let updated = { ...currentConsignmentNote, updatedAt: new Date().toISOString() };
    if (!updated.customerId) {
      if (activeClient && (activeClient.name?.toLowerCase().trim() === updated.consignorName?.toLowerCase().trim() || activeClient.name?.toLowerCase().trim() === updated.consigneeName?.toLowerCase().trim())) {
        updated.customerId = activeClient.id;
      } else {
        const found = customers.find(c => c.name?.toLowerCase().trim() === updated.consignorName?.toLowerCase().trim() || c.name?.toLowerCase().trim() === updated.consigneeName?.toLowerCase().trim());
        if (found) updated.customerId = found.id;
      }
    }
    const existingIndex = consignmentNotes.findIndex((n) => n.id === updated.id);

    if (existingIndex >= 0) {
      const copy = [...consignmentNotes];
      copy[existingIndex] = updated;
      setConsignmentNotes(copy);
      saveConsignmentNote(updated);
      showToast(`Updated e-LR #${updated.lrNo} successfully!`);
    } else {
      setConsignmentNotes([updated, ...consignmentNotes]);
      saveConsignmentNote(updated);
      showToast(`Saved e-LR #${updated.lrNo} to records!`);
    }
  };

  const handleNewLR = () => {
    const fresh = createNewConsignmentNote();
    try {
      const savedComp = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
      if (savedComp) fresh.company = JSON.parse(savedComp);
    } catch (e) {}

    if (activeClient) {
      fresh.customerId = activeClient.id;
      fresh.consignorName = activeClient.name;
      fresh.consignorAddress = activeClient.address || '';
      fresh.consignorGst = activeClient.gstin || '';
    }

    setCurrentConsignmentNote(fresh);
    showToast(`Created new e-LR #${fresh.lrNo}${activeClient ? ` for ${activeClient.name}` : ''}`);
  };

  const handleDuplicateLR = (note: ConsignmentNote) => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const duplicated: ConsignmentNote = {
      ...note,
      id: 'lr-' + Date.now(),
      lrNo: `0${randomDigits}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConsignmentNotes([duplicated, ...consignmentNotes]);
    saveConsignmentNote(duplicated);
    setCurrentConsignmentNote(duplicated);
    showToast(`Duplicated into e-LR #${duplicated.lrNo}`);
  };

  const handleDeleteLR = (id: string) => {
    if (window.confirm('Are you sure you want to delete this e-LR note?')) {
      const filtered = consignmentNotes.filter((n) => n.id !== id);
      setConsignmentNotes(filtered);
      deleteConsignmentNote(id);
      if (currentConsignmentNote.id === id) {
        setCurrentConsignmentNote(filtered.length > 0 ? filtered[0] : createNewConsignmentNote());
      }
      showToast('Deleted e-LR note');
    }
  };

  const handleConvertLRToInvoice = (lr: ConsignmentNote) => {
    const newBillNo = calculateNextBillNumber(savedInvoices, currentInvoice);
    const newInv = createNewInvoice(newBillNo);

    newInv.clientName = lr.consigneeName || lr.consignorName || 'CLIENT TRANSPORT';
    newInv.beNo = lr.lrNo;
    newInv.beDate = lr.date;
    newInv.refDocType = 'LR NO';

    const routeParticular =
      lr.fromLocation && lr.toLocation
        ? `${lr.fromLocation} TO ${lr.toLocation}`
        : lr.description || 'FREIGHT CHARGES';
    const containerStr = lr.containerNo
      ? lr.packagesCount
        ? `${lr.containerNo} ${lr.packagesCount}`
        : lr.containerNo
      : lr.packagesCount || '';

    newInv.items = [
      {
        id: 'row-' + Date.now(),
        sn: '1',
        date: lr.date || '',
        vehicleNo: lr.vehicleNo || '',
        containerNo: containerStr,
        particulars: routeParticular.toUpperCase(),
        weight: lr.senderWeight || 'FIXED',
        advance: '',
        amount: lr.totalFreightAmount || lr.freightAmount || '',
      },
    ];

    setCurrentInvoice(newInv);
    setActiveView('invoice');
    showToast(`Created Bill #${newBillNo} from LR #${lr.lrNo}`);
  };

  const handleConvertMultipleLRsToInvoice = (selectedNotes: ConsignmentNote[]) => {
    if (selectedNotes.length === 0) return;
    const nextBillNo = calculateNextBillNumber(savedInvoices);
    const primaryParty =
      selectedNotes[0]?.consigneeName || selectedNotes[0]?.consignorName || 'CONSOLIDATED CLIENT';

    const items = selectedNotes.map((n, idx) => {
      const containerStr = n.containerNo
        ? `${n.containerNo}\n${n.packagesCount || ''}`.trim()
        : n.packagesCount || '';
      const routeText =
        n.fromLocation && n.toLocation
          ? `${n.fromLocation} TO ${n.toLocation}`
          : n.description || 'FREIGHT CHARGES';

      return {
        id: `batch-item-${Date.now()}-${idx}`,
        sn: String(idx + 1),
        date: n.date || currentInvoice.date,
        vehicleNo: n.vehicleNo || '',
        containerNo: containerStr,
        particulars: `LR: ${n.lrNo || '-'} • ${routeText}`.toUpperCase(),
        weight: n.senderWeight || 'FIXED',
        advance: '',
        amount: n.totalFreightAmount || n.freightAmount || ('' as any),
      };
    });

    const lrNumbers = selectedNotes
      .map((n) => n.lrNo)
      .filter(Boolean)
      .join(', ');

    const newInv: InvoiceData = {
      ...createNewInvoice(nextBillNo, currentInvoice.company, currentInvoice.bank),
      clientName: primaryParty,
      beNo: lrNumbers,
      beDate: selectedNotes[0]?.date || new Date().toISOString().slice(0, 10),
      refDocType: 'LR NOS',
      items,
      advanceDeduction: 0,
    };

    setCurrentInvoice(newInv);
    setActiveView('invoice');
    showToast(`Created Consolidated Bill with ${selectedNotes.length} LRs!`);
  };

  const handleRestoreFullBackup = (backup: FullSystemBackup, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      if (backup.invoices && backup.invoices.length > 0) {
        setSavedInvoices(backup.invoices);
        setCurrentInvoice(backup.invoices[0]);
      }
      if (backup.consignmentNotes && backup.consignmentNotes.length > 0) {
        setConsignmentNotes(backup.consignmentNotes);
        setCurrentConsignmentNote(backup.consignmentNotes[0]);
      }
      if (backup.customers) setCustomers(backup.customers);
      if (backup.vehicles) setVehicles(backup.vehicles);
      if (backup.tripSlips) setTripSlips(backup.tripSlips);
      if (backup.companyProfile) {
        handleSaveAsDefaultProfile(backup.companyProfile);
      }
    } else {
      // Merge unique by ID
      const existingInvIds = new Set(savedInvoices.map((i) => i.id));
      const newInvoices = backup.invoices.filter((i) => !existingInvIds.has(i.id));
      setSavedInvoices([...newInvoices, ...savedInvoices]);

      const existingLRIds = new Set(consignmentNotes.map((l) => l.id));
      const newLRs = backup.consignmentNotes.filter((l) => !existingLRIds.has(l.id));
      setConsignmentNotes([...newLRs, ...consignmentNotes]);

      const existingCustIds = new Set(customers.map((c) => c.id));
      const newCusts = backup.customers.filter((c) => !existingCustIds.has(c.id));
      setCustomers([...newCusts, ...customers]);

      const existingVehIds = new Set(vehicles.map((v) => v.id));
      const newVehs = backup.vehicles.filter((v) => !existingVehIds.has(v.id));
      setVehicles([...newVehs, ...vehicles]);

      const existingSlipIds = new Set(tripSlips.map((s) => s.id));
      const newSlips = backup.tripSlips.filter((s) => !existingSlipIds.has(s.id));
      setTripSlips([...newSlips, ...tripSlips]);
    }
    showToast('Restored backup data successfully!');
  };

  const handleResetToDemo = () => {
    if (window.confirm('Are you sure you want to completely reset? This cannot be undone.')) {
      resetToDemo();
      setCurrentInvoice(defaultInvoice);
      setCurrentConsignmentNote(defaultConsignmentNote);
      showToast('Reset to default demo data!');
    }
  };

  // --- UNIFIED EXPORT & PRINT ACTIONS ---
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      showToast(`Generating high-res ${activeDocType === 'lr' ? 'e-LR' : 'Bill'} PDF...`);
      if (activeDocType === 'lr') {
        await downloadConsignmentNotePDF(currentConsignmentNote);
        showToast('e-LR PDF downloaded successfully!');
      } else {
        await downloadInvoicePDF(currentInvoice);
        showToast('Invoice PDF downloaded successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF. You can also use the Print button to Save as PDF.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadAllLRCopiesPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      showToast('Generating 3-in-1 (Consignor + Consignee + Driver) PDF...');
      await downloadAllLRCopiesPDF(currentConsignmentNote);
      showToast('3-in-1 LR PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Could not generate 3-in-1 PDF.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (activeDocType === 'lr') {
      openConsignmentWhatsAppShare(currentConsignmentNote);
    } else {
      openWhatsAppShare(currentInvoice);
    }
  };

  const handleSelectInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    showToast(`Loaded Bill #${inv.billNo}`);
  };

  const handleDuplicateInvoice = (inv: InvoiceData) => {
    const newBillNo = calculateNextBillNumber(savedInvoices, inv);
    recordBillSequenceNumber(newBillNo);

    const duplicated: InvoiceData = {
      ...inv,
      id: 'inv-' + Date.now(),
      billNo: newBillNo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedInvoices([duplicated, ...savedInvoices]);
    saveInvoice(duplicated);
    setCurrentInvoice(duplicated);
    showToast(`Duplicated to new Bill #${newBillNo}`);
  };

  const handleDeleteInvoice = (id: string) => {
    const filtered = savedInvoices.filter((inv) => inv.id !== id);
    setSavedInvoices(filtered);
      deleteInvoice(id);
    if (currentInvoice.id === id) {
      setCurrentInvoice(filtered.length > 0 ? filtered[0] : createNewInvoice());
    }
    showToast('Deleted invoice from records');
  };

  const handleUpdateInvoicePayment = (
    id: string,
    status: 'PAID' | 'UNPAID' | 'PARTIAL',
    amountReceived?: number,
    paymentDate?: string,
    paymentMode?: string,
    paymentNotes?: string
  ) => {
    const updates: Partial<InvoiceData> = {
      paymentStatus: status,
      amountReceived,
      paymentDate,
      paymentMode,
      paymentNotes,
    };
    const updatedList = savedInvoices.map((inv) => {
      if (inv.id === id) {
        return { ...inv, ...updates, updatedAt: new Date().toISOString() };
      }
      return inv;
    });
    setSavedInvoices(updatedList);
    const updatedInvoice = updatedList.find(i => i.id === id);
    if (updatedInvoice) saveInvoice(updatedInvoice);
    if (currentInvoice.id === id) {
      setCurrentInvoice({ ...currentInvoice, ...updates, updatedAt: new Date().toISOString() });
    }
    showToast('Updated payment status!');
  };

  const handleSaveAsDefaultProfile = (comp: any) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_COMPANY, JSON.stringify(comp));
      showToast('Saved company profile as default template!');
    } catch (e) {}
  };

  const handleLoadOriginalSample = () => {
    if (window.confirm('Reset current template to Swami Krupa Roadlines demo sample?')) {
      if (activeDocType === 'lr') {
        setCurrentConsignmentNote(defaultConsignmentNote);
      } else {
        setCurrentInvoice(defaultInvoice);
      }
      showToast('Loaded demo sample!');
    }
  };

  // Directory handlers
  const handleAddCustomer = (c: Omit<CustomerRecord, 'id'>) => {
    const newCust: CustomerRecord = { ...c, id: 'cust-' + Date.now() };
    setCustomers([...customers, newCust]);
    saveCustomer(newCust);
    showToast(`Added ${c.name} to directory!`);
  };

  const handleUpdateCustomer = (c: CustomerRecord) => {
    setCustomers(customers.map((cust) => (cust.id === c.id ? c : cust)));
    saveCustomer(c);
    showToast(`Updated ${c.name}`);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter((cust) => cust.id !== id));
    deleteCustomer(id);
    showToast('Removed customer from directory');
  };

  const handleAddVehicle = (v: Omit<VehicleRecord, 'id'>) => {
    const newVeh: VehicleRecord = { ...v, id: 'veh-' + Date.now() };
    setVehicles([...vehicles, newVeh]);
    saveVehicle(newVeh);
    showToast(`Added vehicle ${v.vehicleNo} to fleet!`);
  };

  const handleUpdateVehicle = (v: VehicleRecord) => {
    setVehicles(vehicles.map((veh) => (veh.id === v.id ? v : veh)));
    saveVehicle(v);
    showToast(`Updated ${v.vehicleNo}`);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter((veh) => veh.id !== id));
    deleteVehicle(id);
    showToast('Removed vehicle from fleet');
  };

  const handleQuickSaveCustomer = (name: string, phone?: string) => {
    if (!name.trim()) return;
    const exists = customers.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (!exists) {
      handleAddCustomer({ name: name.trim(), phone: phone?.trim() });
    }
  };

  const handleQuickSaveVehicle = (vehicleNo: string) => {
    if (!vehicleNo.trim()) return;
    const cleanNo = vehicleNo.trim().toUpperCase();
    const exists = vehicles.some((v) => v.vehicleNo.toUpperCase() === cleanNo);
    if (!exists) {
      handleAddVehicle({ vehicleNo: cleanNo, type: 'Transport Fleet' });
    }
  };

  const handleSelectCustomerFromDir = (cust: CustomerRecord) => {
    if (activeDocType === 'lr') {
      setCurrentConsignmentNote((prev) => ({
        ...prev,
        consigneeName: cust.name,
        consigneeGst: cust.gstin || prev.consigneeGst,
        consigneeAddress: cust.address || prev.consigneeAddress,
      }));
    } else {
      setCurrentInvoice((prev) => ({
        ...prev,
        clientName: cust.name,
        clientPhone: cust.phone || '',
        clientAddress: cust.address || '',
      }));
    }
    setIsDirectoryModalOpen(false);
    showToast(`Applied ${cust.name}`);
  };

  // Trip slips handlers
  const handleSaveTripSlip = (slip: TripSlip) => {
    const existingIndex = tripSlips.findIndex((s) => s.id === slip.id);
    if (existingIndex >= 0) {
      const copy = [...tripSlips];
      copy[existingIndex] = slip;
      setTripSlips(copy);
      saveTripSlip(slip);
      showToast(`Updated Trip Slip #${slip.slipNo}`);
    } else {
      setTripSlips([slip, ...tripSlips]);
      saveTripSlip(slip);
      showToast(`Saved Trip Slip #${slip.slipNo}`);
    }
  };

  const handleDeleteTripSlip = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trip slip?')) {
      setTripSlips(tripSlips.filter((s) => s.id !== id));
      deleteTripSlip(id);
      showToast('Deleted trip slip');
    }
  };

  // Direct canvas edits
  const handleDirectInvoiceFieldUpdate = (field: string, val: any) => {
    const copy = { ...currentInvoice };
    if (field.startsWith('company.')) {
      const sub = field.replace('company.', '');
      copy.company = { ...copy.company, [sub]: val };
    } else if (field.startsWith('bank.')) {
      const sub = field.replace('bank.', '');
      copy.bank = { ...copy.bank, [sub]: val };
    } else {
      (copy as any)[field] = val;
    }
    setCurrentInvoice(copy);
  };

  const handleDirectLRFieldUpdate = (field: string, val: any) => {
    const copy = { ...currentConsignmentNote };
    if (field.startsWith('company.')) {
      const sub = field.replace('company.', '');
      copy.company = { ...copy.company, [sub]: val };
    } else {
      (copy as any)[field] = val;
    }
    setCurrentConsignmentNote(copy);
  };

  return (
    <div className="app-viewport app-viewport-sidebar">

      {/* Left Sidebar Navigation */}
      <SidebarNav
        activeView={activeView}
        onNavigate={(view) => {
          // If navigating to account, ensure a client is selected
          if (view === 'account' && !activeClient) {
            showToast('Please select a client first!');
            setActiveView('clients');
            return;
          }
          setActiveView(view);
          // Sync legacy activeDocType for editor
          if (view === 'invoice') {
            // handled via activeDocType derivation
          }
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onClearClient={handleClearClient}
      />

      {/* Right: Header + Content */}
      <div className="app-right-panel">
        {/* Top Application Header */}
        <HeaderBar
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
          onNewInvoice={activeDocType === 'lr' ? handleNewLR : handleNewInvoice}
          onSaveInvoice={activeDocType === 'lr' ? handleSaveLR : handleSaveInvoice}
          onSaveAndNextInvoice={activeView === 'invoice' ? handleSaveAndNextInvoice : undefined}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onDownloadAllLRCopiesPDF={handleDownloadAllLRCopiesPDF}
          onWhatsAppShare={handleWhatsAppShare}
          onOpenSavedModal={() => {
            if (activeView === 'lr') {
              setIsSavedLRModalOpen(true);
            } else {
              setIsSavedModalOpen(true);
            }
          }}
          onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
          onOpenTripSlipModal={() => setIsTripSlipModalOpen(true)}
          onOpenLedgerModal={() => setIsLedgerModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          savedCount={savedInvoices.length}
          savedLRCount={consignmentNotes.length}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(1.4, z + 0.08))}
          onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.08))}
          onZoomReset={() => setZoom(0.92)}
          onLoadOriginalSample={handleLoadOriginalSample}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isDownloadingPDF={isDownloadingPDF}
          onSelectClient={handleSelectClient}
          onClearClient={handleClearClient}
          onViewClientProfile={handleViewClientProfile}
        />

        {/* Main Content Area */}
        <main className="app-main-workspace">

          {/* DASHBOARD */}
          {activeView === 'dashboard' && (
            <Dashboard onSelectClient={handleSelectClient} onNavigate={setActiveView} />
          )}

          {/* CLIENTS LIST */}
          {activeView === 'clients' && (
            <ClientsListPage
              onSelectClient={handleSelectClient}
              onNavigate={setActiveView}
            />
          )}

          {/* CLIENT DASHBOARD */}
          {activeView === 'client-dashboard' && activeClient && (
            <ClientDashboard
              client={activeClient}
              onNavigate={setActiveView}
              onCreateInvoice={() => {
                // Pre-fill invoice with active client
                handleNewInvoice();
                setCurrentInvoice((prev) => ({
                  ...prev,
                  clientName: activeClient.name,
                  clientPhone: activeClient.phone || '',
                  clientAddress: activeClient.billingAddress || activeClient.address || '',
                  customerId: activeClient.id,
                }));
                setActiveView('invoice');
              }}
              onCreateLR={() => {
                handleNewLR();
                setCurrentConsignmentNote((prev) => ({
                  ...prev,
                  customerId: activeClient.id,
                }));
                setActiveView('lr');
              }}
              onRecordPayment={() => setShowPaymentModal(true)}
              onEditClient={handleViewClientProfile}
            />
          )}

          {/* ACCOUNT / LEDGER (client-scoped) */}
          {activeView === 'account' && activeClient && (
            <AccountPage
              client={activeClient}
              onNavigate={setActiveView}
              onCreateInvoice={() => {
                handleNewInvoice();
                setCurrentInvoice((prev) => ({
                  ...prev,
                  clientName: activeClient.name,
                  clientPhone: activeClient.phone || '',
                  clientAddress: activeClient.billingAddress || activeClient.address || '',
                  customerId: activeClient.id,
                }));
                setActiveView('invoice');
              }}
            />
          )}

          {/* INVOICE EDITOR */}
          {activeView === 'invoice' && (
            <>
              {viewMode !== 'preview' && (
                <aside className="editor-sidebar-container no-print">
                  <InvoiceEditor
                    invoice={currentInvoice}
                    onChange={setCurrentInvoice}
                    onSaveAsDefaultProfile={() => handleSaveAsDefaultProfile(currentInvoice.company)}
                    customers={customers}
                    vehicles={vehicles}
                    savedInvoices={savedInvoices}
                    onSaveAndNext={handleSaveAndNextInvoice}
                    onQuickSaveCustomer={handleQuickSaveCustomer}
                    onQuickSaveVehicle={handleQuickSaveVehicle}
                    onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
                  />
                </aside>
              )}
              {viewMode !== 'editor' && (
                <section className="preview-pane-container">
                  <div
                    className="preview-scaler"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                  >
                    {currentInvoice.template === 'modern' ? (
                      <ModernInvoiceDocument
                        invoice={currentInvoice}
                        isEditableInline={true}
                        onUpdateField={handleDirectInvoiceFieldUpdate}
                      />
                    ) : (
                      <InvoiceDocument
                        invoice={currentInvoice}
                        isEditableInline={true}
                        onUpdateField={handleDirectInvoiceFieldUpdate}
                      />
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {/* INVOICE LIST (global or client-filtered) */}
          {activeView === 'invoice-list' && (
            <div className="page-container">
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeClient ? `Invoices — ${activeClient.name}` : 'All Invoices'}
                  </h1>
                </div>
                <button className="btn-primary" onClick={() => {
                  handleNewInvoice();
                  setActiveView('invoice');
                }}>
                  + New Invoice
                </button>
              </div>
              <button className="btn-ghost" onClick={() => setIsSavedModalOpen(true)}>Open Invoices Manager</button>
            </div>
          )}

          {/* e-LR EDITOR */}
          {activeView === 'lr' && (
            <>
              {viewMode !== 'preview' && (
                <aside className="editor-sidebar-container no-print">
                  <ConsignmentNoteEditor
                    note={currentConsignmentNote}
                    onChange={setCurrentConsignmentNote}
                    customers={customers}
                    vehicles={vehicles}
                    onSaveAsDefaultProfile={handleSaveAsDefaultProfile}
                    onConvertToInvoice={handleConvertLRToInvoice}
                    onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
                  />
                </aside>
              )}
              {viewMode !== 'editor' && (
                <section className="preview-pane-container">
                  <div
                    className="preview-scaler"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                  >
                    <ConsignmentNoteDocument
                      note={currentConsignmentNote}
                      isEditableInline={true}
                      onUpdateField={handleDirectLRFieldUpdate}
                    />
                  </div>
                </section>
              )}
            </>
          )}

          {/* e-LR LIST */}
          {activeView === 'lr-list' && (
            <div className="page-container">
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeClient ? `e-LR Records — ${activeClient.name}` : 'All e-LR Records'}
                  </h1>
                </div>
                <button className="btn-primary" onClick={() => {
                  handleNewLR();
                  setActiveView('lr');
                }}>
                  + New e-LR
                </button>
              </div>
              <button className="btn-ghost" onClick={() => setIsSavedLRModalOpen(true)}>Open LR Manager</button>
            </div>
          )}

          {/* TRIPS */}
          {activeView === 'trips' && (
            <div className="page-container">
              <div className="page-header">
                <h1 className="page-title">Trip Slips</h1>
              </div>
              <button className="btn-primary" onClick={() => setIsTripSlipModalOpen(true)}>Open Trip Slips</button>
            </div>
          )}

          {/* VEHICLES */}
          {activeView === 'vehicles' && (
            <div className="page-container">
              <div className="page-header">
                <h1 className="page-title">Vehicle Directory</h1>
              </div>
              <button className="btn-primary" onClick={() => setIsDirectoryModalOpen(true)}>Open Directory</button>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeView === 'documents' && (
            <DocumentsPage client={activeClient} />
          )}

          {/* REPORTS */}
          {activeView === 'reports' && (
            <ReportsPage onSelectClient={handleSelectClient} onNavigate={setActiveView} />
          )}

          {/* SETTINGS */}
          {activeView === 'settings' && (
            <div className="page-container">
              <div className="page-header">
                <h1 className="page-title">Settings</h1>
              </div>
              <button className="btn-ghost" onClick={() => setIsBackupModalOpen(true)}>Backup & Restore</button>
            </div>
          )}

          {/* EXPENSES */}
          {activeView === 'expenses' && (
            <div className="page-container">
              <div className="page-header">
                <h1 className="page-title">Expenses</h1>
                <p className="page-subtitle">Coming soon — track driver advances, fuel, and toll charges</p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-badge">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Client Profile Modal (edit from header bar) */}
      {showClientProfileModal && editingClientForModal && (
        <ClientProfileModal
          client={editingClientForModal}
          onSave={(updated) => {
            const existing = customers.find((c) => c.id === updated.id);
            const newList = existing
              ? customers.map((c) => (c.id === updated.id ? updated : c))
              : [updated, ...customers];
            setCustomers(newList);
            saveCustomerSvc(updated);
            // If this was the active client, refresh it
            if (activeClient?.id === updated.id) {
              setActiveClient(updated);
            }
            setShowClientProfileModal(false);
            showToast('Client updated!');
          }}
          onClose={() => setShowClientProfileModal(false)}
        />
      )}

      {/* Payment Modal (from header active client bar) */}
      {showPaymentModal && activeClient && (
        <PaymentModal
          client={activeClient}
          onSave={handleSavePayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Saved Invoices Modal */}
      <SavedInvoicesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedInvoices={savedInvoices}
        onSelectInvoice={(inv) => {
          handleSelectInvoice(inv);
          setActiveView('invoice');
        }}
        onDuplicateInvoice={handleDuplicateInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        onExportAll={() => {
          const dataStr =
            'data:text/json;charset=utf-8,' +
            encodeURIComponent(JSON.stringify(savedInvoices, null, 2));
          const anchor = document.createElement('a');
          anchor.href = dataStr;
          anchor.download = `roadlines_invoices_backup_${new Date().toISOString().slice(0, 10)}.json`;
          anchor.click();
          anchor.remove();
        }}
        onImportBackup={(imported) => setSavedInvoices([...imported, ...savedInvoices])}
        onUpdateInvoicePayment={handleUpdateInvoicePayment}
      />

      {/* Saved Consignment Notes (e-LR) Modal */}
      <SavedConsignmentNotesModal
        isOpen={isSavedLRModalOpen}
        onClose={() => setIsSavedLRModalOpen(false)}
        savedNotes={consignmentNotes}
        onSelectNote={(n) => {
          setCurrentConsignmentNote(n);
          setActiveView('lr');
          showToast(`Loaded e-LR #${n.lrNo}`);
        }}
        onDuplicateNote={handleDuplicateLR}
        onDeleteNote={handleDeleteLR}
        onConvertToInvoice={handleConvertLRToInvoice}
        onConvertMultipleLRsToInvoice={handleConvertMultipleLRsToInvoice}
        onNewNote={handleNewLR}
      />

      {/* Directory Modal */}
      <DirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        customers={customers}
        vehicles={vehicles}
        onAddCustomer={handleAddCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAddVehicle={handleAddVehicle}
        onUpdateVehicle={handleUpdateVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        onSelectCustomer={(cust) => {
          handleSelectCustomerFromDir(cust);
          // Also set as active client
          setActiveClient(cust);
        }}
      />

      {/* Trip Slip Modal */}
      <TripSlipModal
        isOpen={isTripSlipModalOpen}
        onClose={() => setIsTripSlipModalOpen(false)}
        tripSlips={tripSlips}
        onSaveTripSlip={handleSaveTripSlip}
        onDeleteTripSlip={handleDeleteTripSlip}
        vehicles={vehicles}
        company={currentInvoice.company}
      />

      {/* Party Ledger & Khata Modal */}
      <PartyLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        invoices={savedInvoices}
        customers={customers}
        onUpdatePayment={handleUpdateInvoicePayment}
        onSelectInvoice={(inv) => {
          handleSelectInvoice(inv);
          setActiveView('invoice');
        }}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        data={{
          invoices: savedInvoices,
          consignmentNotes: consignmentNotes,
          customers: customers,
          vehicles: vehicles,
          tripSlips: tripSlips,
          companyProfile: currentInvoice.company,
        }}
        onRestoreBackup={handleRestoreFullBackup}
        onResetToDemo={handleResetToDemo}
      />
    </div>
  );
};

export default App;
