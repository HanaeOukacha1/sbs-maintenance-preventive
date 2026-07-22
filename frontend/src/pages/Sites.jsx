import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Search, ChevronRight, Plus } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const Sites = () => {
  const [marches, setMarches] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedMarche, setSelectedMarche] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [siteSearchTerm, setSiteSearchTerm] = useState('');

  // ====== ETATS MODALES ======
  // Modale Marché
  const [isMarcheModalOpen, setIsMarcheModalOpen] = useState(false);
  const [isSubmittingMarche, setIsSubmittingMarche] = useState(false);
  const [marcheData, setMarcheData] = useState({ nom: '', description: '' });
  const [marcheErrors, setMarcheErrors] = useState({});
  const [marcheGlobalError, setMarcheGlobalError] = useState('');

  // Modale Site
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isSubmittingSite, setIsSubmittingSite] = useState(false);
  const [siteData, setSiteData] = useState({ nom: '', marche_id: '', ville: '', adresse: '' });
  const [siteErrors, setSiteErrors] = useState({});
  const [siteGlobalError, setSiteGlobalError] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resMarches, resSites] = await Promise.all([
        api.get('/marches/'),
        api.get('/sites/')
      ]);
      setMarches(resMarches.data);
      setSites(resSites.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrer les marchés
  const filteredMarches = marches.filter(m => 
    m.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrer les sites pour le marché sélectionné
  const filteredSites = sites.filter(s => {
    if (!selectedMarche) return false;
    const matchMarche = s.marche_id === selectedMarche.id;
    const matchSearch = s.nom.toLowerCase().includes(siteSearchTerm.toLowerCase()) || 
                        (s.ville && s.ville.toLowerCase().includes(siteSearchTerm.toLowerCase()));
    return matchMarche && matchSearch;
  });

  // ====== GESTION MARCHÉ ======
  const validateMarche = () => {
    const errors = {};
    if (!marcheData.nom.trim()) errors.nom = "Le nom du marché est requis.";
    setMarcheErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMarcheSubmit = async (e) => {
    e.preventDefault();
    if (!validateMarche()) return;

    try {
      setIsSubmittingMarche(true);
      setMarcheGlobalError('');
      const response = await api.post('/marches/', marcheData);
      setMarches([...marches, response.data]);
      setMarcheData({ nom: '', description: '' });
      setIsMarcheModalOpen(false);
    } catch (error) {
      setMarcheGlobalError(error.response?.data?.detail || "Erreur lors de la création.");
    } finally {
      setIsSubmittingMarche(false);
    }
  };

  // ====== GESTION SITE ======
  const validateSite = () => {
    const errors = {};
    if (!siteData.nom.trim()) errors.nom = "Le nom du site est requis.";
    if (!siteData.marche_id) errors.marche_id = "Veuillez sélectionner un marché.";
    if (!siteData.ville.trim()) errors.ville = "La ville est requise.";
    setSiteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    if (!validateSite()) return;

    try {
      setIsSubmittingSite(true);
      setSiteGlobalError('');
      const response = await api.post('/sites/', {
        ...siteData,
        marche_id: parseInt(siteData.marche_id)
      });
      setSites([...sites, response.data]);
      setSiteData({ nom: '', marche_id: '', ville: '', adresse: '' });
      setIsSiteModalOpen(false);
    } catch (error) {
      setSiteGlobalError(error.response?.data?.detail || "Erreur lors de la création.");
    } finally {
      setIsSubmittingSite(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Marchés & Sites</h1>
          <p className="text-muted">Sélectionnez un marché pour visualiser ses sites d'intervention.</p>
        </div>
      </div>

      <div className="master-detail-layout">
        
        {/* Colonne de gauche : Liste des Marchés */}
        <div className="master-column">
          <div className="card h-full flex-col">
            <div className="p-4 border-bottom">
              <div className="d-flex justify-between items-center mb-3">
                <h2 className="text-h2" style={{ margin: 0, fontSize: '1.1rem' }}>Marchés ({marches.length})</h2>
                <button 
                  className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => setIsMarcheModalOpen(true)}
                >
                  <Plus size={14} /> Nouveau
                </button>
              </div>
              <div className="search-zone w-full">
                <Search size={16} className="search-icon text-muted" style={{ left: '10px' }} />
                <input 
                  type="text" 
                  placeholder="Rechercher un marché..." 
                  className="form-input" 
                  style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', padding: '0.5rem 1rem 0.5rem 2.2rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="marche-list">
              {isLoading ? (
                <div className="p-4 text-center text-muted">Chargement...</div>
              ) : filteredMarches.length === 0 ? (
                <div className="p-4 text-center text-muted">Aucun marché trouvé.</div>
              ) : (
                filteredMarches.map(marche => (
                  <div 
                    key={marche.id} 
                    className={`marche-item ${selectedMarche?.id === marche.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMarche(marche);
                      setSiteSearchTerm('');
                    }}
                  >
                    <div className="d-flex items-center gap-3">
                      <div className="marche-icon">
                        <Briefcase size={18} />
                      </div>
                      <div className="marche-info">
                        <div className="marche-name">{marche.nom}</div>
                        <div className="marche-desc">{marche.description || 'Aucune description'}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="chevron" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Colonne de droite : Détails du marché et ses sites */}
        <div className="detail-column">
          {selectedMarche ? (
            <div className="card h-full flex-col animate-fade-in">
              {/* Header du marché sélectionné */}
              <div className="p-4 border-bottom" style={{ backgroundColor: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <div className="d-flex justify-between items-center">
                  <div>
                    <span className="badge cyan mb-2">Marché Sélectionné</span>
                    <h2 className="text-h1" style={{ marginBottom: '0.25rem' }}>{selectedMarche.nom}</h2>
                    <p className="text-muted">{selectedMarche.description || 'Aucune description'}</p>
                  </div>
                </div>
              </div>

              {/* Liste des sites */}
              <div className="p-4 flex-1">
                <div className="d-flex justify-between items-center mb-4">
                  <h3 className="text-h3 d-flex items-center gap-2">
                    <MapPin size={18} className="text-muted" />
                    Sites d'intervention ({sites.filter(s => s.marche_id === selectedMarche.id).length})
                  </h3>
                  
                  <div className="d-flex gap-3">
                    <div className="search-zone" style={{ width: '250px' }}>
                      <Search size={16} className="search-icon text-muted" style={{ left: '10px' }} />
                      <input 
                        type="text" 
                        placeholder="Filtrer les sites..." 
                        className="form-input" 
                        style={{ paddingLeft: '2.2rem', padding: '0.4rem 1rem 0.4rem 2.2rem' }}
                        value={siteSearchTerm}
                        onChange={(e) => setSiteSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <button 
                      className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSiteData({ ...siteData, marche_id: selectedMarche.id });
                        setIsSiteModalOpen(true);
                      }}
                    >
                      <Plus size={14} /> Ajouter un Site
                    </button>
                  </div>
                </div>

                <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nom du Site</th>
                        <th>Ville</th>
                        <th>Adresse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSites.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-4 text-muted">Aucun site pour ce marché.</td></tr>
                      ) : (
                        filteredSites.map(site => (
                          <tr key={site.id}>
                            <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{site.nom}</td>
                            <td>{site.ville || '-'}</td>
                            <td className="text-muted">{site.adresse || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-full d-flex flex-col items-center justify-center text-center p-4">
              <div className="empty-state-icon mb-3">
                <Briefcase size={48} color="var(--border-strong)" />
              </div>
              <h2 className="text-h2 text-muted">Aucun marché sélectionné</h2>
              <p className="text-muted">Veuillez sélectionner un marché dans la liste de gauche pour visualiser ses sites.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .master-detail-layout {
          display: flex;
          gap: 1.5rem;
          height: calc(100vh - 160px); /* Hauteur fixe pour scroller à l'intérieur */
        }
        
        .master-column {
          width: 350px;
          flex-shrink: 0;
        }

        .detail-column {
          flex: 1;
          min-width: 0;
        }

        .h-full { height: 100%; }
        .flex-1 { flex: 1; overflow-y: auto; }
        .border-bottom { border-bottom: 1px solid var(--border-light); }

        .marche-list {
          overflow-y: auto;
          flex: 1;
        }

        .marche-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-light);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color var(--transition-fast);
        }

        .marche-item:last-child { border-bottom: none; }
        .marche-item:hover { background-color: #f8fafc; }
        
        .marche-item.active {
          background-color: var(--primary-light);
          border-left: 4px solid var(--primary);
          padding-left: calc(1rem - 4px);
        }

        .marche-item .chevron {
          color: transparent;
          transition: color var(--transition-fast);
        }
        .marche-item:hover .chevron { color: var(--border-strong); }
        .marche-item.active .chevron { color: var(--primary); }

        .marche-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background-color: #f1f5f9;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .marche-item.active .marche-icon {
          background-color: white;
          color: var(--primary);
        }

        .marche-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .marche-name {
          font-weight: 600;
          color: var(--text-dark);
          font-size: 0.95rem;
        }
        .marche-item.active .marche-name {
          color: var(--primary);
        }
        .marche-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .empty-state-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-input { border-color: var(--danger) !important; box-shadow: 0 0 0 3px var(--danger-bg) !important; }
        .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 4px; font-weight: 500; }
        .text-danger { color: var(--danger); }
      `}</style>

      {/* ================= MODALE MARCHÉ ================= */}
      <Modal 
        isOpen={isMarcheModalOpen} 
        onClose={() => { setIsMarcheModalOpen(false); setMarcheErrors({}); setMarcheGlobalError(''); }}
        title="Créer un Nouveau Marché"
      >
        <form onSubmit={handleMarcheSubmit} className="flex-col gap-3" noValidate>
          {marcheGlobalError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
              {marcheGlobalError}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Nom du Marché <span className="text-danger">*</span></label>
            <input 
              type="text" className={`form-input ${marcheErrors.nom ? 'error-input' : ''}`} 
              value={marcheData.nom} 
              onChange={(e) => {
                setMarcheData({...marcheData, nom: e.target.value});
                if (marcheErrors.nom) setMarcheErrors({...marcheErrors, nom: ''});
              }}
              placeholder="Ex: Contrat Maintenance AMEE"
            />
            {marcheErrors.nom && <div className="error-text">{marcheErrors.nom}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Description (Optionnel)</label>
            <textarea 
              className="form-input" 
              rows="3"
              value={marcheData.description} 
              onChange={(e) => setMarcheData({...marcheData, description: e.target.value})}
              placeholder="Détails du contrat, durée, etc."
            ></textarea>
          </div>

          <div className="d-flex justify-end gap-2 mt-4 pt-4 border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setIsMarcheModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmittingMarche}>
              {isSubmittingMarche ? 'Création...' : 'Créer le Marché'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODALE SITE ================= */}
      <Modal 
        isOpen={isSiteModalOpen} 
        onClose={() => { setIsSiteModalOpen(false); setSiteErrors({}); setSiteGlobalError(''); }}
        title="Ajouter un Site d'Intervention"
      >
        <form onSubmit={handleSiteSubmit} className="flex-col gap-3" noValidate>
          {siteGlobalError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
              {siteGlobalError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Marché Associé <span className="text-danger">*</span></label>
            <select 
              className={`form-input ${siteErrors.marche_id ? 'error-input' : ''}`}
              value={siteData.marche_id}
              onChange={(e) => {
                setSiteData({...siteData, marche_id: e.target.value});
                if (siteErrors.marche_id) setSiteErrors({...siteErrors, marche_id: ''});
              }}
            >
              <option value="">-- Sélectionner un marché --</option>
              {marches.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
            {siteErrors.marche_id && <div className="error-text">{siteErrors.marche_id}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Nom du Site <span className="text-danger">*</span></label>
            <input 
              type="text" className={`form-input ${siteErrors.nom ? 'error-input' : ''}`} 
              value={siteData.nom} 
              onChange={(e) => {
                setSiteData({...siteData, nom: e.target.value});
                if (siteErrors.nom) setSiteErrors({...siteErrors, nom: ''});
              }}
              placeholder="Ex: Siège Principal AMEE"
            />
            {siteErrors.nom && <div className="error-text">{siteErrors.nom}</div>}
          </div>
          
          <div className="d-flex gap-3">
            <div className="form-group flex-1">
              <label className="form-label">Ville <span className="text-danger">*</span></label>
              <input 
                type="text" className={`form-input ${siteErrors.ville ? 'error-input' : ''}`} 
                value={siteData.ville} 
                onChange={(e) => {
                  setSiteData({...siteData, ville: e.target.value});
                  if (siteErrors.ville) setSiteErrors({...siteErrors, ville: ''});
                }}
                placeholder="Ex: Rabat"
              />
              {siteErrors.ville && <div className="error-text">{siteErrors.ville}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse détaillée (Optionnel)</label>
            <textarea 
              className="form-input" 
              rows="2"
              value={siteData.adresse} 
              onChange={(e) => setSiteData({...siteData, adresse: e.target.value})}
              placeholder="Rue, Quartier, Bâtiment..."
            ></textarea>
          </div>

          <div className="d-flex justify-end gap-2 mt-4 pt-4 border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setIsSiteModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmittingSite}>
              {isSubmittingSite ? 'Création...' : 'Créer le Site'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Sites;
