import React, { useState, useEffect } from 'react';
import {
  Users, FileSpreadsheet, Star, MessageSquare, CheckCircle,
  BookOpen, ChevronRight, ArrowLeft, BarChart2, GraduationCap,
  Layers, Search, RefreshCw, TrendingUp, Award
} from 'lucide-react';
import { RadarAnalytics } from '../components/Charts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function authHeaders() {
  const token = sessionStorage.getItem('admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const CRITERIA = [
  { key: 'q1', label: 'Maîtrise', sub: ['q1_1', 'q1_2'], color: '#818cf8' },
  { key: 'q2', label: 'Clarté', sub: ['q2_1', 'q2_2'], color: '#34d399' },
  { key: 'q3', label: 'Organisation', sub: ['q3_1', 'q3_2'], color: '#f472b6' },
  { key: 'q4', label: 'Pédagogie', sub: ['q4_1', 'q4_2'], color: '#fb923c' },
  { key: 'q5', label: 'Disponibilité', sub: ['q5_1', 'q5_2'], color: '#38bdf8' },
  { key: 'q6', label: 'Évaluation', sub: ['q6_1', 'q6_2'], color: '#a78bfa' },
  { key: 'q7', label: 'Respect', sub: ['q7_1', 'q7_2'], color: '#fbbf24' },
  { key: 'q8', label: 'Ponctualité', sub: ['q8_1', 'q8_2'], color: '#f87171' },
];

const LEVEL_COLORS = {
  'LICENCE 1': { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', dot: 'bg-sky-400' },
  'LICENCE 2': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-400' },
  'LICENCE 3': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  'MASTER': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' },
  'L2': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-400' },
};

function ScoreBadge({ score, large = false }) {
  if (!score) return <span className="text-slate-600 text-sm">—</span>;
  const s = Number(score);
  const color = s >= 4 ? 'text-emerald-400' : s >= 3 ? 'text-indigo-400' : s >= 2 ? 'text-amber-400' : 'text-rose-400';
  const bg = s >= 4 ? 'bg-emerald-400/10' : s >= 3 ? 'bg-indigo-400/10' : s >= 2 ? 'bg-amber-400/10' : 'bg-rose-400/10';
  return (
    <span className={`${color} ${bg} ${large ? 'text-2xl font-bold px-4 py-2' : 'text-sm font-semibold px-2 py-0.5'} rounded-lg`}>
      ★ {s.toFixed(2)}
    </span>
  );
}

function CriteriaScoreBar({ label, score, color }) {
  const pct = ((score / 5) * 100).toFixed(0);
  const s = Number(score);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 font-medium">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{s.toFixed(2)}/5</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  // Navigation state: overview | level | class | professor
  const [view, setView] = useState('overview');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedProf, setSelectedProf] = useState(null);

  const [stats, setStats] = useState(null);
  const [profDetail, setProfDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = () => {
    setLoading(true);
    fetch(`${API_BASE}/results`, { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) { sessionStorage.removeItem('admin_token'); window.location.reload(); return; }
        return res.json();
      })
      .then(data => { if (data) { setStats(data); } setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/export`, { headers: authHeaders() });
      if (res.status === 401) { sessionStorage.removeItem('admin_token'); window.location.reload(); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultats_upb_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (selectedProf) {
      fetch(`${API_BASE}/results/${selectedProf.id}`, { headers: authHeaders() })
        .then(res => {
          if (res.status === 401) { sessionStorage.removeItem('admin_token'); window.location.reload(); return; }
          return res.json();
        })
        .then(data => { if (data) setProfDetail(data); })
        .catch(console.error);
    } else {
      setProfDetail(null);
    }
  }, [selectedProf]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center mt-20 gap-4">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400">Chargement des données...</p>
    </div>
  );
  if (!stats) return null;

  // ─── Build hierarchy from stats ────────────────────────────────────────────
  const allProfs = stats.professorsStats;
  const hierarchy = {};
  allProfs.forEach(p => {
    const levels = p.level.split(', ');
    const classes = p.className.split(', ');
    levels.forEach(lvl => {
      if (!hierarchy[lvl]) hierarchy[lvl] = {};
      classes.forEach(cls => {
        if (!hierarchy[lvl][cls]) hierarchy[lvl][cls] = [];
        if (!hierarchy[lvl][cls].find(x => x.id === p.id)) {
          hierarchy[lvl][cls].push(p);
        }
      });
    });
  });
  const levelList = Object.keys(hierarchy).sort();

  // ─── Breadcrumb ─────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
      <button onClick={() => { setView('overview'); setSelectedLevel(null); setSelectedClass(null); setSelectedProf(null); }}
        className="hover:text-white transition-colors">Accueil</button>
      {selectedLevel && <>
        <ChevronRight size={14} />
        <button onClick={() => { setView('level'); setSelectedClass(null); setSelectedProf(null); }}
          className="hover:text-slate-800 transition-colors">{selectedLevel}</button>
      </>}
      {selectedClass && <>
        <ChevronRight size={14} />
        <button onClick={() => { setView('class'); setSelectedProf(null); }}
          className="hover:text-slate-800 transition-colors">{selectedClass}</button>
      </>}
      {selectedProf && <>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-medium">{selectedProf.name}</span>
      </>}
    </div>
  );

  // ─── VIEW: OVERVIEW ─────────────────────────────────────────────────────────
  if (view === 'overview') {
    const evaluatedCount = allProfs.filter(p => p.evaluationsCount > 0).length;
    const totalEvals = stats.totalEvaluations;

    return (
      <div className="w-full flex flex-col gap-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tableau de bord Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Données importées des fichiers Excel de l'UPB</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchStats} className="border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
              <RefreshCw size={14} /> Actualiser
            </button>
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm text-white">
              <FileSpreadsheet size={16} /> Exporter Excel
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Enseignants', value: stats.totalProfessors, icon: Users, color: 'indigo' },
            { label: 'Évaluations', value: totalEvals, icon: BarChart2, color: 'rose' },
            { label: 'Évalués', value: evaluatedCount, icon: CheckCircle, color: 'emerald' },
            { label: 'Niveaux', value: levelList.length, icon: GraduationCap, color: 'amber' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`glass-panel p-5 rounded-2xl border-t-2 border-t-${color}-500`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
                </div>
                <div className={`bg-${color}-500/10 p-2 rounded-xl`}>
                  <Icon size={20} className={`text-${color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Niveau Cards */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-indigo-600" /> Naviguer par Niveau
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {levelList.map(lvl => {
              const classes = Object.keys(hierarchy[lvl]);
              const profCount = [...new Set(Object.values(hierarchy[lvl]).flat().map(p => p.id))].length;
              const evalCount = Object.values(hierarchy[lvl]).flat().reduce((acc, p) => acc + p.evaluationsCount, 0);
              const colors = LEVEL_COLORS[lvl] || LEVEL_COLORS['LICENCE 3'];
              return (
                <button key={lvl} onClick={() => { setSelectedLevel(lvl); setView('level'); }}
                  className={`glass-panel ${colors.bg} ${colors.border} border rounded-2xl p-6 text-left hover:scale-[1.02] transition-all group hover:bg-slate-50/50`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{lvl}</span>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-800 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-slate-400" /> {classes.length} classe{classes.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" /> {profCount} enseignant{profCount > 1 ? 's' : ''}
                    </div>
                    <div className={`flex items-center gap-2 ${evalCount > 0 ? colors.text : 'text-slate-400'}`}>
                      <BarChart2 size={14} /> {evalCount} avis
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top évalués */}
        {totalEvals > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Award size={20} className="text-amber-500" /> Enseignants les mieux notés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...allProfs]
                .filter(p => p.evaluationsCount > 0)
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, 3)
                .map((p, i) => (
                  <button key={p.id} onClick={() => { setSelectedProf(p); setView('professor'); }}
                    className="glass-panel p-5 rounded-2xl text-left hover:bg-indigo-50/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-2xl font-black ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-amber-700'}`}>#{i + 1}</span>
                      <ScoreBadge score={p.averageScore} />
                    </div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{p.className} · {p.level}</p>
                    <p className="text-xs text-indigo-600 mt-1">{p.courses?.[0]}</p>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── VIEW: LEVEL ────────────────────────────────────────────────────────────
  if (view === 'level' && selectedLevel) {
    const classes = hierarchy[selectedLevel] || {};
    const colors = LEVEL_COLORS[selectedLevel] || LEVEL_COLORS['LICENCE 3'];
    return (
      <div className="w-full flex flex-col gap-6">
        <Breadcrumb />
        <div className={`glass-panel ${colors.bg} ${colors.border} border p-6 rounded-2xl`}>
          <h2 className={`text-2xl font-bold ${colors.text}`}>{selectedLevel}</h2>
          <p className="text-slate-500 text-sm mt-1">{Object.keys(classes).length} classes · sélectionnez une classe pour voir les enseignants</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(classes).map(([cls, profs]) => {
            const evalCount = profs.reduce((acc, p) => acc + p.evaluationsCount, 0);
            const avgScore = evalCount > 0
              ? (profs.filter(p => p.averageScore > 0).reduce((a, p) => a + Number(p.averageScore), 0) / profs.filter(p => p.averageScore > 0).length)
              : 0;
            return (
              <button key={cls} onClick={() => { setSelectedClass(cls); setView('class'); }}
                className="glass-panel p-6 rounded-2xl text-left hover:scale-[1.02] hover:bg-indigo-50/10 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{cls}</h3>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-800 transition-colors" />
                </div>
                <div className="flex flex-col gap-2 text-sm text-slate-500">
                  <span className="flex items-center gap-2"><Users size={14} /> {profs.length} enseignant{profs.length > 1 ? 's' : ''}</span>
                  {evalCount > 0
                    ? <span className="flex items-center gap-2 text-indigo-600"><BarChart2 size={14} /> {evalCount} avis · moy. <ScoreBadge score={avgScore.toFixed(2)} /></span>
                    : <span className="flex items-center gap-2 text-slate-400"><BarChart2 size={14} /> Aucun avis encore</span>
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── VIEW: CLASS ────────────────────────────────────────────────────────────
  if (view === 'class' && selectedLevel && selectedClass) {
    const profs = (hierarchy[selectedLevel]?.[selectedClass] || []);
    const filtered = searchTerm
      ? profs.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.courses?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())))
      : profs;
    const evaluated = filtered.filter(p => p.evaluationsCount > 0).sort((a, b) => b.averageScore - a.averageScore);
    const pending = filtered.filter(p => p.evaluationsCount === 0);

    return (
      <div className="w-full flex flex-col gap-6">
        <Breadcrumb />
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{selectedClass}</h2>
            <p className="text-slate-500 text-sm">{selectedLevel} · {profs.length} enseignant{profs.length > 1 ? 's' : ''}</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-base pl-9 pr-4 py-2 text-sm w-56" />
          </div>
        </div>

        {evaluated.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp size={12} /> Évalués ({evaluated.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluated.map(p => (
                <button key={p.id} onClick={() => { setSelectedProf(p); setView('professor'); }}
                  className="glass-panel p-5 rounded-2xl text-left hover:bg-indigo-50/20 hover:scale-[1.01] transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.courses?.slice(0, 2).map(c => (
                          <span key={c} className="text-xs bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 px-2 py-0.5 rounded truncate max-w-[160px]">{c}</span>
                        ))}
                        {p.courses?.length > 2 && <span className="text-xs text-slate-400">+{p.courses.length - 2}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ScoreBadge score={p.averageScore} />
                      <span className="text-xs text-slate-500">{p.evaluationsCount} avis</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <span className="text-xs text-indigo-600 group-hover:text-indigo-800 transition-colors flex items-center gap-1">Voir détails <ChevronRight size={12} /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">En attente d'évaluation ({pending.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pending.map(p => (
                <button key={p.id} onClick={() => { setSelectedProf(p); setView('professor'); }}
                  className="glass-panel p-4 rounded-xl text-left hover:bg-indigo-50/10 transition-all group opacity-85 hover:opacity-100">
                  <p className="font-medium text-slate-750">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.courses?.slice(0, 2).map(c => (
                      <span key={c} className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[140px]">{c}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">Aucun enseignant trouvé pour "{searchTerm}"</div>
        )}
      </div>
    );
  }

  // ─── VIEW: PROFESSOR ─────────────────────────────────────────────────────────
  if (view === 'professor' && selectedProf) {
    const scores = profDetail?.averageScores || {};
    const hasEvals = selectedProf.evaluationsCount > 0;

    const radarData = CRITERIA.map(c => {
      const avg = ((scores[c.sub[0]] || 0) + (scores[c.sub[1]] || 0)) / 2;
      return { subject: c.label, A: Number(avg.toFixed(2)) };
    });

    return (
      <div className="w-full flex flex-col gap-6">
        <Breadcrumb />

        {/* Header card */}
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{selectedProf.name}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedProf.className?.split(', ').map(cls => (
                    <span key={cls} className="bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-3 py-1 rounded-full text-sm">{cls}</span>
                  ))}
                  {selectedProf.level?.split(', ').map(lvl => (
                    <span key={lvl} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">{lvl}</span>
                  ))}
                </div>
              </div>
              {hasEvals && <ScoreBadge score={selectedProf.averageScore} large />}
            </div>

            {/* Courses */}
            <div className="mt-5">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Matières enseignées</p>
              <div className="flex flex-wrap gap-2">
                {selectedProf.courses?.map(c => (
                  <span key={c} className="text-sm bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">📚 {c}</span>
                ))}
              </div>
            </div>

            {/* Contact */}
            {(selectedProf.email || selectedProf.contact) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {selectedProf.email && <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">✉️ {selectedProf.email}</span>}
                {selectedProf.contact && <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">📱 {selectedProf.contact}</span>}
              </div>
            )}

            {/* Eval count */}
            <div className="mt-5 flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm ${hasEvals ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-500'}`}>
                <Users size={16} /> {selectedProf.evaluationsCount} évaluation{selectedProf.evaluationsCount !== 1 ? 's' : ''} reçue{selectedProf.evaluationsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {!hasEvals ? (
          <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center gap-4 text-slate-500">
            <BookOpen size={48} className="opacity-20" />
            <p className="text-lg">Aucune évaluation reçue pour le moment.</p>
            <p className="text-sm">Les résultats s'afficheront ici dès que les étudiants auront soumis leurs évaluations.</p>
          </div>
        ) : (
          <>
            {/* Score bars + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-slate-400" /> Scores par critère</h3>
                <div className="flex flex-col gap-4">
                  {CRITERIA.map(c => {
                    const avg = ((scores[c.sub[0]] || 0) + (scores[c.sub[1]] || 0)) / 2;
                    return <CriteriaScoreBar key={c.key} label={c.label} score={avg} color={c.color} />;
                  })}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-400" /> Profil de performance</h3>
                <RadarAnalytics data={radarData} />
              </div>
            </div>

            {/* Sub-question detail */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="font-semibold text-white mb-5">Détail par question</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CRITERIA.map(c => (
                  <div key={c.key} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <p className="font-medium mb-3" style={{ color: c.color }}>{c.label}</p>
                    <div className="flex flex-col gap-3">
                      {c.sub.map((qk, i) => (
                        <div key={qk} className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Question {i + 1}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-700 rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${((scores[qk] || 0) / 5) * 100}%`, backgroundColor: c.color }} />
                            </div>
                            <span className="text-white font-bold w-8 text-right">{scores[qk] ? scores[qk].toFixed(1) : '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            {profDetail?.comments && (
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" /> Commentaires ({profDetail.comments.length})
                </h3>
                {profDetail.comments.length === 0 ? (
                  <p className="text-slate-500 text-sm">Aucun commentaire.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {profDetail.comments.map((c, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500">
                        <p className="text-slate-700 italic">"{c.comment}"</p>
                        <span className="text-xs text-slate-500 mt-2 block">
                          {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
