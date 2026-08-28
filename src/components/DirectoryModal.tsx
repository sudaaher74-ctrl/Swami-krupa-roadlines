import React, { useState } from 'react';
import type { CustomerRecord, VehicleRecord } from '../types/invoice';
import { X, Search, Users, Truck, Plus, Trash2, Edit2, Check, Phone } from 'lucide-react';

interface DirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  vehicles: VehicleRecord[];
  onAddCustomer: (c: Omit<CustomerRecord, 'id'>) => void;
  onUpdateCustomer: (c: CustomerRecord) => void;
  onDeleteCustomer: (id: string) => void;
  onAddVehicle: (v: Omit<VehicleRecord, 'id'>) => void;
  onUpdateVehicle: (v: VehicleRecord) => void;
  onDeleteVehicle: (id: string) => void;
  onSelectCustomer?: (c: CustomerRecord) => void;
}

export const DirectoryModal: React.FC<DirectoryModalProps> = ({
  isOpen,
  onClose,
  customers,
  vehicles,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSelectCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'vehicles'>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for new / edit
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Customer form fields
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cGst, setCGst] = useState('');
  const [cAddress, setCAddress] = useState('');

  // Vehicle form fields
  const [vNo, setVNo] = useState('');
  const [vDriver, setVDriver] = useState('');
  const [vDriverPhone, setVDriverPhone] = useState('');
  const [vType, setVType] = useState('');

  if (!isOpen) return null;

  const resetForms = () => {
    setIsAdding(false);
    setEditingId(null);
    setCName('');
    setCPhone('');
    setCGst('');
    setCAddress('');
    setVNo('');
    setVDriver('');
    setVDriverPhone('');
    setVType('');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    if (editingId) {
      onUpdateCustomer({
        id: editingId,
        name: cName.trim().toUpperCase(),
        phone: cPhone.trim(),
        gstin: cGst.trim().toUpperCase(),
        address: cAddress.trim(),
      });
    } else {
      onAddCustomer({
        name: cName.trim().toUpperCase(),
        phone: cPhone.trim(),
        gstin: cGst.trim().toUpperCase(),
        address: cAddress.trim(),
      });
    }
    resetForms();
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNo.trim()) return;

    if (editingId) {
      onUpdateVehicle({
        id: editingId,
        vehicleNo: vNo.trim().toUpperCase(),
        driverName: vDriver.trim(),
        driverPhone: vDriverPhone.trim(),
        type: vType.trim(),
      });
    } else {
      onAddVehicle({
        vehicleNo: vNo.trim().toUpperCase(),
        driverName: vDriver.trim(),
        driverPhone: vDriverPhone.trim(),
        type: vType.trim(),
      });
    }
    resetForms();
  };

  const startEditCustomer = (c: CustomerRecord) => {
    setEditingId(c.id);
    setCName(c.name);
    setCPhone(c.phone || '');
    setCGst(c.gstin || '');
    setCAddress(c.address || '');
    setIsAdding(true);
  };

  const startEditVehicle = (v: VehicleRecord) => {
    setEditingId(v.id);
    setVNo(v.vehicleNo);
    setVDriver(v.driverName || '');
    setVDriverPhone(v.driverPhone || '');
    setVType(v.type || '');
    setIsAdding(true);
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.gstin && c.gstin.toLowerCase().includes(term))
    );
  });

  const filteredVehicles = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.vehicleNo.toLowerCase().includes(term) ||
      (v.driverName && v.driverName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Users size={20} className="text-primary" />
            <h2>Master Directory</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Directory Tabs */}
        <div className="directory-tabs">
          <button
            className={`directory-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('customers');
              resetForms();
            }}
          >
            <Users size={16} />
            <span>Customers / Parties ({customers.length})</span>
          </button>
          <button
            className={`directory-tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vehicles');
              resetForms();
            }}
          >
            <Truck size={16} />
            <span>Vehicles / Trucks ({vehicles.length})</span>
          </button>
        </div>

        {/* Search & Add bar */}
        <div className="modal-search-bar flex-between">
          <div style={{ position: 'relative', flex: 1, marginRight: '12px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'customers' ? 'party names, phones...' : 'vehicle numbers...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isAdding && (
            <button
              className="btn-primary-sm"
              onClick={() => {
                resetForms();
                setIsAdding(true);
              }}
            >
              <Plus size={15} /> Add {activeTab === 'customers' ? 'Party' : 'Vehicle'}
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="modal-list-body">
          {/* Add / Edit Form Panel */}
          {isAdding && (
            <div className="directory-form-card">
              <h4 className="form-card-title">
                {editingId ? `Edit ${activeTab === 'customers' ? 'Party' : 'Vehicle'}` : `Add New ${activeTab === 'customers' ? 'Party' : 'Vehicle'}`}
              </h4>

              {activeTab === 'customers' ? (
                <form onSubmit={handleSaveCustomer} className="form-section-grid">
                  <div className="input-group col-span-8">
                    <label>Party / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ADNISHA TRANSPORT"
                      value={cName}
                      onChange={(e) => setCName(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  </div>
                  <div className="input-group col-span-4">
                    <label>WhatsApp / Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                    />
                  </div>
                  <div className="input-group col-span-6">
                    <label>GSTIN No</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={cGst}
                      onChange={(e) => setCGst(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="input-group col-span-6">
                    <label>Address / Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. Nhava Sheva, Navi Mumbai"
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                    />
                  </div>
                  <div className="col-span-12" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button type="button" className="btn-secondary-sm" onClick={resetForms}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary-sm">
                      <Check size={14} /> Save Party
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveVehicle} className="form-section-grid">
                  <div className="input-group col-span-6">
                    <label>Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH46DL7778"
                      value={vNo}
                      onChange={(e) => setVNo(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  </div>
                  <div className="input-group col-span-6">
                    <label>Vehicle Type</label>
                    <input
                      type="text"
                      placeholder="e.g. 40ft Trailer / 20ft Truck"
                      value={vType}
                      onChange={(e) => setVType(e.target.value)}
                    />
                  </div>
                  <div className="input-group col-span-6">
                    <label>Driver / Transporter Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={vDriver}
                      onChange={(e) => setVDriver(e.target.value)}
                    />
                  </div>
                  <div className="input-group col-span-6">
                    <label>Driver Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={vDriverPhone}
                      onChange={(e) => setVDriverPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-span-12" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button type="button" className="btn-secondary-sm" onClick={resetForms}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary-sm">
                      <Check size={14} /> Save Vehicle
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Customers List View */}
          {activeTab === 'customers' && (
            <div className="directory-items-grid">
              {filteredCustomers.length === 0 ? (
                <div className="empty-state">
                  <Users size={36} className="empty-icon" />
                  <p className="empty-title">No party records found</p>
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div key={c.id} className="directory-card">
                    <div className="directory-card-header">
                      <h4 className="directory-name">{c.name}</h4>
                      <div className="card-actions">
                        <button className="btn-icon" title="Edit" onClick={() => startEditCustomer(c)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn-icon text-danger" title="Delete" onClick={() => onDeleteCustomer(c.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="directory-meta">
                      {c.phone && (
                        <div className="meta-line">
                          <Phone size={12} className="text-muted" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.gstin && <div className="meta-line"><strong>GSTIN:</strong> {c.gstin}</div>}
                      {c.address && <div className="meta-line"><strong>Loc:</strong> {c.address}</div>}
                    </div>

                    {onSelectCustomer && (
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          onSelectCustomer(c);
                          onClose();
                        }}
                      >
                        Use in Active Bill
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Vehicles List View */}
          {activeTab === 'vehicles' && (
            <div className="directory-items-grid">
              {filteredVehicles.length === 0 ? (
                <div className="empty-state">
                  <Truck size={36} className="empty-icon" />
                  <p className="empty-title">No vehicle records found</p>
                </div>
              ) : (
                filteredVehicles.map((v) => (
                  <div key={v.id} className="directory-card">
                    <div className="directory-card-header">
                      <h4 className="directory-name">{v.vehicleNo}</h4>
                      <div className="card-actions">
                        <button className="btn-icon" title="Edit" onClick={() => startEditVehicle(v)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn-icon text-danger" title="Delete" onClick={() => onDeleteVehicle(v.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="directory-meta">
                      {v.type && <div className="meta-line"><strong>Type:</strong> {v.type}</div>}
                      {v.driverName && <div className="meta-line"><strong>Driver:</strong> {v.driverName}</div>}
                      {v.driverPhone && <div className="meta-line"><strong>Phone:</strong> {v.driverPhone}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
