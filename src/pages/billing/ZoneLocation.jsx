import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const initialMockZones = [
  { id: 'ZONE-001', name: 'Heliwaa', code: 'HLW', tariffRate: 1.50, description: 'North-East sector zone, residential tariff rate', status: 'Active', startRef: 2001, endRef: 3000 },
  { id: 'ZONE-002', name: 'Hodan', code: 'HDN', tariffRate: 1.75, description: 'Central business and residential zone, standard rate', status: 'Active', startRef: 1000, endRef: 2000 },
  { id: 'ZONE-003', name: 'Kaxda', code: 'KXD', tariffRate: 1.25, description: 'South-West outskirts zone, low-income residential rate', status: 'Active', startRef: 3001, endRef: 4000 },
  { id: 'ZONE-004', name: 'Wadajir', code: 'WDJ', tariffRate: 1.60, description: 'Airport area and residential zone, commercial rate', status: 'Active', startRef: 4001, endRef: 5000 }
];

export default function ZoneLocation() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tariffRate, setTariffRate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [startRef, setStartRef] = useState('');
  const [endRef, setEndRef] = useState('');
  const [editZoneId, setEditZoneId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!db) {
      setZones(initialMockZones);
      setShowWarning(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          code: data.code,
          tariffRate: Number(data.tariffRate) || 0,
          description: data.description || '',
          status: data.status || 'Active',
          startRef: data.startRef ? Number(data.startRef) : null,
          endRef: data.endRef ? Number(data.endRef) : null
        };
      });
      setZones(list);
      setShowWarning(false);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore access denied for zones:", error);
      setZones(initialMockZones);
      setShowWarning(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditZoneId(null);
    setName('');
    setCode('');
    setTariffRate('');
    setDescription('');
    setStatus('Active');
    setStartRef('');
    setEndRef('');
    setErrors({});
  };

  const handleEditClick = (zone) => {
    setEditZoneId(zone.id);
    setName(zone.name);
    setCode(zone.code);
    setTariffRate(String(zone.tariffRate));
    setDescription(zone.description);
    setStatus(zone.status);
    setStartRef(zone.startRef ? String(zone.startRef) : '');
    setEndRef(zone.endRef ? String(zone.endRef) : '');
    setIsModalOpen(true);
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    setErrors({});

    const errs = {};
    if (!name.trim()) errs.name = 'Zone name is required';
    if (!code.trim()) errs.code = 'Zone code is required';
    if (!tariffRate.trim() || isNaN(Number(tariffRate))) {
      errs.tariffRate = 'Please enter a valid tariff rate';
    }

    // Reference range validation
    if (!startRef.trim() || isNaN(Number(startRef)) || Number(startRef) <= 0) {
      errs.startRef = 'Gali tixraac bilow sax ah (Start Ref)';
    }
    if (!endRef.trim() || isNaN(Number(endRef)) || Number(endRef) <= 0) {
      errs.endRef = 'Gali tixraac dhammaad sax ah (End Ref)';
    }
    if (startRef && endRef && Number(startRef) > Number(endRef)) {
      errs.endRef = 'Dhammaadka kama yarayn karo bilowga';
    }

    // Overlap checks
    if (!errs.startRef && !errs.endRef) {
      const start = Number(startRef);
      const end = Number(endRef);
      const hasOverlap = displayList.some(z => {
        if (editZoneId && z.id === editZoneId) return false;
        if (!z.startRef || !z.endRef) return false;
        return start <= Number(z.endRef) && Number(z.startRef) <= end;
      });
      if (hasOverlap) {
        errs.startRef = 'Range-kan wuxuu ka hor imanayaa zone kale (Overlaps with another zone)';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const newZone = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      tariffRate: Number(tariffRate),
      description: description.trim(),
      status,
      startRef: Number(startRef),
      endRef: Number(endRef),
      createdAt: serverTimestamp()
    };

    try {
      if (db && !showWarning) {
        if (editZoneId) {
          if (editZoneId.startsWith('local-zone-')) {
            setZones(prev => prev.map(z => z.id === editZoneId ? { ...z, ...newZone } : z));
          } else {
            await updateDoc(doc(db, 'zones', editZoneId), {
              name: newZone.name,
              code: newZone.code,
              tariffRate: newZone.tariffRate,
              description: newZone.description,
              status: newZone.status,
              startRef: newZone.startRef,
              endRef: newZone.endRef
            });
          }
        } else {
          await addDoc(collection(db, 'zones'), newZone);
        }
      } else {
        if (editZoneId) {
          setZones(prev => prev.map(z => z.id === editZoneId ? { ...z, ...newZone } : z));
        } else {
          const tempId = `local-zone-${Date.now()}`;
          setZones(prev => [{ id: tempId, ...newZone }, ...prev]);
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert("Error saving zone location.");
    }
  };

  const handleToggleStatus = async (zoneId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, status: newStatus } : z));
    if (db && !showWarning) {
      try {
        await updateDoc(doc(db, 'zones', zoneId), { status: newStatus });
      } catch (err) {
        console.error("Failed to update status in DB:", err);
      }
    }
  };

  const displayList = zones.length === 0 && loading ? [] : zones.length === 0 ? initialMockZones : zones;

  const filteredZones = displayList.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 tracking-tight">Zone Locations & Tariffs</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Configure system water distribution zones and specific pricing rate rules</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Zone
        </button>
      </div>

      {showWarning && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl flex flex-col sm:flex-row gap-3 items-start justify-between mb-6 animate-fade-in transition-all">
          <div className="flex gap-2.5 items-start">
            <svg className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-orange-850 dark:text-orange-300">Using Mock Offline Mode</h4>
              <p className="text-[11px] text-orange-700 dark:text-orange-450 leading-relaxed">
                Connect Firestore or verify security rules to synchronize zones in real-time. Showing offline mockup.
              </p>
            </div>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-[11.5px] font-bold text-orange-500 hover:text-orange-655 uppercase shrink-0 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="admin-card rounded-2xl overflow-hidden animate-fade-in-up">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-9 pr-4 py-2 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Zone Code</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Zone Name</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Tariff Rate ($/m³)</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Reference Range</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Description</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {loading && zones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500 dark:text-slate-450 font-medium">Loading data...</td>
                </tr>
              ) : filteredZones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500 dark:text-slate-450 font-medium">No zones found matching your search.</td>
                </tr>
              ) : (
                filteredZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs font-bold text-gray-700 dark:text-slate-300">{zone.code}</td>
                    <td className="py-4 px-4 font-semibold text-gray-800 dark:text-slate-200 text-[13px]">{zone.name}</td>
                    <td className="py-4 px-4 font-bold text-gray-800 dark:text-slate-200 text-[13px]">
                      ${zone.tariffRate.toFixed(2)}/m³
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-850 dark:text-slate-250 text-[13px]">
                      {zone.startRef && zone.endRef ? (
                        <span className="font-mono bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg">
                          {zone.startRef} - {zone.endRef}
                        </span>
                      ) : (
                        <span className="text-gray-450 dark:text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-500 dark:text-slate-400 text-[13px] max-w-xs truncate">{zone.description}</td>
                    <td className="py-4 px-4">
                      {zone.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleEditClick(zone)}
                        className="mr-2 px-2.5 py-1 border border-gray-300 text-gray-600 dark:border-slate-700 dark:text-slate-350 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(zone.id, zone.status)}
                        className={`px-2.5 py-1 border rounded-lg text-[11px] font-bold transition-all bg-white dark:bg-slate-900 shadow-xs cursor-pointer ${
                          zone.status === 'Active' 
                            ? 'border-gray-300 text-gray-600 hover:bg-gray-55 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800' 
                            : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
                        }`}
                      >
                        {zone.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-850 shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-5 border-b border-gray-105 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                {editZoneId ? 'Edit Zone Location' : 'Create Zone Location'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-650 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddZone} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Zone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hodan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${errors.name ? 'border-red-500' : ''} rounded-xl`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Zone Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HDN"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${errors.code ? 'border-red-500' : ''} rounded-xl`}
                  />
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Tariff ($/m³)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.75"
                    value={tariffRate}
                    onChange={(e) => setTariffRate(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${errors.tariffRate ? 'border-red-500' : ''} rounded-xl`}
                  />
                  {errors.tariffRate && <p className="text-xs text-red-500 mt-1">{errors.tariffRate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-550 dark:text-slate-400 uppercase mb-1.5">Reference Start</label>
                  <input
                    type="number"
                    placeholder="e.g. 1550"
                    value={startRef}
                    onChange={(e) => setStartRef(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${errors.startRef ? 'border-red-500' : ''} rounded-xl`}
                  />
                  {errors.startRef && <p className="text-xs text-red-500 mt-1">{errors.startRef}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-550 dark:text-slate-400 uppercase mb-1.5">Reference End</label>
                  <input
                    type="number"
                    placeholder="e.g. 1600"
                    value={endRef}
                    onChange={(e) => setEndRef(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${errors.endRef ? 'border-red-500' : ''} rounded-xl`}
                  />
                  {errors.endRef && <p className="text-xs text-red-500 mt-1">{errors.endRef}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Description</label>
                <textarea
                  placeholder="Zone details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-755 dark:text-slate-350 text-[13px] font-semibold rounded-xl hover:bg-gray-55 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
