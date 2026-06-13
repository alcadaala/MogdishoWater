import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// The exact 16 customers from the user's reference screenshot with high-fidelity avatars
const initialMockCustomers = [
  {
    id: "mock-1",
    customerName: "Darrell Steward",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 55 55 87 24",
    countryFlag: "🇺🇸",
    countryName: "USA",
    balance: 167.77,
    totalInvoice: 0,
    createdOn: "May 9, 2014",
    status: "Active"
  },
  {
    id: "mock-2",
    customerName: "Ralph Edwards",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 6 55 51 05 09",
    countryFlag: "🇨🇦",
    countryName: "Canada",
    balance: 5872.78,
    totalInvoice: 5,
    createdOn: "April 28, 2016",
    status: "Failed"
  },
  {
    id: "mock-3",
    customerName: "Leslie Alexander",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 6 55 53 19 16",
    countryFlag: "🇬🇧",
    countryName: "UK",
    balance: -2782.78,
    totalInvoice: 4,
    createdOn: "December 19, 2013",
    status: "Active"
  },
  {
    id: "mock-4",
    customerName: "Courtney Henry",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 45 55 87 71",
    countryFlag: "🇩🇪",
    countryName: "Germany",
    balance: 329.78,
    totalInvoice: 5,
    createdOn: "August 7, 2017",
    status: "Failed"
  },
  {
    id: "mock-5",
    customerName: "Floyd Miles",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 6 55 59 32 88",
    countryFlag: "🇫🇷",
    countryName: "France",
    balance: 12.98,
    totalInvoice: 1,
    createdOn: "December 2, 2018",
    status: "Active"
  },
  {
    id: "mock-6",
    customerName: "Devon Lane",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 75 55 65 33",
    countryFlag: "🇦🇷",
    countryName: "Argentina",
    balance: 32788.89,
    totalInvoice: 1,
    createdOn: "September 24, 2017",
    status: "Failed"
  },
  {
    id: "mock-7",
    customerName: "Guy Hawkins",
    avatar: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 00 55 59 27",
    countryFlag: "🇮🇳",
    countryName: "India",
    balance: 13782.22,
    totalInvoice: 3,
    createdOn: "May 20, 2015",
    status: "Active"
  },
  {
    id: "mock-8",
    customerName: "Jacob Jones",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 55 55 93 75",
    countryFlag: "🇮🇹",
    countryName: "Italy",
    balance: 67782.00,
    totalInvoice: 2,
    createdOn: "May 6, 2012",
    status: "Failed"
  },
  {
    id: "mock-9",
    customerName: "Arlene McCoy",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 55 55 33 70",
    countryFlag: "🇳🇿",
    countryName: "New Zealand",
    balance: 32788.89,
    totalInvoice: 3,
    createdOn: "October 24, 2018",
    status: "Active"
  },
  {
    id: "mock-10",
    customerName: "Ronald Richards",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 35 55 46 14",
    countryFlag: "🇦🇺",
    countryName: "Australia",
    balance: 67271.27,
    totalInvoice: 0,
    createdOn: "August 2, 2013",
    status: "Failed"
  },
  {
    id: "mock-11",
    customerName: "Cameron Williamson",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 00 55 55 11",
    countryFlag: "🇨🇳",
    countryName: "China",
    balance: 67271.27,
    totalInvoice: 5,
    createdOn: "May 12, 2019",
    status: "Active"
  },
  {
    id: "mock-12",
    customerName: "Cody Fisher",
    avatar: "https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 55 55 49 84",
    countryFlag: "🇧🇷",
    countryName: "Brazil",
    balance: 7882.78,
    totalInvoice: 3,
    createdOn: "February 28, 2018",
    status: "Failed"
  },
  {
    id: "mock-13",
    customerName: "Robert Fox",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 55 55 45 48",
    countryFlag: "🇮🇩",
    countryName: "Indonesia",
    balance: 167.77,
    totalInvoice: 5,
    createdOn: "November 28, 2015",
    status: "Active"
  },
  {
    id: "mock-14",
    customerName: "Darlene Robertson",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 35 55 50 46",
    countryFlag: "🇮🇳",
    countryName: "India",
    balance: 5872.78,
    totalInvoice: 1,
    createdOn: "November 7, 2017",
    status: "Failed"
  },
  {
    id: "mock-15",
    customerName: "Annette Black",
    avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 35 55 21 02",
    countryFlag: "🇦🇷",
    countryName: "Argentina",
    balance: 72787.54,
    totalInvoice: 0,
    createdOn: "August 24, 2013",
    status: "Active"
  },
  {
    id: "mock-16",
    customerName: "Eleanor Pena",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    phone: "(+33) 7 00 55 54 79",
    countryFlag: "🇬🇧",
    countryName: "UK",
    balance: 132890.97,
    totalInvoice: 2,
    createdOn: "February 29, 2012",
    status: "Failed"
  }
];

export default function Billing() {
  const [dbCustomers, setDbCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('USA');
  const [balance, setBalance] = useState('');
  const [status, setStatus] = useState('Active');
  const [errors, setErrors] = useState({});

  const fetchCustomers = async () => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'customers'));
        const list = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerName: data.customerName,
            avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.customerName)}&background=ffedd5&color=f97316`,
            phone: data.phone,
            countryFlag: data.countryFlag || "🇺🇸",
            countryName: data.countryName || "USA",
            balance: Number(data.balance) || 0,
            totalInvoice: Number(data.totalInvoice) || 0,
            createdOn: data.createdOn || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: data.status || 'Active'
          };
        });
        setDbCustomers(list);
      }
    } catch (e) {
      console.error("Firebase fetch error, using mockup list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Customer name is required';
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?\d[\d\s-]{6,14}\d$/.test(phone.trim())) {
      newErrors.phone = 'Invalid phone format (e.g. (+33) 7 55 55 87 24 or +252...)';
    }
    if (balance !== '' && isNaN(Number(balance))) {
      newErrors.balance = 'Balance must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new customer to Firebase
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const countryFlags = {
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'UK': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Argentina': '🇦🇷',
      'India': '🇮🇳',
      'Italy': '🇮🇹',
      'New Zealand': '🇳🇿',
      'Australia': '🇦🇺',
      'China': '🇨🇳',
      'Brazil': '🇧🇷',
      'Indonesia': '🇮🇩',
      'Somalia': '🇸🇴'
    };

    const newCustomer = {
      customerName: name.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=f97316&bold=true`,
      phone: phone.trim(),
      countryFlag: countryFlags[country] || '🇺🇸',
      countryName: country,
      balance: Number(balance) || 0.00,
      totalInvoice: 0,
      status: status,
      createdOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: serverTimestamp()
    };

    try {
      if (db) {
        await addDoc(collection(db, 'customers'), newCustomer);
        fetchCustomers();
        // Reset state
        setName('');
        setPhone('');
        setBalance('');
        setStatus('Active');
        setCountry('USA');
        setIsModalOpen(false);
      } else {
        alert("Firebase is not properly initialized. Check your settings.");
      }
    } catch (err) {
      console.error("Error adding customer: ", err);
      alert(`Qalad ayaa dhacay: ${err.message}`);
    }
  };

  // Combine DB customers and mock customers (real ones display first)
  const allCustomers = [...dbCustomers, ...initialMockCustomers];

  // Filter list by search term
  const filteredCustomers = allCustomers.filter(cust =>
    cust.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.countryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Top Header Controls (Customers title and action buttons) */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 tracking-tight">Customers</h2>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Export
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Customers
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="admin-card rounded-2xl overflow-hidden animate-fade-in-up">
        {/* Table Toolbar controls */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 transition-colors">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input pl-9 pr-4 py-2 w-full md:w-64"
              />
            </div>
            
            <button className="btn-secondary">
              <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filter
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button className="btn-secondary">
              <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
              </svg>
              Sort By: Latest
              <svg className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            
            <button className="btn-secondary">
              <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Column
              <svg className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
                <th className="py-3 px-4 w-12"><input type="checkbox" className="rounded border-gray-300 dark:border-slate-700 text-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800" /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Customer <SortArrows /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Phone <SortArrows /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Country <SortArrows /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Balance <SortArrows /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Total Invoice <SortArrows /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Created On <SortArrows /></th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Status <SortArrows /></th>
                <th className="table-th text-right"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {loading && dbCustomers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-gray-500 dark:text-slate-400 font-medium">
                    Loading customer data...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-400 dark:text-slate-500 font-medium">
                    No matching customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isMock = cust.id.toString().startsWith('mock-');
                  
                  return (
                    <tr key={cust.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 w-12"><input type="checkbox" className="rounded border-gray-300 dark:border-slate-700 text-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800" /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cust.avatar}
                            alt={cust.customerName}
                            className="w-[32px] h-[32px] rounded-full object-cover shrink-0 bg-gray-100 dark:bg-slate-800 shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.customerName)}&background=ffedd5&color=f97316`;
                            }}
                          />
                          <span className="font-semibold text-gray-800 dark:text-slate-200 text-[13px]">{cust.customerName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-650 dark:text-slate-400 text-[13px]">{cust.phone}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-slate-300 text-[13px]">
                        <span className="mr-1.5">{cust.countryFlag}</span>
                        {cust.countryName}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-800 dark:text-slate-200 text-[13px]">
                        {cust.balance < 0 ? '-' : ''}${Math.abs(cust.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-gray-800 dark:text-slate-200 font-medium text-[13px] text-center w-[100px]">{cust.totalInvoice}</td>
                      <td className="py-4 px-4 text-gray-500 dark:text-slate-400 text-[13px]">{cust.createdOn}</td>
                      <td className="py-4 px-4 text-[13px]">
                        {cust.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                            Active
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                            Failed
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-300 text-[11px] font-semibold transition-colors bg-white dark:bg-slate-900 shadow-sm">
                            <span className="text-gray-400 font-bold text-xs">+</span> Invoice
                          </button>
                          
                          <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-300 text-[11px] font-semibold transition-colors bg-white dark:bg-slate-900 shadow-sm">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            Ledger
                          </button>

                          <button className="flex items-center justify-center p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors bg-white dark:bg-slate-900 shadow-sm w-8 h-8">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 transition-colors">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-slate-400 font-semibold">
            Row Per Page 
            <select className="border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-[12px] text-gray-750 dark:text-slate-300 focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            Entries
          </div>
          
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-semibold text-[13px] shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 font-medium text-[13px] transition-colors shadow-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 font-medium text-[13px] transition-colors shadow-sm">3</button>
            
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* New Customer Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-850 shadow-xl max-w-md w-full overflow-hidden p-6 animate-scale-in transition-colors duration-200">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Add New Customer</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrors({});
                }}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Darrell Steward"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${errors.name ? 'border-red-450 dark:border-red-500 focus:border-red-500' : 'focus:border-orange-500'} rounded-xl`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.name}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. (+33) 7 55 55 87 24"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${errors.phone ? 'border-red-450 dark:border-red-500 focus:border-red-500' : 'focus:border-orange-500'} rounded-xl`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.phone}</p>}
              </div>

              {/* Country Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 shadow-xs cursor-pointer"
                  >
                    <option value="USA">USA 🇺🇸</option>
                    <option value="Canada">Canada 🇨🇦</option>
                    <option value="UK">UK 🇬🇧</option>
                    <option value="Germany">Germany 🇩🇪</option>
                    <option value="France">France 🇫🇷</option>
                    <option value="Argentina">Argentina 🇦🇷</option>
                    <option value="India">India 🇮🇳</option>
                    <option value="Italy">Italy 🇮🇹</option>
                    <option value="New Zealand">New Zealand 🇳🇿</option>
                    <option value="Australia">Australia 🇦🇺</option>
                    <option value="China">China 🇨🇳</option>
                    <option value="Brazil">Brazil 🇧🇷</option>
                    <option value="Indonesia">Indonesia 🇮🇩</option>
                    <option value="Somalia">Somalia 🇸🇴</option>
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 shadow-xs cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Initial Balance ($)</label>
                <input
                  type="text"
                  placeholder="e.g. 167.77 (optional)"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${errors.balance ? 'border-red-450 dark:border-red-500 focus:border-red-500' : 'focus:border-orange-500'} rounded-xl`}
                />
                {errors.balance && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.balance}</p>}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-[13px] font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white dark:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for header sort arrows
function SortArrows() {
  return (
    <svg className="w-[10px] h-[10px] text-gray-400 inline-block ml-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m0-6L12 5.25 8.25 9" />
    </svg>
  );
}
