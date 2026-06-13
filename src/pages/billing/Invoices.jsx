import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const initialMockInvoices = [
  {
    id: "INV-2026-001",
    customerName: "Darrell Steward",
    wellSource: "Heliwaa Well #1",
    amount: 120.50,
    dueDate: "Jun 15, 2026",
    status: "Paid"
  },
  {
    id: "INV-2026-002",
    customerName: "Ralph Edwards",
    wellSource: "Kaxda Well #2",
    amount: 450.00,
    dueDate: "Jun 18, 2026",
    status: "Pending"
  },
  {
    id: "INV-2026-003",
    customerName: "Leslie Alexander",
    wellSource: "Hodan Well #3",
    amount: 85.00,
    dueDate: "Jun 20, 2026",
    status: "Paid"
  },
  {
    id: "INV-2026-004",
    customerName: "Courtney Henry",
    wellSource: "Heliwaa Well #1",
    amount: 320.00,
    dueDate: "Jun 22, 2026",
    status: "Overdue"
  },
  {
    id: "INV-2026-005",
    customerName: "Floyd Miles",
    wellSource: "Wadajir Well #4",
    amount: 15.00,
    dueDate: "Jun 25, 2026",
    status: "Paid"
  }
];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [wellSource, setWellSource] = useState('Heliwaa Well #1');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [errors, setErrors] = useState({});

  const fetchInvoices = async () => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'invoices'));
        const list = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerName: data.customerName,
            wellSource: data.wellSource,
            amount: Number(data.amount) || 0,
            dueDate: data.dueDate,
            status: data.status || 'Pending'
          };
        });
        setInvoices(list);
      }
    } catch (e) {
      console.error("Firebase fetch invoices error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!customerName.trim()) errs.customerName = 'Customer name is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!dueDate) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newInv = {
      customerName: customerName.trim(),
      wellSource,
      amount: Number(amount),
      dueDate: new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status,
      createdAt: serverTimestamp()
    };

    try {
      if (db) {
        await addDoc(collection(db, 'invoices'), newInv);
        fetchInvoices();
        setCustomerName('');
        setAmount('');
        setDueDate('');
        setStatus('Pending');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Qalad ayaa dhacay marka la keydinayay invoice-ka.");
    }
  };

  const allInvoices = [...invoices, ...initialMockInvoices];
  const filteredInvoices = allInvoices.filter(inv =>
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.wellSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 tracking-tight">Invoices</h2>
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
            Create Invoice
          </button>
        </div>
      </div>

      {/* Toolbar & Card */}
      <div className="admin-card rounded-2xl overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 transition-colors">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Invoices"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pl-9 pr-4 py-2 w-full md:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Invoice ID</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Customer</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Source Well</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Amount</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Due Date</th>
                <th className="table-th text-gray-400 dark:text-slate-400 font-semibold">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {filteredInvoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs text-gray-600 dark:text-slate-400">{inv.id}</td>
                  <td className="py-4 px-4 font-semibold text-gray-800 dark:text-slate-200 text-[13px]">{inv.customerName}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-slate-350 text-[13px]">{inv.wellSource}</td>
                  <td className="py-4 px-4 font-bold text-gray-800 dark:text-slate-200 text-[13px]">
                    ${Number(inv.amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-gray-500 dark:text-slate-400 text-[13px]">{inv.dueDate}</td>
                  <td className="py-4 px-4">
                    {inv.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                        Paid
                      </span>
                    ) : inv.status === 'Overdue' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                        Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="px-2.5 py-1 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-[11px] text-gray-600 dark:text-slate-300 font-semibold transition-colors bg-white dark:bg-slate-900 shadow-sm">
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-850 shadow-xl max-w-md w-full animate-scale-in transition-colors duration-200">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Create New Invoice</h3>
              <button onClick={() => { setIsModalOpen(false); setErrors({}); }} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Darrell Steward"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${errors.customerName ? 'border-red-450 dark:border-red-500' : ''} rounded-xl`}
                />
                {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Well Source</label>
                  <select
                    value={wellSource}
                    onChange={(e) => setWellSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Heliwaa Well #1">Heliwaa Well #1</option>
                    <option value="Kaxda Well #2">Kaxda Well #2</option>
                    <option value="Hodan Well #3">Hodan Well #3</option>
                    <option value="Wadajir Well #4">Wadajir Well #4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Amount ($)</label>
                  <input
                    type="text"
                    placeholder="e.g. 150.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${errors.amount ? 'border-red-450 dark:border-red-500' : ''} rounded-xl`}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${errors.dueDate ? 'border-red-450 dark:border-red-500' : ''} rounded-xl`}
                  />
                  {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setErrors({}); }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-[13px] font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
