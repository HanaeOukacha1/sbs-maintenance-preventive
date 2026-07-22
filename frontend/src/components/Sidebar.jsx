import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Monitor, 
  Users, 
  Briefcase, 
  FileJson, 
  LogOut, 
  Settings
} from 'lucide-react';
import authService from '../services/authService';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tableau de Bord', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Sites & Marchés', path: '/sites', icon: <MapPin size={20} /> },
    { name: 'Équipements', path: '/equipements', icon: <Monitor size={20} /> },
    { name: 'Missions', path: '/missions', icon: <Briefcase size={20} /> },
    { name: 'Utilisateurs', path: '/users', icon: <Users size={20} /> },
    { name: 'Schémas', path: '/schemas', icon: <FileJson size={20} /> },
  ];

  return (
    <aside className="sidebar flex-col justify-between">
      <div>
        <div className="sidebar-header d-flex items-center justify-center p-4">
          <div className="brand-logo">
            <span className="brand-primary">SUBSTANCIUM</span>
            <span className="brand-secondary">Business Services</span>
          </div>
        </div>

        <nav className="sidebar-nav flex-col gap-1 p-4">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item d-flex items-center gap-3 ${isActive ? 'active' : ''}`}
            >
              <div className="icon-wrapper">{item.icon}</div>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer p-4 flex-col gap-1">
        <NavLink to="/settings" className="nav-item d-flex items-center gap-3 w-full mb-2">
          <div className="icon-wrapper"><Settings size={20} /></div>
          <span>Paramètres</span>
        </NavLink>
        <button className="nav-item btn-logout d-flex items-center gap-3 w-full" onClick={handleLogout}>
          <div className="icon-wrapper"><LogOut size={20} /></div>
          <span>Déconnexion</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-light);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
        }

        .sidebar-header {
          height: 80px; /* Alignement avec le header topbar */
          border-bottom: 1px solid var(--border-light);
        }

        .brand-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }

        .brand-primary {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 1px;
        }

        .brand-secondary {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--accent);
        }

        .nav-item {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          color: var(--text-muted);
          transition: all var(--transition-fast);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .nav-item:hover {
          color: var(--text-dark);
          background-color: rgba(0,0,0,0.03);
        }

        .nav-item.active {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-logout {
          color: var(--text-muted);
        }
        .btn-logout:hover {
          color: var(--danger);
          background-color: var(--danger-bg);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
