import React from 'react';
import { Search, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import authService from '../services/authService';

const Layout = ({ children }) => {
  const user = authService.getCurrentUser();

  return (
    <div className="layout-container d-flex">
      <Sidebar />
      
      <main className="main-content flex-col">
        {/* Header / Navbar en haut */}
        <header className="topbar d-flex items-center justify-between">
          <div className="search-zone d-flex items-center">
            <Search size={18} className="search-icon text-muted" />
            <input type="text" placeholder="Rechercher..." className="search-input" />
          </div>

          <div className="user-zone d-flex items-center gap-4">
            <button className="notification-btn position-relative" onClick={() => alert("Aucune nouvelle notification.")}>
              <Bell size={20} className="text-muted" />
              <span className="notification-dot"></span>
            </button>
            
            <div 
              className="user-profile d-flex items-center gap-3" 
              style={{ cursor: 'pointer' }}
              onClick={() => alert("Paramètres du profil (à venir)")}
            >
              <div className="text-right d-none d-md-block">
                <div className="user-name">{user?.prenom} {user?.nom}</div>
                <div className="user-role">{user?.role === 'ADMIN' ? 'Administrateur Principal' : 'Superviseur'}</div>
              </div>
              <div className="avatar">
                <div className="avatar-placeholder">
                  {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page (Dashboard, etc.) */}
        <div className="page-content">
          {children}
        </div>
      </main>

      <style>{`
        .layout-container {
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-left: 260px; /* Largeur de la sidebar */
          background-color: var(--bg-app); /* Utilisation de la variable CSS */
          min-width: 0;
        }

        .topbar {
          height: 80px;
          padding: 0 2rem;
          background-color: var(--bg-app);
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .search-zone {
          position: relative;
          width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }

        .search-input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          border: 1px solid transparent;
          border-radius: 99px;
          background-color: var(--bg-hover);
          color: var(--text-dark);
          font-size: 0.875rem;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          background-color: var(--bg-panel);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .position-relative { position: relative; }
        
        .notification-btn {
          padding: 8px;
          border-radius: 50%;
          transition: background-color var(--transition-fast);
        }
        .notification-btn:hover { background-color: var(--bg-hover); }
        
        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background-color: var(--accent); /* Jaune/Or de Substancium */
          border-radius: 50%;
          border: 2px solid var(--bg-app);
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-dark);
          line-height: 1.2;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-hover);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .page-content {
          padding: 2rem;
        }
      `}</style>
    </div>
  );
};

export default Layout;
