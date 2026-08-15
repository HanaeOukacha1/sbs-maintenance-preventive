import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { X, CheckCircle2, Circle, Save, Server, Monitor, Printer, Activity, FileText } from 'lucide-react-native';
import SignatureScreen from 'react-native-signature-canvas';
import syncService from '../services/syncService';
import db from '../services/dbService';

interface FicheInterventionModalProps {
  visible: boolean;
  equipement: any;
  mission: any;
  feuille: string;
  onClose: () => void;
  onSave: (eqData: any, reponses: any) => void;
}



export default function FicheInterventionModal({ visible, equipement, mission, feuille, onClose, onSave }: FicheInterventionModalProps) {
  const [eqData, setEqData] = useState<any>({});
  const [reponses, setReponses] = useState<any>({});
  const [template, setTemplate] = useState<any[]>([]);
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
      // Build the dynamic template for checklists based on market/site
      const typeEq = equipement.type_equipement || 'AUTRE';
      const checklistType = mission.checklist_type || 'MSANTE_STANDARD';
      const isAMEE = checklistType === 'AMEE_MARRAKECH' || checklistType === 'AMEE_RABAT';
      const feuilleAmee = feuille || '';
      
      let targetSchemaName = checklistType;
      
      // Override for Onduleur (always uses ONDULEUR schema regardless of market)
      if (checklistType === 'ANCFCC' || typeEq === 'ONDULEUR') {
        targetSchemaName = 'ONDULEUR';
      } else if (isAMEE && feuilleAmee === 'MISE A JOUR') {
        targetSchemaName = 'AMEE_MISE_A_JOUR';
      } else if (isAMEE && feuilleAmee === 'AVANCEE') {
        targetSchemaName = 'AMEE_AVANCEE';
      }

      // Fetch from local SQLite DB
      try {
        let schemaRow = null;
        
        // Si c'est un override explicite (ex: ONDULEUR), on cherche par nom en priorité
        if (targetSchemaName !== checklistType) {
          schemaRow = db.getFirstSync('SELECT schema_data FROM json_schemas WHERE nom = ?', [targetSchemaName]);
        }
        
        // Sinon on cherche d'abord par site_id
        if (!schemaRow && mission?.site_id) {
          schemaRow = db.getFirstSync('SELECT schema_data FROM json_schemas WHERE site_id = ?', [mission.site_id]);
          
          // Si introuvable, on cherche par marche_id
          if (!schemaRow) {
            const siteInfo = db.getFirstSync('SELECT marche_id FROM sites WHERE id = ?', [mission.site_id]);
            if (siteInfo && siteInfo.marche_id) {
              schemaRow = db.getFirstSync('SELECT schema_data FROM json_schemas WHERE marche_id = ?', [siteInfo.marche_id]);
            }
          }
        }
        
        // Enfin, fallback classique par nom
        if (!schemaRow) {
          schemaRow = db.getFirstSync('SELECT schema_data FROM json_schemas WHERE nom = ?', [targetSchemaName]);
        }

        if (schemaRow && schemaRow.schema_data) {
           const parsed = typeof schemaRow.schema_data === 'string' ? JSON.parse(schemaRow.schema_data) : schemaRow.schema_data;
           setTemplate(parsed);
        } else {
           // Fallback if not found
           setTemplate([{ key: 'observation', label: 'Observation', options: ['OK', 'Non'] }]);
        }
      } catch(err) {
        console.error("Erreur chargement schema:", err);
        setTemplate([{ key: 'observation', label: 'Observation (Erreur chargement)', options: ['OK', 'Non'] }]);
      }
    }
  }, [equipement, visible, mission, feuille]);

  if (!equipement) return null;

  const typeEq = equipement.type_equipement || 'AUTRE';
  const checklistType = mission?.checklist_type || 'MSANTE_STANDARD';
  const feuilleAmee = feuille || '';
  
  let templateKey = 'DEFAULT';
  if (typeEq === 'PC' || typeEq === 'PORTABLE' || typeEq === 'UC') templateKey = 'PC_PORTABLE';
  else if (typeEq === 'SERVEUR') templateKey = 'SERVEUR';
  else if (typeEq === 'IMPRIMANTE' || typeEq === 'SCANNER' || typeEq === 'PHOTOCOPIEUR') templateKey = 'IMPRIMANTE';

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
                {F({ label: 'Désignation / Type', k: 'designation', placeholder: 'Ex: PC Portable, Imprimante...' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell, HP...' })}
                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Latitude 5410' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                  {Flex({ label: 'N° Inventaire', k: 'numero_inventaire', placeholder: 'N° inventaire' })}
                
</> })}
              </>);

              // ── Champs PC/UC (CPU, RAM, stockage, OS) ──
              const PcFields = () => (<>
                {Row({ children: <>

                  {Flex({ label: 'CPU / Processeur', k: 'cpu', placeholder: 'Ex: Core i5 10gen' })}
                  {Flex({ label: 'RAM', k: 'ram', placeholder: 'Ex: 8 Go' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Disque Dur / Stockage', k: 'disque_dur', placeholder: 'Ex: 256 Go SSD' })}
                  {Flex({ label: 'Système d\'Exploitation', k: 'systeme_exploitation', placeholder: 'Ex: Win 11 Pro' })}
                
</> })}
              </>);

              // ── AOH ──
              if (checklistType === 'AOH') return (<>
                {CommonFields()}
              </>);

              // ── AMEE Marrakech ──
              if (checklistType === 'AMEE_MARRAKECH') {
                if (feuilleAmee === 'DATA CENTER') return (<>
                  {F({ label: 'Type', k: 'designation', placeholder: 'Serveur, Switch...' })}
                  {Row({ children: <>

                    {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Lenovo' })}
                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: SR550' })}
                  
</> })}
                  {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                </>);
                if (feuilleAmee === 'UC') return (<>
                  {F({ label: 'Utilisateur', k: 'utilisateur_nom', placeholder: 'Nom de l\'utilisateur' })}
                  {F({ label: 'Type', k: 'designation', placeholder: 'UC, PC Portable, Écran...' })}
                  {Row({ children: <>

                    {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell' })}
                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Optiplex 9020' })}
                  
</> })}
                  {Row({ children: <>

                    {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                    {Flex({ label: 'N° Inventaire', k: 'numero_inventaire', placeholder: 'N° Inv' })}
                  
</> })}
                  {PcFields({})}
                </>);
                if (feuilleAmee === 'MISE A JOUR') return (<>
                  {F({ label: 'Personne / Utilisateur', k: 'utilisateur_nom', placeholder: 'Nom' })}
                  {F({ label: 'Type de poste', k: 'designation', placeholder: 'UC, PC Portable...' })}
                </>);
                if (feuilleAmee === 'IMPRIMANTE ET MFP') return (<>
                  {F({ label: 'Type', k: 'designation', placeholder: 'Imprimante multifonction...' })}
                  {Row({ children: <>

                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: E-Studio 3505AC' })}
                    {Flex({ label: 'Emplacement', k: 'emplacement', placeholder: 'Ex: RDC' })}
                  
</> })}
                  {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                </>);
              }

              // ── AMEE Rabat ──
              if (checklistType === 'AMEE_RABAT') {
                if (feuilleAmee === 'PC') return (<>
                  {F({ label: 'Personne / Utilisateur', k: 'utilisateur_nom', placeholder: 'Nom' })}
                  {F({ label: 'Type', k: 'designation', placeholder: 'PC Portable, Écran...' })}
                  {Row({ children: <>

                    {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell' })}
                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Désignation' })}
                  
</> })}
                  {Row({ children: <>

                    {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                    {Flex({ label: 'Système d\'Exploitation', k: 'systeme_exploitation', placeholder: 'Ex: Win 11' })}
                  
</> })}
                  {PcFields({})}
                </>);
                if (feuilleAmee === 'MISE A JOUR') return (<>
                  {F({ label: 'Personne / Utilisateur', k: 'utilisateur_nom', placeholder: 'Nom' })}
                  {F({ label: 'Type de poste', k: 'designation', placeholder: 'UC, PC Portable...' })}
                </>);
                if (feuilleAmee === 'IMP ET MFP RESEAUX') return (<>
                  {F({ label: 'Type', k: 'designation', placeholder: 'Imprimante, Fax, Scanner...' })}
                  {Row({ children: <>

                    {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Xerox' })}
                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: VersaLink C625' })}
                  
</> })}
                  {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                </>);
                if (feuilleAmee === 'DATA CENTER') return (<>
                  {F({ label: 'Type', k: 'designation', placeholder: 'Serveur, KVM...' })}
                  {Row({ children: <>

                    {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Lenovo, IBM' })}
                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: ThinkSystem SR630' })}
                  
</> })}
                  {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                </>);
              }

              // ── INPPLC ──
              if (checklistType === 'INPPLC') return (<>
                {Row({ children: <>

                  {Flex({ label: 'Famille / Type', k: 'designation', placeholder: 'Imprimante, PC...' })}
                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: HP' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: LaserJet' })}
                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                
</> })}
              </>);

              // ── MARSA MAROC ──
              if (checklistType === 'MARSA_MAROC') return (<>
                {Row({ children: <>

                  {Flex({ label: 'Direction', k: 'direction', placeholder: 'Direction' })}
                  {Flex({ label: 'Bureau', k: 'bureau', placeholder: 'Bureau' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Famille / Type', k: 'designation', placeholder: 'Ex: PC, Imprimante' })}
                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Article / Modèle', k: 'modele', placeholder: 'Ex: Latitude 5410' })}
                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                
</> })}
                {F({ label: 'Nom et Prénom utilisateur', k: 'utilisateur_nom', placeholder: 'Ex: M. Alaoui' })}
                {PcFields({})}
              </>);

              // ── MHAI ──
              if (checklistType === 'MHAI') return (<>
                {Row({ children: <>

                  {Flex({ label: 'Matériel / Type', k: 'designation', placeholder: 'Ex: PC, Onduleur' })}
                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Optiplex' })}
                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                
</> })}
                {F({ label: 'N° Inventaire', k: 'numero_inventaire', placeholder: 'N° Inventaire' })}
              </>);

              // ── ONP ──
              if (checklistType === 'ONP') return (<>
                {F({ label: 'Désignation / Type', k: 'designation', placeholder: 'Ex: PC Portable, Imprimante...' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell, HP...' })}
                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Latitude 5410' })}
                
</> })}
                {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
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
                  {F({ label: 'Entité / Site', k: 'direction', placeholder: 'Direction ou entité' })}
                  {!hideEmplacementAffectation && (
                    <>
                      {F({ label: 'Emplacement / Bureau', k: 'bureau', placeholder: 'Emplacement' })}
                      {F({ label: 'Affectation / Utilisateur', k: 'utilisateur_nom', placeholder: 'Nom de l\'utilisateur' })}
                    </>
                  )}
                  {F({ label: 'Article / Type', k: 'designation', placeholder: 'Ex: PC, Imprimante' })}
                  {Row({ children: <>

                    {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell' })}
                    {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Latitude' })}
                  
</> })}
                  {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                </>);
              }

              // ── INPPLC ──
              if (checklistType === 'INPPLC') return (<>
                {F({ label: 'Famille / Type', k: 'designation', placeholder: 'Ex: PC Portable, Imprimante...' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell, HP...' })}
                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Latitude 5410' })}
                
</> })}
                {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
              </>);

              // ── MARSA MAROC ──
              if (checklistType === 'MARSA_MAROC') return (<>
                {F({ label: 'Direction', k: 'direction', placeholder: 'Direction' })}
                {Row({ children: <>

                  {Flex({ label: 'Bureau', k: 'bureau', placeholder: 'Emplacement' })}
                  {Flex({ label: 'Nom et Prénom', k: 'utilisateur_nom', placeholder: 'Utilisateur' })}
                
</> })}
                {F({ label: 'Famille / Type', k: 'designation', placeholder: 'Ex: PC PORTABLE' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: DELL' })}
                  {Flex({ label: 'Modèle (Article)', k: 'modele', placeholder: 'Ex: 5570' })}
                
</> })}
                {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                {templateKey === 'PC_PORTABLE' && (
                  <>
                    {Row({ children: <>

                      {Flex({ label: 'Processeur', k: 'cpu', placeholder: 'Ex: i5' })}
                      {Flex({ label: 'RAM', k: 'ram', placeholder: 'Ex: 8GB' })}
                    
</> })}
                    {Row({ children: <>

                      {Flex({ label: 'Disque Dur', k: 'disque_dur', placeholder: 'Ex: 256GB SSD' })}
                      {Flex({ label: 'Système d\'expl.', k: 'systeme_exploitation', placeholder: 'Ex: Win 10' })}
                    
</> })}
                  </>
                )}
              </>);

              // ── ADM ──
              if (checklistType === 'ADM') return (<>
                {F({ label: 'Désignation', k: 'designation', placeholder: 'Ex: Serveur, Firewall...' })}
                {Row({ children: <>

                  {Flex({ label: 'Fabricant', k: 'marque', placeholder: 'Ex: HP, Dell' })}
                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: ProLiant DL380' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N' })}
                  {Flex({ label: 'IP Réseau', k: 'ip', placeholder: 'Ex: 192.168.1.10' })}
                
</> })}
                {PcFields({})}
              </>);

              // ── ANP ──
              if (checklistType === 'ANP') return (<>
                {F({ label: 'Famille / Type', k: 'designation', placeholder: 'Ex: PC Bureau' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: HP, Dell' })}
                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Modèle exact' })}
                
</> })}
                {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'S/N de l\'équipement' })}
              </>);

              // ── ANCFCC / ONDULEUR ──
              if (checklistType === 'ANCFCC' || typeEq === 'ONDULEUR') return (<>
                {Row({ children: <>

                  {Flex({ label: 'Organisme', k: 'organisme', placeholder: 'Ex: ANCFCC' })}
                  {Flex({ label: 'Puissance de l\'onduleur', k: 'puissance_kva', placeholder: 'Ex: 15 KVA' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Zone', k: 'zone', placeholder: 'Ex: SUD' })}
                  {Flex({ label: 'Nombre des batteries', k: 'nb_batteries', placeholder: 'Ex: 32', numeric: true })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Ville', k: 'ville', placeholder: 'Ex: AGADIR' })}
                  {Flex({ label: 'Marque/modèle', k: 'marque', placeholder: 'Ex: Riello 15 KVA' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'Établissement', k: 'etablissement', placeholder: 'Ex: CADASTRE' })}
                  {Flex({ label: 'Site', k: 'nom_site', placeholder: 'Nom du site' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                  {Flex({ label: 'C à B', k: 'capacite_batteries', placeholder: 'Capacité batteries' })}
                
</> })}
              </>);

              // ── MSANTE CAPM / DPRF (Compta) / SIGNATURE ──
              if (checklistType === 'MSANTE_CAPM' || checklistType === 'MSANTE_SIGNATURE' || (checklistType === 'MSANTE_DPRF' && feuilleAmee.toUpperCase() === 'COMPTABILITE')) return (<>
                {F({ label: 'Désignation / Type', k: 'designation', placeholder: 'Ex: PC Portable, Imprimante...' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell, HP...' })}
                  {Flex({ label: 'Modèle (Article)', k: 'modele', placeholder: 'Ex: Latitude 5410' })}
                
</> })}
                {Row({ children: <>

                  {Flex({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
                  {Flex({ label: 'Utilisateur', k: 'utilisateur_nom', placeholder: 'Nom d\'utilisateur' })}
                
</> })}
              </>);

              // ── MSANTE (défaut) ──
              return (<>
                {F({ label: 'Désignation / Type', k: 'designation', placeholder: 'Ex: PC Portable, Imprimante...' })}
                {Row({ children: <>

                  {Flex({ label: 'Marque', k: 'marque', placeholder: 'Ex: Dell, HP...' })}
                  {Flex({ label: 'Modèle', k: 'modele', placeholder: 'Ex: Latitude 5410' })}
                
</> })}
                {F({ label: 'N° Série', k: 'numero_serie', placeholder: 'N° de série' })}
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

          {(checklistType === 'MSANTE_CAPM' || (checklistType === 'MSANTE_DPRF' && feuilleAmee.toUpperCase() === 'COMPTABILITE') || checklistType === 'MSANTE_SIGNATURE') && (
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

