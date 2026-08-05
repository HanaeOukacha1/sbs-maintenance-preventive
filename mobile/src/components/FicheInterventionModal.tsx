import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { X, CheckCircle2, Circle, Save, Server, Monitor, Printer, Activity, FileText } from 'lucide-react-native';
import SignatureScreen from 'react-native-signature-canvas';
import syncService from '../services/syncService';

interface FicheInterventionModalProps {
  visible: boolean;
  equipement: any;
  mission: any;
  feuille: string;
  onClose: () => void;
  onSave: (eqData: any, reponses: any) => void;
}

const FIELD_LABELS: Record<string, { label: string; options: string[] }> = {
  etat_software: { label: 'État Software', options: ['OK', 'Non'] },
  etat_hardware: { label: 'État Hardware', options: ['OK', 'Non'] },
  etat:          { label: 'État Général', options: ['OK', 'Non'] },
  statut:        { label: 'Statut', options: ['OK', 'Non'] },
  observation:   { label: 'Observation', options: ['BON', 'DÉFAILLANT', 'À RÉPARER'] },
  observation_cndh: { label: 'Observation', options: ['Bon', 'En panne', 'En réparation'] },
  etat_msante:   { label: 'État', options: ['BON', 'EN PANNE', 'À RÉPARER'] },
};

const CHECKLIST_FIELDS: Record<string, string[]> = {
  ADM:             ['etat_software', 'etat_hardware'],
  AMEE_MARRAKECH:  ['statut'],
  AMEE_RABAT:      ['statut'],
  ANCFCC:          [], // géré par ONDULEUR
  ANP:             ['etat'],
  AOH:             ['etat'],
  INPPLC:          ['observation'],
  MARSA_MAROC:     ['observation'],
  MHAI:            ['observation'],
  MSANTE_STANDARD: ['etat_msante'],
  MSANTE_CAPM:     ['etat_msante'],
  MSANTE_DPRF:     ['etat_msante'],
  ONP:             ['etat'],
  CNDH_G1:         ['observation_cndh'],
  CNDH_G2:         ['observation_cndh'],
  CNDH_SIEGE:      ['observation_cndh'],
};

// Helper : carte lecture seule pour les marchés AMEE
const ReadOnlyCard = ({ fields, color = '#f0fdf4', border = '#bbf7d0' }: { fields: {label: string; value: any}[]; color?: string; border?: string }) => (
  <View style={{ backgroundColor: color, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: border, marginBottom: 4 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {fields.filter(f => f.value).map(({ label, value }) => (
        <View key={label} style={{ minWidth: '45%', flex: 1, marginBottom: 4 }}>
          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>{label}</Text>
          <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700', marginTop: 2 }}>{value || '—'}</Text>
        </View>
      ))}
    </View>
  </View>
);

const ONDULEUR_TEMPLATE = [
  { key: 'pt1', label: 'Vérification du matériel', options: ['oui', 'non'] },
  { key: 'pt2', label: 'Contrôle des différents paramètres électriques en entrée/sortie', options: ['oui', 'non'] },
  { key: 'pt3', label: 'Contrôle du bruit des différents composants mécaniques', options: ['oui', 'non'] },
  { key: 'pt4', label: 'Test de simulation de fonctionnement du matériel (sur batteries, by-pass...)', options: ['oui', 'non'] },
  { key: 'pt5', label: 'Vérification de la carte SNMP et la communication à distance', options: ['oui', 'non'] },
  { key: 'pt6', label: "Contrôle de l'ensemble des batteries", options: ['oui', 'non'] },
  { key: 'pt7', label: 'Réparation de tout défaut constaté si nécessaire', options: ['oui', 'non'] },
  { key: 'pt8', label: 'Ouvrir un incident (maintenance curative), en cas de panne matériel, en vue de : a. Réparation de tout défaut constaté b. Remplacement de tout composant reconnu défectueux pendant la visite', options: ['oui', 'non'] },
  { key: 'pt9', label: 'Nettoyage et dépoussiérage', options: ['oui', 'non'] },
  { key: 'pt10', label: "Rédaction d'un rapport de synthèse à l'issue de la visite", options: ['oui', 'non'] },
];

const ADM_TEMPLATE = [
  { key: 'adm1', label: 'Vérification des journaux d\'événements (Event Logs)', options: ['oui', 'non'] },
  { key: 'adm2', label: 'Contrôle des mises à jour système (OS)', options: ['oui', 'non'] },
  { key: 'adm3', label: 'Vérification de l\'état de la mémoire (RAM)', options: ['oui', 'non'] },
  { key: 'adm4', label: 'Vérification de l\'état des disques (Espace & SMART)', options: ['oui', 'non'] },
  { key: 'adm5', label: 'Contrôle de la connectivité réseau', options: ['oui', 'non'] },
  { key: 'adm6', label: 'Vérification de l\'état des sauvegardes', options: ['oui', 'non'] },
  { key: 'adm7', label: 'Contrôle des paramètres de sécurité (Antivirus/Firewall)', options: ['oui', 'non'] },
  { key: 'adm8', label: 'Nettoyage physique (dépoussiérage) si nécessaire', options: ['oui', 'non'] },
  { key: 'adm9', label: 'Vérification du fonctionnement des ventilateurs', options: ['oui', 'non'] },
  { key: 'adm10', label: "Rédaction d'un rapport de synthèse de l'intervention", options: ['oui', 'non'] },
];

export default function FicheInterventionModal({ visible, equipement, mission, feuille, onClose, onSave }: FicheInterventionModalProps) {
  const [eqData, setEqData] = useState<any>({});
  const [reponses, setReponses] = useState<any>({});
  const sigRef = useRef<any>(null);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (equipement) {
      setEqData({
        designation: equipement.designation || equipement.famille || equipement.type_equipement || '',
        numero_serie: equipement.numero_serie || '',
        numero_inventaire: equipement.numero_inventaire || '',
        marque: equipement.marque || '',
        modele: equipement.modele || '',
        utilisateur_nom: equipement.utilisateur_nom || '',
        direction: equipement.direction || '',
        bureau: equipement.bureau || '',
        emplacement: equipement.emplacement || '',
        sous_site: equipement.sous_site || '',
        puissance_kva: equipement.puissance_kva || '',
        zone: equipement.zone || '',
        nb_batteries: equipement.nb_batteries ? String(equipement.nb_batteries) : '',
        capacite_batteries: equipement.capacite_batteries || '',
        organisme: 'ANCFCC',
        ville: mission?.site_ville || '',
        etablissement: equipement.sous_site || (mission?.checklist_type === 'ANCFCC' ? 'CADASTRE' : ''),
        nom_site: mission?.site_nom || '',
        cpu: equipement.cpu || '',
        ram: equipement.ram || '',
        disque_dur: equipement.disque_dur || '',
        systeme_exploitation: equipement.systeme_exploitation || '',
        antivirus: equipement.antivirus || '',
        ip: equipement.ip || '',
      });
      setReponses(equipement.saved_reponses || {});
    }
  }, [equipement, visible]);

  if (!equipement) return null;

  const typeEq = equipement.type_equipement || 'AUTRE';
  const checklistType = mission.checklist_type || 'MSANTE_STANDARD';
  
  let templateKey = 'DEFAULT';
  if (typeEq === 'PC' || typeEq === 'PORTABLE' || typeEq === 'UC') templateKey = 'PC_PORTABLE';
  else if (typeEq === 'SERVEUR') templateKey = 'SERVEUR';
  else if (typeEq === 'IMPRIMANTE' || typeEq === 'SCANNER' || typeEq === 'PHOTOCOPIEUR') templateKey = 'IMPRIMANTE';

  const isAMEE = checklistType === 'AMEE_MARRAKECH' || checklistType === 'AMEE_RABAT';
  const feuilleAmee = feuille || '';

  // Build the dynamic template for checklists based on market (except Onduleur which is fixed)
  let template = [];
  if (checklistType === 'ANCFCC' || typeEq === 'ONDULEUR') {
    template = ONDULEUR_TEMPLATE;
  } else if (isAMEE && feuilleAmee === 'MISE A JOUR') {
    template = [
      { key: 'nettoyage_disque', label: 'Nettoyage de disque', options: ['OK', 'NON'] },
      { key: 'fichiers_temporaires', label: 'Fichiers temporaires', options: ['OK', 'NON'] },
      { key: 'maj_windows', label: 'Mise à jour Windows', options: ['OK', 'NON'] }
    ];
  } else if (isAMEE && feuilleAmee === 'AVANCEE') {
    template = [
      { key: 'etat_systeme', label: 'État Système', options: ['ACTIVE', 'INACTIF'] },
      { key: 'etat_antivirus', label: 'État Antivirus', options: ['ACTIVE', 'EXPIRE'] },
      { key: 'maj', label: 'Mise à Jour', options: ['À JOUR', 'MANQUANTE'] }
    ];
  } else if (checklistType === 'ADM') {
    const fields = CHECKLIST_FIELDS[checklistType] || ['observation'];
    template = fields.map(f => ({
      key: f,
      label: FIELD_LABELS[f]?.label || f,
      options: FIELD_LABELS[f]?.options || ['OK', 'Non']
    }));
    template = [...template, ...ADM_TEMPLATE];
  } else {
    const fields = CHECKLIST_FIELDS[checklistType] || ['observation'];
    template = fields.map(f => ({
      key: f,
      label: FIELD_LABELS[f]?.label || f,
      options: FIELD_LABELS[f]?.options || ['OK', 'Non']
    }));
  }

  const handleSave = () => {
    onSave(eqData, reponses);
    onClose();
  };

  const getIcon = () => {
    if (templateKey === 'PC_PORTABLE') return <Monitor color="#22b5d8" size={24} />;
    if (templateKey === 'SERVEUR') return <Server color="#7c3aed" size={24} />;
    if (templateKey === 'IMPRIMANTE') return <Printer color="#d97706" size={24} />;
    return <Activity color="#64748b" size={24} />;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Header Modal */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {getIcon()}
            <View>
              <Text style={styles.headerTitle}>{equipement.designation || equipement.famille || typeEq}</Text>
              <Text style={styles.headerSub}>
                {equipement.nom ? equipement.nom : (`${equipement.marque || ''} ${equipement.modele || ''}`.trim() || 'Nom / Modèle inconnu')}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#64748b" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Section 1: Informations Matériel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Informations Matériel</Text>

            {/* ── Helper: champ toujours visible, pré-rempli + éditable ── */}
            {(() => {
              const F = ({ label, k, placeholder, numeric }: { label: string; k: string; placeholder?: string; numeric?: boolean }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={eqData[k] || ''}
                    onChangeText={t => setEqData({ ...eqData, [k]: t })}
                    placeholder={placeholder || label}
                    keyboardType={numeric ? 'numeric' : 'default'}
                  />
                </View>
              );
              const Row = ({ children }: { children: React.ReactNode }) => (
                <View style={styles.row}>{children}</View>
              );
              const Flex = ({ label, k, placeholder, numeric }: { label: string; k: string; placeholder?: string; numeric?: boolean }) => (
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={eqData[k] || ''}
                    onChangeText={t => setEqData({ ...eqData, [k]: t })}
                    placeholder={placeholder || label}
                    keyboardType={numeric ? 'numeric' : 'default'}
                  />
                </View>
              );

              // ── Champs communs à presque tous les marchés ──
              const CommonFields = () => (<>
                <F label="Désignation / Type" k="designation" placeholder="Ex: PC Portable, Imprimante..." />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell, HP..." />
                  <Flex label="Modèle" k="modele" placeholder="Ex: Latitude 5410" />
                </Row>
                <Row>
                  <Flex label="N° Série" k="numero_serie" placeholder="N° de série" />
                  <Flex label="N° Inventaire" k="numero_inventaire" placeholder="N° inventaire" />
                </Row>
              </>);

              // ── Champs PC/UC (CPU, RAM, stockage, OS) ──
              const PcFields = () => (<>
                <Row>
                  <Flex label="CPU / Processeur" k="cpu" placeholder="Ex: Core i5 10gen" />
                  <Flex label="RAM" k="ram" placeholder="Ex: 8 Go" />
                </Row>
                <Row>
                  <Flex label="Disque Dur / Stockage" k="disque_dur" placeholder="Ex: 256 Go SSD" />
                  <Flex label="Système d'Exploitation" k="systeme_exploitation" placeholder="Ex: Win 11 Pro" />
                </Row>
              </>);

              // ── AOH ──
              if (checklistType === 'AOH') return (<>
                <CommonFields />
              </>);

              // ── AMEE Marrakech ──
              if (checklistType === 'AMEE_MARRAKECH') {
                if (feuilleAmee === 'DATA CENTER') return (<>
                  <F label="Type" k="designation" placeholder="Serveur, Switch..." />
                  <Row>
                    <Flex label="Marque" k="marque" placeholder="Ex: Lenovo" />
                    <Flex label="Modèle" k="modele" placeholder="Ex: SR550" />
                  </Row>
                  <F label="N° Série" k="numero_serie" placeholder="N° de série" />
                </>);
                if (feuilleAmee === 'UC') return (<>
                  <F label="Utilisateur" k="utilisateur_nom" placeholder="Nom de l'utilisateur" />
                  <F label="Type" k="designation" placeholder="UC, PC Portable, Écran..." />
                  <Row>
                    <Flex label="Marque" k="marque" placeholder="Ex: Dell" />
                    <Flex label="Modèle" k="modele" placeholder="Ex: Optiplex 9020" />
                  </Row>
                  <Row>
                    <Flex label="N° Série" k="numero_serie" placeholder="S/N" />
                    <Flex label="N° Inventaire" k="numero_inventaire" placeholder="N° Inv" />
                  </Row>
                  <PcFields />
                </>);
                if (feuilleAmee === 'MISE A JOUR') return (<>
                  <F label="Personne / Utilisateur" k="utilisateur_nom" placeholder="Nom" />
                  <F label="Type de poste" k="designation" placeholder="UC, PC Portable..." />
                </>);
                if (feuilleAmee === 'IMPRIMANTE ET MFP') return (<>
                  <F label="Type" k="designation" placeholder="Imprimante multifonction..." />
                  <Row>
                    <Flex label="Modèle" k="modele" placeholder="Ex: E-Studio 3505AC" />
                    <Flex label="Emplacement" k="emplacement" placeholder="Ex: RDC" />
                  </Row>
                  <F label="N° Série" k="numero_serie" placeholder="N° de série" />
                </>);
              }

              // ── AMEE Rabat ──
              if (checklistType === 'AMEE_RABAT') {
                if (feuilleAmee === 'PC') return (<>
                  <F label="Personne / Utilisateur" k="utilisateur_nom" placeholder="Nom" />
                  <F label="Type" k="designation" placeholder="PC Portable, Écran..." />
                  <Row>
                    <Flex label="Marque" k="marque" placeholder="Ex: Dell" />
                    <Flex label="Modèle" k="modele" placeholder="Désignation" />
                  </Row>
                  <Row>
                    <Flex label="N° Série" k="numero_serie" placeholder="S/N" />
                    <Flex label="Système d'Exploitation" k="systeme_exploitation" placeholder="Ex: Win 11" />
                  </Row>
                  <PcFields />
                </>);
                if (feuilleAmee === 'MISE A JOUR') return (<>
                  <F label="Personne / Utilisateur" k="utilisateur_nom" placeholder="Nom" />
                  <F label="Type de poste" k="designation" placeholder="UC, PC Portable..." />
                </>);
                if (feuilleAmee === 'IMP ET MFP RESEAUX') return (<>
                  <F label="Type" k="designation" placeholder="Imprimante, Fax, Scanner..." />
                  <Row>
                    <Flex label="Marque" k="marque" placeholder="Ex: Xerox" />
                    <Flex label="Modèle" k="modele" placeholder="Ex: VersaLink C625" />
                  </Row>
                  <F label="N° Série" k="numero_serie" placeholder="S/N" />
                </>);
                if (feuilleAmee === 'DATA CENTER') return (<>
                  <F label="Type" k="designation" placeholder="Serveur, KVM..." />
                  <Row>
                    <Flex label="Marque" k="marque" placeholder="Ex: Lenovo, IBM" />
                    <Flex label="Modèle" k="modele" placeholder="Ex: ThinkSystem SR630" />
                  </Row>
                  <F label="N° Série" k="numero_serie" placeholder="N° de série" />
                </>);
              }

              // ── INPPLC ──
              if (checklistType === 'INPPLC') return (<>
                <Row>
                  <Flex label="Famille / Type" k="designation" placeholder="Imprimante, PC..." />
                  <Flex label="Marque" k="marque" placeholder="Ex: HP" />
                </Row>
                <Row>
                  <Flex label="Modèle" k="modele" placeholder="Ex: LaserJet" />
                  <Flex label="N° Série" k="numero_serie" placeholder="S/N" />
                </Row>
              </>);

              // ── MARSA MAROC ──
              if (checklistType === 'MARSA_MAROC') return (<>
                <Row>
                  <Flex label="Direction" k="direction" placeholder="Direction" />
                  <Flex label="Bureau" k="bureau" placeholder="Bureau" />
                </Row>
                <Row>
                  <Flex label="Famille / Type" k="designation" placeholder="Ex: PC, Imprimante" />
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell" />
                </Row>
                <Row>
                  <Flex label="Article / Modèle" k="modele" placeholder="Ex: Latitude 5410" />
                  <Flex label="N° Série" k="numero_serie" placeholder="S/N" />
                </Row>
                <F label="Nom et Prénom utilisateur" k="utilisateur_nom" placeholder="Ex: M. Alaoui" />
                <PcFields />
              </>);

              // ── MHAI ──
              if (checklistType === 'MHAI') return (<>
                <Row>
                  <Flex label="Matériel / Type" k="designation" placeholder="Ex: PC, Onduleur" />
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell" />
                </Row>
                <Row>
                  <Flex label="Modèle" k="modele" placeholder="Ex: Optiplex" />
                  <Flex label="N° Série" k="numero_serie" placeholder="S/N" />
                </Row>
                <F label="N° Inventaire" k="numero_inventaire" placeholder="N° Inventaire" />
              </>);

              // ── ONP ──
              if (checklistType === 'ONP') return (<>
                <F label="Désignation / Type" k="designation" placeholder="Ex: PC Portable, Imprimante..." />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell, HP..." />
                  <Flex label="Modèle" k="modele" placeholder="Ex: Latitude 5410" />
                </Row>
                <F label="N° Série" k="numero_serie" placeholder="N° de série" />
              </>);

              // ── CNDH ──
              if (checklistType.startsWith('CNDH_')) {
                const site = mission.site_nom?.toUpperCase() || '';
                const hideEmplacementAffectation = 
                  site.includes('DAKHLA') || 
                  site.includes('ERRACHIDIA') || 
                  site.includes('FES') || 
                  site.includes('GUELMIM') || 
                  site.includes('MARRAKECH') || 
                  site.includes('TANGER') ||
                  site.includes('OUJDA') ||
                  site.includes('SIEGE') || 
                  site.includes('SIÈGE');

                return (<>
                  <F label="Entité / Site" k="direction" placeholder="Direction ou entité" />
                  {!hideEmplacementAffectation && (
                    <>
                      <F label="Emplacement / Bureau" k="bureau" placeholder="Emplacement" />
                      <F label="Affectation / Utilisateur" k="utilisateur_nom" placeholder="Nom de l'utilisateur" />
                    </>
                  )}
                  <F label="Article / Type" k="designation" placeholder="Ex: PC, Imprimante" />
                  <Row>
                    <Flex label="Marque" k="marque" placeholder="Ex: Dell" />
                    <Flex label="Modèle" k="modele" placeholder="Ex: Latitude" />
                  </Row>
                  <F label="N° Série" k="numero_serie" placeholder="S/N" />
                </>);
              }

              // ── INPPLC ──
              if (checklistType === 'INPPLC') return (<>
                <F label="Famille / Type" k="designation" placeholder="Ex: PC Portable, Imprimante..." />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell, HP..." />
                  <Flex label="Modèle" k="modele" placeholder="Ex: Latitude 5410" />
                </Row>
                <F label="N° Série" k="numero_serie" placeholder="N° de série" />
              </>);

              // ── MARSA MAROC ──
              if (checklistType === 'MARSA_MAROC') return (<>
                <F label="Direction" k="direction" placeholder="Direction" />
                <Row>
                  <Flex label="Bureau" k="bureau" placeholder="Emplacement" />
                  <Flex label="Nom et Prénom" k="utilisateur_nom" placeholder="Utilisateur" />
                </Row>
                <F label="Famille / Type" k="designation" placeholder="Ex: PC PORTABLE" />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: DELL" />
                  <Flex label="Modèle (Article)" k="modele" placeholder="Ex: 5570" />
                </Row>
                <F label="N° Série" k="numero_serie" placeholder="N° de série" />
                {templateKey === 'PC_PORTABLE' && (
                  <>
                    <Row>
                      <Flex label="Processeur" k="cpu" placeholder="Ex: i5" />
                      <Flex label="RAM" k="ram" placeholder="Ex: 8GB" />
                    </Row>
                    <Row>
                      <Flex label="Disque Dur" k="disque_dur" placeholder="Ex: 256GB SSD" />
                      <Flex label="Système d'expl." k="systeme_exploitation" placeholder="Ex: Win 10" />
                    </Row>
                  </>
                )}
              </>);

              // ── ADM ──
              if (checklistType === 'ADM') return (<>
                <F label="Désignation" k="designation" placeholder="Ex: Serveur, Firewall..." />
                <Row>
                  <Flex label="Fabricant" k="marque" placeholder="Ex: HP, Dell" />
                  <Flex label="Modèle" k="modele" placeholder="Ex: ProLiant DL380" />
                </Row>
                <Row>
                  <Flex label="N° Série" k="numero_serie" placeholder="S/N" />
                  <Flex label="IP Réseau" k="ip" placeholder="Ex: 192.168.1.10" />
                </Row>
                <PcFields />
              </>);

              // ── ANP ──
              if (checklistType === 'ANP') return (<>
                <F label="Famille / Type" k="designation" placeholder="Ex: PC Bureau" />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: HP, Dell" />
                  <Flex label="Modèle" k="modele" placeholder="Modèle exact" />
                </Row>
                <F label="N° Série" k="numero_serie" placeholder="S/N de l'équipement" />
              </>);

              // ── ANCFCC / ONDULEUR ──
              if (checklistType === 'ANCFCC' || typeEq === 'ONDULEUR') return (<>
                <Row>
                  <Flex label="Organisme" k="organisme" placeholder="Ex: ANCFCC" />
                  <Flex label="Puissance de l'onduleur" k="puissance_kva" placeholder="Ex: 15 KVA" />
                </Row>
                <Row>
                  <Flex label="Zone" k="zone" placeholder="Ex: SUD" />
                  <Flex label="Nombre des batteries" k="nb_batteries" placeholder="Ex: 32" numeric />
                </Row>
                <Row>
                  <Flex label="Ville" k="ville" placeholder="Ex: AGADIR" />
                  <Flex label="Marque/modèle" k="marque" placeholder="Ex: Riello 15 KVA" />
                </Row>
                <Row>
                  <Flex label="Établissement" k="etablissement" placeholder="Ex: CADASTRE" />
                  <Flex label="Site" k="nom_site" placeholder="Nom du site" />
                </Row>
                <Row>
                  <Flex label="N° Série" k="numero_serie" placeholder="N° de série" />
                  <Flex label="C à B" k="capacite_batteries" placeholder="Capacité batteries" />
                </Row>
              </>);

              // ── MSANTE CAPM / DPRF / SIGNATURE ──
              if (checklistType === 'MSANTE_CAPM' || checklistType === 'MSANTE_SIGNATURE' || checklistType === 'MSANTE_DPRF') return (<>
                <F label="Désignation / Type" k="designation" placeholder="Ex: PC Portable, Imprimante..." />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell, HP..." />
                  <Flex label="Modèle (Article)" k="modele" placeholder="Ex: Latitude 5410" />
                </Row>
                <Row>
                  <Flex label="N° Série" k="numero_serie" placeholder="N° de série" />
                  <Flex label="Utilisateur" k="utilisateur_nom" placeholder="Nom d'utilisateur" />
                </Row>
              </>);

              // ── MSANTE (défaut) ──
              return (<>
                <F label="Désignation / Type" k="designation" placeholder="Ex: PC Portable, Imprimante..." />
                <Row>
                  <Flex label="Marque" k="marque" placeholder="Ex: Dell, HP..." />
                  <Flex label="Modèle" k="modele" placeholder="Ex: Latitude 5410" />
                </Row>
                <F label="N° Série" k="numero_serie" placeholder="N° de série" />
              </>);
            })()}
          </View>

          {/* Section 2: Checklist */}
          <View style={styles.section}>
            {template.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>2. Checklist d'intervention</Text>
                <Text style={styles.sectionSub}>Validez les points de contrôle demandés pour ce marché.</Text>

                {template.map((item, idx) => (
                  <View key={item.key} style={styles.checkItem}>
                    <Text style={styles.checkLabel}>{template.length > 1 ? `${idx + 1}. ` : ''}{item.label}</Text>
                    <View style={styles.checkOptions}>
                      {item.options.map(opt => {
                        const isActive = reponses[item.key] === opt;
                        const isPositive = opt === 'OK' || opt === 'Actif' || opt === 'Fait' || opt === 'BON';
                        return (
                          <TouchableOpacity 
                            key={opt} 
                            style={[
                              styles.checkBtn, 
                              isActive && (isPositive ? styles.checkBtnActivePos : styles.checkBtnActiveNeg)
                            ]}
                            onPress={() => setReponses({ ...reponses, [item.key]: opt })}
                          >
                            {isActive 
                              ? <CheckCircle2 color="#fff" size={16} /> 
                              : <Circle color="#94a3b8" size={16} />
                            }
                            <Text style={[styles.checkBtnText, isActive && { color: '#fff' }]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes & Observations additionnelles</Text>
                  <TextInput 
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                    multiline 
                    placeholder="DÃ©tails supplÃ©mentaires (optionnel)..." 
                    value={reponses.notes || ''}
                    onChangeText={t => setReponses({...reponses, notes: t})}
                  />
                </View>
              </>
            ) : (
              <View style={styles.emptyChecklist}>
                <CheckCircle2 color="#10b981" size={48} style={{ marginBottom: 16 }} />
                <Text style={styles.sectionTitle}>Aucune saisie requise</Text>
                <Text style={styles.sectionSub}>Ce marchÃ© ne demande qu'une simple validation de prÃ©sence. Cliquez sur Enregistrer pour valider cet Ã©quipement.</Text>
              </View>
            )}
          </View>

          {(checklistType === 'MSANTE_CAPM' || checklistType === 'MSANTE_DPRF' || checklistType === 'MSANTE_SIGNATURE') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Signature Utilisateur</Text>
              <Text style={styles.label}>Signature (Appuyez sur Confirmer après avoir signé)</Text>
              {signature ? (
                <View style={{alignItems: 'center'}}>
                  <Text style={{color: '#10b981', marginBottom: 10}}>Signature enregistrÃ©e !</Text>
                  <TouchableOpacity onPress={() => {setSignature(null); setReponses({...reponses, signature: null});}} style={{padding: 8, backgroundColor: '#fef2f2', borderRadius: 8}}>
                    <Text style={{color: '#ef4444'}}>Effacer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ height: 200, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <SignatureScreen
                    ref={sigRef}
                    onOK={(sig) => {
                      setSignature(sig);
                      setReponses({...reponses, signature: sig});
                    }}
                    webStyle={`.m-signature-pad {box-shadow: none; border: none;} .m-signature-pad--body {border: none;}`}
                  />
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Save color="#fff" size={20} />
            <Text style={styles.saveBtnText}>Enregistrer la fiche</Text>
          </TouchableOpacity>
          {Object.keys(reponses).length > 0 && (mission.checklist_type === 'ANCFCC' || mission.checklist_type === 'ADM') && (
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: '#10b981', marginTop: 10 }]} 
              onPress={() => {
                import('../services/exportService').then(mod => {
                  mod.generateWordReport(mission, equipement, reponses);
                });
              }}
            >
              <FileText color="#fff" size={20} />
              <Text style={styles.saveBtnText}>Partager le Rapport Word</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 14, color: '#64748b' },
  closeBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },
  
  content: { flex: 1, padding: 16 },
  
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  
  checkItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  checkLabel: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 10 },
  checkOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff'
  },
  checkBtnActivePos: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkBtnActiveNeg: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  checkBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  
  footer: {
    backgroundColor: '#fff', padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  saveBtn: {
    backgroundColor: '#22b5d8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyChecklist: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
});

