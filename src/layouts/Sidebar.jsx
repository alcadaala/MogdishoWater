import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navGroups = [
  {
    label: 'MOGADISHO WATER',
    items: [
      { 
        name: 'Dashboard', 
        path: '/', 
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        )
      },
      { 
        name: 'Billing', 
        path: '/billing', 
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        ),
        subItems: [
          { name: 'Bill Info', path: '/billing/info' },
          { name: 'Qiimeyn', path: '/billing/adjustment' },
          { name: 'Ref Zone Location', path: '/billing/zones' }
        ]
      },
      { 
        name: 'Invoices', 
        path: '/invoices', 
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        )
      },
      { 
        name: 'Reports', 
        path: '/reports', 
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.625c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.75v-5.625zM10.125 9c-.621 0-1.125.504-1.125 1.125v8.625c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V10.125c0-.621-.504-1.125-1.125-1.125h-2.25zM17.25 4.5c-.621 0-1.125.504-1.125 1.125v13.125c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125h-2.25z" />
          </svg>
        )
      }
    ]
  }
];

export default function Sidebar({ userRole }) {
  const location = useLocation();
  const [billingExpanded, setBillingExpanded] = useState(
    location.pathname.startsWith('/billing')
  );

  useEffect(() => {
    if (location.pathname.startsWith('/billing')) {
      setBillingExpanded(true);
    }
  }, [location.pathname]);

  const activeNavGroups = userRole === 'it_admin'
    ? [
        {
          label: 'IT ADMIN',
          items: [
            { 
              name: 'User Management', 
              path: '/users', 
              icon: (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.005 9.005 0 00-12 0M12 10a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              )
            }
          ]
        }
      ]
    : navGroups;

  return (
    <aside className="w-[260px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen overflow-y-auto flex-shrink-0 flex flex-col transition-colors duration-200">
      {/* Brand Logo Header */}
      <div className="h-[70px] border-b border-gray-200 dark:border-slate-800 px-5 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold text-gray-900 dark:text-slate-100 tracking-tight leading-tight">Mogdisho Water</span>
        </div>
        <button className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 lg:hidden">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 py-5">
        {activeNavGroups.map((group, gIdx) => (
          <div key={gIdx} className="mb-6">
            <p className="px-5 mb-3 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {group.label}
            </p>
            <ul className="space-y-0.5 px-3">
              {group.items.map((item, iIdx) => {
                const isParentActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path);

                const isActive = location.pathname === item.path || (item.path === '/users' && location.pathname === '/');

                return (
                  <li key={iIdx}>
                    {item.subItems ? (
                      <div>
                        <button
                          onClick={() => setBillingExpanded(!billingExpanded)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left cursor-pointer ${
                            isParentActive ? 'bg-orange-50/50 dark:bg-orange-950/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`${isParentActive ? 'text-orange-500' : 'text-gray-500 dark:text-slate-400'}`}>
                              {item.icon}
                            </span>
                            <span className={`text-[13px] font-semibold ${isParentActive ? 'text-orange-500' : 'text-gray-600 dark:text-slate-300'}`}>
                              {item.name}
                            </span>
                          </div>
                          <span className={`transition-transform duration-200 ${isParentActive ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500'}`}>
                            <svg className={`w-3.5 h-3.5 transform transition-transform duration-200 ${billingExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </span>
                        </button>
                        
                        {billingExpanded && (
                          <div className="pl-6 mt-1 space-y-1.5 border-l border-gray-100 dark:border-slate-800 ml-5 transition-all">
                            {item.subItems.map((sub, sIdx) => {
                              const isSubActive = location.pathname === sub.path || (sub.path === '/billing/info' && location.pathname === '/billing');
                              return (
                                <NavLink
                                  key={sIdx}
                                  to={sub.path}
                                  className={`block py-1.5 px-3 text-[12.5px] rounded-md transition-colors ${
                                    isSubActive 
                                      ? 'text-orange-500 font-bold bg-orange-50/30 dark:bg-orange-950/10' 
                                      : 'text-gray-500 dark:text-slate-400 font-semibold hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  {sub.name}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                          isActive ? 'bg-orange-50/50 dark:bg-orange-950/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`${isActive ? 'text-orange-500' : 'text-gray-500 dark:text-slate-400'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-[13px] font-semibold ${isActive ? 'text-orange-500' : 'text-gray-600 dark:text-slate-300'}`}>
                            {item.name}
                          </span>
                        </div>
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

