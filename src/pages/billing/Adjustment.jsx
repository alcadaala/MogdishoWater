import { useState, useEffect, useRef } from 'react';
import { 
  collection, addDoc, doc, updateDoc, 
  serverTimestamp, getDocs, query, where 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const RATE = 1.6;

// Mock customers list for autocomplete search
const mockCustomers = [
  { id: 'C001', name: 'Axmed Cali Hassan', sqn: 'SQN-001', tel: '0615001001', zone: 'Hodan', address: 'Wadada Maka Al-Mukarama, Hodan' },
  { id: 'C002', name: 'Faadumo Nuur Warsame', sqn: 'SQN-002', tel: '0617002002', zone: 'Heliwaa', address: 'Xaafadda Heliwaa, Muqdisho' },
  { id: 'C003', name: 'Maxamed Cabdi Jaamac', sqn: 'SQN-003', tel: '0618003003', zone: 'Wadajir', address: 'Wadajir District, K4' },
  { id: 'C004', name: 'Ubax Yusuf Ciise', sqn: 'SQN-004', tel: '0619004004', zone: 'Kaxda', address: 'Kaxda, Muqdisho South' },
  { id: 'C005', name: 'Cabdilaahi Muuse', sqn: 'SQN-005', tel: '0610005005', zone: 'Hodan', address: 'Yaaqshiid, Wadada Afgooye' },
];

export default function Adjustment() {
  const [showWarning, setShowWarning] = useState(false);

  // Estimation & Billing states
  const [searchType, setSearchType] = useState('sqn');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [meterIssue, setMeterIssue] = useState('burnt'); // 'burnt', 'missing', 'custom'
  const [issueText, setIssueText] = useState('Sacad Gubtay');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [useAverage, setUseAverage] = useState(true);
  const [customConsumption, setCustomConsumption] = useState('');
  const [averageConsumption, setAverageConsumption] = useState(15);
  const [totalPastConsumption, setTotalPastConsumption] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [billsHistoryCount, setBillsHistoryCount] = useState(0);
  const [reference, setReference] = useState('');
  const [savingEstimation, setSavingEstimation] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [estimationError, setEstimationError] = useState('');

  const searchInputRef = useRef(null);
  const ignoreSearchRef = useRef(false);

  useEffect(() => {
    if (!db) {
      setShowWarning(true);
    }
  }, []);

  // Click outside search suggestions dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Customer Search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
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
        let queryRef;

        if (searchType === 'sqn') {
          queryRef = query(customersRef, where('sqn', '>=', q), where('sqn', '<=', q + '\uf8ff'));
        } else if (searchType === 'tel') {
          queryRef = query(customersRef, where('tel', '>=', q), where('tel', '<=', q + '\uf8ff'));
        } else {
          queryRef = query(customersRef, where('name', '>=', q), where('name', '<=', q + '\uf8ff'));
        }

        const snap = await getDocs(queryRef);
        let results = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.customerName || data.name || '',
            sqn: data.sqn || doc.id || '',
            tel: data.phone || data.tel || '',
            zone: data.zone || data.countryName || 'Hodan',
            address: data.address || 'Muqdisho, Somalia'
          };
        });

        // Double fallback if specific query fields are empty
        if (results.length === 0 && searchType === 'name') {
          const secondQuery = query(customersRef, where('customerName', '>=', q), where('customerName', '<=', q + '\uf8ff'));
          const secondSnap = await getDocs(secondQuery);
          results = secondSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.customerName || data.name || '',
              sqn: data.sqn || doc.id || '',
              tel: data.phone || data.tel || '',
              zone: data.zone || data.countryName || 'Hodan',
              address: data.address || 'Muqdisho, Somalia'
            };
          });
        }

        if (results.length === 0 && searchType === 'tel') {
          const secondQuery = query(customersRef, where('phone', '>=', q), where('phone', '<=', q + '\uf8ff'));
          const secondSnap = await getDocs(secondQuery);
          results = secondSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.customerName || data.name || '',
              sqn: data.sqn || doc.id || '',
              tel: data.phone || data.tel || '',
              zone: data.zone || data.countryName || 'Hodan',
              address: data.address || 'Muqdisho, Somalia'
            };
          });
        }

        if (results.length === 0) {
          setSuggestions([]);
          setSearchError('Macmiil lama helin. Fadlan hubi SQN, Tel ama Magaca.');
        } else {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } catch (err) {
        // Offline search fallback
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
        } else {
          setSuggestions([]);
          setSearchError('Macmiil lama helin. Fadlan hubi SQN, Tel ama Magaca.');
        }
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);

  // Handle customer selection
  const selectCustomer = async (cust) => {
    ignoreSearchRef.current = true;
    setSelectedCust(cust);
    setSearchQuery(cust.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError('');
    setEstimationError('');
    setSelectedMonths([]);
    setSavedReceipt(null);
    setMeterIssue('burnt');
    setIssueText('Sacad Gubtay');

    // Fetch this customer's billing history to compute average consumption
    setLoadingHistory(true);
    if (!db) {
      setAverageConsumption(18);
      setTotalPastConsumption(54);
      setBillsHistoryCount(3);
      setLoadingHistory(false);
      return;
    }

    try {
      const q = query(collection(db, 'bills'), where('customerId', '==', cust.id));
      const snap = await getDocs(q);
      const bills = snap.docs.map(d => d.data());
      
      const validConsumptionBills = bills.filter(b => b.consumption !== undefined && b.consumption !== null);
      setBillsHistoryCount(validConsumptionBills.length);
      
      if (validConsumptionBills.length > 0) {
        const totalC = validConsumptionBills.reduce((s, b) => s + Number(b.consumption), 0);
        setTotalPastConsumption(totalC);
        const avg = totalC / validConsumptionBills.length;
        setAverageConsumption(Number(avg.toFixed(1)));
      } else {
        setTotalPastConsumption(0);
        setAverageConsumption(15);
      }
    } catch (e) {
      console.warn("Failed to fetch customer bill history for average:", e);
      setTotalPastConsumption(0);
      setAverageConsumption(15);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Generate dynamic 6 recent months
  const getRecentMonths = () => {
    const months = [];
    const monthNames = [
      "Janaayo", "Febraayo", "Maarso", "Abriil", "May", "Juun", 
      "Luulyo", "Agoosto", "Sebtembar", "Oktoobar", "Nofeembar", "Diseembar"
    ];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        month: d.getMonth() + 1,
        year: d.getFullYear()
      });
    }
    return months;
  };

  const recentMonths = getRecentMonths();

  // Toggle selected months
  const handleToggleMonth = (key) => {
    if (selectedMonths.includes(key)) {
      setSelectedMonths(prev => prev.filter(m => m !== key));
    } else {
      setSelectedMonths(prev => [...prev, key]);
    }
    setEstimationError('');
  };

  // Save Estimation and Bill
  const handleSaveEstimation = async (e) => {
    e.preventDefault();
    setEstimationError('');

    if (!selectedCust) {
      setEstimationError('Fadlan horta dooro macmiilka.');
      return;
    }
    if (selectedMonths.length === 0) {
      setEstimationError('Fadlan dooro ugu yaraan hal bil oo la qiyaasayo.');
      return;
    }
    const consumptionVal = useAverage ? averageConsumption : Number(customConsumption);
    if (!consumptionVal || isNaN(consumptionVal) || consumptionVal <= 0) {
      setEstimationError('Fadlan gali xaddi sax ah oo biyo ah (m³).');
      return;
    }
    if (!reference.trim()) {
      setEstimationError('Fadlan gali tixraaca boonada (Reference Number).');
      return;
    }

    setSavingEstimation(true);
    const amountPerMonth = consumptionVal * RATE;
    const overallTotal = amountPerMonth * selectedMonths.length;

    try {
      const generatedBills = [];
      for (const monthKey of selectedMonths) {
        const [year, monthStr] = monthKey.split('-');
        const monthObj = recentMonths.find(m => m.key === monthKey);
        const monthLabel = monthObj ? monthObj.label : monthKey;

        const billData = {
          customerId: selectedCust.id,
          customerName: selectedCust.name,
          sqn: selectedCust.sqn,
          zone: selectedCust.zone,
          address: selectedCust.address,
          tel: selectedCust.tel,
          prevReading: 0,
          currentReading: 0,
          consumption: consumptionVal,
          rate: RATE,
          totalAmount: amountPerMonth,
          readingDate: `${year}-${monthStr}-28`,
          reference: `${reference}-${monthKey}`,
          status: 'unpaid',
          isEstimated: true,
          notes: `Qiyaasta Bisha (${issueText})`,
          createdAt: serverTimestamp()
        };

        if (db) {
          const docRef = await addDoc(collection(db, 'bills'), billData);
          generatedBills.push({ id: docRef.id, monthLabel, ...billData });
        } else {
          generatedBills.push({ id: `LOCAL-BILL-${Date.now()}-${monthKey}`, monthLabel, ...billData });
        }
      }

      // Add audit log to adjustments
      const adjustmentData = {
        customerName: selectedCust.name,
        type: 'Meter Correction',
        amount: overallTotal,
        status: 'Approved',
        createdAt: serverTimestamp(),
        notes: `Meter correction (${issueText}) for months: ${selectedMonths.join(', ')}`
      };

      if (db) {
        await addDoc(collection(db, 'adjustments'), adjustmentData);
      }

      setSavedReceipt({
        customer: selectedCust,
        issue: issueText,
        months: selectedMonths.map(k => recentMonths.find(m => m.key === k)?.label || k),
        consumption: consumptionVal,
        totalBilled: overallTotal,
        reference,
        bills: generatedBills
      });

      setSelectedCust(null);
      setSearchQuery('');
      setSelectedMonths([]);
      setReference('');
      setCustomConsumption('');
    } catch (err) {
      console.error("Estimation save error:", err);
      setEstimationError('Qalad ayaa dhacay inta la kaydinayay xogta qiyaasta biyaha.');
    } finally {
      setSavingEstimation(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 animate-fade-in">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 tracking-tight">Qiimeyn (Meter Estimation)</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Habka qiimeynta iyo dalacaadda biyaha macaamiisha sacad la'aanta ah ama gubtay</p>
        </div>
      </div>

      {showWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/40 rounded-xl flex items-center justify-between gap-3 mb-6 animate-fade-in">
          <div className="flex gap-2.5 items-center">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Offline Mode — Firebase settings are local or inaccessible.</p>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-[11px] font-bold text-amber-500 uppercase cursor-pointer">×</button>
        </div>
      )}

      {/* Qiimeyn Workspace */}
      <div className="space-y-6">
        {/* Customer Selection and Search Header */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-fade-in-up">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-3">1. Raadi Macmiilka (Search Customer)</h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex bg-gray-100 dark:bg-slate-850 p-1 rounded-xl shrink-0 w-full md:w-auto">
              {[
                { key: 'sqn', label: 'SQN' },
                { key: 'name', label: 'Magac' },
                { key: 'tel', label: 'Telefoon' },
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

            <div className="relative flex-1 w-full" ref={searchInputRef}>
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={
                  searchType === 'sqn' ? 'Gali lambarka SQN (Tusaale: SQN-001)...'
                  : searchType === 'name' ? 'Gali magaca macmiilka...'
                  : 'Gali lambarka telefoonka...'
                }
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
              />

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
                      <span className="text-[10.5px] font-bold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {searchError && <p className="text-xs text-red-500 mt-2.5 font-medium">{searchError}</p>}

          {selectedCust ? (
            <div className="mt-4 p-4 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center font-bold text-orange-600">
                  {selectedCust.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-950 dark:text-slate-100">{selectedCust.name}</h4>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    SQN: <span className="font-mono">{selectedCust.sqn}</span> • Tel: {selectedCust.tel} • Degmada: {selectedCust.zone}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase">Active</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 shrink-0">❓</div>
              <p className="text-[11.5px] text-gray-500 dark:text-slate-400">Doorashada Macmiilka: Fadlan kor ku qor macmiilka si aad u doorato.</p>
            </div>
          )}
        </div>

        {/* Form Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {!selectedCust && !savedReceipt && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] z-10 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-slate-800">
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-2xl flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-900/40 shadow-sm">🚰</div>
              <h4 className="text-[15px] font-bold text-gray-800 dark:text-slate-200">Dooro Macmiil marka hore</h4>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 max-w-[280px] text-center">Ugu horeyn kor ka raadi macmiilka si loo dalaco qiyaasta sacad la'aanta ama gubashada.</p>
            </div>
          )}

          {/* Saved Receipt Visual State */}
          {savedReceipt ? (
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 shadow-md animate-scale-in">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-500 text-xl font-bold">✓</div>
                <div>
                  <h3 className="text-[16px] font-black text-gray-900 dark:text-white">Dalac-bixintii Waa Lagu Guuleystay (Estimated & Billed!)</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Xisaabta qiyaasta biyaha ee macmiilka si sax ah ayaa loo keydiyay.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px] bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/60">
                <div className="space-y-2.5">
                  <p className="font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider text-[10px]">Customer details</p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Magaca: <span className="font-medium text-gray-700 dark:text-slate-350">{savedReceipt.customer.name}</span></p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">SQN: <span className="font-mono text-gray-700 dark:text-slate-350">{savedReceipt.customer.sqn}</span></p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Telefoon: <span className="font-medium text-gray-700 dark:text-slate-350">{savedReceipt.customer.tel}</span></p>
                </div>

                <div className="space-y-2.5">
                  <p className="font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider text-[10px]">Estimation Details</p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Nooca Cilada: <span className="font-bold text-amber-600 uppercase">{savedReceipt.issue === 'burnt' ? 'Sacad Gubtay (Burnt)' : 'Aqris La\'aan (Missing)'}</span></p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Wadarta Biyo Qiyaas: <span className="font-bold text-blue-500">{savedReceipt.consumption} m³ / bishiiba</span></p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Rate: <span className="font-mono">${RATE}/m³</span></p>
                </div>

                <div className="space-y-2.5">
                  <p className="font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider text-[10px]">Financials & Invoicing</p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Bilaha La Dalacay: <span className="text-gray-700 dark:text-slate-350 font-bold">{savedReceipt.months.join(', ')}</span></p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold">Invoice Reference: <span className="font-mono font-bold text-gray-700 dark:text-slate-350">{savedReceipt.reference}</span></p>
                  <p className="text-gray-900 dark:text-slate-205 font-bold text-[13px]">Lacagta Guud: <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">${savedReceipt.totalBilled.toFixed(2)}</span></p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-150 dark:border-slate-800 flex justify-end gap-3">
                <button onClick={() => setSavedReceipt(null)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-650 dark:text-slate-300 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                  Xir Rasiidhka (Close)
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-md cursor-pointer flex items-center gap-1.5">
                  🖨 Print Rasiidh
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Left Side: Configurations (Spans 2 columns on large screen) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Issue configuration */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">2. Dooro ama Qor Nooca Ciladda (Issue Type)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => { setMeterIssue('burnt'); setIssueText('Sacad Gubtay'); }}
                      className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        meterIssue === 'burnt'
                          ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/15'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className="text-xl">🔥</span>
                      <span className="text-[12.5px] font-bold text-gray-800 dark:text-slate-200 mt-1">Sacad Gubtay</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">Meter index cannot rotate/burn.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMeterIssue('missing'); setIssueText('Aqris La\'aan'); }}
                      className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        meterIssue === 'missing'
                          ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/15'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className="text-xl">🚫</span>
                      <span className="text-[12.5px] font-bold text-gray-800 dark:text-slate-200 mt-1">Aqris La'aan</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">No physical reading obtained.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMeterIssue('custom'); setIssueText(''); }}
                      className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        meterIssue === 'custom'
                          ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/15'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className="text-xl">✍️</span>
                      <span className="text-[12.5px] font-bold text-gray-800 dark:text-slate-200 mt-1">Cilad Kale</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">Enter custom issue description.</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Qor faahfaahinta ciladda (Custom Issue Text)</label>
                    <input
                      type="text"
                      value={issueText}
                      onChange={e => {
                        setIssueText(e.target.value);
                        if (e.target.value !== 'Sacad Gubtay' && e.target.value !== 'Aqris La\'aan') {
                          setMeterIssue('custom');
                        }
                        setEstimationError('');
                      }}
                      placeholder="Ku qor sababta qiimeynta halkan (Tusaale: Sacad jaban, Leakage, xisaab celin)..."
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-205 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-205 focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Months Selector Checkboxes */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">3. Dooro Bilaha la Qiyaasayo (Months to Estimate)</h3>
                  <p className="text-[10.5px] text-gray-400 dark:text-slate-550 mb-4">Waxaad dooran kartaa hal bil ama dhowr bilood oo isku xigta si hal mar loo dalaco.</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                    {recentMonths.map(m => {
                      const isChecked = selectedMonths.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => handleToggleMonth(m.key)}
                          className={`px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? 'border-orange-300 dark:border-orange-850 bg-orange-50/40 dark:bg-orange-950/15 text-orange-600 dark:text-orange-400 font-bold'
                              : 'border-gray-150 dark:border-slate-800 text-gray-755 dark:text-slate-350 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <span className="text-[12px] truncate">{m.label}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 dark:border-slate-650 text-transparent'
                          }`}>✓</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Consumption calculation & inputs */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">4. Habka Xisaabinta Biyaha (Consumption Configuration)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                    {/* Calculated Average Panel */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-150 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Celceliska Isticmaalka (Average)</span>
                        <h4 className="text-xl font-black text-gray-900 dark:text-slate-200 mt-1">
                          {loadingHistory ? 'Xisaabinaya...' : `${averageConsumption} m³ / bil`}
                        </h4>
                        {!loadingHistory && billsHistoryCount > 0 ? (
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1.5 font-semibold leading-relaxed">
                            Xisaabtu: {totalPastConsumption.toFixed(1)} m³ (Wadarta) ÷ {billsHistoryCount} Bilood = {averageConsumption} m³ (Celcelis)
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-1.5 font-medium">
                            {loadingHistory ? 'Raadinaya taariikhda...' : 'Diiwaan hore ma jiro — biilka caadiga ah (15 m³)'}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-350 cursor-pointer">
                          <input
                            type="radio"
                            name="consumptionMode"
                            checked={useAverage}
                            onChange={() => setUseAverage(true)}
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          Isticmaal Celceliska (Use Average)
                        </label>
                      </div>
                    </div>

                    {/* Manual Override Panel */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                      !useAverage 
                        ? 'border-orange-300 dark:border-orange-850 bg-orange-50/20 dark:bg-orange-950/10' 
                        : 'border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Manual Consumption Input</span>
                        <div className="flex items-center mt-1">
                          <input
                            type="number"
                            disabled={useAverage}
                            value={customConsumption}
                            onChange={e => { setCustomConsumption(e.target.value); setEstimationError(''); }}
                            placeholder="e.g. 20"
                            className="w-full bg-transparent border-none p-0 text-xl font-black text-gray-900 dark:text-slate-205 focus:ring-0 focus:outline-none placeholder-gray-300 dark:placeholder-slate-700 disabled:opacity-50"
                          />
                          <span className="text-xs font-bold text-gray-400 ml-1">m³</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="consumptionMode"
                            checked={!useAverage}
                            onChange={() => setUseAverage(false)}
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          Gacanta Ku Qor (Manual Entry)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Invoice reference input */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Invoice Reference Number</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={e => { setReference(e.target.value); setEstimationError(''); }}
                      placeholder="Gali tixraaca qaansada (Tusaale: EST-5022)..."
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-255 dark:border-slate-700 rounded-xl text-[13px] text-gray-850 dark:text-slate-200 font-bold focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Billing Invoice Summary Panel (1 column) */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden h-full shadow-sm relative">
                  <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-500 w-full absolute top-0 left-0"></div>
                  
                  <div className="p-5 flex-1 mt-2">
                    <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-5">Biilka Qiyaasta Bisha (Bill Summary)</h3>

                    <div className="space-y-4 text-[12.5px]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-400 font-medium">Biyaha / month</span>
                        <span className="font-bold text-gray-800 dark:text-slate-200">
                          {useAverage ? averageConsumption : (Number(customConsumption) || 0)} m³
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-400 font-medium">Rate per m³</span>
                        <span className="font-mono text-gray-800 dark:text-slate-200 font-bold">${RATE.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-400 font-medium">Qiimaha bishii</span>
                        <span className="font-mono text-gray-855 dark:text-slate-200 font-black">
                          ${((useAverage ? averageConsumption : (Number(customConsumption) || 0)) * RATE).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-400 font-medium">Bilaha la doortay</span>
                        <span className="font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-md text-[11px]">
                          {selectedMonths.length} bilood
                        </span>
                      </div>

                      <div className="border-t border-gray-100 dark:border-slate-800/80 pt-4 my-2 border-dashed"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 dark:text-slate-200 font-bold">Lacagta guud</span>
                        <span className="font-mono text-gray-900 dark:text-white font-extrabold text-base">
                          ${(((useAverage ? averageConsumption : (Number(customConsumption) || 0)) * RATE) * selectedMonths.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/30 p-5 border-t border-gray-200 dark:border-slate-800">
                    {estimationError && (
                      <p className="text-[11.5px] text-red-500 font-semibold mb-3 flex items-center gap-1">
                        ⚠️ {estimationError}
                      </p>
                    )}

                    <button
                      onClick={handleSaveEstimation}
                      disabled={savingEstimation || selectedMonths.length === 0}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-slate-850 dark:disabled:text-slate-605 text-white text-[13.5px] font-bold rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {savingEstimation ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Dalacaya (Biling...)
                        </>
                      ) : (
                        <>Keydi oo Dalac (Save & Bill)</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
