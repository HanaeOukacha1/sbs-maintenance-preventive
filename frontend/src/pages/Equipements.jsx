import React, { useState, useEffect } from 'react';
import { Monitor, Search, MapPin, Tag, Layers } from 'lucide-react';
import api from '../services/api';

const TYPE_COLORS = {
  SERVEUR:      { bg: '#ede9fe', color: '#7c3aed' },
  PC:           { bg: '#e0f2fe', color: '#0284c7' },
  PORTABLE:     { bg: '#dbeafe', color: '#1d4ed8' },
  IMPRIMANTE:   { bg: '#fef3c7', color: '#d97706' },
  ECRAN:        { bg: '#f0fdf4', color: '#16a34a' },
  ONDULEUR:     { bg: '#fee2e2', color: '#dc2626' },
  SCANNER:      { bg: '#fce7f3', color: '#be185d' },
  PHOTOCOPIEUR: { bg: '#fef9c3', color: '#ca8a04' },
  FAX:          { bg: '#e0e7ff', color: '#4338ca' },
  AIO:          { bg: '#d1fae5', color: '#059669' },
  AUTRE:        { bg: 'var(--bg-app)', color: 'var(--text-muted)' },
};

const Equipements = () => {
  const [equipements, setEquipements] = useState([]);
  const [sites, setSites] = useState({});
  const [marches, setMarches] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [marcheFilter, setMarcheFilter] = useState('');
  const [marchesList, setMarchesList] = useState([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [resEq, resSites, resMarches] = await Promise.all([
          api.get('/equipements/?limit=500'),
          api.get('/sites/'),
          api.get('/marches/'),
        ]);
        setEquipements(resEq.data);

        // Map id → objet pour lookup rapide
        const sitesMap = {};
        resSites.data.forEach(s => { sitesMap[s.id] = s; });
        setSites(sitesMap);

        const marchesMap = {};
        resSites.data.forEach(s => {
          marchesMap[s.id] = resMarches.data.find(m => m.id === s.marche_id);
        });
        setMarches(marchesMap);
        setMarchesList(resMarches.data);
      } catch (e) {
        console.error("Erreur lors de la récupération des équipements:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  console.log("Équipements chargés:", equipements.length, "Sites:", Object.keys(sites).length);

  const filtered = equipements.filter(eq => {
    const q = searchTerm.toLowerCase();
    const matchText = !searchTerm || (
      String(eq.numero_serie || '').toLowerCase().includes(q) ||
      String(eq.nom || '').toLowerCase().includes(q) ||
      String(eq.marque || '').toLowerCase().includes(q) ||
      String(eq.designation || '').toLowerCase().includes(q) ||
      String(eq.modele || '').toLowerCase().includes(q)
    );
    const matchType = !typeFilter || eq.type_equipement === typeFilter;
    const site = sites[eq.site_id];
    const marche = site ? marches[eq.site_id] : null;
    const matchMarche = !marcheFilter || (marche && String(marche.id) === marcheFilter);
    return matchText && matchType && matchMarche;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="page-wrapper">
      <div className="d-flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1">Parc Équipements</h1>
          <p className="text-muted">Inventaire de {equipements.length.toLocaleString()} équipements sur {Object.keys(sites).length} sites.</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4 mb-4">
        <div className="d-flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="search-zone" style={{ flex: 1, minWidth: 250 }}>
            <Search size={18} className="search-icon text-muted" />
            <input
              type="text"
              placeholder="N° Série, Désignation, Marque, Modèle..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            />
          </div>

          <select className="form-input" style={{ width: 180 }} value={marcheFilter} onChange={e => { setMarcheFilter(e.target.value); setPage(0); }}>
            <option value="">Tous les marchés</option>
            {marchesList.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>

          <select className="form-input" style={{ width: 160 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}>
            <option value="">Tous les types</option>
            {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <span className="badge gray">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          <table className="table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th>Type</th>
                <th>Désignation / Nom</th>
                <th>Marque & Modèle</th>
                <th className="text-right">N° Série</th>
                <th>Site</th>
                <th>Marché</th>
                <th>Sous-site</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">Chargement...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">Aucun équipement trouvé.</td></tr>
              ) : paged.map(eq => {
                const typeStyle = TYPE_COLORS[eq.type_equipement] || TYPE_COLORS.AUTRE;
                const site = sites[eq.site_id];
                const marche = site ? marches[eq.site_id] : null;
                return (
                  <tr key={eq.id}>
                    <td>
                      <span className="badge" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color, fontSize: '0.75rem' }}>
                        {eq.type_equipement}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                      {eq.designation || eq.famille || eq.nom || '—'}
                    </td>
                    <td>
                      <div>{eq.marque || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{eq.modele || ''}</div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-muted">
                        {eq.numero_serie || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex items-center gap-1">
                        <MapPin size={12} className="text-muted" />
                        <span style={{ fontSize: '0.85rem' }}>{site?.nom || `Site #${eq.site_id}`}</span>
                      </div>
                    </td>
                    <td>
                      {marche ? (
                        <span className="badge cyan" style={{ fontSize: '0.75rem' }}>{marche.nom}</span>
                      ) : '—'}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {eq.sous_site || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-between items-center p-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Page {page + 1} / {totalPages} ({filtered.length} résultats)
            </span>
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                ← Précédent
              </button>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipements;
