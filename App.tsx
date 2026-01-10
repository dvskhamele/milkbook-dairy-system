import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Droplets, 
  Users, 
  BookOpen, 
  IndianRupee, 
  ShoppingBag, 
  Warehouse, 
  BarChart3, 
  Database, 
  Settings, 
  LogOut, 
  Save, 
  Printer, 
  Plus, 
  Trash2, 
  ChevronRight,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Languages,
  Clock
} from 'lucide-react';

/**
 * CONSTANTS & CONFIG
 */
const STORAGE_KEY = 'milkbook_state_v1';
const BACKUP_KEY = 'milkbook_backup_v1';

const INITIAL_STATE = {
  auth: { isAuthenticated: false, user: null },
  currentScreen: 'login',
  dairyInfo: {
    name: '',
    owner: '',
    mobile: '',
    address: '',
    rateType: 'Fat_SNF', // Fat, Fat_SNF, CLR
    language: 'EN'
  },
  farmers: [],
  milkEntries: [],
  rates: {
    cow: { base: 40, fatRef: 3.5, snfRef: 8.5 },
    buffalo: { base: 60, fatRef: 6.0, snfRef: 9.0 }
  },
  payments: [],
  sales: [],
  inventory: [],
  settings: {
    backupEnabled: true,
    lastBackup: null,
    printerName: 'Default'
  }
};

/**
 * UTILITY FUNCTIONS
 */
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
const calculateMilkAmount = (qty, fat, snf, rateType, rates, type) => {
  const baseRate = type === 'Cow' ? rates.cow.base : rates.buffalo.base;
  const fatRef = type === 'Cow' ? rates.cow.fatRef : rates.buffalo.fatRef;
  const snfRef = type === 'Cow' ? rates.cow.snfRef : rates.buffalo.snfRef;

  let calculatedRate = baseRate;
  if (rateType === 'Fat_SNF') {
    const fatDiff = (fat - fatRef) * 2;
    const snfDiff = (snf - snfRef) * 1.5;
    calculatedRate = baseRate + fatDiff + snfDiff;
  } else if (rateType === 'Fat') {
    calculatedRate = (baseRate / fatRef) * fat;
  }
  
  return {
    rate: Math.max(calculatedRate, 10).toFixed(2),
    amount: (qty * Math.max(calculatedRate, 10)).toFixed(2)
  };
};

/**
 * MAIN APP COMPONENT
 */
function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [notif, setNotif] = useState(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const notify = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  };

  const navigate = (screen) => setState(prev => ({ ...prev, currentScreen: screen }));

  const logout = () => {
    setState(prev => ({ ...prev, auth: { isAuthenticated: false, user: null }, currentScreen: 'login' }));
  };

  // Screens Rendering Logic
  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'register': return <RegisterScreen state={state} setState={setState} notify={notify} />;
      case 'login': return <LoginScreen state={state} setState={setState} notify={notify} />;
      case 'setup': return <SetupWizard state={state} setState={setState} notify={notify} />;
      case 'dashboard': return <DashboardScreen state={state} navigate={navigate} />;
      case 'milkEntry': return <MilkEntryScreen state={state} setState={setState} notify={notify} />;
      case 'farmers': return <FarmerManagementScreen state={state} setState={setState} notify={notify} />;
      case 'ledger': return <LedgerScreen state={state} />;
      case 'payments': return <PaymentsScreen state={state} setState={setState} notify={notify} />;
      case 'sales': return <SalesScreen state={state} setState={setState} notify={notify} />;
      case 'inventory': return <InventoryScreen state={state} setState={setState} notify={notify} />;
      case 'reports': return <ReportsScreen state={state} />;
      case 'backup': return <BackupScreen state={state} setState={setState} notify={notify} />;
      case 'settings': return <SettingsScreen state={state} setState={setState} notify={notify} />;
      default: return <LoginScreen state={state} setState={setState} notify={notify} />;
    }
  };

  // Auth Guard
  const needsAuth = !['login', 'register'].includes(state.currentScreen);
  if (needsAuth && !state.auth.isAuthenticated) {
    navigate('login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Notification Toast */}
      {notif && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce border-l-4 ${
          notif.type === 'success' ? 'bg-white border-green-500 text-green-700' : 'bg-white border-red-500 text-red-700'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold">{notif.msg}</span>
        </div>
      )}

      {needsAuth ? (
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shrink-0 overflow-y-auto print:hidden`}>
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Droplets className="text-white" size={24} />
              </div>
              {isSidebarOpen && <span className="font-bold text-xl tracking-tight">MilkBook</span>}
            </div>
            
            <nav className="flex-1 mt-4 px-3 space-y-1">
              <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={state.currentScreen === 'dashboard'} onClick={() => navigate('dashboard')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<Droplets size={20}/>} label="Milk Entry" active={state.currentScreen === 'milkEntry'} onClick={() => navigate('milkEntry')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<Users size={20}/>} label="Farmers" active={state.currentScreen === 'farmers'} onClick={() => navigate('farmers')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<BookOpen size={20}/>} label="Ledger" active={state.currentScreen === 'ledger'} onClick={() => navigate('ledger')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<IndianRupee size={20}/>} label="Payments" active={state.currentScreen === 'payments'} onClick={() => navigate('payments')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<ShoppingBag size={20}/>} label="Sales" active={state.currentScreen === 'sales'} onClick={() => navigate('sales')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<Warehouse size={20}/>} label="Inventory" active={state.currentScreen === 'inventory'} onClick={() => navigate('inventory')} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<BarChart3 size={20}/>} label="Reports" active={state.currentScreen === 'reports'} onClick={() => navigate('reports')} collapsed={!isSidebarOpen} />
              <div className="pt-4 border-t border-slate-800 mt-4">
                <SidebarItem icon={<Database size={20}/>} label="Backup" active={state.currentScreen === 'backup'} onClick={() => navigate('backup')} collapsed={!isSidebarOpen} />
                <SidebarItem icon={<Settings size={20}/>} label="Settings" active={state.currentScreen === 'settings'} onClick={() => navigate('settings')} collapsed={!isSidebarOpen} />
                <SidebarItem icon={<LogOut size={20}/>} label="Logout" onClick={logout} collapsed={!isSidebarOpen} />
              </div>
            </nav>

            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 print:hidden shadow-sm">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{state.dairyInfo.name || 'MilkBook Dairy'}</h1>
                <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">
                   <Clock size={14}/> {formatDate(new Date())}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${state.settings.backupEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Backup: {state.settings.backupEnabled ? 'ON' : 'OFF'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700 leading-none">{state.auth.user?.name}</p>
                    <p className="text-xs text-slate-400 font-medium">Administrator</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 border shadow-inner">
                    {state.auth.user?.name?.charAt(0) || 'U'}
                  </div>
                </div>
              </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {renderScreen()}
            </div>
          </main>
        </div>
      ) : (
        renderScreen()
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        
        /* ERP Style Scrollbars */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Print Optimization */
        @media print {
          .print-hidden { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; color: black; font-size: 10pt; }
          .card { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 4pt !important; text-align: left !important; }
        }

        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          font-weight: 600;
          border-radius: 0.5rem;
          transition: all 0.2s;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .btn-primary { background: #2563eb; color: white; }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
        .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #475569; }
        .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
      `}} />
    </div>
  );
}

/**
 * COMPONENTS
 */

function SidebarItem({ icon, label, active, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-semibold text-sm">{label}</span>}
    </button>
  );
}

function Card({ title, children, extra, noPadding = false }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
      {(title || extra) && (
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/30">
          {title && <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className={`p-4 rounded-xl ${colors[color] || colors.blue}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/**
 * SCREEN: LOGIN
 */
function LoginScreen({ state, setState, notify }) {
  const [formData, setFormData] = useState({ mobile: '', password: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.auth?.user?.mobile === formData.mobile && stored?.auth?.user?.password === formData.password) {
      setState(prev => ({
        ...prev,
        auth: { isAuthenticated: true, user: stored.auth.user },
        currentScreen: stored.dairyInfo.name ? 'dashboard' : 'setup'
      }));
      notify('Logged in successfully');
    } else {
      notify('Invalid credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <Droplets className="mx-auto mb-4" size={48} />
          <h2 className="text-3xl font-black tracking-tight">MilkBook</h2>
          <p className="opacity-80 text-sm font-medium">Automatic Milk Collection & Dairy Accounting</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
            <input 
              type="text" 
              required
              className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 font-medium" 
              value={formData.mobile} 
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 font-medium" 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Secure Login
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setState(p => ({ ...p, currentScreen: 'register' }))} className="text-blue-600 font-bold hover:underline">
              Start New Dairy with MilkBook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * SCREEN: REGISTER
 */
function RegisterScreen({ setState, notify }) {
  const [formData, setFormData] = useState({
    dairyName: '', ownerName: '', mobile: '', password: '', confirmPassword: '', language: 'EN'
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return notify("Passwords don't match", 'error');
    
    const newUser = { name: formData.ownerName, mobile: formData.mobile, password: formData.password };
    setState(prev => ({
      ...prev,
      auth: { isAuthenticated: true, user: newUser },
      dairyInfo: { ...prev.dairyInfo, name: formData.dairyName, owner: formData.ownerName, mobile: formData.mobile, language: formData.language },
      currentScreen: 'setup'
    }));
    notify("Account created successfully");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-10">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Start with MilkBook</h2>
        <p className="text-slate-500 font-medium mb-8">Setup your automatic milk collection system in seconds.</p>
        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Dairy Name</label>
            <input required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.dairyName} onChange={e => setFormData({ ...formData, dairyName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Owner Name</label>
            <input required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mobile</label>
            <input required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input type="password" required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
            <input type="password" required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
          </div>
          <div className="col-span-2">
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all">
              Start Using MilkBook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * SCREEN: SETUP WIZARD
 */
function SetupWizard({ state, setState, notify }) {
  const [step, setStep] = useState(1);
  const [localDairy, setLocalDairy] = useState(state.dairyInfo);

  const completeSetup = () => {
    setState(prev => ({ ...prev, dairyInfo: localDairy, currentScreen: 'dashboard' }));
    notify("Setup completed!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border">
        <div className="flex bg-slate-100 border-b">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex-1 py-4 text-center text-sm font-bold ${step === i ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
              STEP {i}
            </div>
          ))}
        </div>
        <div className="p-10">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black">Dairy Setup</h3>
              <div>
                <label className="block font-bold text-slate-700 mb-2">Address</label>
                <textarea className="w-full p-3 border rounded-xl" value={localDairy.address} onChange={e => setLocalDairy({ ...localDairy, address: e.target.value })} placeholder="Village, Tehsil, District..." />
              </div>
              <button onClick={() => setStep(2)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black">Fat/SNF Rate Method</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'Fat_SNF', title: 'Fat + SNF Based', desc: 'Standard calculation based on Fat and Solids-Not-Fat' },
                  { id: 'Fat', title: 'Fat Only', desc: 'Rate calculated purely on Fat percentage' },
                  { id: 'CLR', title: 'CLR Method', desc: 'Used for traditional quality testing' }
                ].map(opt => (
                  <label key={opt.id} className={`p-5 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${localDairy.rateType === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <div>
                      <p className="font-bold text-slate-800">{opt.title}</p>
                      <p className="text-sm text-slate-500 font-medium">{opt.desc}</p>
                    </div>
                    <input type="radio" checked={localDairy.rateType === opt.id} onChange={() => setLocalDairy({ ...localDairy, rateType: opt.id })} />
                  </label>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl">Continue</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black">Ready to Start</h3>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <p className="text-amber-800 font-bold mb-2 flex items-center gap-2"><AlertCircle size={18}/> Review Details</p>
                <ul className="text-sm space-y-1 text-amber-700 font-medium">
                  <li>Dairy: {localDairy.name}</li>
                  <li>Rate: {localDairy.rateType}</li>
                  <li>Backup: Enabled (Always Safe)</li>
                </ul>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">Back</button>
                <button onClick={completeSetup} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl">Complete Setup</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SCREEN: DASHBOARD
 */
function DashboardScreen({ state, navigate }) {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = state.milkEntries.filter(e => e.date === today);
  const totalQty = todayEntries.reduce((acc, curr) => acc + Number(curr.qty), 0);
  const totalAmt = todayEntries.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const avgFat = todayEntries.length > 0 ? (todayEntries.reduce((acc, curr) => acc + Number(curr.fat), 0) / todayEntries.length).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Today's Milk" value={`${totalQty.toFixed(1)} L`} icon={<Droplets size={24}/>} color="blue" />
        <StatCard label="Today's Value" value={formatCurrency(totalAmt)} icon={<IndianRupee size={24}/>} color="green" />
        <StatCard label="Avg. Fat" value={`${avgFat}%`} icon={<CheckCircle2 size={24}/>} color="amber" />
        <StatCard label="Total Farmers" value={state.farmers.filter(f => f.active).length} icon={<Users size={24}/>} color="rose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <Card title="Recent Milk Collections" extra={<button onClick={() => navigate('milkEntry')} className="text-blue-600 text-sm font-bold hover:underline">View All</button>}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-widest border-b font-bold">
                    <th className="pb-4 font-black">Farmer</th>
                    <th className="pb-4">Qty (L)</th>
                    <th className="pb-4">Fat/SNF</th>
                    <th className="pb-4">Rate</th>
                    <th className="pb-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {todayEntries.slice(-5).reverse().map((entry, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50">
                      <td className="py-4">
                        <p className="font-bold text-slate-800">{entry.farmerName}</p>
                        <p className="text-xs text-slate-400">{entry.shift} | {entry.type}</p>
                      </td>
                      <td className="py-4 font-bold text-slate-700">{entry.qty}</td>
                      <td className="py-4 font-medium text-slate-600">{entry.fat}% / {entry.snf}</td>
                      <td className="py-4 font-medium text-slate-600">₹{entry.rate}</td>
                      <td className="py-4 text-right font-black text-blue-600">{formatCurrency(entry.amount)}</td>
                    </tr>
                  ))}
                  {todayEntries.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-400 font-medium">No collections yet today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('milkEntry')} className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all gap-2 font-bold text-sm">
                <Plus size={24}/> New Entry
              </button>
              <button onClick={() => navigate('farmers')} className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all gap-2 font-bold text-sm">
                <UserPlus size={24}/> Add Farmer
              </button>
              <button onClick={() => navigate('payments')} className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all gap-2 font-bold text-sm">
                <IndianRupee size={24}/> Pay Farmer
              </button>
              <button onClick={() => navigate('reports')} className="flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all gap-2 font-bold text-sm">
                <BarChart3 size={24}/> Reports
              </button>
            </div>
          </Card>

          <Card title="System Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-3">
                <span className="text-slate-500 font-medium">Last Backup</span>
                <span className="font-bold text-slate-700">{state.settings.lastBackup ? new Date(state.settings.lastBackup).toLocaleString() : 'Never'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-3">
                <span className="text-slate-500 font-medium">Total Farmers</span>
                <span className="font-bold text-slate-700">{state.farmers.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Collection (Life)</span>
                <span className="font-bold text-blue-600">{state.milkEntries.length} Entries</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * SCREEN: MILK ENTRY
 */
function MilkEntryScreen({ state, setState, notify }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    farmerId: '',
    type: 'Cow',
    qty: '',
    fat: '',
    snf: '',
    rate: '0',
    amount: '0'
  });

  const activeFarmers = state.farmers.filter(f => f.active);

  useEffect(() => {
    if (form.qty && form.fat && form.snf) {
      const calc = calculateMilkAmount(form.qty, form.fat, form.snf, state.dairyInfo.rateType, state.rates, form.type);
      setForm(prev => ({ ...prev, rate: calc.rate, amount: calc.amount }));
    }
  }, [form.qty, form.fat, form.snf, form.type, state.rates, state.dairyInfo.rateType]);

  const saveEntry = (e) => {
    e.preventDefault();
    if (!form.farmerId || !form.qty) return notify("Missing details", "error");
    
    const farmer = state.farmers.find(f => f.id === form.farmerId);
    const newEntry = {
      ...form,
      id: Date.now().toString(),
      farmerName: farmer.name,
      timestamp: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      milkEntries: [...prev.milkEntries, newEntry]
    }));
    
    notify(`Entry saved for ${farmer.name}`);
    setForm(prev => ({ ...prev, qty: '', fat: '', snf: '', rate: '0', amount: '0' }));
    document.getElementById('farmerSelect')?.focus();
  };

  const deleteEntry = (id) => {
    if (confirm("Delete this entry?")) {
      setState(prev => ({ ...prev, milkEntries: prev.milkEntries.filter(e => e.id !== id) }));
      notify("Entry deleted", "error");
    }
  };

  const currentEntries = state.milkEntries.filter(e => e.date === form.date && e.shift === form.shift);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4">
        <Card title="Daily Milk Collection">
          <form onSubmit={saveEntry} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Date</label>
                <input type="date" className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Shift</label>
                <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})}>
                  <option>Morning</option>
                  <option>Evening</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">Select Farmer</label>
              <select id="farmerSelect" required className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-lg" value={form.farmerId} onChange={e => setForm({...form, farmerId: e.target.value})}>
                <option value="">-- Choose Farmer --</option>
                {activeFarmers.map(f => <option key={f.id} value={f.id}>{f.id} - {f.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Milk Type</label>
                <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option>Cow</option>
                  <option>Buffalo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Qty (Liters)</label>
                <input type="number" step="0.1" required className="w-full p-2.5 bg-white border rounded-lg font-bold text-lg text-blue-600" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Fat %</label>
                <input type="number" step="0.1" required className="w-full p-2.5 bg-white border rounded-lg font-bold" value={form.fat} onChange={e => setForm({...form, fat: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">SNF</label>
                <input type="number" step="0.01" required className="w-full p-2.5 bg-white border rounded-lg font-bold" value={form.snf} onChange={e => setForm({...form, snf: e.target.value})} />
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Calculated Rate</span>
                <span className="text-2xl font-black">₹{form.rate}/L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black">{formatCurrency(form.amount)}</span>
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3">
              <Save size={20}/> Save Entry
            </button>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <Card title={`Collections: ${form.date} (${form.shift})`} extra={
          <button className="btn btn-secondary text-sm" onClick={() => window.print()}>
            <Printer size={16}/> Print Sheet
          </button>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b font-black">
                  <th className="pb-4">Farmer</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Qty</th>
                  <th className="pb-4">Quality</th>
                  <th className="pb-4">Rate</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-4 font-bold text-slate-800">{entry.farmerName}</td>
                    <td className="py-4 text-sm font-semibold">{entry.type}</td>
                    <td className="py-4 font-bold">{entry.qty} L</td>
                    <td className="py-4 text-sm text-slate-600">{entry.fat}% / {entry.snf}</td>
                    <td className="py-4 text-sm">₹{entry.rate}</td>
                    <td className="py-4 font-black text-blue-600">{formatCurrency(entry.amount)}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => deleteEntry(entry.id)} className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {currentEntries.length === 0 && (
                  <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-medium">No entries for this shift yet.</td></tr>
                )}
              </tbody>
              {currentEntries.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-black">
                    <td colSpan="2" className="py-4 px-2">TOTAL</td>
                    <td className="py-4">{currentEntries.reduce((a, b) => a + Number(b.qty), 0).toFixed(1)} L</td>
                    <td className="py-4"></td>
                    <td className="py-4"></td>
                    <td className="py-4 text-blue-600">{formatCurrency(currentEntries.reduce((a, b) => a + Number(b.amount), 0))}</td>
                    <td className="py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * SCREEN: FARMER MANAGEMENT
 */
function FarmerManagementScreen({ state, setState, notify }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', village: '', openingBalance: '0' });

  const resetForm = () => {
    setForm({ name: '', mobile: '', village: '', openingBalance: '0' });
    setIsAdding(false);
    setEditId(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editId) {
      setState(prev => ({
        ...prev,
        farmers: prev.farmers.map(f => f.id === editId ? { ...f, ...form } : f)
      }));
      notify("Farmer updated");
    } else {
      const newFarmer = { ...form, id: (state.farmers.length + 101).toString(), active: true, createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, farmers: [...prev.farmers, newFarmer] }));
      notify("Farmer registered");
    }
    resetForm();
  };

  const toggleStatus = (id) => {
    setState(prev => ({
      ...prev,
      farmers: prev.farmers.map(f => f.id === id ? { ...f, active: !f.active } : f)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Farmer Directory</h2>
        <button onClick={() => setIsAdding(true)} className="btn btn-primary">
          <UserPlus size={18}/> Register New Farmer
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <Card title={editId ? "Update Farmer" : "New Farmer Registration"} className="w-full max-w-lg mb-0">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input required className="w-full p-3 bg-slate-50 border rounded-xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mobile</label>
                  <input required className="w-full p-3 bg-slate-50 border rounded-xl" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Village</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={form.village} onChange={e => setForm({...form, village: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={form.openingBalance} onChange={e => setForm({...form, openingBalance: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Save Farmer</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr className="text-slate-500 text-xs uppercase tracking-widest font-black">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Farmer Name</th>
                <th className="px-6 py-4">Village</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {state.farmers.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-500">{f.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-400">Bal: {formatCurrency(f.openingBalance)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600">{f.village}</td>
                  <td className="px-6 py-4 text-sm font-medium">{f.mobile}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${f.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                      {f.active ? 'Active' : 'Deactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setEditId(f.id); setForm(f); setIsAdding(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Settings size={18}/>
                    </button>
                    <button onClick={() => toggleStatus(f.id)} className={`p-2 rounded-lg ${f.active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {f.active ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                    </button>
                  </td>
                </tr>
              ))}
              {state.farmers.length === 0 && (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-medium italic">No farmers registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * SCREEN: LEDGER
 */
function LedgerScreen({ state }) {
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  
  const ledgerData = useMemo(() => {
    if (!selectedFarmerId) return [];
    
    const farmer = state.farmers.find(f => f.id === selectedFarmerId);
    let balance = Number(farmer.openingBalance || 0);
    
    // Initial opening balance entry
    const entries = [{
      date: farmer.createdAt || new Date().toISOString(),
      desc: 'Opening Balance',
      debit: 0,
      credit: balance,
      balance: balance
    }];

    // Milk collections add to farmer's credit (Dairy owes farmer)
    state.milkEntries
      .filter(e => e.farmerId === selectedFarmerId)
      .forEach(e => {
        balance += Number(e.amount);
        entries.push({
          date: e.timestamp,
          desc: `Milk Collection (${e.qty}L @ ${e.rate})`,
          debit: 0,
          credit: Number(e.amount),
          balance
        });
      });

    // Payments reduce dairy's debt to farmer
    state.payments
      .filter(p => p.farmerId === selectedFarmerId)
      .forEach(p => {
        balance -= Number(p.amount);
        entries.push({
          date: p.timestamp,
          desc: `Payment (${p.mode})`,
          debit: Number(p.amount),
          credit: 0,
          balance
        });
      });

    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedFarmerId, state]);

  return (
    <div className="space-y-6">
      <Card title="Farmer Ledger Statement" extra={
        <select className="p-2.5 border rounded-lg font-bold min-w-[200px]" value={selectedFarmerId} onChange={e => setSelectedFarmerId(e.target.value)}>
          <option value="">-- Choose Farmer --</option>
          {state.farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      }>
        {!selectedFarmerId ? (
          <div className="py-20 text-center text-slate-400 font-medium">Please select a farmer to view the ledger.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-widest font-black border-b">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Description</th>
                  <th className="pb-4 text-right text-rose-600">Debit (Paid)</th>
                  <th className="pb-4 text-right text-green-600">Credit (Milk)</th>
                  <th className="pb-4 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledgerData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-4 text-sm font-medium text-slate-500">{formatDate(item.date)}</td>
                    <td className="py-4 font-bold text-slate-700">{item.desc}</td>
                    <td className="py-4 text-right font-bold text-rose-500">{item.debit > 0 ? formatCurrency(item.debit) : '-'}</td>
                    <td className="py-4 text-right font-bold text-green-500">{item.credit > 0 ? formatCurrency(item.credit) : '-'}</td>
                    <td className="py-4 text-right font-black text-slate-800">{formatCurrency(item.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * SCREEN: PAYMENTS
 */
function PaymentsScreen({ state, setState, notify }) {
  const [form, setForm] = useState({ farmerId: '', amount: '', mode: 'Cash', remarks: '' });

  const handlePay = (e) => {
    e.preventDefault();
    if (!form.farmerId || !form.amount) return notify("Incomplete form", "error");
    
    const farmer = state.farmers.find(f => f.id === form.farmerId);
    const newPayment = {
      ...form,
      id: Date.now().toString(),
      farmerName: farmer.name,
      timestamp: new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
    notify(`Paid ₹${form.amount} to ${farmer.name}`);
    setForm({ farmerId: '', amount: '', mode: 'Cash', remarks: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card title="Issue Payment Receipt">
        <form onSubmit={handlePay} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Select Farmer</label>
            <select required className="w-full p-3 border rounded-xl font-bold" value={form.farmerId} onChange={e => setForm({...form, farmerId: e.target.value})}>
              <option value="">-- Choose Farmer --</option>
              {state.farmers.filter(f => f.active).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Payment Amount (₹)</label>
            <input type="number" required className="w-full p-4 border rounded-xl font-black text-2xl text-blue-600" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {['Cash', 'Bank Transfer', 'Cheque'].map(m => (
                <button key={m} type="button" onClick={() => setForm({...form, mode: m})} className={`py-3 rounded-xl font-bold text-sm border-2 ${form.mode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Remarks (Optional)</label>
            <input className="w-full p-3 border rounded-xl" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="e.g. Adv payment" />
          </div>
          <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-100">
            Confirm Payment Receipt
          </button>
        </form>
      </Card>

      <Card title="Recent Transactions">
        <div className="space-y-4">
          {state.payments.slice(-8).reverse().map(p => (
            <div key={p.id} className="flex justify-between items-center p-4 border rounded-xl bg-slate-50 group transition-all hover:bg-white hover:shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <p className="font-bold text-slate-800">{p.farmerName}</p>
                  <p className="text-xs text-slate-400 font-medium">{formatDate(p.timestamp)} | {p.mode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-rose-600">-{formatCurrency(p.amount)}</p>
                <p className="text-[10px] uppercase font-black text-slate-400">Paid Out</p>
              </div>
            </div>
          ))}
          {state.payments.length === 0 && <div className="py-20 text-center text-slate-400 font-medium italic">No payment history.</div>}
        </div>
      </Card>
    </div>
  );
}

/**
 * SCREEN: SALES
 */
function SalesScreen({ state, setState, notify }) {
  const [form, setForm] = useState({ customer: '', qty: '', rate: '', date: new Date().toISOString().split('T')[0] });

  const handleSale = (e) => {
    e.preventDefault();
    const amount = Number(form.qty) * Number(form.rate);
    const newSale = { ...form, amount, id: Date.now().toString() };
    setState(prev => ({ ...prev, sales: [...prev.sales, newSale] }));
    notify(`Sold ${form.qty}L to ${form.customer}`);
    setForm({ customer: '', qty: '', rate: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4">
        <Card title="Record Bulk Sale">
          <form onSubmit={handleSale} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Customer / Vendor Name</label>
              <input required className="w-full p-3 border rounded-xl" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Qty (L)</label>
                <input type="number" required className="w-full p-3 border rounded-xl font-bold" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Rate (₹/L)</label>
                <input type="number" required className="w-full p-3 border rounded-xl font-bold" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} />
              </div>
            </div>
            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold opacity-70">Total Receivable</span>
              <span className="text-xl font-black">{formatCurrency(Number(form.qty || 0) * Number(form.rate || 0))}</span>
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Complete Sale</button>
          </form>
        </Card>
      </div>
      <div className="lg:col-span-8">
        <Card title="Sales History">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs uppercase font-black text-slate-400">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Qty</th>
                  <th className="pb-4">Rate</th>
                  <th className="pb-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {state.sales.slice().reverse().map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-4 text-sm">{formatDate(s.date)}</td>
                    <td className="py-4 font-bold">{s.customer}</td>
                    <td className="py-4">{s.qty} L</td>
                    <td className="py-4">₹{s.rate}</td>
                    <td className="py-4 text-right font-black text-green-600">{formatCurrency(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * SCREEN: INVENTORY
 */
function InventoryScreen({ state, setState, notify }) {
  const [form, setForm] = useState({ item: 'Feed', type: 'Purchase', qty: '', rate: '', date: new Date().toISOString().split('T')[0] });

  const handleStock = (e) => {
    e.preventDefault();
    const newStock = { ...form, id: Date.now().toString() };
    setState(prev => ({ ...prev, inventory: [...prev.inventory, newStock] }));
    notify(`${form.type} of ${form.item} recorded`);
    setForm({ item: 'Feed', type: 'Purchase', qty: '', rate: '', date: new Date().toISOString().split('T')[0] });
  };

  const calculateStock = (item) => {
    const records = state.inventory.filter(r => r.item === item);
    const bought = records.filter(r => r.type === 'Purchase').reduce((a, b) => a + Number(b.qty), 0);
    const sold = records.filter(r => r.type === 'Sale').reduce((a, b) => a + Number(b.qty), 0);
    return bought - sold;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Cattle Feed Stock" value={`${calculateStock('Feed')} Bags`} icon={<Warehouse size={24}/>} color="amber" />
        <StatCard label="Ghee Stock" value={`${calculateStock('Ghee')} Kg`} icon={<ShoppingBag size={24}/>} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card title="Manage Inventory">
            <form onSubmit={handleStock} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Item</label>
                <select className="w-full p-3 border rounded-xl font-bold" value={form.item} onChange={e => setForm({...form, item: e.target.value})}>
                  <option>Feed</option>
                  <option>Ghee</option>
                  <option>Mineral Mix</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm({...form, type: 'Purchase'})} className={`py-2 rounded-lg font-bold border-2 ${form.type === 'Purchase' ? 'bg-green-600 text-white border-green-600' : 'border-slate-100'}`}>Stock IN</button>
                  <button type="button" onClick={() => setForm({...form, type: 'Sale'})} className={`py-2 rounded-lg font-bold border-2 ${form.type === 'Sale' ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-100'}`}>Stock OUT</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">Qty</label>
                  <input type="number" required className="w-full p-3 border rounded-xl font-bold" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">Price/Unit</label>
                  <input type="number" required className="w-full p-3 border rounded-xl font-bold" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">Update Inventory</button>
            </form>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Card title="Stock Ledger">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-xs font-black text-slate-400">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Item</th>
                    <th className="pb-4">Action</th>
                    <th className="pb-4">Qty</th>
                    <th className="pb-4 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {state.inventory.slice().reverse().map(i => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-4 text-sm">{formatDate(i.date)}</td>
                      <td className="py-4 font-bold">{i.item}</td>
                      <td className="py-4 italic font-medium">{i.type}</td>
                      <td className={`py-4 font-black ${i.type === 'Purchase' ? 'text-green-600' : 'text-rose-600'}`}>{i.type === 'Purchase' ? '+' : '-'}{i.qty}</td>
                      <td className="py-4 text-right">₹{i.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * SCREEN: REPORTS
 */
function ReportsScreen({ state }) {
  const [range, setRange] = useState('Today');
  const today = new Date().toISOString().split('T')[0];

  const filteredEntries = state.milkEntries.filter(e => {
    if (range === 'Today') return e.date === today;
    return true; // Simple mock for range logic
  });

  const stats = {
    totalLiters: filteredEntries.reduce((a, b) => a + Number(b.qty), 0),
    totalAmt: filteredEntries.reduce((a, b) => a + Number(b.amount), 0),
    avgRate: filteredEntries.length > 0 ? (filteredEntries.reduce((a, b) => a + Number(b.rate), 0) / filteredEntries.length).toFixed(2) : 0
  };

  return (
    <div className="space-y-8 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-black">Performance Reports</h2>
        <div className="flex gap-2">
          {['Today', 'This Week', 'This Month', 'All Time'].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-lg text-xs font-bold ${range === r ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>
              {r}
            </button>
          ))}
          <button onClick={() => window.print()} className="btn btn-secondary ml-4"><Printer size={16}/> Print Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <p className="text-xs font-black opacity-50 uppercase tracking-widest mb-1">Total Milk Procured</p>
          <p className="text-3xl font-black">{stats.totalLiters.toFixed(1)} Liters</p>
        </div>
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl">
          <p className="text-xs font-black opacity-50 uppercase tracking-widest mb-1">Total Procurement Cost</p>
          <p className="text-3xl font-black">{formatCurrency(stats.totalAmt)}</p>
        </div>
        <div className="bg-white border p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Average Procured Rate</p>
          <p className="text-3xl font-black text-slate-800">₹{stats.avgRate}</p>
        </div>
      </div>

      <Card title={`${range} Collection Summary`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs font-black text-slate-400">
                <th className="pb-4">Shift</th>
                <th className="pb-4">Count</th>
                <th className="pb-4">Qty</th>
                <th className="pb-4">Avg Fat</th>
                <th className="pb-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {['Morning', 'Evening'].map(shift => {
                const shiftEntries = filteredEntries.filter(e => e.shift === shift);
                const qty = shiftEntries.reduce((a, b) => a + Number(b.qty), 0);
                const amt = shiftEntries.reduce((a, b) => a + Number(b.amount), 0);
                const fat = shiftEntries.length > 0 ? (shiftEntries.reduce((a, b) => a + Number(b.fat), 0) / shiftEntries.length).toFixed(1) : 0;
                return (
                  <tr key={shift}>
                    <td className="py-4 font-bold">{shift}</td>
                    <td className="py-4">{shiftEntries.length} entries</td>
                    <td className="py-4 font-bold">{qty.toFixed(1)} L</td>
                    <td className="py-4">{fat}%</td>
                    <td className="py-4 text-right font-black">{formatCurrency(amt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * SCREEN: BACKUP & SECURITY
 */
function BackupScreen({ state, setState, notify }) {
  const handleBackup = () => {
    const backupData = JSON.stringify(state);
    localStorage.setItem(BACKUP_KEY, backupData);
    setState(prev => ({ ...prev, settings: { ...prev.settings, lastBackup: new Date().toISOString() } }));
    notify("Backup created locally");
  };

  const handleRestore = () => {
    const data = localStorage.getItem(BACKUP_KEY);
    if (data && confirm("Restore from backup? Current data will be replaced.")) {
      setState(JSON.parse(data));
      notify("Data restored successfully");
    } else if (!data) {
      notify("No backup found", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card title="Backup & Data Security">
        <div className="space-y-8">
          <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-2xl border">
            <div className="bg-blue-100 p-4 rounded-full text-blue-600">
              <Database size={32}/>
            </div>
            <div>
              <p className="font-black text-xl">Local Storage Backup</p>
              <p className="text-sm text-slate-500 font-medium">Last successful sync: {state.settings.lastBackup ? new Date(state.settings.lastBackup).toLocaleString() : 'Never'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleBackup} className="p-6 border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left">
              <p className="font-black text-blue-600 mb-1">Create Manual Backup</p>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">Instantly save a copy of all records to local device storage.</p>
            </button>
            <button onClick={handleRestore} className="p-6 border-2 border-slate-100 rounded-2xl hover:border-amber-600 hover:bg-amber-50 transition-all text-left">
              <p className="font-black text-amber-600 mb-1">Restore from Previous</p>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">Load data from the last saved backup file on this machine.</p>
            </button>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex items-start gap-4">
            <AlertCircle className="text-amber-600 shrink-0" size={24}/>
            <div>
              <p className="font-bold text-amber-800">Why Backup Matters?</p>
              <p className="text-sm text-amber-700 font-medium leading-relaxed">MilkBook stores data in your browser. Clearing your browser cache or history might delete your records. We recommend taking manual backups daily and exporting reports to PDF.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * SCREEN: SETTINGS
 */
function SettingsScreen({ state, setState, notify }) {
  const [localRates, setLocalRates] = useState(state.rates);

  const saveSettings = () => {
    setState(prev => ({ ...prev, rates: localRates }));
    notify("System settings updated");
  };

  const handleReset = () => {
    if (confirm("ABSOLUTE DATA WIPE! Are you sure? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card title="Base Rate Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest border-b pb-2">Cow Milk Config</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Rate (₹)</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold" value={localRates.cow.base} onChange={e => setLocalRates({...localRates, cow: {...localRates.cow, base: e.target.value}})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ref Fat %</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold" value={localRates.cow.fatRef} onChange={e => setLocalRates({...localRates, cow: {...localRates.cow, fatRef: e.target.value}})} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest border-b pb-2">Buffalo Milk Config</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Rate (₹)</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold" value={localRates.buffalo.base} onChange={e => setLocalRates({...localRates, buffalo: {...localRates.buffalo, base: e.target.value}})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ref Fat %</label>
                <input type="number" className="w-full p-2.5 border rounded-lg font-bold" value={localRates.buffalo.fatRef} onChange={e => setLocalRates({...localRates, buffalo: {...localRates.buffalo, fatRef: e.target.value}})} />
              </div>
            </div>
          </div>
        </div>
        <button onClick={saveSettings} className="btn btn-primary mt-8 w-full justify-center py-4">Save Rate Configuration</button>
      </Card>

      <Card title="General Preferences">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">System Language</label>
            <div className="flex gap-2">
              <button onClick={() => setState(p => ({...p, dairyInfo: {...p.dairyInfo, language: 'EN'}}))} className={`flex-1 py-3 border-2 rounded-xl font-bold ${state.dairyInfo.language === 'EN' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-slate-100'}`}>English</button>
              <button onClick={() => setState(p => ({...p, dairyInfo: {...p.dairyInfo, language: 'HI'}}))} className={`flex-1 py-3 border-2 rounded-xl font-bold ${state.dairyInfo.language === 'HI' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-slate-100'}`}>Hindi (हिन्दी)</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Printer Name</label>
            <input className="w-full p-3 border rounded-xl" value={state.settings.printerName} onChange={e => setState(p => ({...p, settings: {...p.settings, printerName: e.target.value}}))} />
          </div>
        </div>
      </Card>

      <Card title="Danger Zone" className="border-rose-100 bg-rose-50/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-rose-800">Reset All Data</p>
            <p className="text-sm text-rose-700 font-medium">Deletes all farmers, collections, payments and dairy configuration.</p>
          </div>
          <button onClick={handleReset} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">
            Wipe Everything
          </button>
        </div>
      </Card>
    </div>
  );
}

export default App;