import api from './api';
import * as SecureStore from 'expo-secure-store';
import db from './dbService';

const syncService = {
  // Sync matinale : télécharge missions + équipements + sites
  downloadMorningData: async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) throw new Error('Non authentifié');

    console.log('🔄 Synchronisation...');

    // 1. Récupération de TOUTES les données (Missions, Sites, Equipements) en 1 seule requête
    const syncRes = await api.get('/missions/sync-data');
    const { missions, sites, equipements: allEquipements } = syncRes.data;
    
    // 2. Transformer la liste des sites en dictionnaire (sitesMap) pour l'insertion
    const sitesMap = {};
    for (const site of sites) {
      sitesMap[site.id] = site;
    }

    // 4. Insérer dans SQLite
    db.withTransactionSync(() => {
      db.execSync('DELETE FROM missions;');
      db.execSync('DELETE FROM sites;');
      db.execSync('DELETE FROM equipements WHERE is_local = 0;');

      // Sites
      const insSite = db.prepareSync(
        'INSERT OR REPLACE INTO sites (id, nom, ville, marche_id, marche_nom, checklist_type, feuilles) VALUES (?,?,?,?,?,?,?)'
      );
      for (const site of Object.values(sitesMap)) {
        insSite.executeSync([
          site.id, site.nom, site.ville, site.marche_id, site.marche_nom || '',
          site.checklist_type || null,
          site.feuilles ? JSON.stringify(site.feuilles) : null,
        ]);
      }
      insSite.finalizeSync();

      // Missions
      const insMission = db.prepareSync(
        `INSERT OR REPLACE INTO missions 
         (id, titre, site_id, site_nom, site_ville, marche_nom, checklist_type, feuilles, date_planifiee, statut, description)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      );
      for (const m of missions) {
        const site = sitesMap[m.site_id] || {};
        insMission.executeSync([
          m.id, m.titre || '', m.site_id,
          site.nom || '', site.ville || '', site.marche_nom || '',
          site.checklist_type || null,
          site.feuilles ? JSON.stringify(site.feuilles) : null,
          m.date_planifiee, m.statut, m.description || '',
        ]);
      }
      insMission.finalizeSync();

      // Équipements
      const insEq = db.prepareSync(
        `INSERT OR REPLACE INTO equipements
         (id, site_id, sous_site, nom, designation, famille, marque, modele, numero_serie,
          numero_inventaire, type_equipement, direction, bureau, emplacement, affectation,
          entite, utilisateur_nom, cpu, ram, disque_dur, systeme_exploitation,
          stockage_utilise, antivirus, ip, est_serveur_redondant, serveur_principal_id,
          puissance_kva, nb_batteries, capacite_batteries, zone, description, is_local)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`
      );
      for (const eq of allEquipements) {
        insEq.executeSync([
          eq.id, eq.site_id, eq.sous_site || null, eq.nom, eq.designation || null,
          eq.famille || null, eq.marque || null, eq.modele || null, eq.numero_serie || null,
          eq.numero_inventaire || null, eq.type_equipement,
          eq.direction || null, eq.bureau || null, eq.emplacement || null,
          eq.affectation || null, eq.entite || null, eq.utilisateur_nom || null,
          eq.cpu || null, eq.ram || null, eq.disque_dur || null,
          eq.systeme_exploitation || null, eq.stockage_utilise || null,
          eq.antivirus || null, eq.ip || null,
          eq.est_serveur_redondant ? 1 : 0, eq.serveur_principal_id || null,
          eq.puissance_kva || null, eq.nb_batteries || null,
          eq.capacite_batteries || null, eq.zone || null, eq.description || null,
        ]);
      }
      insEq.finalizeSync();
    });

    console.log(`✅ Sync: ${missions.length} missions, ${allEquipements.length} équipements`);
    return { missions: missions.length, equipements: allEquipements.length };
  },

  // Upload soir : envoie les interventions en attente vers le serveur
  uploadEveningData: async () => {
    const pendingInterventions = db.getAllSync(
      'SELECT * FROM interventions WHERE sync_en_attente = 1'
    );
    const pendingMissions = db.getAllSync(
      'SELECT id, statut FROM missions WHERE sync_statut_en_attente = 1 AND statut = ?',
      ['TERMINEE']
    );

    if (pendingInterventions.length === 0 && pendingMissions.length === 0) {
      return { uploaded: 0 };
    }

    let uploadedInterventions = 0;
    for (const intervention of pendingInterventions) {
      try {
        let isHorsInventaire = intervention.est_hors_inventaire === 1;
        let horsInventaireData = intervention.equipement_hors_inventaire
            ? JSON.parse(intervention.equipement_hors_inventaire) : null;
        let equipId = intervention.equipement_id || null;

        // Si l'équipement est local, on le transforme en hors-inventaire pour le serveur
        if (equipId) {
           const eq = db.getFirstSync('SELECT * FROM equipements WHERE id = ?', [equipId]);
           if (eq && eq.is_local === 1) {
              isHorsInventaire = true;
              equipId = null;
              horsInventaireData = {
                 numero_serie: eq.numero_serie,
                 designation: eq.designation,
                 type_equipement: eq.type_equipement,
                 marque: eq.marque,
                 modele: eq.modele
              };
           }
        }

        const payload = {
          mission_id: intervention.mission_id,
          equipement_id: equipId,
          feuille: intervention.feuille || null,
          reponses: intervention.reponses ? JSON.parse(intervention.reponses) : null,
          observations: intervention.observations || null,
          est_hors_inventaire: isHorsInventaire,
          equipement_hors_inventaire: horsInventaireData,
          signature_technicien: intervention.signature_technicien || null,
          signature_client: intervention.signature_client || null,
          signature_utilisateur: intervention.signature_utilisateur || null,
          heure_debut: intervention.heure_debut || null,
          heure_fin: intervention.heure_fin || null,
        };

        await api.post('/interventions/', payload);

        db.runSync(
          'UPDATE interventions SET sync_en_attente = 0 WHERE id = ?',
          [intervention.id]
        );
        uploadedInterventions++;
      } catch (err) {
        console.error('Erreur upload intervention', intervention.id, err);
      }
    }

    let uploadedMissions = 0;
    for (const m of pendingMissions) {
      try {
        await api.put(`/missions/${m.id}`, { statut: 'TERMINEE' });
        db.runSync('UPDATE missions SET sync_statut_en_attente = 0 WHERE id = ?', [m.id]);
        uploadedMissions++;
      } catch (err) {
        console.error('Erreur upload statut mission', m.id, err);
      }
    }

    console.log(`✅ Upload: ${uploadedInterventions}/${pendingInterventions.length} interventions, ${uploadedMissions}/${pendingMissions.length} statuts de mission`);
    return { uploaded: uploadedInterventions + uploadedMissions, total: pendingInterventions.length + pendingMissions.length };
  },

  // Sauvegarder une intervention localement (offline-first)
  saveIntervention: (data) => {
    const stmt = db.prepareSync(
      `INSERT INTO interventions
       (mission_id, equipement_id, feuille, reponses, observations,
        est_hors_inventaire, equipement_hors_inventaire,
        signature_technicien, signature_client, signature_utilisateur,
        heure_debut, heure_fin, sync_en_attente)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`
    );
    stmt.executeSync([
      data.mission_id,
      data.equipement_id || null,
      data.feuille || null,
      data.reponses ? JSON.stringify(data.reponses) : null,
      data.observations || null,
      data.est_hors_inventaire ? 1 : 0,
      data.equipement_hors_inventaire ? JSON.stringify(data.equipement_hors_inventaire) : null,
      data.signature_technicien || null,
      data.signature_client || null,
      data.signature_utilisateur || null,
      data.heure_debut || null,
      data.heure_fin || null,
    ]);
    stmt.finalizeSync();
  },
};

export default syncService;
