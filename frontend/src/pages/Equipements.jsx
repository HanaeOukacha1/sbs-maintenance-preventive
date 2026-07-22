import React, { useState, useEffect } from 'react';
import { Monitor, Search, Filter, Cpu, Download } from 'lucide-react';
import api from '../services/api';

const Equipements = () => {
  const [equipements, setEquipements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Limite fixée pour ne pas saturer le navigateur avec les 7800 équipements
  // Dans un vrai cas de production, on ferait une pagination côté serveur (skip/limit)
  const LIMIT = 500;

  const fetchEquipements = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/equipements/?limit=${LIMIT}`);
      setEquipements(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des équipements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipements();
  }, []);

  // Recherche multicritères
  const filteredEquipements = equipements.filter(eq => {
    // Filtre texte
    const searchLower = searchTerm.toLowerCase();
    const matchText = 
      (eq.nom && eq.nom.toLowerCase().includes(searchLower)) ||
      (eq.numero_serie && eq.numero_serie.toLowerCase().includes(searchLower)) ||
      (eq.marque && eq.marque.toLowerCase().includes(searchLower));
      
    // Filtre par type
    const matchType = typeFilter === '' || eq.type_equipement === typeFilter;

    return matchText && matchType;
  });

  return (
    <div className="page-wrapper">
      {/* En-tête de page */}
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Parc Équipements</h1>
          <p className="text-muted">Inventaire global des équipements audités sur l'ensemble des sites.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary">
            <Download size={16} /> Exporter (Excel)
          </button>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="card p-4 mb-4 d-flex justify-between items-center">
        <div className="search-zone" style={{ width: '400px' }}>
          <Search size={18} className="search-icon text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher par N° Série, Marque ou Modèle..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="d-flex items-center gap-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-input" 
              style={{ padding: '0.4rem 2rem 0.4rem 1rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="SERVEUR">Serveur</option>
              <option value="PC">PC Bureau</option>
              <option value="PORTABLE">PC Portable</option>
              <option value="ONDULEUR">Onduleur</option>
              <option value="BAIE_BRASSAGE">Baie de brassage</option>
              <option value="IMPRIMANTE">Imprimante</option>
              <option value="ECRAN">Écran</option>
              <option value="SCANNER">Scanner</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <span className="badge gray">
            Affichage des {filteredEquipements.length} résultats
          </span>
        </div>
      </div>

      {/* Tableau des équipements */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table className="table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Type</th>
                <th>Désignation</th>
                <th>Marque & Modèle</th>
                <th>N° Série</th>
                <th>Site (ID)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Chargement de l'inventaire...</td></tr>
              ) : filteredEquipements.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Aucun équipement trouvé.</td></tr>
              ) : (
                filteredEquipements.map((eq) => (
                  <tr key={eq.id}>
                    <td>
                      <div className="d-flex items-center gap-2">
                        <div className="type-icon">
                          {eq.type_equipement === 'SERVEUR' ? <Cpu size={14} /> : <Monitor size={14} />}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          {eq.type_equipement}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                      {eq.nom || 'Non défini'}
                    </td>
                    <td>
                      <div>{eq.marque || '-'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{eq.modele || ''}</div>
                    </td>
                    <td>
                      <span className="badge gray" style={{ fontFamily: 'monospace' }}>
                        {eq.numero_serie || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge cyan">Site #{eq.site_id}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .type-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .table-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .table-container::-webkit-scrollbar-track {
          background: #f1f5f9; 
        }
        .table-container::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}</style>
    </div>
  );
};

export default Equipements;
