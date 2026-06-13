import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/config';
import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';
import Dashboard from './pages/Dashboard';
import Billing from './pages/billing/Billing';
import Invoices from './pages/billing/Invoices';
import Reports from './pages/billing/Reports';
import Login from './pages/Login';
import UserManagement from './pages/it-admin/UserManagement';
import Adjustment from './pages/billing/Adjustment';
import ZoneLocation from './pages/billing/ZoneLocation';
import BillInfo from './pages/billing/BillInfo';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('billing');
  const [userStatus, setUserStatus] = useState('approved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (db) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const roleVal = userDoc.data().role || 'billing';
              setUserRole(roleVal === 'it-admin' ? 'it_admin' : roleVal);
              setUserStatus(userDoc.data().status || 'approved');
            } else {
              // Automatically write user document to the users collection if missing
              await setDoc(userDocRef, {
                uid: currentUser.uid,
                fullName: currentUser.displayName || 'Mogdisho Manager',
                email: currentUser.email,
                role: 'billing',
                status: 'pending',
                createdAt: serverTimestamp()
              });
              setUserRole('billing');
              setUserStatus('pending');
            }
          } catch (e) {
            console.warn("Error checking/creating user document in Firestore:", e);
            setUserRole('billing');
            setUserStatus('approved');
          }
        } else {
          setUserRole('billing');
          setUserStatus('approved');
        }
      } else {
        setUser(null);
        setUserRole('billing');
        setUserStatus('approved');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shadow-md animate-pulse">
            <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Loading Mogadishu Water...</span>
        </div>
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show Pending Approval view if user is authenticated but not approved yet
  if (userStatus !== 'approved') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-250 font-sans relative overflow-hidden">
        {/* Glowing Background Blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-400/5 dark:bg-orange-900/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-400/5 dark:bg-blue-900/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6 animate-scale-in">
          {/* Hourglass Icon */}
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Codsigaaga Waa Pendi (Pending Approval)</h2>
            <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
              Cinwaankaaga <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[12px] font-semibold text-gray-700 dark:text-slate-300 font-mono">{user.email}</code> weli lama oggolaan. Fadlan sug inta maamulaha (IT Administrator) uu ka oggolaanayo helitaanka nidaamka.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 flex flex-col gap-3">
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-750 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Ka Bax Nidaamka (Sign Out)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <Sidebar userRole={userRole} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <Routes>
              {userRole === 'it_admin' ? (
                <>
                  <Route path="/" element={<UserManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/billing" element={<BillInfo />} />
                  <Route path="/billing/info" element={<BillInfo />} />
                  <Route path="/billing/adjustment" element={<Adjustment />} />
                  <Route path="/billing/zones" element={<ZoneLocation />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/reports" element={<Reports />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
