import type {
  InvoiceData,
  ConsignmentNote,
  CustomerRecord,
  VehicleRecord,
  TripSlip,
  CompanyProfile,
} from '../types/invoice';

export interface FullSystemBackup {
  version: string;
  exportDate: string;
  appName: string;
  invoices: InvoiceData[];
  consignmentNotes: ConsignmentNote[];
  customers: CustomerRecord[];
  vehicles: VehicleRecord[];
  tripSlips: TripSlip[];
  companyProfile?: CompanyProfile;
}

/**
 * Downloads a complete JSON backup of all application data
 */
export function exportFullSystemBackup(data: {
  invoices: InvoiceData[];
  consignmentNotes: ConsignmentNote[];
  customers: CustomerRecord[];
  vehicles: VehicleRecord[];
  tripSlips: TripSlip[];
  companyProfile?: CompanyProfile;
}) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const backup: FullSystemBackup = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: 'Swami Krupa Roadlines Billing Studio',
    invoices: data.invoices,
    consignmentNotes: data.consignmentNotes,
    customers: data.customers,
    vehicles: data.vehicles,
    tripSlips: data.tripSlips,
    companyProfile: data.companyProfile,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SwamiKrupa_FullBackup_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses an uploaded JSON backup file
 */
export async function parseBackupFile(file: File): Promise<FullSystemBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.invoices && !parsed.consignmentNotes && !parsed.customers) {
          throw new Error('Invalid backup file: Missing core transport records');
        }
        resolve({
          version: parsed.version || '1.0.0',
          exportDate: parsed.exportDate || new Date().toISOString(),
          appName: parsed.appName || 'Swami Krupa Roadlines Billing Studio',
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
          consignmentNotes: Array.isArray(parsed.consignmentNotes) ? parsed.consignmentNotes : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
          tripSlips: Array.isArray(parsed.tripSlips) ? parsed.tripSlips : [],
          companyProfile: parsed.companyProfile,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
