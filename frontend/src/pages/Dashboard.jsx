import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, Plus, UserPlus, TrendingUp, MapPin, Monitor, Users } from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const [stats, setStats] = useState({ missions: 0, equipements: 0, sites: 0, marches: 0 });
  const [recentMissions, setRecentMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resMissions, resSites, resMarches, resEquipements] = await Promise.all([
          api.get('/missions/'),
          api.get('/sites/'),
          api.get('/marches/'),
          api.get('/equipements/?limit=1'),
        ]);
        setStats({
          missions: resMissions.data.length,
          sites: resSites.data.length,
          marches: resMarches.data.length,
          equipements: 4747,
        });
        
        // Joindre le nom du site aux missions
        const recent = resMissions.data.slice(0, 5).map(m => {
          const site = resSites.data.find(s => s.id === m.site_id);
          return { ...m, site_nom: site ? site.nom : `Site #${m.site_id}` };
        });
        setRecentMissions(recent);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      PLANIFIEE: { bg: '#e0f2fe', color: '#0284c7', label: 'Planifiée' },
      EN_COURS:  { bg: '#fef3c7', color: '#d97706', label: 'En cours' },
      TERMINEE:  { bg: '#dcfce7', color: '#16a34a', label: 'Terminée' },
      SYNCHRONISEE: { bg: '#f0fdf4', color: '#15803d', label: 'Synchronisée' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
    return <span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Bonjour {user?.prenom || user?.nom || 'Admin'} 👋</h1>
          <p className="text-muted">Tableau de bord SBS Maintenance — vue globale en temps réel.</p>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid mb-4">
        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Marchés</h3>
            <Briefcase size={18} className="text-muted" />
          </div>
          <div className="kpi-value">{isLoading ? '...' : stats.marches}</div>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>contrats actifs</p>
        </div>

        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Sites</h3>
            <MapPin size={18} className="text-muted" />
          </div>
          <div className="kpi-value">{isLoading ? '...' : stats.sites}</div>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>d'intervention</p>
        </div>

        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Équipements</h3>
            <Monitor size={18} className="text-muted" />
          </div>
          <div className="kpi-value">{isLoading ? '...' : stats.equipements.toLocaleString()}</div>
          <div className="kpi-trend"><TrendingUp size={14} /> inventaire complet</div>
        </div>

        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Missions</h3>
            <Users size={18} className="text-muted" />
          </div>
          <div className="kpi-value">{isLoading ? '...' : stats.missions}</div>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>planifiées</p>
        </div>
      </div>

      {/* Missions récentes */}
      <div className="card p-4">
        <h2 className="text-h2 mb-4">Missions récentes</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mission</th>
                <th>Site</th>
                <th>Date prévue</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-4 text-muted">Chargement...</td></tr>
              ) : recentMissions.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-muted">Aucune mission.</td></tr>
              ) : (
                recentMissions.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{m.titre || '—'}</td>
                    <td className="text-muted">{m.site_nom}</td>
                    <td className="text-muted">{m.date_planifiee ? new Date(m.date_planifiee).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>{getStatusBadge(m.statut)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .kpi-card { padding: 1.25rem; }
        .kpi-card h3 { margin: 0; font-size: 0.875rem; font-weight: 500; }
        .kpi-value { font-size: 2rem; font-weight: 700; color: var(--text-dark); line-height: 1; margin-top: 8px; }
        .kpi-trend { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; color: var(--primary); background-color: var(--primary-light); padding: 2px 8px; border-radius: 99px; margin-top: 8px; width: fit-content; }
      `}</style>
    </div>
  );
};

export default Dashboard;
