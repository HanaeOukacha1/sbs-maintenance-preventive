import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const Missions = () => {
  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [techniciens, setTechniciens] = useState([]);
  const [sites, setSites] = useState([]);
  const [sitesMap, setSitesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titre: '', description: '', date_planifiee: '',
    technicien_id: '', site_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const fetchDonnees = async () => {
    try {
      setIsLoading(true);
      const [resMissions, resUsers, resSites] = await Promise.all([
        api.get('/missions/'),
        api.get('/users/'),
        api.get('/sites/'),
      ]);

      const uMap = {};
      resUsers.data.forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);

      const sMap = {};
      resSites.data.forEach(s => { sMap[s.id] = s; });
      setSitesMap(sMap);

      setMissions(resMissions.data);
      setTechniciens(resUsers.data.filter(u => u.role === 'TECHNICIEN'));
      setSites(resSites.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDonnees(); }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.titre.trim()) errors.titre = 'Le titre est requis.';
    if (!formData.date_planifiee) errors.date_planifiee = 'La date est requise.';
    if (!formData.technicien_id) errors.technicien_id = 'Veuillez assigner un technicien.';
    if (!formData.site_id) errors.site_id = 'Veuillez sélectionner un site.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      setGlobalError('');
      const payload = {
        ...formData,
        technicien_id: parseInt(formData.technicien_id),
        site_id: parseInt(formData.site_id),
      };
      const response = await api.post('/missions/', payload);
      setMissions([...missions, response.data]);
      setFormData({ titre: '', description: '', date_planifiee: '', technicien_id: '', site_id: '' });
      setIsModalOpen(false);
    } catch (e) {
      setGlobalError(e.response?.data?.detail || 'Erreur lors de la création.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = missions.filter(m => {
    const matchText = (m.titre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || m.statut === statusFilter;
    return matchText && matchStatus;
  });

  const getStatusBadge = (status) => {
    const map = {
      PLANIFIEE:    { bg: '#e0f2fe', color: '#0284c7', label: 'Planifiée' },
      EN_COURS:     { bg: '#fef3c7', color: '#d97706', label: 'En cours' },
      TERMINEE:     { bg: '#dcfce7', color: '#16a34a', label: 'Terminée' },
      SYNCHRONISEE: { bg: '#f0fdf4', color: '#15803d', label: 'Synchronisée' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
    return <span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div className="page-wrapper">
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Gestion des Missions</h1>
          <p className="text-muted">Planifiez et suivez les interventions sur site.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nouvelle Mission
        </button>
      </div>

      <div className="card p-4 mb-4 d-flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="search-zone" style={{ width: 350 }}>
          <Search size={18} className="search-icon text-muted" />
          <input
            type="text" placeholder="Rechercher une mission..."
            className="form-input" style={{ paddingLeft: '2.5rem' }}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: 180, padding: '0.4rem 1rem' }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="PLANIFIEE">Planifiée</option>
          <option value="EN_COURS">En Cours</option>
          <option value="TERMINEE">Terminée</option>
          <option value="SYNCHRONISEE">Synchronisée</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mission</th>
                <th>Technicien</th>
                <th>Site</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">Aucune mission.</td></tr>
              ) : filtered.map(m => {
                const tech = usersMap[m.technicien_id];
                const site = sitesMap[m.site_id];
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{m.titre || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.description || ''}</div>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-2 text-muted">
                        <UserIcon size={14} />
                        {tech ? `${tech.prenom || ''} ${tech.nom || ''}`.trim() : `Tech #${m.technicien_id}`}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-1 text-muted">
                        <MapPin size={14} />
                        <div>
                          <div>{site?.nom || `Site #${m.site_id}`}</div>
                          {site?.ville && <div style={{ fontSize: '0.75rem' }}>{site.ville}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-2 text-muted">
                        <Calendar size={14} />
                        {m.date_planifiee ? new Date(m.date_planifiee).toLocaleDateString('fr-FR') : '—'}
                      </div>
                    </td>
                    <td>{getStatusBadge(m.statut)}</td>
                    <td>
                      {m.statut === 'TERMINEE' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Télécharger le rapport"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const res = await fetch(`http://localhost:8000/api/v1/missions/${m.id}/export`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (!res.ok) throw new Error("Erreur lors du téléchargement");
                              
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              
                              // Récupérer le nom du fichier depuis le header Content-Disposition si possible
                              const disposition = res.headers.get('Content-Disposition');
                              let filename = "Rapport.xlsx"; // défaut
                              if (disposition && disposition.indexOf('filename=') !== -1) {
                                filename = disposition.split('filename=')[1];
                              }
                              
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                        >
                          Télécharger
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormErrors({}); setGlobalError(''); }} title="Planifier une Nouvelle Mission">
        <form onSubmit={handleSubmit} className="flex-col gap-3" noValidate>
          {globalError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: 12, borderRadius: 8, fontSize: '0.875rem' }}>
              {globalError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Titre <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" name="titre" className={`form-input ${formErrors.titre ? 'error-input' : ''}`}
              value={formData.titre} onChange={handleInputChange} placeholder="Ex: Audit Q1 2026 Onduleurs" />
            {formErrors.titre && <div className="error-text">{formErrors.titre}</div>}
          </div>

          <div className="d-flex gap-3">
            <div className="form-group flex-1">
              <label className="form-label">Site <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select name="site_id" className={`form-input ${formErrors.site_id ? 'error-input' : ''}`}
                value={formData.site_id} onChange={handleInputChange}>
                <option value="">-- Sélectionner --</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.nom} ({s.ville})</option>)}
              </select>
              {formErrors.site_id && <div className="error-text">{formErrors.site_id}</div>}
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Date prévue <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="date" name="date_planifiee" className={`form-input ${formErrors.date_planifiee ? 'error-input' : ''}`}
                value={formData.date_planifiee} onChange={handleInputChange} />
              {formErrors.date_planifiee && <div className="error-text">{formErrors.date_planifiee}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technicien <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select name="technicien_id" className={`form-input ${formErrors.technicien_id ? 'error-input' : ''}`}
              value={formData.technicien_id} onChange={handleInputChange}>
              <option value="">-- Sélectionner --</option>
              {techniciens.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
            </select>
            {formErrors.technicien_id && <div className="error-text">{formErrors.technicien_id}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description / Consignes (optionnel)</label>
            <textarea name="description" className="form-input" rows="2"
              value={formData.description} onChange={handleInputChange}
              placeholder="Consignes particulières..." />
          </div>

          <div className="d-flex justify-end gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Planifier la Mission'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .error-input { border-color: var(--danger) !important; }
        .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 4px; }
      `}</style>
    </div>
  );
};

export default Missions;
