import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Palette } from 'lucide-react';
import authService from '../services/authService';
import api from '../services/api';
import Modal from '../components/Modal';

const SettingsPage = () => {
  const user = authService.getCurrentUser();
  const [theme, setTheme] = useState('light');

  // États de la modale de mot de passe
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passwordData.newPassword.length < 8) {
      setErrorMsg("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/users/${user.id}`, { password: passwordData.newPassword });
      setSuccessMsg("Mot de passe mis à jour avec succès !");
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "Erreur lors du changement de mot de passe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="mb-4">
        <h1 className="text-h1">Paramètres</h1>
        <p className="text-muted">Gérez les préférences de votre compte et du portail.</p>
      </div>

      <div className="settings-grid">
        
        {/* Mon Profil */}
        <div className="card p-4">
          <div className="d-flex items-center gap-2 mb-4 border-bottom pb-3">
            <Shield size={20} className="text-primary" />
            <h2 className="text-h2" style={{ margin: 0 }}>Mon Profil</h2>
          </div>
          
          <div className="form-group">
            <label className="form-label">Nom Complet</label>
            <input type="text" className="form-input" disabled value={`${user?.prenom} ${user?.nom}`} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" disabled value={user?.email} />
          </div>

          <div className="form-group">
            <label className="form-label">Rôle</label>
            <input type="text" className="form-input" disabled value={user?.role} />
          </div>
          
          <button 
            className="btn btn-secondary mt-2"
            onClick={() => {
              setIsModalOpen(true);
              setSuccessMsg('');
              setErrorMsg('');
            }}
          >
            Changer le mot de passe
          </button>
        </div>

        {/* Préférences */}
        <div className="card p-4">
          <div className="d-flex items-center gap-2 mb-4 border-bottom pb-3">
            <Palette size={20} className="text-primary" />
            <h2 className="text-h2" style={{ margin: 0 }}>Préférences</h2>
          </div>
          
          <div className="d-flex justify-between items-center mb-3">
            <div>
              <div style={{ fontWeight: 500 }}>Thème de l'application</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Basculer entre Light Mode et Dark Mode</div>
            </div>
            <select className="form-input" style={{ width: 'auto' }} value={theme} onChange={handleThemeChange}>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>
        </div>

      </div>

      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          max-width: 800px;
        }
        .pb-3 { padding-bottom: 1rem; }
        .border-bottom { border-bottom: 1px solid var(--border-light); }
      `}</style>

      {/* MODALE CHANGEMENT DE MOT DE PASSE */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Changer le mot de passe"
      >
        <form onSubmit={handlePasswordSubmit} className="flex-col gap-3">
          {errorMsg && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: '6px', fontSize: '0.875rem' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: '6px', fontSize: '0.875rem' }}>
              {successMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <input 
              type="password" 
              className="form-input" 
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <input 
              type="password" 
              className="form-input" 
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            />
          </div>

          <div className="d-flex justify-end gap-2 mt-4 pt-4 border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || successMsg !== ''}>
              {isSubmitting ? 'Mise à jour...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
