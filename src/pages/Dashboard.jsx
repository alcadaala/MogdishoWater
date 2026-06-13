import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const fallbackWells = [
  { id: 'well-1', name: 'Heliwaa Well #1', location: 'Heliwaa District', status: 'active', production: '24,500 L/day' },
  { id: 'well-2', name: 'Kaxda Well #2', location: 'Kaxda District', status: 'inactive', production: '0 L/day' },
  { id: 'well-3', name: 'Hodan Well #3', location: 'Hodan District', status: 'active', production: '18,200 L/day' },
  { id: 'well-4', name: 'Wadajir Well #4', location: 'Wadajir District', status: 'active', production: '22,700 L/day' }
];

const fallbackPayments = [
  { id: 'pay-1', customerName: 'Darrell Steward', description: 'Water bill - May', amount: 120.50, status: 'paid' },
  { id: 'pay-2', customerName: 'Ralph Edwards', description: 'Water bill - May', amount: 450.00, status: 'pending' },
  { id: 'pay-3', customerName: 'Leslie Alexander', description: 'Water bill - May', amount: 85.00, status: 'paid' },
  { id: 'pay-4', customerName: 'Courtney Henry', description: 'Water bill - May', amount: 320.00, status: 'pending' },
  { id: 'pay-5', customerName: 'Floyd Miles', description: 'Water bill - May', amount: 15.00, status: 'paid' }
];

const initialSeedCustomers = [
  { customerName: "Darrell Steward", phone: "(+33) 7 55 55 87 24", countryFlag: "🇺🇸", countryName: "USA", balance: 167.77, totalInvoice: 0, status: "Active", createdOn: "May 9, 2014" },
  { customerName: "Ralph Edwards", phone: "(+33) 6 55 51 05 09", countryFlag: "🇨🇦", countryName: "Canada", balance: 5872.78, totalInvoice: 5, status: "Failed", createdOn: "April 28, 2016" },
  { customerName: "Leslie Alexander", phone: "(+33) 6 55 53 19 16", countryFlag: "🇬🇧", countryName: "UK", balance: -2782.78, totalInvoice: 4, status: "Active", createdOn: "December 19, 2013" },
  { customerName: "Courtney Henry", phone: "(+33) 7 45 55 87 71", countryFlag: "🇩🇪", countryName: "Germany", balance: 329.78, totalInvoice: 5, status: "Failed", createdOn: "August 7, 2017" },
  { customerName: "Floyd Miles", phone: "(+33) 6 55 59 32 88", countryFlag: "🇫🇷", countryName: "France", balance: 12.98, totalInvoice: 1, status: "Active", createdOn: "December 2, 2018" }
];

const fallbackStats = {
  totalWells: 4,
  activeWells: 3,
  totalCustomers: 16,
  totalRevenue: 990.50
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [wells, setWells] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!db) throw new Error("No database initialized");

        // Fetch wells
        const wellsSnap = await getDocs(collection(db, 'wells'));
        let wellsData = wellsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Check if database is empty - seed it automatically
        if (wellsData.length === 0) {
          try {
            // Seed wells
            for (const well of fallbackWells) {
              const { id, ...wellData } = well;
              await addDoc(collection(db, 'wells'), {
                ...wellData,
                createdAt: serverTimestamp()
              });
            }
            // Seed payments
            for (const pay of fallbackPayments) {
              const { id, ...payData } = pay;
              await addDoc(collection(db, 'payments'), {
                ...payData,
                createdAt: serverTimestamp()
              });
            }
            // Seed customers
            for (const cust of initialSeedCustomers) {
              await addDoc(collection(db, 'customers'), {
                ...cust,
                createdAt: serverTimestamp()
              });
            }

            // Re-fetch wells
            const reWellsSnap = await getDocs(collection(db, 'wells'));
            wellsData = reWellsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          } catch (seedErr) {
            console.warn("Firestore write permission denied during auto-seeding. Locked rules?", seedErr);
            throw seedErr; // escalate to show warning banner
          }
        }

        // Fetch payments
        const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(5));
        const paymentsSnap = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Fetch customers size
        const customersSnap = await getDocs(collection(db, 'customers'));

        setWells(wellsData);
        setRecentPayments(paymentsData);
        setStats({
          totalWells: wellsData.length,
          activeWells: wellsData.filter((w) => w.status === 'active').length,
          totalCustomers: customersSnap.size,
          totalRevenue: paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        });
        setShowWarning(false);
      } catch (err) {
        console.warn("Firestore data load failed, falling back to local mock data:", err);
        setWells(fallbackWells);
        setRecentPayments(fallbackPayments);
        setStats(fallbackStats);
        setShowWarning(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-100 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[100px] bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-[280px] bg-white rounded-xl border border-slate-200" />
          <div className="h-[280px] bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Wells',
      value: stats?.totalWells ?? 0,
      sub: `${stats?.activeWells ?? 0} currently active`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Customers',
      value: stats?.totalCustomers ?? 0,
      sub: 'Registered users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Revenue',
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      sub: 'From recent payments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Active Wells',
      value: stats?.activeWells ?? 0,
      sub: `of ${stats?.totalWells ?? 0} total`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {showWarning && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl flex flex-col sm:flex-row gap-3 items-start justify-between animate-fade-in transition-all">
          <div className="flex gap-2.5 items-start">
            <svg className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-orange-850 dark:text-orange-300">Firebase Firestore Rule Warning</h4>
              <p className="text-[11px] text-orange-700 dark:text-orange-450 leading-relaxed">
                Database reads were denied because of Firestore Security Rules (insufficient permissions). Showing offline mockup data.
              </p>
              <div className="pt-2">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">To fix this, update your rules in the Firebase Console to:</p>
                <pre className="p-2 bg-white dark:bg-slate-950 border border-orange-100 dark:border-slate-800 rounded-lg text-[10px] font-mono text-gray-650 dark:text-slate-400 select-all overflow-x-auto max-w-full">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowWarning(false)}
            className="text-[11.5px] font-bold text-orange-500 hover:text-orange-650 transition-colors uppercase shrink-0 mt-0.5 sm:mt-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={card.label} className="admin-card p-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{card.sub}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Wells */}
        <div className="lg:col-span-3 admin-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Well Status</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Real-time monitoring</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800/80">
              {wells.length} Wells
            </span>
          </div>

          {wells.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-300 dark:text-slate-650" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No wells registered yet</p>
              <p className="text-xs text-slate-300 dark:text-slate-600">Add wells to the Firestore <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-slate-400 font-mono">wells</code> collection</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-3 px-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Name</th>
                    <th className="py-3 px-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location</th>
                    <th className="py-3 px-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</th>
                    <th className="py-3 px-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {wells.map((well) => (
                    <tr key={well.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-sm">
                      <td className="py-3 px-5 font-semibold text-slate-700 dark:text-slate-200">{well.name || 'Unnamed'}</td>
                      <td className="py-3 px-5 text-slate-500 dark:text-slate-400">{well.location || '—'}</td>
                      <td className="py-3 px-5">
                        <span className={`badge ${well.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${well.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {well.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 dark:text-slate-400">{well.production || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-2 admin-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Payments</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Latest 5 transactions</p>
          </div>

          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-300 dark:text-slate-605" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No payments yet</p>
            </div>
          ) : (
            <div>
              {recentPayments.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-5 py-3.5 hover:bg-slate-55 dark:hover:bg-slate-800/30 transition-colors ${i < recentPayments.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{(p.customerName || 'U')[0]}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{p.customerName || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{p.description || 'Water bill'}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">${Number(p.amount || 0).toFixed(2)}</p>
                    <span className={`badge text-[9px] ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {p.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
