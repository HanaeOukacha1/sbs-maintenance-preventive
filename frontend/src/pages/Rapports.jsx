import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, ChevronDown, ChevronUp, Calendar, MapPin, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

const Rapports = () => {
  const [interventions, setInterventions] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [expanded, setExpanded]           = useState(null);
  const [sitesMap, setSitesMap]           = useState({});
  const [usersMap, setUsersMap]           = useState({});
  const [missionsMap, setMissionsMap]     = useState({});
  const [equipementsMap, setEquipementsMap] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [resInter, resSites, resUsers, resMissions, resEq] = await Promise.all([
          api.get('/interventions/'),
          api.get('/sites/'),
          api.get('/users/'),
          api.get('/missions/'),
          api.get('/equipements/?limit=500'),
        ]);

        const sm = {}; resSites.data.forEach(s => { sm[s.id] = s; }); setSitesMap(sm);
        const um = {}; resUsers.data.forEach(u => { um[u.id] = u; }); setUsersMap(um);
        const mm = {}; resMissions.data.forEach(m => { mm[m.id] = m; }); setMissionsMap(mm);
        const em = {}; resEq.data.forEach(e => { em[e.id] = e; }); setEquipementsMap(em);
        setInterventions(resInter.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = interventions.filter(inv => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const eq = equipementsMap[inv.equipement_id];
    const mission = missionsMap[inv.mission_id];
    return (
      (eq?.numero_serie || '').toLowerCase().includes(q) ||
      (eq?.nom || '').toLowerCase().includes(q) ||
      (mission?.titre || '').toLowerCase().includes(q)
    );
  });

  const parseReponses = (rep) => {
    if (!rep) return null;
    if (typeof rep === 'object') return rep;
    try { return JSON.parse(rep); } catch { return null; }
  };

  const getStatutIcon = (rep) => {
    const r = parseReponses(rep);
    if (!r) return <span className="text-muted">—</span>;
    const vals = Object.values(r);
    const allOk = vals.every(v => ['OK', 'BON', 'oui', 'Oui'].includes(v));
    if (allOk) return <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>✅ Bon état</span>;
    return <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>⚠️ Problème</span>;
  };

  return (
    <div className="page-wrapper">
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Rapports d'Interventions</h1>
          <p className="text-muted">{interventions.length} rapport{interventions.length !== 1 ? 's' : ''} remontés depuis les appareils mobiles.</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="card p-4 mb-4">
        <div className="search-zone" style={{ maxWidth: 420 }}>
          <Search size={18} className="search-icon text-muted" />
          <input
            type="text"
            placeholder="Rechercher par N° série, équipement, mission..."
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-col gap-3">
        {isLoading ? (
          <div className="card p-4 text-center text-muted">Chargement des rapports...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-4 text-center text-muted">Aucun rapport trouvé.</div>
        ) : filtered.map(inv => {
          const eq      = equipementsMap[inv.equipement_id];
          const mission = missionsMap[inv.mission_id];
          const site    = sitesMap[mission?.site_id];
          const tech    = usersMap[mission?.technicien_id];
          const reponses = parseReponses(inv.reponses);
          const isOpen  = expanded === inv.id;

          return (
            <div key={inv.id} className="card" style={{ overflow: 'hidden' }}>
              {/* En-tête de la carte */}
              <div
                className="d-flex justify-between items-center p-4"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setExpanded(isOpen ? null : inv.id)}
              >
                <div className="d-flex items-center gap-4" style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: 4 }}>
                      {eq ? `${eq.designation || eq.type_equipement} — ${eq.marque || ''} ${eq.modele || ''}` : `Équipement #${inv.equipement_id || 'Hors-inventaire'}`}
                    </div>
                    <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                      {eq?.numero_serie && (
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          S/N: {eq.numero_serie}
                        </span>
                      )}
                      {mission && (
                        <span className="d-flex items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                          <MapPin size={12} /> {site?.nom || `Site #${mission.site_id}`}
                        </span>
                      )}
                      {tech && (
                        <span className="d-flex items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                          <User size={12} /> {tech.prenom} {tech.nom}
                        </span>
                      )}
                      {inv.created_at && (
                        <span className="d-flex items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                          <Calendar size={12} /> {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {inv.feuille && (
                        <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '0.7rem' }}>
                          {inv.feuille}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex items-center gap-3">
                  {getStatutIcon(inv.reponses)}
                  {isOpen ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                </div>
              </div>

              {/* Détail des réponses */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem', backgroundColor: '#f8fafc' }}>
                  {reponses ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      {Object.entries(reponses).map(([key, val]) => {
                        const isOk = ['OK', 'BON', 'oui', 'Oui'].includes(val);
                        const isNon = ['Non', 'NON', 'non'].includes(val);
                        return (
                          <div key={key} style={{ backgroundColor: '#fff', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="d-flex items-center gap-2">
                              {isOk && <CheckCircle2 size={16} color="#16a34a" />}
                              {isNon && <XCircle size={16} color="#dc2626" />}
                              {!isOk && !isNon && <Clock size={16} color="#94a3b8" />}
                              <span style={{
                                fontWeight: 600,
                                color: isOk ? '#16a34a' : isNon ? '#dc2626' : 'var(--text-dark)',
                                fontSize: '0.875rem',
                              }}>
                                {String(val)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Aucun détail disponible.</p>
                  )}

                  {/* Observation texte libre */}
                  {inv.observations && (
                    <div style={{ marginTop: '1rem', backgroundColor: '#fff', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>OBSERVATION</div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-dark)', margin: 0 }}>{inv.observations}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rapports;
