import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft, Search, Plus, CheckCircle2, XCircle,
  ChevronRight, Layers,
} from 'lucide-react-native';
import db from '../../services/dbService';
import syncService from '../../services/syncService';
import api from '../../services/api';
import FicheInterventionModal from '../../components/FicheInterventionModal';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  ANCFCC:          [], // gÃ©rÃ© sÃ©parÃ©ment (10 points)
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
  'VÃ©rification du matÃ©riel',
  'ContrÃ´le des diffÃ©rents paramÃ¨tres Ã©lectriques en entrÃ©e/sortie',
  'ContrÃ´le du bruit des diffÃ©rents composants mÃ©caniques',
  'Test de simulation de fonctionnement du matÃ©riel (sur batteries, by-pass...)',
  'VÃ©rification de la carte SNMP et la communication Ã  distance',
  "ContrÃ´le de l'ensemble des batteries",
  'RÃ©paration de tout dÃ©faut constatÃ© si nÃ©cessaire',
  'Ouvrir un incident (maintenance curative), en cas de panne matÃ©riel, en vue de : a. RÃ©paration de tout dÃ©faut constatÃ© b. Remplacement de tout composant reconnu dÃ©fectueux pendant la visite',
  'Nettoyage et dÃ©poussiÃ©rage',
  "RÃ©daction d'un rapport de synthÃ¨se Ã  l'issue de la visite",
];

// â”€â”€â”€ Composant principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Charger mission â”€â”€
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

  // â”€â”€ Charger Ã©quipements selon feuille active â”€â”€
  useEffect(() => {
    if (!mission) return;
    let sql = 'SELECT * FROM equipements WHERE site_id = ?';
    const params: any[] = [mission.site_id];

    if (feuilleActive) {
      sql += ' AND (sous_site = ? OR sous_site IS NULL)';
      params.push(feuilleActive);
    }
    sql += ' ORDER BY id ASC';

    const rows = db.getAllSync(sql, params) as Equipement[];
    
    // Charger aussi les interventions locales pour voir si c'est "TerminÃ©"
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
  }, [mission, feuilleActive, saving]); // Recharger aprÃ¨s sauvegarde

  // â”€â”€ Filtrage par recherche â”€â”€
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
      Alert.alert('Info', 'Cette mission est dÃ©jÃ  clÃ´turÃ©e.');
      router.back();
      return;
    }

    Alert.alert(
      'ClÃ´turer la mission',
      'Avez-vous terminÃ© toutes les interventions pour cette mission ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, clÃ´turer', 
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('UPDATE missions SET statut = ?, sync_statut_en_attente = 1 WHERE id = ?', ['TERMINEE', mission?.id]);
              Alert.alert('SuccÃ¨s', 'Mission clÃ´turÃ©e localement. Pensez Ã  synchroniser ce soir !');
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

  // â”€â”€ Rendu â”€â”€
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
          <Text style={styles.headerSub}>{mission.marche_nom} â€¢ {mission.site_ville}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveBtn, mission.statut === 'TERMINEE' && { backgroundColor: '#64748b' }]} 
          onPress={cloturerMission} 
          disabled={saving || mission.statut === 'TERMINEE'}
        >
          <Text style={styles.saveBtnText}>{mission.statut === 'TERMINEE' ? 'ClÃ´turÃ©e' : 'ClÃ´turer'}</Text>
        </TouchableOpacity>
      </View>

      {/* Onglets feuilles (si multi-feuilles) */}
      {feuilles.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
          {feuilles.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, feuilleActive === f && styles.tabActive]}
              onPress={() => setFeuilleActive(f)}
            >
              <Layers color={feuilleActive === f ? '#22b5d8' : '#64748b'} size={14} />
              <Text style={[styles.tabText, feuilleActive === f && styles.tabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Search color="#94a3b8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par NÂ° sÃ©rie, dÃ©signation, modÃ¨le..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && filteredEquipements.length === 0 && (
          <TouchableOpacity
            style={styles.addNewBtn}
            onPress={() => {
              // Ajouter Ã©quipement hors-inventaire
              Alert.prompt(
                'Ajouter Ã©quipement',
                `NÂ° sÃ©rie : ${search}\nDÃ©signation ?`,
                (designation) => {
                  if (!designation) return;
                  syncService.saveIntervention({
