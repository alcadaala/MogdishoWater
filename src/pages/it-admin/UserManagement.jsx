import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const initialMockUsers = [
  { id: 'u-1', fullName: 'ILmix Agency', email: 'manager@mogdishowater.com', role: 'it_admin', createdOn: 'Jun 1, 2026' },
  { id: 'u-2', fullName: 'Darrell Steward', email: 'darrell@example.com', role: 'billing', createdOn: 'May 9, 2026' },
  { id: 'u-3', fullName: 'Ralph Edwards', email: 'ralph@example.com', role: 'billing', createdOn: 'Apr 28, 2026' },
  { id: 'u-4', fullName: 'Leslie Alexander', email: 'leslie@example.com', role: 'billing', createdOn: 'Dec 19, 2025' }
];

const initialMockWells = [
  { id: 'well-1', name: 'Heliwaa Well #1', location: 'Heliwaa District', status: 'active', production: '24,500 L/day' },
  { id: 'well-2', name: 'Kaxda Well #2', location: 'Kaxda District', status: 'inactive', production: '0 L/day' },
  { id: 'well-3', name: 'Hodan Well #3', location: 'Hodan District', status: 'active', production: '18,200 L/day' },
  { id: 'well-4', name: 'Wadajir Well #4', location: 'Wadajir District', status: 'active', production: '22,700 L/day' }
];

export default function UserManagement() {
  const [usersList, setUsersList] = useState([]);
  const [wellsList, setWellsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Well Modal states
  const [isWellModalOpen, setIsWellModalOpen] = useState(false);
  const [wellName, setWellName] = useState('');
  const [wellLocation, setWellLocation] = useState('');
  const [wellProduction, setWellProduction] = useState('');
  const [wellStatus, setWellStatus] = useState('active');
  const [wellErrors, setWellErrors] = useState({});

  useEffect(() => {
    if (!db) {
      setUsersList(initialMockUsers);
      setWellsList(initialMockWells);
      setShowWarning(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to users collection in real-time
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = 'June 5, 2026';
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            formattedDate = data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } else if (data.createdAt.seconds) {
            formattedDate = new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
        const roleVal = data.role || 'billing';
        return {
          id: doc.id,
          fullName: data.fullName || 'Unnamed User',
          email: data.email || '',
          role: roleVal === 'it-admin' ? 'it_admin' : roleVal,
          status: data.status || 'approved',
          createdOn: formattedDate
        };
      });
      setUsersList(usersData);
      setShowWarning(false);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore access denied for users:", error);
      setUsersList(initialMockUsers);
      setShowWarning(true);
      setLoading(false);
    });

    // Subscribe to wells collection in real-time
    const unsubscribeWells = onSnapshot(collection(db, 'wells'), (snapshot) => {
      const wellsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWellsList(wellsData);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore access denied for wells:", error);
      setWellsList(initialMockWells);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeWells();
    };
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    // 1. Update local state instantly (Optimistic UI updates)
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    // 2. Persist in database
    if (db && !showWarning) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          role: newRole
        });
      } catch (err) {
        console.error("Failed to update user role in Firestore:", err);
        alert("Could not update user role. Checking your Firestore Rules.");
      }
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    // 1. Update local state instantly (Optimistic UI updates)
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));

    // 2. Persist in database
    if (db && !showWarning) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: newStatus
        });
      } catch (err) {
        console.error("Failed to update user status in Firestore:", err);
        alert("Could not update user status. Checking your Firestore Rules.");
      }
    }
  };

  const handleAddWell = async (e) => {
    e.preventDefault();
    setWellErrors({});

    // Validations
    const errs = {};
    if (!wellName.trim()) errs.name = 'Well name is required';
    if (!wellLocation.trim()) errs.location = 'Location is required';
    if (!wellProduction.trim()) errs.production = 'Production capacity is required';

    if (Object.keys(errs).length > 0) {
      setWellErrors(errs);
      return;
    }

    const newWell = {
      name: wellName.trim(),
      location: wellLocation.trim(),
      production: wellProduction.trim(),
      status: wellStatus,
      createdAt: serverTimestamp()
    };

    // Optimistic local state update
    const tempId = `local-well-${Date.now()}`;
    setWellsList(prev => [...prev, { id: tempId, ...newWell, production: `${newWell.production} L/day` }]);

    if (db && !showWarning) {
      try {
        await addDoc(collection(db, 'wells'), newWell);
      } catch (err) {
        console.error("Failed to register well in Firestore:", err);
      }
    }

    // Reset fields & Close modal
    setWellName('');
    setWellLocation('');
    setWellProduction('');
    setWellStatus('active');
    setIsWellModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 tracking-tight">IT Administration Portal</h2>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Manage system user access roles and water well registries</p>
      </div>

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

      {/* Grid: Left: Users management, Right: Wells configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* User Role Matrix */}
        <div className="lg:col-span-3 admin-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-colors">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">User Access Control</h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Assign roles and verify system registrations</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
                  <th className="table-th text-[11px] font-semibold text-gray-400 dark:text-slate-400">User / Details</th>
                  <th className="table-th text-[11px] font-semibold text-gray-400 dark:text-slate-400">Created On</th>
                  <th className="table-th text-[11px] font-semibold text-gray-400 dark:text-slate-400">Access Role</th>
                  <th className="table-th text-[11px] font-semibold text-gray-400 dark:text-slate-400">Status</th>
                  <th className="table-th text-right px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 dark:text-slate-200 text-[13px]">{user.fullName}</span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-500 dark:text-slate-400 text-[13px]">{user.createdOn}</td>
                    <td className="py-4 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-800 dark:text-slate-250 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
                      >
                        <option value="billing">Billing Manager</option>
                        <option value="it_admin">IT Administrator</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      {user.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {user.status !== 'approved' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'approved')}
                          className="px-3 py-1.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          Approve Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'pending')}
                          className="px-3 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 dark:text-slate-400 hover:text-red-550 dark:hover:text-red-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wells Configuration */}
        <div className="lg:col-span-2 admin-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between transition-colors">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Wells Registry</h3>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Manage water source locations</p>
              </div>
              <button
                onClick={() => setIsWellModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Register
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {wellsList.map((well) => (
                <div key={well.id} className="p-4 flex items-center justify-between hover:bg-gray-50/40 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1">
                    <p className="text-[13px] font-bold text-gray-800 dark:text-slate-200">{well.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-450 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                      {well.location}
                    </p>
                  </div>

                  <div className="text-right space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-700 dark:text-slate-300">{well.production}</p>
                    <span className={`badge ${well.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${well.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {well.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Well Registration Dialog Modal */}
      {isWellModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-850 shadow-xl max-w-sm w-full p-6 animate-scale-in transition-colors duration-200">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Register New Water Well</h3>
              <button
                onClick={() => { setIsWellModalOpen(false); setWellErrors({}); }}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-350 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddWell} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Well Name</label>
                <input
                  type="text"
                  placeholder="e.g. Heliwaa Well #2"
                  value={wellName}
                  onChange={(e) => setWellName(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${wellErrors.name ? 'border-red-500' : ''} rounded-xl`}
                />
                {wellErrors.name && <p className="text-xs text-red-500 mt-1">{wellErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Location District</label>
                <input
                  type="text"
                  placeholder="e.g. Heliwaa District"
                  value={wellLocation}
                  onChange={(e) => setWellLocation(e.target.value)}
                  className={`admin-input w-full px-3.5 py-2.5 border ${wellErrors.location ? 'border-red-500' : ''} rounded-xl`}
                />
                {wellErrors.location && <p className="text-xs text-red-500 mt-1">{wellErrors.location}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Yield (L/day)</label>
                  <input
                    type="text"
                    placeholder="e.g. 25,000"
                    value={wellProduction}
                    onChange={(e) => setWellProduction(e.target.value)}
                    className={`admin-input w-full px-3.5 py-2.5 border ${wellErrors.production ? 'border-red-500' : ''} rounded-xl`}
                  />
                  {wellErrors.production && <p className="text-xs text-red-500 mt-1">{wellErrors.production}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Initial Status</label>
                  <select
                    value={wellStatus}
                    onChange={(e) => setWellStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-850 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsWellModalOpen(false); setWellErrors({}); }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-350 text-[13px] font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
