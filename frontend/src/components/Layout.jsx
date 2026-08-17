import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, FileText } from 'lucide-react';
import Sidebar from './Sidebar';
import authService from '../services/authService';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fermer les dropdowns si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

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
            {/* Notifications */}
            <div className="position-relative" ref={notifRef}>
              <button 
                className="notification-btn position-relative" 
                onClick={() => setShowNotifs(!showNotifs)}
              >
                <Bell size={20} className="text-muted" />
                <span className="notification-dot"></span>
              </button>
              
              {showNotifs && (
                <div className="dropdown-menu-custom notif-menu">
                  <div className="dropdown-header">
                    <h6>Notifications</h6>
                  </div>
                  <div className="dropdown-body empty-state">
                    <p className="text-muted mb-0">Aucune nouvelle notification.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profil */}
            <div className="position-relative" ref={profileRef}>
              <div 
                className="user-profile d-flex items-center gap-3" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/settings')}
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
          background-color: var(--primary-light);
          color: var(--primary);
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .page-content {
          padding: 2rem;
          flex: 1;
          background-color: var(--bg-app);
        }

        /* --- Custom Dropdowns --- */
        .dropdown-menu-custom {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 12px;
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          min-width: 240px;
          animation: dropFade 0.2s ease forwards;
        }

        .dropdown-menu-custom.notif-menu {
          min-width: 300px;
        }

        @keyframes dropFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-light);
        }
        
        .dropdown-header h6 {
          margin: 0;
          font-weight: 700;
          color: var(--text-dark);
        }

        .dropdown-body.empty-state {
          padding: 32px 16px;
          text-align: center;
        }

        .dropdown-item {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          color: var(--text-dark);
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background-color: var(--bg-hover);
        }

        .dropdown-divider {
          height: 1px;
          background-color: var(--border-light);
          margin: 4px 0;
        }

        .text-danger {
          color: #ef4444 !important;
        }

        .text-danger:hover {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }

        /* Media Query for mobile sidebar (optionnel) */
        @media (max-width: 991px) {
          .main-content {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
