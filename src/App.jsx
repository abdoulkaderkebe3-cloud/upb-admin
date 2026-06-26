import React, { useState } from 'react';
import AdminDashboard from './views/AdminDashboard';
import AdminLogin from './views/AdminLogin';
import { ShieldCheck, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!sessionStorage.getItem('admin_token')
  );

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        className="w-full px-4 sm:px-6 py-2 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 no-underline group">
          <div className="transition-transform group-hover:scale-105">
            <img src="/logo-clean.png" alt="Logo UPB" style={{ height: '42px', width: '42px', objectFit: 'contain' }} />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>UPB Admin</div>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Panneau d'administration</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                <ShieldCheck size={14} />
                <span>Connecté</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm transition-colors"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 w-full" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {isAuthenticated ? (
          <AdminDashboard />
        ) : (
          <AdminLogin onLogin={() => setIsAuthenticated(true)} />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', background: 'white' }}
        className="py-4 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-center">
        <div className="flex items-center gap-2 grayscale opacity-60">
          <img src="/logo-clean.png" alt="UPB" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>UPB Admin</span>
        </div>
        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
          © {new Date().getFullYear()} — Panneau sécurisé
        </span>
      </footer>
    </div>
  );
}

export default App;
