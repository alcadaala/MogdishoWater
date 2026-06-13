import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, getDocs, addDoc, onSnapshot,
  orderBy, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const RATE = 1.6;

const initialMockZones = [
  { id: 'ZONE-001', name: 'Heliwaa', code: 'HLW', tariffRate: 1.50, description: 'North-East sector zone, residential tariff rate', status: 'Active', startRef: 2001, endRef: 3000 },
  { id: 'ZONE-002', name: 'Hodan', code: 'HDN', tariffRate: 1.75, description: 'Central business and residential zone, standard rate', status: 'Active', startRef: 1000, endRef: 2000 },
  { id: 'ZONE-003', name: 'Kaxda', code: 'KXD', tariffRate: 1.25, description: 'South-West outskirts zone, low-income residential rate', status: 'Active', startRef: 3001, endRef: 4000 },
  { id: 'ZONE-004', name: 'Wadajir', code: 'WDJ', tariffRate: 1.60, description: 'Airport area and residential zone, commercial rate', status: 'Active', startRef: 4001, endRef: 5000 }
];

// Mock customers for offline fallback
const mockCustomers = [
  { id: 'C001', name: 'Axmed Cali Hassan', sqn: 'SQN-001', tel: '0615001001', zone: 'Hodan', address: 'Wadada Maka Al-Mukarama, Hodan' },
  { id: 'C002', name: 'Faadumo Nuur Warsame', sqn: 'SQN-002', tel: '0617002002', zone: 'Heliwaa', address: 'Xaafadda Heliwaa, Muqdisho' },
  { id: 'C003', name: 'Maxamed Cabdi Jaamac', sqn: 'SQN-003', tel: '0618003003', zone: 'Wadajir', address: 'Wadajir District, K4' },
  { id: 'C004', name: 'Ubax Yusuf Ciise', sqn: 'SQN-004', tel: '0619004004', zone: 'Kaxda', address: 'Kaxda, Muqdisho South' },
  { id: 'C005', name: 'Cabdilaahi Muuse', sqn: 'SQN-005', tel: '0610005005', zone: 'Hodan', address: 'Yaaqshiid, Wadada Afgooye' },
];

const mockReadings = {
  'C001': { prevReading: 1248, date: '2026-05-01' },
  'C002': { prevReading: 876, date: '2026-05-01' },
  'C003': { prevReading: 2105, date: '2026-05-01' },
  'C004': { prevReading: 543, date: '2026-05-01' },
  'C005': { prevReading: 1890, date: '2026-05-01' },
};

export default function BillInfo() {
  const [searchType, setSearchType] = useState('sqn');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prevReading, setPrevReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [readingError, setReadingError] = useState('');
  const [zones, setZones] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const searchInputRef = useRef(null);
  const ignoreSearchRef = useRef(false);

  const consumption = currentReading !== '' && prevReading !== ''
    ? Math.max(0, Number(currentReading) - Number(prevReading))
    : null;
  const totalAmount = consumption !== null ? (consumption * RATE).toFixed(2) : null;

  // Fetch zones for reference validation
  useEffect(() => {
    if (!db) {
      setZones(initialMockZones);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          startRef: data.startRef ? Number(data.startRef) : null,
          endRef: data.endRef ? Number(data.endRef) : null,
          status: data.status || 'Active'
        };
      });
      setZones(list);
    }, (error) => {
      console.warn("Firestore fetch zones failed for BillInfo, using mock zones:", error);
      setZones(initialMockZones);
    });
    return () => unsubscribe();
  }, []);

  // Fetch recent bills for found customer
  useEffect(() => {
    if (!customer) {
      setRecentBills([]);
      return;
    }
    setLoadingBills(true);
    if (!db) {
      // mock
      setRecentBills([]);
      setLoadingBills(false);
      return;
    }
    const billsRef = collection(db, 'bills');
    const q = query(
      billsRef,
      where('customerId', '==', customer.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentBills(list);
      setLoadingBills(false);
    }, (err) => {
      console.warn('Bills fetch error:', err);
      setRecentBills([]);
      setLoadingBills(false);
    });
    return () => unsub();
  }, [customer]);

  // Click outside suggestions list to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time search effect with suggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setCustomer(null);
      setSuggestions([]);
      setSearchError('');
      return;
    }

    if (ignoreSearchRef.current) {
      ignoreSearchRef.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        if (!db) throw new Error('offline');

        const customersRef = collection(db, 'customers');
        const fieldMap = { name: 'name', sqn: 'sqn', tel: 'tel' };
        
        let queryRef;
        if (searchType === 'sqn') {
          queryRef = query(customersRef, where('sqn', '>=', q), where('sqn', '<=', q + '\uf8ff'));
        } else if (searchType === 'tel') {
          queryRef = query(customersRef, where('tel', '>=', q), where('tel', '<=', q + '\uf8ff'));
        } else {
          queryRef = query(customersRef, where('name', '>=', q), where('name', '<=', q + '\uf8ff'));
        }

        const snap = await getDocs(queryRef);
        if (snap.empty) {
          // Try case-insensitive prefix matching locally
          setSuggestions([]);
          setSearchError('Macmiil lama helin. Fadlan hub magaca, SQN, ama lambarka telefoonka.');
          setCustomer(null);
          setShowWarning(false);
        } else {
          const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSuggestions(results);
          setShowSuggestions(true);
          setSearchError('');
          setShowWarning(false);

          // If exact match (one result), select it automatically
          if (results.length === 1 && results[0][fieldMap[searchType]].toLowerCase() === q.toLowerCase()) {
            selectCustomer(results[0]);
          }
        }
      } catch (err) {
        // Offline fallback search
        const searchLower = q.toLowerCase();
        const results = mockCustomers.filter(c => {
          if (searchType === 'name') return c.name.toLowerCase().includes(searchLower);
          if (searchType === 'sqn') return c.sqn.toLowerCase().includes(searchLower);
          if (searchType === 'tel') return c.tel.includes(searchLower);
          return false;
        });

        if (results.length > 0) {
          setSuggestions(results);
          setShowSuggestions(true);
          setSearchError('');
          setShowWarning(true);

          if (results.length === 1 && results[0][searchType].toLowerCase() === searchLower) {
            selectCustomer(results[0]);
          }
        } else {
          setSuggestions([]);
          setSearchError('Macmiil lama helin. Fadlan hub magaca, SQN, ama lambarka telefoonka.');
          setCustomer(null);
          setShowWarning(true);
        }
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);

  const selectCustomer = (selectedCust) => {
    ignoreSearchRef.current = true;
    setCustomer(selectedCust);
    setSearchQuery(selectedCust.name);
    setSuggestions([]);
    setShowSuggestions(false);
    if (selectedCust.lastReading !== undefined) {
      setPrevReading(String(selectedCust.lastReading));
    } else {
      // Find previous reading from mock or DB
      const mockR = mockReadings[selectedCust.id];
      if (mockR) setPrevReading(String(mockR.prevReading));
      else setPrevReading('0');
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    setReadingError('');
    if (!currentReading || isNaN(Number(currentReading))) {
      setReadingError('Fadlan gali akhris sax ah.');
      return;
    }
    if (Number(currentReading) < Number(prevReading)) {
      setReadingError('Akhris dambe kuma badnaan karo akhris hore.');
      return;
    }
    if (!reference.trim()) {
      setReadingError('Fadlan gali reffrence inoviceka.');
      return;
    }

    const refNum = Number(reference.trim());
    if (isNaN(refNum)) {
      setReadingError('Tixraaca boonadu waa inuu lambar noqdaa.');
      return;
    }

    const custZoneName = customer?.zone || '';
    const matchingZone = zones.find(z => z.name.toLowerCase() === custZoneName.toLowerCase());

    if (!matchingZone || matchingZone.startRef === null || matchingZone.endRef === null || refNum < matchingZone.startRef || refNum > matchingZone.endRef) {
      setReadingError('Reference-ka uma diwan-gashana zone-kan');
      return;
    }

    setSaving(true);
    const billData = {
      customerId: customer.id,
      customerName: customer.name,
      sqn: customer.sqn,
      zone: customer.zone || '',
      address: customer.address || '',
      tel: customer.tel || '',
      prevReading: Number(prevReading),
      currentReading: Number(currentReading),
      consumption,
      rate: RATE,
      totalAmount: Number(totalAmount),
      readingDate,
      reference,
      createdAt: serverTimestamp(),
      status: 'unpaid',
    };

    try {
      if (db && !showWarning) {
        const ref = await addDoc(collection(db, 'bills'), billData);
        // Update customer's lastReading
        try {
          await updateDoc(doc(db, 'customers', customer.id), {
            lastReading: Number(currentReading),
            lastReadingDate: readingDate,
          });
        } catch (_) {}
        setSavedBill({ id: ref.id, ...billData });
      } else {
        const tempId = `LOCAL-${Date.now()}`;
        setSavedBill({ id: tempId, ...billData });
      }
      // Nadiifi foomka si macmiil kale loo raadiyo
      setCustomer(null);
      setSearchQuery('');
      setCurrentReading('');
      setPrevReading('');
      setReference('');
      setSearchError('');
      setReadingError('');
      setRecentBills([]);
      searchInputRef.current?.focus();
    } catch (err) {
      console.error(err);
      alert('Khalad ayaa dhacay marka la keydinayay xisaabta.');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setCustomer(null);
    setSearchQuery('');
    setCurrentReading('');
    setPrevReading('');
    setSavedBill(null);
    setSearchError('');
    setReadingError('');
    setRecentBills([]);
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen">


      {/* Offline Warning Banner */}
      {showWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start justify-between gap-3 mb-5 animate-fade-in">
          <div className="flex gap-2.5 items-center">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-[11.5px] font-medium text-amber-700 dark:text-amber-400">
              Offline mode — xogta mock-ka ayaa la isticmaalayaa. Firebase-ka ma xidna.
            </p>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-[11px] font-bold text-amber-500 uppercase shrink-0 cursor-pointer">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Main Panel - Full Width */}
        <div className="flex flex-col gap-6">
          {/* Top Horizontal Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex bg-gray-100 dark:bg-slate-850 p-1 rounded-xl shrink-0 w-full md:w-auto">
                {[
                  { key: 'name', label: 'Magac' },
                  { key: 'sqn', label: 'SQN' },
                  { key: 'tel', label: 'Tel' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSearchType(opt.key)}
                    className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                      searchType === opt.key
                        ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-350'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    searchType === 'name' ? 'Ku qor magaca macmiilka...'
                    : searchType === 'sqn' ? 'Ku qor lambarka SQN...'
                    : 'Ku qor lambarka telefoonka...'
                  }
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                />
                
                {/* Autocomplete Dropdown List */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectCustomer(s)}
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-800 dark:text-slate-250">{s.name}</span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500">SQN: {s.sqn} • Tel: {s.tel}</span>
                        </div>
                        <span className="text-[10.5px] font-semibold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="w-full md:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all cursor-pointer"
              >
                {searching ? 'Raadinta...' : 'Raadi Macmiil'}
              </button>
            </form>
            {searchError && (
              <p className="text-[12px] text-red-500 mt-2.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
                {searchError}
              </p>
            )}
          </div>

          {/* Customer Header / Selection Status */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
            {customer ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center font-bold text-orange-600">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{customer.name}</h4>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">SQN: <span className="font-mono">{customer.sqn}</span> • Tel: {customer.tel} • Degaan: {customer.zone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11.5px] text-gray-500 dark:text-slate-400 font-medium">{customer.address}</span>
                  <button
                    onClick={resetAll}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 text-gray-500 dark:text-slate-400 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Nadiifi
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-750 dark:text-slate-350">Macmiil Lama Dooran</h4>
                  <p className="text-[11px] text-gray-400 dark:text-slate-550">Fadlan ku raadi macmiilka sanduuqa bidix si aad u bilowdo xisaabta.</p>
                </div>
              </div>
            )}
          </div>

          {/* Modern Billing Input Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
            {!customer && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] z-20 rounded-2xl flex flex-col items-center justify-center border border-gray-100 dark:border-slate-800">
                <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-2xl flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-900/40">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-[15px] font-bold text-gray-800 dark:text-slate-200">Macmiil Ma Jiro</h4>
                <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-1 max-w-[250px] text-center">Fadlan raadi oo dooro macmiilka marka hore si aad ugu xareyso xisaabta biyaha.</p>
              </div>
            )}

            {/* Left Panel: Inputs (Spans 2 columns on XL) */}
            <div className="xl:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2.626c.825 0 1.593-.335 2.176-.922l.796-.796a3.09 3.09 0 014.169-.028l.764.73a3.09 3.09 0 002.164.887H21M9 17h6" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Akhrinta Mitirka (Meter Reading)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Previous Reading */}
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Akhrintii Hore</label>
                    <div className="text-3xl font-black text-gray-900 dark:text-slate-200">
                      {prevReading || '0'} <span className="text-lg font-bold text-gray-400">m³</span>
                    </div>
                  </div>

                  {/* Current Reading */}
                  <div className={`rounded-xl p-5 border-2 transition-all ${readingError ? 'border-red-400 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10' : 'border-orange-300 bg-orange-50/50 dark:border-orange-700/50 dark:bg-orange-950/20'}`}>
                    <label className="block text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Gali Akhrinta Cusub</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={currentReading}
                        onChange={e => { setCurrentReading(e.target.value); setReadingError(''); }}
                        placeholder={prevReading || '0'}
                        className="w-full bg-transparent border-none p-0 text-4xl font-black text-gray-900 dark:text-slate-100 placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-0"
                      />
                      <span className="text-lg font-bold text-orange-500 absolute right-2">m³</span>
                    </div>
                  </div>
                </div>
                
                {readingError && (
                  <p className="text-sm text-red-500 font-semibold mt-3 flex items-center gap-1.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {readingError}
                  </p>
                )}

                {/* Consumption Display (Auto-calculated) */}
                <div className="mt-6 flex items-center justify-between p-5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-base font-bold text-emerald-800 dark:text-emerald-500">Farqiga (Isticmaalka)</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {consumption !== null ? consumption.toFixed(2) : '-'} <span className="text-sm opacity-70">m³</span>
                  </span>
                  </div>
              </div>

              {/* Reference Input */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                 <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3">Tixraaca Boonada (Invoice Reference)</label>
                 <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Gali tixraaca boonada (Tusaale: 12345)..."
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-lg font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
              </div>

            </div>

            {/* Right Panel: Premium Receipt Summary */}
            <div className="xl:col-span-1">
               <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-hidden relative">
                  
                  {/* Subtle Top Decor */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 absolute top-0 left-0"></div>

                  <div className="p-6 flex-1 mt-2">
                     <h3 className="text-sm font-black text-gray-500 dark:text-slate-400 uppercase tracking-[0.1em] mb-6">Xisaabta (Summary)</h3>
                     
                     <div className="space-y-5">
                       <div className="flex justify-between items-center text-base">
                         <span className="text-gray-600 dark:text-slate-300 font-medium">Rate (Qiimaha m³)</span>
                         <span className="font-mono text-gray-900 dark:text-slate-100 font-bold">${RATE.toFixed(2)}</span>
                       </div>
                       
                       <div className="flex justify-between items-center text-base">
                         <span className="text-gray-600 dark:text-slate-300 font-medium">Isticmaalka</span>
                         <span className="font-mono text-gray-900 dark:text-slate-100 font-bold">{consumption !== null ? consumption.toFixed(2) : '0.00'} m³</span>
                       </div>

                       <div className="w-full h-px bg-gray-200 dark:bg-slate-700 my-5 border-dashed border-b border-gray-300 dark:border-slate-700"></div>

                       <div className="flex justify-between items-center text-base">
                         <span className="text-gray-800 dark:text-slate-200 font-bold">Biilka Cusub</span>
                         <span className="font-mono text-gray-900 dark:text-white font-black">${totalAmount !== null ? totalAmount : '0.00'}</span>
                       </div>

                       <div className="flex justify-between items-center text-base">
                         <span className="text-gray-500 dark:text-slate-400 font-medium">Resto (Balance)</span>
                         <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">$-0.00</span>
                       </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/50 p-6 border-t border-gray-200 dark:border-slate-800">
                     <div className="flex justify-between items-end mb-6">
                       <span className="text-sm font-bold text-gray-700 dark:text-slate-300 leading-tight">Wadarta Guud<br/><span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Amount</span></span>
                       <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">${totalAmount !== null ? totalAmount : '0.00'}</span>
                     </div>

                     <button
                        onClick={handleSaveBill}
                        disabled={saving || !currentReading}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white text-base font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {saving ? (
                          <>
                           <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                           Keydinaya...
                          </>
                        ) : (
                          <>
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           Keydi Xisaabta (Save)
                          </>
                        )}
                      </button>
                  </div>
               </div>
            </div>

          </div>

          {/* Saved Bill Receipt */}
          {savedBill && (
            <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Rasiidhka Xisaabta
                </h3>
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">#{savedBill.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                <ReceiptRow label="Macmiil" value={savedBill.customerName} />
                <ReceiptRow label="SQN" value={savedBill.sqn} mono />
                <ReceiptRow label="Taariikhda" value={savedBill.readingDate} />
                <ReceiptRow label="Akhris Hore" value={`${savedBill.prevReading} m³`} />
                <ReceiptRow label="Akhris Dambe" value={`${savedBill.currentReading} m³`} />
                <ReceiptRow label="Isticmaal" value={`${savedBill.consumption.toFixed(2)} m³`} />
                <ReceiptRow label="Rate" value={`$${savedBill.rate}/m³`} />
                <ReceiptRow label="Wadarta" value={`$${savedBill.totalAmount.toFixed(2)}`} big />
              </div>
            </div>
          )}

          {/* Recent Bills History Table */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Xisaabaha Hore
              </h3>
              <span className="text-[11px] text-gray-400 dark:text-slate-500">{recentBills.length} xisaab</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40">
                    {['Taariikhda', 'Akhris Hore', 'Akhris Dambe', 'Isticmaal', 'Rate', 'Wadarta', 'Xaalad'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10.5px] font-bold text-gray-400 dark:text-slate-505 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {loadingBills ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-[13px] text-gray-400 dark:text-slate-550">
                        <svg className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                      </td>
                    </tr>
                  ) : recentBills.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-[13px] text-gray-400 dark:text-slate-550">
                        {customer ? 'Xisaab hore ma jiraan macmiilkan.' : 'Fadlan dooro macmiil si aad u aragto taariikhda.'}
                      </td>
                    </tr>
                  ) : (
                    recentBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-gray-55/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-[12.5px] text-gray-700 dark:text-slate-300">{bill.readingDate}</td>
                        <td className="px-4 py-3 text-[12.5px] text-gray-600 dark:text-slate-400 font-mono">{bill.prevReading}</td>
                        <td className="px-4 py-3 text-[12.5px] text-gray-600 dark:text-slate-400 font-mono">{bill.currentReading}</td>
                        <td className="px-4 py-3 text-[12.5px] font-bold text-blue-600 dark:text-blue-400">{Number(bill.consumption).toFixed(2)} m³</td>
                        <td className="px-4 py-3 text-[12.5px] text-gray-500 dark:text-slate-500">${bill.rate}</td>
                        <td className="px-4 py-3 text-[12.5px] font-bold text-gray-800 dark:text-slate-100">${Number(bill.totalAmount).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                            bill.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                            {bill.status === 'paid' ? 'La Bixiyay' : 'La Sugayo'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper components
function InfoRow({ label, value, highlight, mono, icon }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-[10.5px] font-bold text-gray-400 dark:text-slate-500 uppercase w-16 shrink-0 pt-0.5">{label}</span>
      <span className={`text-[13px] flex-1 ${
        highlight ? 'font-bold text-gray-900 dark:text-slate-100' :
        mono ? 'font-mono font-semibold text-gray-700 dark:text-slate-300' :
        'text-gray-700 dark:text-slate-300'
      }`}>{value || '—'}</span>
    </div>
  );
}

function ResultCard({ label, value, color, icon, large }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  };
  return (
    <div className={`border rounded-xl p-4 flex items-center gap-3 ${colorMap[color]}`}>
      <div className="opacity-70">{icon}</div>
      <div>
        <p className="text-[10.5px] font-bold uppercase opacity-70 tracking-wider">{label}</p>
        <p className={`font-bold ${large ? 'text-[18px]' : 'text-[15px]'} mt-0.5`}>{value}</p>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, mono, big }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`${mono ? 'font-mono' : ''} ${big ? 'text-[16px] font-black text-emerald-600 dark:text-emerald-400' : 'text-[13px] font-semibold text-gray-800 dark:text-slate-200'}`}>
        {value}
      </p>
    </div>
  );
}


