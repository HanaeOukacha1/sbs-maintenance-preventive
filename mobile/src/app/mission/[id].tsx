import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft, Search, Plus, CheckCircle2, XCircle,
  ChevronRight, Layers, Download,
} from 'lucide-react-native';
import db from '../../services/dbService';
import syncService from '../../services/syncService';
import api from '../../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import FicheInterventionModal from '../../components/FicheInterventionModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mission {
  id: number; titre: string; site_id: number; site_nom: string;
  site_ville: string; marche_nom: string; checklist_type: string;
  feuilles: string | null; statut: string; date_planifiee: string;
}

interface Equipement {
  id: number; nom: string; designation: string; famille: string;
  marque: string; modele: string; numero_serie: string; numero_inventaire: string;
  type_equipement: string; direction: string; bureau: string; emplacement: string;
  affectation: string; entite: string; utilisateur_nom: string; cpu: string;
  ram: string; disque_dur: string; systeme_exploitation: string; ip: string;
  puissance_kva: string; nb_batteries: number; est_serveur_redondant: number;
  serveur_principal_id: number; sous_site: string;
}

// Champs que le technicien remplit selon le type de checklist
const CHECKLIST_FIELDS: Record<string, string[]> = {
  ADM:             ['etat_software', 'etat_hardware'],
  AMEE_MARRAKECH:  ['statut'],
  AMEE_RABAT:      ['statut'],
  ANCFCC:          [], // géré séparément (10 points)
  ANP:             ['etat'],
  AOH:             ['etat'],
  INPPLC:          ['observation'],
  MARSA_MAROC:     ['observation'],
  MHAI:            ['observation'],
  MSANTE_STANDARD: ['observation'],
  MSANTE_CAPM:     ['observation'],
  MSANTE_DPRF:     ['observation'],
  ONP:             ['etat'],
  CNDH_G1:         ['observation'],
  CNDH_G2:         ['observation'],
  CNDH_SIEGE:      ['observation'],
};

const ANCFCC_POINTS = [
  'Vérification du matériel',
  'Contrôle des différents paramètres électriques en entrée/sortie',
  'Contrôle du bruit des différents composants mécaniques',
  'Test de simulation de fonctionnement du matériel (sur batteries, by-pass...)',
  'Vérification de la carte SNMP et la communication à distance',
  "Contrôle de l'ensemble des batteries",
  'Réparation de tout défaut constaté si nécessaire',
  'Ouvrir un incident (maintenance curative), en cas de panne matériel, en vue de : a. Réparation de tout défaut constaté b. Remplacement de tout composant reconnu défectueux pendant la visite',
  'Nettoyage et dépoussiérage',
  "Rédaction d'un rapport de synthèse à l'issue de la visite",
];

// ─── Composant principal ───────────────────────────────────────────────────────
export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [mission, setMission] = useState<Mission | null>(null);
  const [feuilles, setFeuilles] = useState<string[]>([]);
  const [feuilleActive, setFeuilleActive] = useState<string>('');
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [search, setSearch] = useState('');
  const [reponses, setReponses] = useState<Record<number | string, any>>({});
  const [ancfccPoints, setAncfccPoints] = useState<Record<number, { reponse: string; observation: string }>>({});
  const [saving, setSaving] = useState(false);

  const [selectedEq, setSelectedEq] = useState<Equipement | null>(null);

  // ── Charger mission ──
  useEffect(() => {
    const rows = db.getAllSync(`SELECT * FROM missions WHERE id = ?`, [id]);
    if (!rows.length) return;
    const m = rows[0] as Mission;

    setMission(m);

    let fl: string[] = [];
    if (m.feuilles) {
      try { fl = JSON.parse(m.feuilles); } catch { fl = []; }
    }
    setFeuilles(fl);
    setFeuilleActive(fl.length > 0 ? fl[0] : '');
  }, [id]);

  // ── Charger équipements selon feuille active ──
  useEffect(() => {
    if (!mission) return;
    const checklistType = mission.checklist_type || '';
    let sql = 'SELECT * FROM equipements WHERE site_id = ?';
    const params: any[] = [mission.site_id];

    if (feuilleActive) {
      sql += ' AND sous_site = ?';
      params.push(feuilleActive);
    }
    sql += ' ORDER BY id ASC';

    const rows = db.getAllSync(sql, params) as Equipement[];
    
    // Charger aussi les interventions locales pour voir si c'est "Terminé"
    const saved = db.getAllSync('SELECT equipement_id, reponses, equipement_hors_inventaire FROM interventions WHERE mission_id = ?', [mission.id]);
    const savedMap: Record<number, any> = {};
    saved.forEach((s: any) => {
      if (s.equipement_id) {
        try { savedMap[s.equipement_id] = JSON.parse(s.reponses || '{}'); } catch {}
      }
    });

    const enriched = rows.map(r => ({ ...r, saved_reponses: savedMap[r.id] }));
    setEquipements(enriched);
    setReponses({});
  }, [mission, feuilleActive, saving]); // Recharger après sauvegarde

  // ── Filtrage par recherche ──
  const filteredEquipements = equipements.filter(eq => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (eq.numero_serie || '').toLowerCase().includes(q) ||
      (eq.nom || '').toLowerCase().includes(q) ||
      (eq.designation || '').toLowerCase().includes(q) ||
      (eq.marque || '').toLowerCase().includes(q) ||
      (eq.modele || '').toLowerCase().includes(q)
    );
  });

  const handleSaveModal = (eqData: any, newReponses: any) => {
    if (!mission || !selectedEq) return;
    setSaving(true);
    try {
      syncService.saveIntervention({
        mission_id: mission.id,
        equipement_id: selectedEq.id,
        feuille: feuilleActive || null,
        reponses: { ...newReponses, equipement_modifie: eqData },
      });
    } catch (e: any) {
      Alert.alert('Erreur', e?.message);
    } finally {
      setSaving(false);
      setSelectedEq(null);
    }
  };

  const cloturerMission = () => {
    if (mission?.statut === 'TERMINEE') {
      Alert.alert('Info', 'Cette mission est déjà clôturée.');
      router.back();
      return;
    }

    Alert.alert(
      'Clôturer la mission',
      'Avez-vous terminé toutes les interventions pour cette mission ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, clôturer', 
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('UPDATE missions SET statut = ?, sync_statut_en_attente = 1 WHERE id = ?', ['TERMINEE', mission?.id]);
              Alert.alert('Succès', 'Mission clôturée localement. Pensez à synchroniser ce soir !');
              router.back();
            } catch (e: any) {
              Alert.alert('Erreur', e?.message);
            }
          }
        }
      ]
    );
  };

  if (!mission) return <View style={styles.center}><ActivityIndicator /></View>;

  const checklistType = mission.checklist_type || 'MSANTE_STANDARD';

  // ── Rendu ──
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#0f172a" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{mission.site_nom}</Text>
          <Text style={styles.headerSub}>{mission.marche_nom} • {mission.site_ville}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveBtn, mission.statut === 'TERMINEE' && { backgroundColor: '#64748b' }]} 
          onPress={cloturerMission} 
          disabled={saving || mission.statut === 'TERMINEE'}
        >
          <Text style={styles.saveBtnText}>{mission.statut === 'TERMINEE' ? 'Clôturée' : 'Clôturer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: '#10b981', marginLeft: 4 }]}
          onPress={async () => {
            try {
              // Charger tous les équipements du site
              const eqs = db.getAllSync('SELECT * FROM equipements WHERE site_id = ?', [mission.site_id]) as any[];
              // Charger les interventions locales
              const interventions = db.getAllSync('SELECT * FROM interventions WHERE mission_id = ?', [mission.id]) as any[];
              const interventionMap: Record<number, any> = {};
              interventions.forEach((i: any) => {
                try { interventionMap[i.equipement_id] = JSON.parse(i.reponses || '{}'); } catch {}
              });

              // Construire le CSV
              const escape = (v: any) => '"' + String(v || '').replace(/"/g, '""') + '"';
              const headers = ['N°', 'Désignation', 'Marque', 'Modèle', 'N° Série', 'Sous-site', 'État', 'Notes', 'Vérifié'];
              const lines = [headers.map(escape).join(';')];

              eqs.forEach((eq: any) => {
                const rep = interventionMap[eq.id] || {};
                const eqMod = rep.equipement_modifie || {};
                lines.push([
                  escape(eq.id),
                  escape(eqMod.designation || eq.designation || eq.famille || eq.type_equipement || ''),
                  escape(eqMod.marque || eq.marque || ''),
                  escape(eqMod.modele || eq.modele || ''),
                  escape(eqMod.numero_serie || eq.numero_serie || ''),
                  escape(eq.sous_site || ''),
                  escape(rep.etat_msante || rep.observation || rep.etat || rep.statut || ''),
                  escape(rep.notes || ''),
                  escape(Object.keys(rep).length > 0 ? 'OUI' : 'NON'),
                ].join(';'));
              });

              const csvContent = '\uFEFF' + lines.join('\n'); // BOM UTF-8 pour Excel
              const fileUri = FileSystem.documentDirectory + 'Rapport_' + mission.site_nom.replace(/\s/g, '_') + '.csv';
              await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' as any });

              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Rapport CSV - Ouvrir avec Excel' });
              } else {
                Alert.alert('Succès', 'Fichier CSV généré.');
              }
            } catch(e: any) {
              Alert.alert('Erreur', 'Génération échouée : ' + e?.message);
            }
          }}
        >
          <Download color="#fff" size={16} />
          <Text style={[styles.saveBtnText, { fontSize: 12 }]}> Excel</Text>
        </TouchableOpacity>
      </View>

      {/* Onglets feuilles (si multi-feuilles) */}
      {feuilles.length > 1 && (
        <View style={{ backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', height: 52 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
              {feuilles.map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFeuilleActive(f)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 16,
                    backgroundColor: feuilleActive === f ? '#0ea5e9' : '#e2e8f0',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: feuilleActive === f ? '#ffffff' : '#0f172a',
                  }}>{f || '?'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Search color="#94a3b8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par N° série, désignation, modèle..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && filteredEquipements.length === 0 && (
          <TouchableOpacity
            style={styles.addNewBtn}
            onPress={() => {
              // Ajouter équipement hors-inventaire
              Alert.prompt(
                'Ajouter équipement',
                `N° série : ${search}\nDésignation ?`,
                (designation) => {
                  if (!designation) return;
                  syncService.saveIntervention({
                    mission_id: mission.id,
                    equipement_id: null,
                    feuille: feuilleActive || null,
                    est_hors_inventaire: true,
                    equipement_hors_inventaire: { numero_serie: search, designation },
                    reponses: { observation: 'BON' },
                  });
                  setSearch('');
                  setSaving(!saving); // trigger reload
                }
              );
            }}
          >
            <Plus color="#22b5d8" size={18} />
            <Text style={styles.addNewText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredEquipements.length === 0 && search.length > 0 && (
          <View style={styles.notFoundBox}>
            <Text style={styles.notFoundText}>"{search}" introuvable dans l'inventaire</Text>
            <Text style={styles.notFoundSub}>Appuyez sur "+ Ajouter" pour l'enregistrer</Text>
          </View>
        )}
        
        {filteredEquipements.map((eq: any, idx: number) => {
          const isDone = eq.saved_reponses && Object.keys(eq.saved_reponses).length > 0;
          const eqMod = eq.saved_reponses?.equipement_modifie || {};
          const desig = eqMod.designation || eq.designation || eq.famille || eq.type_equipement || 'Équipement inconnu';
          const marque = eqMod.marque || eq.marque || '';
          const modele = eqMod.modele || eq.modele || '';
          const nom = eq.nom ? eq.nom : (`${marque} ${modele}`.trim() || 'Nom / Modèle inconnu');
          
          return (
            <TouchableOpacity 
              key={eq.id} 
              style={[styles.eqItem, search.length > 0 && styles.eqItemHighlighted]}
              onPress={() => setSelectedEq(eq)}
            >
              <View style={styles.eqItemLeft}>
                <View style={[styles.statusDot, isDone ? styles.statusDotDone : styles.statusDotPending]} />
                <View>
                  <Text style={styles.eqItemDesig}>{idx + 1}. {desig}</Text>
                  <Text style={styles.eqItemNom}>{nom}</Text>
                  {eq.numero_serie ? <Text style={styles.eqItemMeta}>S/N: {eq.numero_serie}</Text> : null}
                  {eq.affectation || eq.utilisateur_nom ? <Text style={styles.eqItemMeta}>👤 {eq.affectation || eq.utilisateur_nom}</Text> : null}
                </View>
              </View>
              <ChevronRight color="#cbd5e1" size={20} />
            </TouchableOpacity>
          );
        })}
        

        {filteredEquipements.length === 0 && search.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun équipement pour cette feuille.</Text>
          </View>
        )}



      </ScrollView>

      {/* Modal Fiche d'intervention */}
      <FicheInterventionModal 
        visible={!!selectedEq} 
        equipement={selectedEq} 
        mission={mission}
        feuille={feuilleActive}
        onClose={() => setSelectedEq(null)}
        onSave={handleSaveModal}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    paddingTop: 52,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#22b5d8', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabBar: { backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  tabBarContent: { paddingHorizontal: 8, paddingVertical: 8, gap: 6, alignItems: 'center', flexDirection: 'row' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155',
  },
  tabActive: { backgroundColor: '#22b5d8', borderColor: '#22b5d8' },
  tabText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addNewText: { color: '#22b5d8', fontWeight: '700', fontSize: 14 },

  list: { padding: 12, paddingBottom: 60 },

  // ANCFCC
  onduleurCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  onduleurTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  onduleurSub: { fontSize: 14, color: '#64748b' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 10 },
  pointCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#fff',
    borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  pointNum: { fontSize: 15, fontWeight: '700', color: '#22b5d8', minWidth: 22 },
  pointLabel: { fontSize: 14, color: '#334155', marginBottom: 8, lineHeight: 20 },
  ouiNonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ouiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#16a34a', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  ouiBtnActive: { backgroundColor: '#16a34a' },
  ouiBtnText: { color: '#16a34a', fontWeight: '700' },
  obsInput: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#0f172a',
  },

  // Équipements standard (Nouvelle interface liste)
  eqItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  eqItemHighlighted: { borderColor: '#22b5d8', borderWidth: 1.5 },
  eqItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusDotPending: { backgroundColor: '#cbd5e1' }, // gris par défaut (à faire)
  statusDotDone: { backgroundColor: '#10b981' }, // vert (terminé)
  eqItemDesig: { fontSize: 12, fontWeight: '700', color: '#22b5d8', textTransform: 'uppercase' },
  eqItemNom: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 2 },
  eqItemMeta: { fontSize: 13, color: '#64748b', marginTop: 2, fontFamily: 'monospace' },

  notFoundBox: {
    backgroundColor: '#fef3c7', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#fcd34d',
  },
  notFoundText: { fontSize: 14, fontWeight: '600', color: '#92400e' },
  notFoundSub: { fontSize: 13, color: '#b45309', marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', fontSize: 15 },
});
