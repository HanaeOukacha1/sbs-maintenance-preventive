import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import authService from '../services/authService';
import Modal from '../components/Modal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [marches, setMarches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la modale d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '', role: 'TECHNICIEN', marche_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  
  // L'utilisateur actuellement connecté
  const currentUser = authService.getCurrentUser();

  const fetchUsersAndMarches = async () => {
    try {
      setIsLoading(true);
      const [usersRes, marchesRes] = await Promise.all([
        api.get('/users/'),
        api.get('/marches/')
      ]);
      setUsers(usersRes.data);
      setMarches(marchesRes.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndMarches();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        alert("Erreur lors de la suppression : " + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur spécifique au champ quand l'utilisateur tape
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (globalError) setGlobalError('');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.prenom.trim()) errors.prenom = "Le prénom est requis.";
    if (!formData.nom.trim()) errors.nom = "Le nom est requis.";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "L'email est requis.";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Le format de l'email est invalide.";
    }
    
    if (!formData.password) {
      errors.password = "Le mot de passe est requis.";
    } else if (formData.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (formData.role === 'TECHNICIEN' && !formData.marche_id) {
      errors.marche_id = "Le marché est requis pour un technicien.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setGlobalError('');
      // Appel API pour créer l'utilisateur
      const payload = { ...formData };
      if (payload.role !== 'TECHNICIEN' || !payload.marche_id) {
        payload.marche_id = null;
      } else {
        payload.marche_id = parseInt(payload.marche_id, 10);
      }
      const response = await api.post('/users/', payload);
      
      // Ajouter le nouvel utilisateur à la liste locale
      setUsers([...users, response.data]);
      
      // Réinitialiser et fermer la modale
      setFormData({ nom: '', prenom: '', email: '', password: '', role: 'TECHNICIEN', marche_id: '' });
      setFormErrors({});
      setIsModalOpen(false);
    } catch (error) {
      console.error(error.response);
      let errorMsg = "Erreur inattendue lors de la création.";
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Erreurs de validation FastAPI
          errorMsg = error.response.data.detail.map(e => {
            const field = e.loc[e.loc.length - 1];
            return `${field}: ${e.msg}`;
          }).join(' | ');
        } else {
          // Erreur métier (ex: Email déjà utilisé)
          errorMsg = error.response.data.detail;
        }
      }
      
      setGlobalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrage local basé sur la recherche
  const filteredUsers = users.filter(u => 
    `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      {/* En-tête de page */}
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Gestion des Utilisateurs</h1>
          <p className="text-muted">Gérez les accès des techniciens et superviseurs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Nouvel Utilisateur
        </button>
      </div>

      {/* Barre d'outils (Filtres, Recherche) */}
      <div className="card p-4 mb-4 d-flex justify-between items-center">
        <div className="search-zone" style={{ width: '350px' }}>
          <Search size={18} className="search-icon text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou email..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* On pourrait ajouter des filtres par rôle ici */}
        <div className="d-flex gap-2">
          <span className="badge gray d-flex items-center">
            Total : {filteredUsers.length}
          </span>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Marché</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Chargement...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Aucun utilisateur trouvé.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex items-center gap-3">
                        <div className="mini-avatar" style={{ backgroundColor: 'var(--border-light)', color: '#475569' }}>
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </div>
                        <div style={{ fontWeight: 500 }}>{user.prenom} {user.nom}</div>
                      </div>
                    </td>
                    <td className="text-muted">{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'ADMIN' ? 'gold' : 
                        user.role === 'SUPERVISEUR' ? 'cyan' : 'gray'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.role === 'TECHNICIEN' && user.marche_nom ? (
                        <span className="badge blue">{user.marche_nom}</span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'cyan' : 'gray'}`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-flex justify-end gap-2">
                        <button className="btn-icon" title="Modifier">
                          <Edit size={16} className="text-muted" />
                        </button>
                        {/* Empêcher l'admin de se supprimer lui-même */}
                        {currentUser?.email !== user.email && (
                          <button 
                            className="btn-icon delete" 
                            title="Supprimer"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .btn-icon {
          padding: 6px;
          border-radius: 6px;
          transition: background-color var(--transition-fast);
        }
        .btn-icon:hover {
          background-color: var(--bg-app);
        }
        .btn-icon.delete:hover {
          background-color: var(--danger-bg);
          color: var(--danger);
        }
        .btn-icon.delete:hover svg {
          color: var(--danger);
        }
        .justify-end { justify-content: flex-end; }
        .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
      `}</style>

      {/* Modale d'ajout d'utilisateur */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setGlobalError('');
          setFormErrors({});
        }}
        title="Ajouter un Utilisateur"
      >
        <form onSubmit={handleSubmit} className="flex-col gap-3" noValidate>
          {globalError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
              {globalError}
            </div>
          )}
          
          <div className="d-flex gap-3">
            <div className="form-group flex-1">
              <label className="form-label">Prénom <span className="text-danger">*</span></label>
              <input 
                type="text" name="prenom" 
                className={`form-input ${formErrors.prenom ? 'error-input' : ''}`} 
                value={formData.prenom} onChange={handleInputChange} 
                placeholder="Ex: Alex"
              />
              {formErrors.prenom && <div className="error-text">{formErrors.prenom}</div>}
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Nom <span className="text-danger">*</span></label>
              <input 
                type="text" name="nom" 
                className={`form-input ${formErrors.nom ? 'error-input' : ''}`} 
                value={formData.nom} onChange={handleInputChange} 
                placeholder="Ex: Dubois"
              />
              {formErrors.nom && <div className="error-text">{formErrors.nom}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Email professionnel <span className="text-danger">*</span></label>
            <input 
              type="email" name="email" 
              className={`form-input ${formErrors.email ? 'error-input' : ''}`} 
              value={formData.email} onChange={handleInputChange} 
              placeholder="ex: a.dubois@sbs.ma"
            />
            {formErrors.email && <div className="error-text">{formErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Mot de passe temporaire <span className="text-danger">*</span></label>
            <input 
              type="password" name="password" 
              className={`form-input ${formErrors.password ? 'error-input' : ''}`} 
              value={formData.password} onChange={handleInputChange} 
              placeholder="Min. 8 caractères"
            />
            {formErrors.password && <div className="error-text">{formErrors.password}</div>}
            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Le mot de passe doit comporter au moins 8 caractères. L'utilisateur pourra le modifier plus tard.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rôle assigné <span className="text-danger">*</span></label>
            <select 
              name="role" className="form-input" 
              value={formData.role} onChange={handleInputChange}
            >
              <option value="TECHNICIEN">Technicien (Accès mobile uniquement)</option>
              <option value="SUPERVISEUR">Superviseur (Accès web limité)</option>
            </select>
            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Note : La création d'Administrateur est verrouillée.
            </div>
          </div>

          {formData.role === 'TECHNICIEN' && (
            <div className="form-group">
              <label className="form-label">Affectation au marché <span className="text-danger">*</span></label>
              <select 
                name="marche_id" className={`form-input ${formErrors.marche_id ? 'error-input' : ''}`}
                value={formData.marche_id} onChange={handleInputChange}
              >
                <option value="">-- Sélectionner un marché --</option>
                {marches.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </select>
              {formErrors.marche_id && <div className="error-text">{formErrors.marche_id}</div>}
            </div>
          )}

          <div className="d-flex justify-end gap-2 mt-4 pt-4 border-top">
            <button 
              type="button" className="btn btn-secondary" 
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Création en cours...' : 'Confirmer la création'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .error-input {
          border-color: var(--danger) !important;
          box-shadow: 0 0 0 3px var(--danger-bg) !important;
        }
        .error-text {
          color: var(--danger);
          font-size: 0.75rem;
          margin-top: 4px;
          font-weight: 500;
        }
        .text-danger {
          color: var(--danger);
        }
      `}</style>
    </div>
  );
};

export default Users;
