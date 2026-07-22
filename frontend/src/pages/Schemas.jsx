import React, { useState, useEffect } from 'react';
import { FileJson, Search, Plus, Eye, Code } from 'lucide-react';
import api from '../services/api';

const Schemas = () => {
  const [schemas, setSchemas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSchemas = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/json-schemas/');
      setSchemas(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des schémas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, []);

  const filteredSchemas = schemas.filter(s => 
    s.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Modèles de Formulaires (JSON Schemas)</h1>
          <p className="text-muted">Gérez la structure des formulaires dynamiques envoyés à l'application mobile.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Nouveau Schéma
        </button>
      </div>

      <div className="card p-4 mb-4 d-flex justify-between items-center">
        <div className="search-zone" style={{ width: '350px' }}>
          <Search size={18} className="search-icon text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher un schéma..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="schemas-grid">
        {isLoading ? (
          <div className="text-muted p-4">Chargement des schémas...</div>
        ) : filteredSchemas.length === 0 ? (
          <div className="text-muted p-4">Aucun schéma trouvé.</div>
        ) : (
          filteredSchemas.map((schema) => (
            <div key={schema.id} className="card schema-card">
              <div className="schema-header border-bottom p-3 d-flex justify-between items-center">
                <div className="d-flex items-center gap-2">
                  <FileJson size={20} className="text-muted" />
                  <h3 className="text-h3" style={{ margin: 0 }}>{schema.nom}</h3>
                </div>
                <span className={`badge ${schema.is_active ? 'cyan' : 'gray'}`}>
                  v{schema.version}
                </span>
              </div>
              
              <div className="schema-body p-3">
                <div className="text-muted mb-3" style={{ fontSize: '0.85rem', minHeight: '40px' }}>
                  {schema.description || 'Aucune description fournie.'}
                </div>
                
                <div className="d-flex justify-between items-center mt-3 pt-3 border-top">
                  <span className="badge gray" style={{ fontSize: '0.7rem' }}>
                    Type: {schema.type_equipement}
                  </span>
                  
                  <div className="d-flex gap-2">
                    <button className="btn-icon" title="Voir les champs">
                      <Eye size={16} className="text-muted" />
                    </button>
                    <button className="btn-icon" title="Voir le JSON brut">
                      <Code size={16} className="text-muted" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .schemas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .schema-card {
          display: flex;
          flex-direction: column;
        }

        .border-bottom { border-bottom: 1px solid var(--border-light); }
        .border-top { border-top: 1px solid var(--border-light); }

        .btn-icon {
          padding: 6px;
          border-radius: 6px;
          background-color: #f1f5f9;
          transition: background-color var(--transition-fast);
        }
        .btn-icon:hover {
          background-color: var(--border-strong);
        }
      `}</style>
    </div>
  );
};

export default Schemas;
