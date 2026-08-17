import React, { useState, useEffect } from 'react';
import { FileJson, Search, Plus, Eye, Code, Edit, Trash2, Save, GripVertical } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const Schemas = () => {
  const [schemas, setSchemas] = useState([]);
  const [marches, setMarches] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form Builder state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [formData, setFormData] = useState({ nom: '', type_equipement: 'GLOBAL', description: '', marche_id: '', site_id: '' });
  const [schemaFields, setSchemaFields] = useState([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [schemasRes, marchesRes, sitesRes] = await Promise.all([
        api.get('/json-schemas/'),
        api.get('/marches/'),
        api.get('/sites/')
      ]);
      setSchemas(schemasRes.data);
      setMarches(marchesRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSchema(null);
    setFormData({ nom: '', type_equipement: 'GLOBAL', description: '', marche_id: '', site_id: '' });
    setSchemaFields([]);
    setIsModalOpen(true);
  };

  const openEditModal = (schema) => {
    setEditingSchema(schema);
    setFormData({ 
      nom: schema.nom, 
      type_equipement: schema.type_equipement, 
      description: schema.description || '',
      marche_id: schema.marche_id || '',
      site_id: schema.site_id || ''
    });
    
    let parsedFields = [];
    try {
      const data = typeof schema.schema_data === 'string' ? JSON.parse(schema.schema_data) : schema.schema_data;
      if (Array.isArray(data)) {
        parsedFields = data;
      } else if (typeof data === 'object' && data !== null && data.properties) {
        // Fallback for old schema format {"type": "object", "properties": {...}}
        parsedFields = Object.keys(data.properties).map(k => ({
          key: k,
          label: data.properties[k].title || k,
          options: data.properties[k].type === 'boolean' ? ['OK', 'NON'] : []
        }));
      }
    } catch (e) {
      console.warn("Invalid schema_data format", e);
    }
    
    setSchemaFields(parsedFields);
    setIsModalOpen(true);
  };

  const addField = () => {
    const newField = {
      key: `field_${Date.now()}`,
      label: 'Nouveau champ',
      options: ['OK', 'Non']
    };
    setSchemaFields([...schemaFields, newField]);
  };

  const updateField = (index, key, value) => {
    const updated = [...schemaFields];
    if (key === 'options') {
      updated[index][key] = value.split(',').map(s => s.trim()).filter(s => s);
    } else if (key === 'label') {
      updated[index][key] = value;
      // Auto-generate technical key behind the scenes so the user doesn't have to
      updated[index]['key'] = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    } else {
      updated[index][key] = value;
    }
    setSchemaFields(updated);
  };

  const removeField = (index) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const handleSaveSchema = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        marche_id: formData.marche_id ? parseInt(formData.marche_id) : null,
        site_id: formData.site_id ? parseInt(formData.site_id) : null,
        schema_data: schemaFields
      };

      if (editingSchema) {
        await api.put(`/json-schemas/${editingSchema.id}`, payload);
      } else {
        await api.post('/json-schemas/', payload);
      }
      
      await fetchData();
      setIsModalOpen(false);
    } catch (error) {
      alert("Erreur lors de la sauvegarde : " + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <button className="btn btn-primary" onClick={openCreateModal}>
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
                  <FileJson size={20} className="text-primary" />
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
                    <button className="btn-icon" title="Modifier" onClick={() => openEditModal(schema)}>
                      <Edit size={16} className="text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM BUILDER */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingSchema ? `Modifier le schéma : ${editingSchema.nom}` : "Nouveau Schéma JSON"}
      >
        <form onSubmit={handleSaveSchema} className="flex-col gap-4">
          <div className="d-flex gap-3">
            <div className="form-group flex-1">
              <label className="form-label">Nom du schéma (ex: ADM, ANCFCC)</label>
              <input 
                type="text" className="form-input" required
                value={formData.nom} 
                onChange={e => setFormData({...formData, nom: e.target.value})}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Type d'équipement visé</label>
              <input 
                type="text" className="form-input" required
                value={formData.type_equipement} 
                onChange={e => setFormData({...formData, type_equipement: e.target.value})}
                placeholder="Ex: GLOBAL, EXTINCTEUR, GROUPE_ELECTROGENE..."
              />
              <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>Détermine à quel onglet ce formulaire s'applique.</span>
            </div>
          </div>
          
          <div className="d-flex gap-3 mt-2">
            <div className="form-group flex-1">
              <label className="form-label">Marché cible (optionnel)</label>
              <select 
                className="form-input" 
                value={formData.marche_id}
                onChange={e => setFormData({...formData, marche_id: e.target.value, site_id: ''})}
              >
                <option value="">-- Applicable à TOUS les marchés --</option>
                {marches.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </select>
              <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>Laissez vide pour un formulaire standard global.</span>
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Site cible (optionnel)</label>
              <select 
                className="form-input" 
                value={formData.site_id}
                onChange={e => setFormData({...formData, site_id: e.target.value})}
                disabled={!formData.marche_id}
              >
                <option value="">-- Applicable à TOUS les sites du marché --</option>
                {sites.filter(s => s.marche_id == formData.marche_id).map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
              <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>Nécessite d'abord de sélectionner un marché.</span>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description (optionnelle)</label>
            <input 
              type="text" className="form-input"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="form-builder border-top pt-4 mt-2">
            <div className="d-flex justify-between items-center mb-3">
              <h3 className="text-h3" style={{ margin: 0 }}>Champs du formulaire ({schemaFields.length})</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addField}>
                <Plus size={14} /> Ajouter un champ
              </button>
            </div>

            <div className="fields-container" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {schemaFields.length === 0 ? (
                <div className="text-center text-muted py-4" style={{ backgroundColor: 'var(--bg-hover)', borderRadius: '8px' }}>
                  Aucun champ défini. Cliquez sur "Ajouter un champ".
                </div>
              ) : (
                schemaFields.map((field, index) => (
                  <div key={index} className="field-editor-card mb-3 p-3" style={{ backgroundColor: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div className="d-flex justify-between items-start mb-2">
                      <div className="d-flex items-center gap-2">
                        <GripVertical size={16} className="text-muted" style={{ cursor: 'move' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Champ #{index + 1}</span>
                      </div>
                      <button type="button" className="btn-icon delete" onClick={() => removeField(index)}>
                        <Trash2 size={16} className="text-danger" />
                      </button>
                    </div>
                    
                    <div className="form-group mb-2">
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Question / Label (ex: État de la porte)</label>
                      <input 
                        type="text" className="form-input" style={{ padding: '6px 12px' }}
                        value={field.label || ''} 
                        onChange={e => updateField(index, 'label', e.target.value)}
                        placeholder="Ex: État de l'extincteur"
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Options (séparées par une virgule)</label>
                      <input 
                        type="text" className="form-input" style={{ padding: '6px 12px' }}
                        value={Array.isArray(field.options) ? field.options.join(', ') : ''} 
                        onChange={e => updateField(index, 'options', e.target.value)}
                        placeholder="Ex: OK, Non, À remplacer"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="d-flex justify-end gap-2 mt-4 pt-4 border-top">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : (editingSchema ? 'Mettre à jour' : 'Créer le schéma')}
            </button>
          </div>
        </form>
      </Modal>

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
          background-color: var(--bg-hover);
          transition: background-color var(--transition-fast);
          border: none;
          cursor: pointer;
        }
        .btn-icon:hover {
          background-color: var(--border-strong);
        }
        .btn-remove-field {
          background-color: var(--danger-bg);
          color: var(--danger);
          padding: 0.5rem;
        }
        .btn-remove-field:hover {
          background-color: var(--danger-bg);
          opacity: 0.8;
        }
        .text-primary { color: var(--primary); }
        .text-danger { color: var(--danger); }
      `}</style>
    </div>
  );
};

export default Schemas;
