import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

// ─── MOCK DATA ──────────────────────────────────────────────
const mockBills = [
  { id: 'b1', customerId: 'C001', customerName: 'Axmed Cali Hassan', sqn: 'SQN-001', zone: 'Hodan', consumption: 45, totalAmount: 72, status: 'paid', readingDate: '2026-05-15', createdAt: { toDate: () => new Date('2026-05-15') } },
  { id: 'b2', customerId: 'C002', customerName: 'Faadumo Nuur Warsame', sqn: 'SQN-002', zone: 'Heliwaa', consumption: 62, totalAmount: 99.2, status: 'unpaid', readingDate: '2026-05-12', createdAt: { toDate: () => new Date('2026-05-12') } },
  { id: 'b3', customerId: 'C003', customerName: 'Maxamed Cabdi Jaamac', sqn: 'SQN-003', zone: 'Wadajir', consumption: 38, totalAmount: 60.8, status: 'paid', readingDate: '2026-05-10', createdAt: { toDate: () => new Date('2026-05-10') } },
  { id: 'b4', customerId: 'C004', customerName: 'Ubax Yusuf Ciise', sqn: 'SQN-004', zone: 'Kaxda', consumption: 55, totalAmount: 88, status: 'overdue', readingDate: '2026-04-20', createdAt: { toDate: () => new Date('2026-04-20') } },
  { id: 'b5', customerId: 'C005', customerName: 'Cabdilaahi Muuse', sqn: 'SQN-005', zone: 'Hodan', consumption: 70, totalAmount: 112, status: 'paid', readingDate: '2026-05-18', createdAt: { toDate: () => new Date('2026-05-18') } },
  { id: 'b6', customerId: 'C006', customerName: 'Sahra Maxamed', sqn: 'SQN-006', zone: 'Heliwaa', consumption: 30, totalAmount: 48, status: 'unpaid', readingDate: '2026-05-20', createdAt: { toDate: () => new Date('2026-05-20') } },
  { id: 'b7', customerId: 'C007', customerName: 'Cali Warsame Xirsi', sqn: 'SQN-007', zone: 'Wadajir', consumption: 85, totalAmount: 136, status: 'paid', readingDate: '2026-04-28', createdAt: { toDate: () => new Date('2026-04-28') } },
  { id: 'b8', customerId: 'C008', customerName: 'Hawa Cabdi Nuur', sqn: 'SQN-008', zone: 'Kaxda', consumption: 42, totalAmount: 67.2, status: 'overdue', readingDate: '2026-03-15', createdAt: { toDate: () => new Date('2026-03-15') } },
  { id: 'b9', customerId: 'C001', customerName: 'Axmed Cali Hassan', sqn: 'SQN-001', zone: 'Hodan', consumption: 50, totalAmount: 80, status: 'paid', readingDate: '2026-04-15', createdAt: { toDate: () => new Date('2026-04-15') } },
  { id: 'b10', customerId: 'C002', customerName: 'Faadumo Nuur Warsame', sqn: 'SQN-002', zone: 'Heliwaa', consumption: 58, totalAmount: 92.8, status: 'paid', readingDate: '2026-04-12', createdAt: { toDate: () => new Date('2026-04-12') } },
  { id: 'b11', customerId: 'C003', customerName: 'Maxamed Cabdi Jaamac', sqn: 'SQN-003', zone: 'Wadajir', consumption: 40, totalAmount: 64, status: 'paid', readingDate: '2026-04-10', createdAt: { toDate: () => new Date('2026-04-10') } },
  { id: 'b12', customerId: 'C005', customerName: 'Cabdilaahi Muuse', sqn: 'SQN-005', zone: 'Hodan', consumption: 65, totalAmount: 104, status: 'paid', readingDate: '2026-04-18', createdAt: { toDate: () => new Date('2026-04-18') } },
];

const mockCustomers = [
  { id: 'C001', name: 'Axmed Cali Hassan', sqn: 'SQN-001', zone: 'Hodan', status: 'Active', tel: '0615001001', createdOn: 'Jan 2025' },
  { id: 'C002', name: 'Faadumo Nuur Warsame', sqn: 'SQN-002', zone: 'Heliwaa', status: 'Active', tel: '0617002002', createdOn: 'Feb 2025' },
  { id: 'C003', name: 'Maxamed Cabdi Jaamac', sqn: 'SQN-003', zone: 'Wadajir', status: 'Active', tel: '0618003003', createdOn: 'Mar 2025' },
  { id: 'C004', name: 'Ubax Yusuf Ciise', sqn: 'SQN-004', zone: 'Kaxda', status: 'Inactive', tel: '0619004004', createdOn: 'Apr 2025' },
  { id: 'C005', name: 'Cabdilaahi Muuse', sqn: 'SQN-005', zone: 'Hodan', status: 'Active', tel: '0610005005', createdOn: 'May 2025' },
  { id: 'C006', name: 'Sahra Maxamed', sqn: 'SQN-006', zone: 'Heliwaa', status: 'Active', tel: '0611006006', createdOn: 'Jun 2025' },
  { id: 'C007', name: 'Cali Warsame Xirsi', sqn: 'SQN-007', zone: 'Wadajir', status: 'Active', tel: '0612007007', createdOn: 'Jul 2025' },
  { id: 'C008', name: 'Hawa Cabdi Nuur', sqn: 'SQN-008', zone: 'Kaxda', status: 'Inactive', tel: '0613008008', createdOn: 'Aug 2025' },
  { id: 'C009', name: 'Yusuf Axmed Xasan', sqn: 'SQN-009', zone: 'Hodan', status: 'Active', tel: '0614009009', createdOn: 'Sep 2025' },
  { id: 'C010', name: 'Nimco Faarax Cali', sqn: 'SQN-010', zone: 'Wadajir', status: 'Active', tel: '0615010010', createdOn: 'Oct 2025' },
];

const mockWells = [
  { id: 'w1', name: 'Heliwaa Well #1', location: 'Heliwaa District', status: 'active', production: '24,500 L/day', dailyOutput: 24500, uptime: 98 },
  { id: 'w2', name: 'Kaxda Well #2', location: 'Kaxda District', status: 'inactive', production: '0 L/day', dailyOutput: 0, uptime: 0 },
  { id: 'w3', name: 'Hodan Well #3', location: 'Hodan District', status: 'active', production: '18,200 L/day', dailyOutput: 18200, uptime: 95 },
  { id: 'w4', name: 'Wadajir Well #4', location: 'Wadajir District', status: 'active', production: '22,700 L/day', dailyOutput: 22700, uptime: 92 },
];

const mockPayments = [
  { id: 'p1', customerName: 'Axmed Cali Hassan', amount: 72, status: 'paid', method: 'Cash', date: '2026-05-15' },
  { id: 'p2', customerName: 'Maxamed Cabdi Jaamac', amount: 60.8, status: 'paid', method: 'EVC Plus', date: '2026-05-10' },
  { id: 'p3', customerName: 'Cabdilaahi Muuse', amount: 112, status: 'paid', method: 'Cash', date: '2026-05-18' },
  { id: 'p4', customerName: 'Cali Warsame Xirsi', amount: 136, status: 'paid', method: 'Zaad', date: '2026-04-28' },
  { id: 'p5', customerName: 'Faadumo Nuur Warsame', amount: 92.8, status: 'paid', method: 'EVC Plus', date: '2026-04-12' },
  { id: 'p6', customerName: 'Axmed Cali Hassan', amount: 80, status: 'paid', method: 'Cash', date: '2026-04-15' },
  { id: 'p7', customerName: 'Maxamed Cabdi Jaamac', amount: 64, status: 'paid', method: 'Zaad', date: '2026-04-10' },
  { id: 'p8', customerName: 'Cabdilaahi Muuse', amount: 104, status: 'paid', method: 'Cash', date: '2026-04-18' },
];

const monthlyData = [
  { month: 'Jan', production: 12000, revenue: 14500, billed: 15200, collected: 14500 },
  { month: 'Feb', production: 14000, revenue: 16200, billed: 17000, collected: 16200 },
  { month: 'Mar', production: 18000, revenue: 19800, billed: 21000, collected: 19800 },
  { month: 'Apr', production: 22000, revenue: 24500, billed: 26000, collected: 24500 },
  { month: 'May', production: 25000, revenue: 28900, billed: 30500, collected: 28900 },
  { month: 'Jun', production: 27000, revenue: 31200, billed: 33000, collected: 31200 },
];

// ─── TAB DEFINITIONS ────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'revenue', label: 'Revenue & Billing', icon: '💰' },
  { key: 'production', label: 'Production & Wells', icon: '🚰' },
  { key: 'customers', label: 'Customer Analytics', icon: '👥' },
  { key: 'collection', label: 'Collection Report', icon: '📋' },
  { key: 'statements', label: 'Statements', icon: '📁' },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [wells, setWells] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showWarning, setShowWarning] = useState(false);

  // ─── FETCH DATA ───────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        if (!db) throw new Error('No DB');

        const [billsSnap, custSnap, wellsSnap, paySnap] = await Promise.all([
          getDocs(collection(db, 'bills')),
          getDocs(collection(db, 'customers')),
          getDocs(collection(db, 'wells')),
          getDocs(collection(db, 'payments')),
        ]);

        setBills(billsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setWells(wellsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setShowWarning(false);
      } catch (err) {
        console.warn('Firebase fetch failed, using mock data:', err);
        setBills(mockBills);
        setCustomers(mockCustomers);
        setWells(mockWells);
        setPayments(mockPayments);
        setShowWarning(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── COMPUTED DATA ────────────────────────────────────────
  const totalRevenue = bills.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const totalBilled = bills.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const totalConsumption = bills.reduce((s, b) => s + Number(b.consumption || 0), 0);
  const outstandingBalance = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const collectionRate = totalBilled > 0 ? ((totalRevenue / totalBilled) * 100).toFixed(1) : '0';
  const activeWells = wells.filter(w => w.status === 'active').length;
  const activeCustomers = customers.filter(c => (c.status || '').toLowerCase() === 'active').length;
  const paidCount = bills.filter(b => b.status === 'paid').length;
  const unpaidCount = bills.filter(b => b.status === 'unpaid').length;
  const overdueCount = bills.filter(b => b.status === 'overdue').length;

  // Zone breakdown
  const zoneRevenue = {};
  const zoneConsumption = {};
  const zoneCustCount = {};
  bills.forEach(b => {
    const z = b.zone || 'Unknown';
    zoneRevenue[z] = (zoneRevenue[z] || 0) + Number(b.totalAmount || 0);
    zoneConsumption[z] = (zoneConsumption[z] || 0) + Number(b.consumption || 0);
  });
  customers.forEach(c => {
    const z = c.zone || 'Unknown';
    zoneCustCount[z] = (zoneCustCount[z] || 0) + 1;
  });

  // Top debtors
  const debtorMap = {};
  bills.filter(b => b.status !== 'paid').forEach(b => {
    const key = b.customerName || b.customerId;
    debtorMap[key] = (debtorMap[key] || 0) + Number(b.totalAmount || 0);
  });
  const topDebtors = Object.entries(debtorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top consumers
  const consumerMap = {};
  bills.forEach(b => {
    const key = b.customerName || b.customerId;
    consumerMap[key] = (consumerMap[key] || 0) + Number(b.consumption || 0);
  });
  const topConsumers = Object.entries(consumerMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Payment methods
  const methodMap = {};
  payments.forEach(p => {
    const m = p.method || 'Cash';
    methodMap[m] = (methodMap[m] || 0) + Number(p.amount || 0);
  });

  // Zone collection efficiency
  const zoneCollected = {};
  const zoneBilled = {};
  bills.forEach(b => {
    const z = b.zone || 'Unknown';
    zoneBilled[z] = (zoneBilled[z] || 0) + Number(b.totalAmount || 0);
    if (b.status === 'paid') {
      zoneCollected[z] = (zoneCollected[z] || 0) + Number(b.totalAmount || 0);
    }
  });

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* Offline Warning */}
      {showWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between gap-3 mb-5 animate-fade-in">
          <div className="flex gap-2.5 items-center">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Offline mode — mock data ayaa la isticmaalayaa.</p>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-[11px] font-bold text-amber-500 uppercase cursor-pointer">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 tracking-tight">Reports & Analytics</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Warbixinaha shirkadda biyaha iyo falanqeynta xogta</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[13px] text-gray-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer font-semibold transition-colors"
          >
            <option value="all">All Time</option>
            <option value="month">Bishaan</option>
            <option value="quarter">3 Bilood</option>
            <option value="year">Sannadkan</option>
          </select>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium text-[13px] rounded-md border border-gray-200 dark:border-slate-800 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 -mx-4 sm:mx-0">
        <div className="flex gap-1 overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Loading reports...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              totalRevenue={totalRevenue}
              totalBilled={totalBilled}
              totalConsumption={totalConsumption}
              outstandingBalance={outstandingBalance}
              collectionRate={collectionRate}
              activeWells={activeWells}
              wells={wells}
              customers={customers}
              activeCustomers={activeCustomers}
              paidCount={paidCount}
              unpaidCount={unpaidCount}
              overdueCount={overdueCount}
              bills={bills}
            />
          )}
          {activeTab === 'revenue' && (
            <RevenueTab
              totalRevenue={totalRevenue}
              totalBilled={totalBilled}
              outstandingBalance={outstandingBalance}
              collectionRate={collectionRate}
              zoneRevenue={zoneRevenue}
              topDebtors={topDebtors}
              paidCount={paidCount}
              unpaidCount={unpaidCount}
              overdueCount={overdueCount}
            />
          )}
          {activeTab === 'production' && (
            <ProductionTab
              wells={wells}
              totalConsumption={totalConsumption}
              totalBilled={totalBilled}
            />
          )}
          {activeTab === 'customers' && (
            <CustomerTab
              customers={customers}
              activeCustomers={activeCustomers}
              zoneCustCount={zoneCustCount}
              topConsumers={topConsumers}
              bills={bills}
            />
          )}
          {activeTab === 'collection' && (
            <CollectionTab
              totalRevenue={totalRevenue}
              totalBilled={totalBilled}
              collectionRate={collectionRate}
              zoneCollected={zoneCollected}
              zoneBilled={zoneBilled}
              methodMap={methodMap}
              payments={payments}
              bills={bills}
              overdueCount={overdueCount}
            />
          )}
          {activeTab === 'statements' && (
            <StatementsTab
              totalRevenue={totalRevenue}
              totalBilled={totalBilled}
              outstandingBalance={outstandingBalance}
              bills={bills}
              customers={customers}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── STAT CARD ──────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'orange', delay = 0, icon }) {
  const colorMap = {
    orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
    red: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30',
    amber: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm animate-fade-in-up transition-colors" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-slate-500 mb-2">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{value}</span>
          </div>
          {sub && <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 font-medium">{sub}</p>}
        </div>
        {icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>{icon}</div>}
      </div>
    </div>
  );
}

// ─── BAR CHART ──────────────────────────────────────────────
function HorizontalBar({ label, value, max, color = 'bg-orange-500', suffix = '', prefix = '' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 font-bold text-[12px] text-gray-600 dark:text-slate-300 truncate">{label}</span>
      <div className="flex-1 h-7 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden relative">
        <div className={`h-full ${color} transition-all duration-1000 ease-out rounded-r-lg`} style={{ width: `${Math.min(pct, 100)}%` }} />
        <span className="absolute inset-y-0 left-3 flex items-center text-[11px] font-bold text-gray-700 dark:text-slate-200">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
      </div>
    </div>
  );
}

// ─── MINI TABLE ─────────────────────────────────────────────
function MiniTable({ headers, rows, emptyText = 'Xog ma jirto' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40">
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="py-8 text-center text-[13px] text-gray-400 dark:text-slate-550">{emptyText}</td></tr>
          ) : rows}
        </tbody>
      </table>
    </div>
  );
}

// ─── STATUS BADGE ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    unpaid: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
    overdue: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    inactive: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
  };
  const labels = { paid: 'La Bixiyay', unpaid: 'La Sugayo', overdue: 'Waa Dhaafay', active: 'Active', inactive: 'Inactive' };
  const s = (status || '').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[s] || map.unpaid}`}>
      {labels[s] || status}
    </span>
  );
}

// ─── SECTION CARD ───────────────────────────────────────────
function Section({ title, subtitle, children, delay = 0 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm animate-fade-in-up transition-colors overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          {title && <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── DONUT / PIE VISUAL ─────────────────────────────────────
function DonutVisual({ items, total }) {
  const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        return (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]} shrink-0`} />
            <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300 flex-1">{item.label}</span>
            <span className="text-[12px] font-bold text-gray-900 dark:text-slate-100">{typeof item.value === 'number' ? `$${item.value.toFixed(2)}` : item.value}</span>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 w-12 text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════
function OverviewTab({ totalRevenue, totalBilled, totalConsumption, outstandingBalance, collectionRate, activeWells, wells, customers, activeCustomers, paidCount, unpaidCount, overdueCount, bills }) {
  const maxProd = Math.max(...monthlyData.map(m => m.production));
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Dakhliga Guud" value={`$${totalRevenue.toLocaleString()}`} sub="Total collected" color="emerald" delay={0} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="La Biiliyay" value={`$${totalBilled.toLocaleString()}`} sub="Total billed" color="blue" delay={50} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>} />
        <StatCard label="Isticmaalka" value={`${totalConsumption.toLocaleString()} m³`} sub="Total consumption" color="orange" delay={100} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 007-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 007 7z" /></svg>} />
        <StatCard label="La Sugayo" value={`$${outstandingBalance.toLocaleString()}`} sub="Outstanding" color="red" delay={150} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>} />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} sub="Efficiency" color="purple" delay={200} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
        <StatCard label="Ceelasha Active" value={`${activeWells}/${wells.length}`} sub={`${customers.length} macmiil`} color="amber" delay={250} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Production */}
        <Section title="Wax Soo Saarka Bishii" subtitle="Monthly production capacity" delay={100} >
          <div className="space-y-3">
            {monthlyData.map((m) => (
              <HorizontalBar key={m.month} label={m.month} value={m.production} max={maxProd} suffix=" L" />
            ))}
          </div>
        </Section>

        {/* Revenue Trend */}
        <Section title="Dakhliga Bishii" subtitle="Monthly revenue" delay={150}>
          <div className="space-y-3">
            {monthlyData.map((m) => (
              <HorizontalBar key={m.month} label={m.month} value={m.revenue} max={Math.max(...monthlyData.map(x => x.revenue))} prefix="$" color="bg-emerald-500" />
            ))}
          </div>
        </Section>

        {/* Payment Status */}
        <Section title="Xaaladda Lacag Bixinta" subtitle="Payment status distribution" delay={200}>
          <div className="space-y-4 mt-2">
            <DonutVisual
              total={paidCount + unpaidCount + overdueCount}
              items={[
                { label: 'La Bixiyay (Paid)', value: paidCount },
                { label: 'La Sugayo (Pending)', value: unpaidCount },
                { label: 'Waa Dhaafay (Overdue)', value: overdueCount },
              ]}
            />
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">Wadarta Bills</span>
                <span className="text-lg font-extrabold text-gray-900 dark:text-slate-100">{paidCount + unpaidCount + overdueCount}</span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Quick Alerts */}
      {overdueCount > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-800 dark:text-red-300">Digniin: {overdueCount} biil oo waqtigoodu dhaafay</h4>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">Wadarta lacag la sugayo: ${outstandingBalance.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: REVENUE & BILLING
// ═══════════════════════════════════════════════════════════
function RevenueTab({ totalRevenue, totalBilled, outstandingBalance, collectionRate, zoneRevenue, topDebtors, paidCount, unpaidCount, overdueCount }) {
  const maxZone = Math.max(...Object.values(zoneRevenue), 1);
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wadarta La Biiliyay" value={`$${totalBilled.toLocaleString()}`} sub="All bills issued" color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>} />
        <StatCard label="La Ururiyay" value={`$${totalRevenue.toLocaleString()}`} sub="Collected amount" color="emerald" delay={50} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>} />
        <StatCard label="La Sugayo" value={`$${outstandingBalance.toLocaleString()}`} sub="Unpaid balance" color="red" delay={100} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>} />
        <StatCard label="Collection %" value={`${collectionRate}%`} sub="Efficiency rate" color="purple" delay={150} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Zone */}
        <Section title="Dakhliga Degmada" subtitle="Revenue breakdown by zone">
          <div className="space-y-3">
            {Object.entries(zoneRevenue).sort((a, b) => b[1] - a[1]).map(([zone, rev]) => (
              <HorizontalBar key={zone} label={zone} value={rev} max={maxZone} prefix="$" color="bg-blue-500" />
            ))}
          </div>
        </Section>

        {/* Monthly Revenue Trend */}
        <Section title="Isbedelka Dakhliga" subtitle="Monthly revenue trend" delay={100}>
          <div className="space-y-3">
            {monthlyData.map((m) => (
              <HorizontalBar key={m.month} label={m.month} value={m.revenue} max={Math.max(...monthlyData.map(x => x.revenue))} prefix="$" color="bg-emerald-500" />
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Debtors */}
        <Section title="Macaamiisha Deynta ugu Badan" subtitle="Top outstanding balances" delay={150}>
          <MiniTable
            headers={['Macmiil', 'Deynta']}
            rows={topDebtors.map(([name, amount], i) => (
              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-[12.5px] font-semibold text-gray-800 dark:text-slate-200">{name}</td>
                <td className="px-4 py-3 text-[12.5px] font-bold text-red-600 dark:text-red-400">${amount.toFixed(2)}</td>
              </tr>
            ))}
            emptyText="Deyn ma jirto — waad ku mahadsan tahay!"
          />
        </Section>

        {/* Bill Status Distribution */}
        <Section title="Qaybinta Xaaladda" subtitle="Payment status breakdown" delay={200}>
          <DonutVisual
            total={paidCount + unpaidCount + overdueCount}
            items={[
              { label: 'Paid', value: paidCount },
              { label: 'Pending', value: unpaidCount },
              { label: 'Overdue', value: overdueCount },
            ]}
          />
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="text-center">
              <p className="text-lg font-extrabold text-emerald-600">{paidCount}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-amber-600">{unpaidCount}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-red-600">{overdueCount}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Overdue</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 3: PRODUCTION & WELLS
// ═══════════════════════════════════════════════════════════
function ProductionTab({ wells, totalConsumption, totalBilled }) {
  const maxOutput = Math.max(...wells.map(w => w.dailyOutput || 0), 1);
  const totalDailyOutput = wells.reduce((s, w) => s + (w.dailyOutput || 0), 0);
  const monthlyCapacity = totalDailyOutput * 30;
  const waterLoss = monthlyCapacity > 0 ? (((monthlyCapacity - totalConsumption) / monthlyCapacity) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wax Soo Saarka Maalintii" value={`${totalDailyOutput.toLocaleString()} L`} sub="Daily total output" color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 007-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 007 7z" /></svg>} />
        <StatCard label="Awooda Bishii" value={`${monthlyCapacity.toLocaleString()} L`} sub="Monthly capacity" color="orange" delay={50} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
        <StatCard label="Ceelasha Active" value={`${wells.filter(w => w.status === 'active').length} / ${wells.length}`} sub="Active wells" color="emerald" delay={100} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Biyaha Lumay" value={`${waterLoss}%`} sub="Estimated water loss" color={Number(waterLoss) > 20 ? 'red' : 'amber'} delay={150} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-well Performance */}
        <Section title="Wax Soo Saarka Ceel Walba" subtitle="Daily output comparison">
          <div className="space-y-3">
            {wells.sort((a, b) => (b.dailyOutput || 0) - (a.dailyOutput || 0)).map(w => (
              <HorizontalBar key={w.id} label={w.name?.replace(' Well', '').replace(' #', '-') || 'Well'} value={w.dailyOutput || 0} max={maxOutput} suffix=" L" color={w.status === 'active' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'} />
            ))}
          </div>
        </Section>

        {/* Well Uptime */}
        <Section title="Shaqeynta Ceelasha" subtitle="Well uptime percentage" delay={100}>
          <div className="space-y-3">
            {wells.map(w => (
              <div key={w.id} className="flex items-center gap-3">
                <span className="w-24 text-[12px] font-bold text-gray-600 dark:text-slate-300 truncate">{w.name?.split(' #')[0] || 'Well'}</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${(w.uptime || 0) >= 90 ? 'bg-emerald-500' : (w.uptime || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${w.uptime || 0}%` }}
                  />
                </div>
                <span className="text-[12px] font-bold text-gray-800 dark:text-slate-200 w-12 text-right">{w.uptime || 0}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Well Details Table */}
      <Section title="Faahfaahinta Ceelasha" subtitle="Detailed well information" delay={150}>
        <MiniTable
          headers={['Ceel', 'Goob', 'Xaalad', 'Wax Soo Saar', 'Uptime']}
          rows={wells.map(w => (
            <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 text-[12.5px] font-semibold text-gray-800 dark:text-slate-200">{w.name}</td>
              <td className="px-4 py-3 text-[12.5px] text-gray-500 dark:text-slate-400">{w.location}</td>
              <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
              <td className="px-4 py-3 text-[12.5px] font-bold text-blue-600 dark:text-blue-400">{w.production}</td>
              <td className="px-4 py-3 text-[12.5px] font-bold text-gray-800 dark:text-slate-200">{w.uptime || 0}%</td>
            </tr>
          ))}
        />
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 4: CUSTOMER ANALYTICS
// ═══════════════════════════════════════════════════════════
function CustomerTab({ customers, activeCustomers, zoneCustCount, topConsumers, bills }) {
  const inactiveCustomers = customers.length - activeCustomers;
  const avgConsumption = bills.length > 0 ? (bills.reduce((s, b) => s + Number(b.consumption || 0), 0) / new Set(bills.map(b => b.customerId)).size).toFixed(1) : 0;
  const maxZoneCust = Math.max(...Object.values(zoneCustCount), 1);
  const maxConsumer = topConsumers.length > 0 ? topConsumers[0][1] : 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Macaamiisha Guud" value={customers.length} sub="All registered" color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
        <StatCard label="Active" value={activeCustomers} sub={`${inactiveCustomers} inactive`} color="emerald" delay={50} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Celcelis Isticmaal" value={`${avgConsumption} m³`} sub="Per customer average" color="orange" delay={100} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 007-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 007 7z" /></svg>} />
        <StatCard label="Degmooyinka" value={Object.keys(zoneCustCount).length} sub="Active zones" color="purple" delay={150} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers by Zone */}
        <Section title="Macaamiisha Degmada" subtitle="Customer distribution by zone">
          <div className="space-y-3">
            {Object.entries(zoneCustCount).sort((a, b) => b[1] - a[1]).map(([zone, count]) => (
              <HorizontalBar key={zone} label={zone} value={count} max={maxZoneCust} suffix=" macmiil" color="bg-purple-500" />
            ))}
          </div>
        </Section>

        {/* Top Consumers */}
        <Section title="Isticmaalayaasha ugu Badan" subtitle="Highest water consumption" delay={100}>
          <div className="space-y-3">
            {topConsumers.map(([name, consumption], i) => (
              <HorizontalBar key={i} label={name.split(' ')[0]} value={consumption} max={maxConsumer} suffix=" m³" color="bg-orange-500" />
            ))}
          </div>
        </Section>
      </div>

      {/* Active vs Inactive */}
      <Section title="Xaaladda Macaamiisha" subtitle="Active vs Inactive breakdown" delay={150}>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">Active</span>
              <span className="text-[12px] font-bold text-emerald-600 ml-auto">{activeCustomers} ({customers.length > 0 ? ((activeCustomers / customers.length) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${customers.length > 0 ? (activeCustomers / customers.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">Inactive</span>
              <span className="text-[12px] font-bold text-red-600 ml-auto">{inactiveCustomers} ({customers.length > 0 ? ((inactiveCustomers / customers.length) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${customers.length > 0 ? (inactiveCustomers / customers.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </Section>

      {/* Customer List */}
      <Section title="Liiska Macaamiisha" subtitle={`${customers.length} macmiil oo la diiwaangeliyay`} delay={200}>
        <MiniTable
          headers={['Magac', 'SQN', 'Degmo', 'Tel', 'Xaalad']}
          rows={customers.slice(0, 10).map(c => (
            <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 text-[12.5px] font-semibold text-gray-800 dark:text-slate-200">{c.name}</td>
              <td className="px-4 py-3 text-[12.5px] font-mono text-gray-500 dark:text-slate-400">{c.sqn}</td>
              <td className="px-4 py-3 text-[12.5px] text-gray-600 dark:text-slate-350">{c.zone}</td>
              <td className="px-4 py-3 text-[12.5px] text-gray-500 dark:text-slate-400">{c.tel}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
            </tr>
          ))}
        />
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 5: COLLECTION REPORT
// ═══════════════════════════════════════════════════════════
function CollectionTab({ totalRevenue, totalBilled, collectionRate, zoneCollected, zoneBilled, methodMap, payments, bills, overdueCount }) {
  const totalMethodAmount = Object.values(methodMap).reduce((s, v) => s + v, 0);

  // Aging analysis
  const now = new Date();
  const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  bills.filter(b => b.status !== 'paid').forEach(b => {
    let billDate;
    if (b.createdAt?.toDate) billDate = b.createdAt.toDate();
    else if (b.readingDate) billDate = new Date(b.readingDate);
    else billDate = now;
    const days = Math.floor((now - billDate) / (1000 * 60 * 60 * 24));
    if (days <= 30) aging['0-30'] += Number(b.totalAmount || 0);
    else if (days <= 60) aging['31-60'] += Number(b.totalAmount || 0);
    else if (days <= 90) aging['61-90'] += Number(b.totalAmount || 0);
    else aging['90+'] += Number(b.totalAmount || 0);
  });
  const maxAging = Math.max(...Object.values(aging), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="La Ururiyay" value={`$${totalRevenue.toLocaleString()}`} sub="Total collected" color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>} />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} sub="Efficiency" color="purple" delay={50} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
        <StatCard label="Biilal Overdue" value={overdueCount} sub="Past due" color="red" delay={100} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>} />
        <StatCard label="Lacag Bixinooyinka" value={payments.length} sub="Total payments" color="blue" delay={150} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Collection Efficiency */}
        <Section title="Ururinta Degmada" subtitle="Collection efficiency by zone">
          <div className="space-y-4">
            {Object.keys(zoneBilled).sort((a, b) => (zoneCollected[b] || 0) - (zoneCollected[a] || 0)).map(zone => {
              const billed = zoneBilled[zone] || 0;
              const collected = zoneCollected[zone] || 0;
              const pct = billed > 0 ? ((collected / billed) * 100).toFixed(0) : 0;
              return (
                <div key={zone}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-gray-700 dark:text-slate-300">{zone}</span>
                    <span className={`text-[11px] font-bold ${Number(pct) >= 80 ? 'text-emerald-600' : Number(pct) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${Number(pct) >= 80 ? 'bg-emerald-500' : Number(pct) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">Billed: ${billed.toFixed(0)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">Collected: ${collected.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Payment Methods */}
        <Section title="Habka Lacag Bixinta" subtitle="Payment method breakdown" delay={100}>
          <DonutVisual
            total={totalMethodAmount}
            items={Object.entries(methodMap).sort((a, b) => b[1] - a[1]).map(([method, amount]) => ({
              label: method,
              value: amount,
            }))}
          />
        </Section>
      </div>

      {/* Aging Analysis */}
      <Section title="Falanqeynta Da'da Deynta" subtitle="Outstanding bills aging analysis" delay={150}>
        <div className="space-y-3">
          {Object.entries(aging).map(([range, amount]) => (
            <HorizontalBar key={range} label={`${range} maalmood`} value={amount} max={maxAging} prefix="$" color={range === '90+' ? 'bg-red-500' : range === '61-90' ? 'bg-orange-500' : range === '31-60' ? 'bg-amber-500' : 'bg-emerald-500'} />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">Wadarta Deynta</span>
          <span className="text-lg font-extrabold text-red-600 dark:text-red-400">${Object.values(aging).reduce((s, v) => s + v, 0).toFixed(2)}</span>
        </div>
      </Section>

      {/* Recent Payments */}
      <Section title="Lacag Bixinooyinkii Ugu Dambeeyay" subtitle="Latest payment transactions" delay={200}>
        <MiniTable
          headers={['Macmiil', 'Lacag', 'Hab', 'Taariikhda', 'Xaalad']}
          rows={payments.slice(0, 8).map((p, i) => (
            <tr key={p.id || i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 text-[12.5px] font-semibold text-gray-800 dark:text-slate-200">{p.customerName}</td>
              <td className="px-4 py-3 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400">${Number(p.amount).toFixed(2)}</td>
              <td className="px-4 py-3 text-[12.5px] text-gray-600 dark:text-slate-400">{p.method || 'Cash'}</td>
              <td className="px-4 py-3 text-[12.5px] text-gray-500 dark:text-slate-400">{p.date || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
            </tr>
          ))}
        />
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 6: STATEMENTS
// ═══════════════════════════════════════════════════════════
function StatementsTab({ totalRevenue, totalBilled, outstandingBalance, bills, customers }) {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchCust, setSearchCust] = useState('');

  const totalExpenses = totalRevenue * 0.35; // Estimated operating costs 35%
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Filter bills for selected customer
  const filteredBills = selectedCustomer
    ? bills.filter(b => b.customerId === selectedCustomer || b.customerName === selectedCustomer)
    : bills;

  const filteredCustomers = searchCust
    ? customers.filter(c => c.name.toLowerCase().includes(searchCust.toLowerCase()) || (c.sqn || '').toLowerCase().includes(searchCust.toLowerCase()))
    : customers.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* P&L Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Dakhli Guud" value={`$${totalRevenue.toLocaleString()}`} sub="Total income" color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>} />
        <StatCard label="Kharashka" value={`$${totalExpenses.toLocaleString()}`} sub="Estimated expenses (35%)" color="red" delay={50} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>} />
        <StatCard label="Faa'iido Saafi" value={`$${netProfit.toLocaleString()}`} sub="Net profit" color={netProfit >= 0 ? 'emerald' : 'red'} delay={100} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Profit Margin" value={`${profitMargin}%`} sub="Margin percentage" color="purple" delay={150} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
      </div>

      {/* P&L Statement */}
      <Section title="Xisaabta Faa'iidada iyo Khasaaraha" subtitle="Profit & Loss summary">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-[13px] font-semibold text-gray-700 dark:text-slate-300">Dakhli (Revenue)</span>
            <span className="text-[13px] font-bold text-emerald-600">${totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-gray-200 dark:border-slate-700">
            <span className="text-[12px] text-gray-500 dark:text-slate-400">La bixiyay (Collected)</span>
            <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">${totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-gray-200 dark:border-slate-700">
            <span className="text-[12px] text-gray-500 dark:text-slate-400">La sugayo (Outstanding)</span>
            <span className="text-[12px] font-semibold text-amber-600">${outstandingBalance.toFixed(2)}</span>
          </div>
          <div className="w-full h-px bg-gray-200 dark:bg-slate-700 my-2" />
          <div className="flex justify-between items-center py-2">
            <span className="text-[13px] font-semibold text-gray-700 dark:text-slate-300">Kharashka (Expenses)</span>
            <span className="text-[13px] font-bold text-red-600">-${totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-gray-200 dark:border-slate-700">
            <span className="text-[12px] text-gray-500 dark:text-slate-400">Shaqaalaha & Hawlgallada</span>
            <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">-${(totalExpenses * 0.6).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-gray-200 dark:border-slate-700">
            <span className="text-[12px] text-gray-500 dark:text-slate-400">Dayactirka & Qalabka</span>
            <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">-${(totalExpenses * 0.25).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-gray-200 dark:border-slate-700">
            <span className="text-[12px] text-gray-500 dark:text-slate-400">Kharashyada Kale</span>
            <span className="text-[12px] font-semibold text-gray-700 dark:text-slate-300">-${(totalExpenses * 0.15).toFixed(2)}</span>
          </div>
          <div className="w-full h-px bg-gray-900 dark:bg-slate-300 my-2" />
          <div className="flex justify-between items-center py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-4">
            <span className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Faa'iido Saafi (Net Profit)</span>
            <span className={`text-[16px] font-extrabold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${netProfit.toFixed(2)}</span>
          </div>
        </div>
      </Section>

      {/* Customer Statement Lookup */}
      <Section title="Xisaabta Macmiilka" subtitle="Look up individual customer statement" delay={100}>
        <div className="space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              type="text"
              placeholder="Raadi macmiilka (magac ama SQN)..."
              value={searchCust}
              onChange={e => { setSearchCust(e.target.value); setSelectedCustomer(''); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-[13px] text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {!selectedCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c.name); setSearchCust(c.name); }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-[11px] font-bold text-orange-600 shrink-0">
                    {c.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-800 dark:text-slate-200">{c.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">SQN: {c.sqn} • {c.zone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">{selectedCustomer} — Statement</h4>
                <button onClick={() => { setSelectedCustomer(''); setSearchCust(''); }} className="text-[11px] font-bold text-orange-500 cursor-pointer hover:text-orange-600">Nadiifi</button>
              </div>
              <MiniTable
                headers={['Taariikhda', 'Isticmaal', 'Lacag', 'Xaalad']}
                rows={filteredBills.map((b, i) => (
                  <tr key={b.id || i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-[12.5px] text-gray-700 dark:text-slate-300">{b.readingDate || '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] font-bold text-blue-600 dark:text-blue-400">{Number(b.consumption || 0).toFixed(2)} m³</td>
                    <td className="px-4 py-3 text-[12.5px] font-bold text-gray-800 dark:text-slate-100">${Number(b.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
                emptyText="Macmiilkan xisaab ma laha"
              />
              {filteredBills.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">Wadarta</span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-slate-100">${filteredBills.reduce((s, b) => s + Number(b.totalAmount || 0), 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Monthly Summary */}
      <Section title="Kooban Bishii" subtitle="Monthly financial summary" delay={150}>
        <MiniTable
          headers={['Bil', 'Wax Soo Saar', 'La Biiliyay', 'La Ururiyay', 'Collection %']}
          rows={monthlyData.map((m, i) => {
            const pct = m.billed > 0 ? ((m.collected / m.billed) * 100).toFixed(0) : 0;
            return (
              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-[12.5px] font-bold text-gray-800 dark:text-slate-200">{m.month}</td>
                <td className="px-4 py-3 text-[12.5px] text-blue-600 dark:text-blue-400 font-semibold">{m.production.toLocaleString()} L</td>
                <td className="px-4 py-3 text-[12.5px] text-gray-700 dark:text-slate-300">${m.billed.toLocaleString()}</td>
                <td className="px-4 py-3 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400">${m.collected.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${Number(pct) >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'}`}>
                    {pct}%
                  </span>
                </td>
              </tr>
            );
          })}
        />
      </Section>
    </div>
  );
}
