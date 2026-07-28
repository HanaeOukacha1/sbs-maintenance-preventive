import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Sites from './pages/Sites';
import Equipements from './pages/Equipements';
import Missions from './pages/Missions';
import Rapports from './pages/Rapports';
import Schemas from './pages/Schemas';
import SettingsPage from './pages/Settings';
import Layout from './components/Layout';
import authService from './services/authService';
import './index.css';

// Composant pour protéger les routes qui nécessitent d'être connecté
const RequireAuth = ({ children }) => {
  if (!authService.isAuthenticated()) {
    // Si pas de token, on redirige de force vers le login
    return <Navigate to="/login" replace />;
  }
  return children;
};



const App = () => {
  // Appliquer le thème au chargement globalement
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />
        
        {/* Routes privées (protégées par RequireAuth) */}
        <Route 
          path="/" 
          element={
            <RequireAuth>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/users" 
          element={
            <RequireAuth>
              <Layout>
                <Users />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/sites" 
          element={
            <RequireAuth>
              <Layout>
                <Sites />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/equipements" 
          element={
            <RequireAuth>
              <Layout>
                <Equipements />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/missions" 
          element={
            <RequireAuth>
              <Layout>
                <Missions />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/rapports" 
          element={
            <RequireAuth>
              <Layout>
                <Rapports />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/schemas" 
          element={
            <RequireAuth>
              <Layout>
                <Schemas />
              </Layout>
            </RequireAuth>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <RequireAuth>
              <Layout>
                <SettingsPage />
              </Layout>
            </RequireAuth>
          } 
        />
        
        {/* Fallback si URL inconnue */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
