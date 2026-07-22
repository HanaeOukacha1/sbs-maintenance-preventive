import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, Plus, UserPlus, TrendingUp } from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const [stats, setStats] = useState({ missions: 0, equipements: 0, sites: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setStats({ missions: 12, equipements: 7805, sites: 91 });
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="dashboard-wrapper">
      {/* En-tête du Dashboard */}
      <div className="dashboard-header d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Bonjour {user?.prenom || 'Alex'}, voici votre aperçu.</h1>
          <p className="text-muted">Gérez vos missions de maintenance et vos équipes depuis cet espace central.</p>
        </div>
        
        {/* Actions Rapides */}
        <div className="quick-actions d-flex gap-2">
          <button className="btn btn-secondary">
            <UserPlus size={16} />
            Inviter un Utilisateur
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Créer une Mission
          </button>
        </div>
      </div>

      {/* Cartes KPI adaptées */}
      <div className="kpi-grid mb-4">
        
        {/* Carte 1 : Missions (avec mini-tendance) */}
        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Missions en cours</h3>
            <Briefcase size={18} className="text-muted" />
          </div>
          <div className="d-flex items-center gap-3">
            <div className="kpi-value">{isLoading ? '...' : stats.missions}</div>
            <div className="kpi-trend">
              <TrendingUp size={14} /> +3 cette semaine
            </div>
          </div>
        </div>

        {/* Carte 2 : Alertes Système (avec pastille d'alerte) */}
        <div className="card kpi-card alert-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Alertes Système</h3>
            <div className="position-relative">
              <AlertCircle size={18} color="var(--accent)" />
              <span className="alert-dot"></span>
            </div>
          </div>
          <div className="kpi-value alert-text">2 Blocages</div>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Nécessite votre attention</p>
        </div>

        {/* Carte 3 : Utilisateurs / Équipe */}
        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Techniciens Actifs</h3>
          </div>
          <div className="kpi-value">5</div>
          <div className="avatars-row mt-2">
            {/* Simulation de vrais avatars */}
            <div className="mini-avatar" style={{ backgroundColor: '#bfdbfe', color: '#1d4ed8' }}>A</div>
            <div className="mini-avatar" style={{ backgroundColor: '#fef08a', color: '#a16207' }}>M</div>
            <div className="mini-avatar" style={{ backgroundColor: '#fbcfe8', color: '#be185d' }}>S</div>
            <div className="mini-avatar" style={{ backgroundColor: '#bbf7d0', color: '#15803d' }}>Y</div>
            <div className="mini-avatar more">+1</div>
          </div>
        </div>

        {/* Carte 4 : Taux de couverture */}
        <div className="card kpi-card">
          <div className="d-flex justify-between items-center mb-2">
            <h3 className="text-muted">Taux de couverture</h3>
          </div>
          <div className="kpi-value">85%</div>
          <div className="progress-bar-container mt-2">
            <div className="progress-bar-fill" style={{ width: '85%' }}></div>
          </div>
        </div>

      </div>

      {/* Tableau des Missions Récentes */}
      <div className="card p-4">
        <h2 className="text-h2 mb-4">Missions Récentes</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nom de la Mission</th>
                <th>Technicien</th>
                <th>Site</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>Audit Trimestriel - Serveurs</td>
                <td>Alex Dubois</td>
                <td>Siège AMEE</td>
                <td className="text-muted">21 Juil. 2026</td>
                <td><span className="badge cyan">En Cours</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>Vérification Onduleurs</td>
                <td>Maria Garcia</td>
                <td>ANCFCC Agdal</td>
                <td className="text-muted">19 Juil. 2026</td>
                <td><span className="badge gold">Bloqué</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>Maintenance Imprimantes</td>
                <td>Samir Tazi</td>
                <td>MHAI Rabat</td>
                <td className="text-muted">15 Juil. 2026</td>
                <td><span className="badge gray">Terminée</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .kpi-card {
          padding: 1.25rem;
        }

        .kpi-card h3 { margin: 0; font-size: 0.875rem; font-weight: 500; }
        
        .kpi-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1;
        }

        .kpi-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 2px 8px;
          border-radius: 99px;
        }

        .alert-card {
          border: 1px solid var(--warning);
          background-color: var(--warning-bg);
        }
        .alert-text { color: var(--accent); }
        .alert-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: var(--danger);
          border-radius: 50%;
        }

        .avatars-row {
          display: flex;
        }
        .mini-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--bg-panel);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: bold;
          margin-left: -8px;
        }
        .mini-avatar:first-child { margin-left: 0; }
        .mini-avatar.more { background-color: var(--bg-hover); color: var(--text-muted); }

        .progress-bar-container {
          width: 100%;
          height: 6px;
          background-color: var(--bg-hover);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background-color: var(--primary);
          border-radius: 99px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
