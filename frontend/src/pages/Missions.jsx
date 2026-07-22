import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, Calendar, MapPin, User as UserIcon, Settings2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const Missions = () => {
  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // États pour les listes déroulantes de la modale
  const [techniciens, setTechniciens] = useState([]);
  const [sites, setSites] = useState([]);
  const [schemas, setSchemas] = useState([]);

  // États pour la modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titre: '', description: '', date_planifiee: '', 
    technicien_id: '', site_id: '', json_schema_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const fetchDonnees = async () => {
    try {
      setIsLoading(true);
      // On charge toutes les données nécessaires en parallèle pour gagner du temps
      const [resMissions, resUsers, resSites, resSchemas] = await Promise.all([
        api.get('/missions/'),
        api.get('/users/'),
        api.get('/sites/'),
        api.get('/json-schemas/')
      ]);
      
      setMissions(resMissions.data);
      // On ne garde que les techniciens pour l'assignation des missions
      setTechniciens(resUsers.data.filter(u => u.role === 'TECHNICIEN'));
      setSites(resSites.data);
      setSchemas(resSchemas.data.filter(s => s.is_active));
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonnees();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.titre.trim()) errors.titre = "Le titre est requis.";
    if (!formData.date_planifiee) errors.date_planifiee = "La date prévue est requise.";
    if (!formData.technicien_id) errors.technicien_id = "Veuillez assigner un technicien.";
    if (!formData.site_id) errors.site_id = "Veuillez sélectionner un site.";
    if (!formData.json_schema_id) errors.json_schema_id = "Veuillez sélectionner un formulaire d'audit.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setGlobalError('');
      
      // On convertit les ID en nombres (parseInt) car les Select renvoient des strings
      const payload = {
        ...formData,
        technicien_id: parseInt(formData.technicien_id),
        site_id: parseInt(formData.site_id),
        json_schema_id: parseInt(formData.json_schema_id)
      };

      const response = await api.post('/missions/', payload);
      setMissions([...missions, response.data]);
      
      // Reset
      setFormData({ titre: '', description: '', date_planifiee: '', technicien_id: '', site_id: '', json_schema_id: '' });
      setIsModalOpen(false);
    } catch (error) {
      setGlobalError(error.response?.data?.detail || "Erreur lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMissions = missions.filter(m => {
    const matchText = m.titre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === '' || m.statut === statusFilter;
    return matchText && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLANIFIEE': return <span className="badge gray">Planifiée</span>;
      case 'EN_COURS': return <span className="badge cyan">En Cours</span>;
      case 'TERMINEE': return <span className="badge gold">Terminée</span>;
      case 'SYNCHRONISEE': return <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Synchronisée</span>;
      default: return <span className="badge gray">{status}</span>;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Gestion des Missions</h1>
          <p className="text-muted">Planifiez et suivez l'avancement des interventions sur site.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nouvelle Mission
        </button>
      </div>

      <div className="card p-4 mb-4 d-flex justify-between items-center">
        <div className="search-zone" style={{ width: '350px' }}>
          <Search size={18} className="search-icon text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher une mission..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="d-flex gap-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-input" 
              style={{ padding: '0.4rem 2rem 0.4rem 1rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En Cours</option>
              <option value="TERMINEE">Terminée</option>
              <option value="SYNCHRONISEE">Synchronisée</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mission</th>
                <th>Technicien assigné</th>
                <th>Site (ID)</th>
                <th>Date Prévue</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Chargement des missions...</td></tr>
              ) : filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="flex-col items-center justify-center text-muted gap-2">
                      <Briefcase size={32} />
                      <p>Aucune mission planifiée.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMissions.map((mission) => (
                  <tr key={mission.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{mission.titre}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                        Schema ID: {mission.json_schema_id || 'Aucun'}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-2 text-muted">
                        <UserIcon size={14} />
                        Tech #{mission.technicien_id}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-2 text-muted">
                        <MapPin size={14} />
                        Site #{mission.site_id}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-2 text-muted">
                        <Calendar size={14} />
                        {new Date(mission.date_planifiee).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(mission.statut)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setFormErrors({}); setGlobalError(''); }}
        title="Planifier une Nouvelle Mission"
      >
        <form onSubmit={handleSubmit} className="flex-col gap-3" noValidate>
          {globalError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
              {globalError}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Titre de la mission <span className="text-danger">*</span></label>
            <input 
              type="text" name="titre" 
              className={`form-input ${formErrors.titre ? 'error-input' : ''}`} 
              value={formData.titre} onChange={handleInputChange} 
              placeholder="Ex: Audit Trimestriel Onduleurs"
            />
            {formErrors.titre && <div className="error-text">{formErrors.titre}</div>}
          </div>

          <div className="d-flex gap-3">
            <div className="form-group flex-1">
              <label className="form-label">Site d'intervention <span className="text-danger">*</span></label>
              <select 
                name="site_id" 
                className={`form-input ${formErrors.site_id ? 'error-input' : ''}`}
                value={formData.site_id} onChange={handleInputChange}
              >
                <option value="">-- Sélectionner un site --</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.nom} ({s.ville})</option>
                ))}
              </select>
              {formErrors.site_id && <div className="error-text">{formErrors.site_id}</div>}
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Date prévue <span className="text-danger">*</span></label>
              <input 
                type="date" name="date_planifiee" 
                className={`form-input ${formErrors.date_planifiee ? 'error-input' : ''}`} 
                value={formData.date_planifiee} onChange={handleInputChange} 
              />
              {formErrors.date_planifiee && <div className="error-text">{formErrors.date_planifiee}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technicien Assigné <span className="text-danger">*</span></label>
            <select 
              name="technicien_id" 
              className={`form-input ${formErrors.technicien_id ? 'error-input' : ''}`}
              value={formData.technicien_id} onChange={handleInputChange}
            >
              <option value="">-- Sélectionner un technicien --</option>
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
              ))}
            </select>
            {formErrors.technicien_id && <div className="error-text">{formErrors.technicien_id}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Formulaire d'Audit (Schéma JSON) <span className="text-danger">*</span></label>
            <select 
              name="json_schema_id" 
              className={`form-input ${formErrors.json_schema_id ? 'error-input' : ''}`}
              value={formData.json_schema_id} onChange={handleInputChange}
            >
              <option value="">-- Sélectionner le modèle --</option>
              {schemas.map(s => (
                <option key={s.id} value={s.id}>{s.nom} (v{s.version})</option>
              ))}
            </select>
            {formErrors.json_schema_id && <div className="error-text">{formErrors.json_schema_id}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Description / Consignes (Optionnel)</label>
            <textarea 
              name="description" className="form-input" rows="2"
              value={formData.description} onChange={handleInputChange} 
              placeholder="Consignes particulières pour le technicien..."
            ></textarea>
          </div>

          <div className="d-flex justify-end gap-2 mt-4 pt-4 border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Planifier la Mission'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .error-input { border-color: var(--danger) !important; box-shadow: 0 0 0 3px var(--danger-bg) !important; }
        .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 4px; font-weight: 500; }
        .text-danger { color: var(--danger); }
        .border-top { border-top: 1px solid var(--border-light); }
      `}</style>
    </div>
  );
};

export default Missions;
