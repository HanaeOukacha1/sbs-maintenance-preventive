import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sbs_maintenance.db');

export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY,
        titre TEXT,
        site_id INTEGER,
        site_nom TEXT,
        site_ville TEXT,
        marche_nom TEXT,
        checklist_type TEXT,
        feuilles TEXT,
        date_planifiee TEXT,
        statut TEXT,
        description TEXT,
        technicien_id INTEGER,
        sync_statut_en_attente INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS equipements (
        id INTEGER PRIMARY KEY,
        site_id INTEGER,
        sous_site TEXT,
        nom TEXT,
        designation TEXT,
        famille TEXT,
        marque TEXT,
        modele TEXT,
        numero_serie TEXT,
        numero_inventaire TEXT,
        type_equipement TEXT,
        direction TEXT,
        bureau TEXT,
        emplacement TEXT,
        affectation TEXT,
        entite TEXT,
        utilisateur_nom TEXT,
        cpu TEXT,
        ram TEXT,
        disque_dur TEXT,
        systeme_exploitation TEXT,
        stockage_utilise TEXT,
        antivirus TEXT,
        ip TEXT,
        est_serveur_redondant INTEGER DEFAULT 0,
        serveur_principal_id INTEGER,
        puissance_kva TEXT,
        nb_batteries INTEGER,
        capacite_batteries TEXT,
        zone TEXT,
        description TEXT,
        is_local INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER,
        equipement_id INTEGER,
        feuille TEXT,
        reponses TEXT,
        observations TEXT,
        est_hors_inventaire INTEGER DEFAULT 0,
        equipement_hors_inventaire TEXT,
        signature_technicien TEXT,
        signature_client TEXT,
        signature_utilisateur TEXT,
        heure_debut TEXT,
        heure_fin TEXT,
        sync_en_attente INTEGER DEFAULT 1,
        date_creation TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY,
        nom TEXT,
        ville TEXT,
        marche_id INTEGER,
        marche_nom TEXT,
        checklist_type TEXT,
        feuilles TEXT
      );

      CREATE TABLE IF NOT EXISTS json_schemas (
        id INTEGER PRIMARY KEY,
        nom TEXT,
        type_equipement TEXT,
        version INTEGER,
        schema_data TEXT,
        is_active INTEGER,
        marche_id INTEGER,
        site_id INTEGER
      );
    `);

    // Migrations légères pour BD existante
    const migrations = [
      'ALTER TABLE missions ADD COLUMN site_nom TEXT',
      'ALTER TABLE missions ADD COLUMN site_ville TEXT',
      'ALTER TABLE missions ADD COLUMN marche_nom TEXT',
      'ALTER TABLE missions ADD COLUMN checklist_type TEXT',
      'ALTER TABLE missions ADD COLUMN feuilles TEXT',
      'ALTER TABLE missions ADD COLUMN titre TEXT',
      'ALTER TABLE equipements ADD COLUMN sous_site TEXT',
      'ALTER TABLE equipements ADD COLUMN designation TEXT',
      'ALTER TABLE equipements ADD COLUMN famille TEXT',
      'ALTER TABLE equipements ADD COLUMN marque TEXT',
      'ALTER TABLE equipements ADD COLUMN modele TEXT',
      'ALTER TABLE equipements ADD COLUMN numero_inventaire TEXT',
      'ALTER TABLE equipements ADD COLUMN numero_serie TEXT',
      'ALTER TABLE equipements ADD COLUMN observations TEXT',
      'ALTER TABLE equipements ADD COLUMN direction TEXT',
      'ALTER TABLE equipements ADD COLUMN bureau TEXT',
      'ALTER TABLE equipements ADD COLUMN emplacement TEXT',
      'ALTER TABLE equipements ADD COLUMN affectation TEXT',
      'ALTER TABLE equipements ADD COLUMN entite TEXT',
      'ALTER TABLE equipements ADD COLUMN utilisateur_nom TEXT',
      'ALTER TABLE equipements ADD COLUMN cpu TEXT',
      'ALTER TABLE equipements ADD COLUMN ram TEXT',
      'ALTER TABLE equipements ADD COLUMN disque_dur TEXT',
      'ALTER TABLE equipements ADD COLUMN systeme_exploitation TEXT',
      'ALTER TABLE equipements ADD COLUMN stockage_utilise TEXT',
      'ALTER TABLE equipements ADD COLUMN antivirus TEXT',
      'ALTER TABLE equipements ADD COLUMN ip TEXT',
      'ALTER TABLE equipements ADD COLUMN est_serveur_redondant INTEGER DEFAULT 0',
      'ALTER TABLE equipements ADD COLUMN serveur_principal_id INTEGER',
      'ALTER TABLE equipements ADD COLUMN puissance_kva TEXT',
      'ALTER TABLE equipements ADD COLUMN nb_batteries INTEGER',
      'ALTER TABLE equipements ADD COLUMN capacite_batteries TEXT',
      'ALTER TABLE equipements ADD COLUMN zone TEXT',
      'ALTER TABLE equipements ADD COLUMN description TEXT',
      'ALTER TABLE equipements ADD COLUMN is_local INTEGER DEFAULT 0',
      'ALTER TABLE interventions ADD COLUMN feuille TEXT',
      'ALTER TABLE interventions ADD COLUMN est_hors_inventaire INTEGER DEFAULT 0',
      'ALTER TABLE interventions ADD COLUMN equipement_hors_inventaire TEXT',
      'ALTER TABLE interventions ADD COLUMN signature_technicien TEXT',
      'ALTER TABLE interventions ADD COLUMN signature_client TEXT',
      'ALTER TABLE interventions ADD COLUMN signature_utilisateur TEXT',
      'ALTER TABLE interventions ADD COLUMN heure_debut TEXT',
      'ALTER TABLE interventions ADD COLUMN heure_fin TEXT',
      'ALTER TABLE json_schemas ADD COLUMN marche_id INTEGER',
      'ALTER TABLE json_schemas ADD COLUMN site_id INTEGER',
    ];

    for (const sql of migrations) {
      try { db.execSync(sql); } catch (_) { /* colonne existe déjà */ }
    }

    // Migrations critiques pour tables existantes (v2)
    const migrationsV2 = [
      'ALTER TABLE interventions ADD COLUMN sync_en_attente INTEGER DEFAULT 1',
      'ALTER TABLE interventions ADD COLUMN date_creation TEXT DEFAULT (datetime(\'now\'))',
      'ALTER TABLE interventions ADD COLUMN feuille TEXT',
      'ALTER TABLE interventions ADD COLUMN est_hors_inventaire INTEGER DEFAULT 0',
      'ALTER TABLE interventions ADD COLUMN equipement_hors_inventaire TEXT',
      'ALTER TABLE interventions ADD COLUMN signature_technicien TEXT',
      'ALTER TABLE interventions ADD COLUMN signature_client TEXT',
      'ALTER TABLE interventions ADD COLUMN signature_utilisateur TEXT',
      'ALTER TABLE interventions ADD COLUMN heure_debut TEXT',
      'ALTER TABLE interventions ADD COLUMN heure_fin TEXT',
      'ALTER TABLE missions ADD COLUMN technicien_id INTEGER',
      'ALTER TABLE missions ADD COLUMN sync_statut_en_attente INTEGER DEFAULT 0',
      'ALTER TABLE sites ADD COLUMN feuilles TEXT',
    ];

    for (const sql of migrationsV2) {
      try { db.execSync(sql); } catch (_) { /* colonne existe déjà */ }
    }

    // Migration pour ajouter la colonne observations aux anciennes bases locales
    try {
      db.execSync("ALTER TABLE interventions ADD COLUMN observations TEXT;");
    } catch (e) {
      // La colonne existe probablement déjà
    }

    console.log('✅ SQLite initialisé');
  } catch (error) {
    console.error('❌ Erreur SQLite init:', error);
  }
};

export default db;
