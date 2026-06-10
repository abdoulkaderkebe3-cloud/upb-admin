import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_token', data.token);
        onLogin();
      } else {
        setError('Mot de passe incorrect.');
      }
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-4 inline-block mx-auto">
            <img src="/logo-square.png" alt="Logo UPB" style={{ height: '64px', objectFit: 'contain', borderRadius: '12px', display: 'block' }} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>Accès Administrateur</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            Université Polytechnique de Bingerville
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '10px' }}>
              <Lock size={20} style={{ color: '#111827' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>Connexion sécurisée</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Réservé au personnel autorisé</div>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe administrateur"
                className="input-base"
                style={{ padding: '12px 44px 12px 16px', fontSize: '14px' }}
                autoFocus
              />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={!password || loading} className="btn-primary"
              style={{ padding: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading
                ? <div style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <><LogIn size={18} /> Se connecter</>
              }
            </button>
          </form>
        </div>

      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
