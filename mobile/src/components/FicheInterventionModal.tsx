import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { X, CheckCircle2, Circle, Save, Server, Monitor, Printer, Activity } from 'lucide-react-native';

interface FicheInterventionModalProps {
  visible: boolean;
  equipement: any;
  mission: any;
  feuille: string;
  onClose: () => void;
  onSave: (eqData: any, reponses: any) => void;
}

const FIELD_LABELS: Record<string, { label: string; options: string[] }> = {
  etat_software: { label: 'État Software', options: ['OK', 'Anomalie'] },
  etat_hardware: { label: 'État Hardware', options: ['OK', 'Anomalie'] },
  etat:          { label: 'État Général', options: ['OK', 'Non'] },
  statut:        { label: 'Statut', options: ['OK', 'Non'] },
  observation:   { label: 'Observation', options: ['BON', 'DÉFAILLANT', 'À RÉPARER'] },
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
  MSANTE_STANDARD: ['observation'],
  MSANTE_CAPM:     ['observation'],
  MSANTE_DPRF:     ['observation'],
  ONP:             ['etat'],
  CNDH_G1:         ['observation'],
  CNDH_G2:         ['observation'],
  CNDH_SIEGE:      ['observation'],
};

const ONDULEUR_TEMPLATE = [
  { key: 'pt1', label: 'Vérification du matériel', options: ['OK', 'Non'] },
  { key: 'pt2', label: 'Contrôle paramètres électriques', options: ['OK', 'Non'] },
  { key: 'pt3', label: 'Contrôle bruit mécanique', options: ['OK', 'Non'] },
  { key: 'pt4', label: 'Test de simulation', options: ['OK', 'Non'] },
  { key: 'pt5', label: 'Vérif. carte SNMP', options: ['OK', 'Non'] },
  { key: 'pt6', label: 'Contrôle des batteries', options: ['OK', 'Non'] },
  { key: 'pt7', label: 'Nettoyage et dépoussiérage', options: ['Fait', 'Non'] },
  { key: 'observation', label: 'Observation générale', options: ['BON', 'PANNE'] },
];

export default function FicheInterventionModal({ visible, equipement, mission, feuille, onClose, onSave }: FicheInterventionModalProps) {
  const [eqData, setEqData] = useState<any>({});
  const [reponses, setReponses] = useState<any>({});

  useEffect(() => {
    if (equipement) {
      setEqData({
        numero_serie: equipement.numero_serie || '',
        cpu: equipement.cpu || '',
        ram: equipement.ram || '',
        disque_dur: equipement.disque_dur || '',
        systeme_exploitation: equipement.systeme_exploitation || '',
        antivirus: equipement.antivirus || '',
        ip: equipement.ip || '',
        puissance_kva: equipement.puissance_kva || '',
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

  // Build the dynamic template for checklists based on market (except Onduleur which is fixed)
  let template = [];
  if (checklistType === 'ANCFCC' || typeEq === 'ONDULEUR') {
    template = ONDULEUR_TEMPLATE;
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
          
          {/* Section 1: Informations Matériel (Affiché selon le marché) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Informations Matériel</Text>
            <Text style={styles.sectionSub}>Mettez à jour les caractéristiques réelles.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>N° de Série</Text>
              <TextInput style={styles.input} value={eqData.numero_serie} onChangeText={t => setEqData({...eqData, numero_serie: t})} placeholder="N° Série" />
            </View>

            {['ADM', 'AMEE_MARRAKECH', 'AMEE_RABAT', 'MARSA_MAROC'].includes(checklistType) && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>CPU (Processeur)</Text>
                    <TextInput style={styles.input} value={eqData.cpu} onChangeText={t => setEqData({...eqData, cpu: t})} placeholder="Ex: Core i5" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>RAM</Text>
                    <TextInput style={styles.input} value={eqData.ram} onChangeText={t => setEqData({...eqData, ram: t})} placeholder="Ex: 8 Go" />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Stockage (Disque)</Text>
                    <TextInput style={styles.input} value={eqData.disque_dur} onChangeText={t => setEqData({...eqData, disque_dur: t})} placeholder="Ex: 256 Go SSD" />
                  </View>
                  
                  {checklistType !== 'ADM' ? (
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Système d'Exploitation</Text>
                      <TextInput style={styles.input} value={eqData.systeme_exploitation} onChangeText={t => setEqData({...eqData, systeme_exploitation: t})} placeholder="Ex: Win 11 Pro" />
                    </View>
                  ) : (
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Adresse IP</Text>
                      <TextInput style={styles.input} value={eqData.ip} onChangeText={t => setEqData({...eqData, ip: t})} placeholder="192.168.x.x" />
                    </View>
                  )}
                </View>
              </>
            )}

            {(checklistType === 'ANCFCC' || typeEq === 'ONDULEUR') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Puissance (KVA)</Text>
                <TextInput style={styles.input} value={eqData.puissance_kva} onChangeText={t => setEqData({...eqData, puissance_kva: t})} placeholder="Ex: 10 KVA" />
              </View>
            )}
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
                    placeholder="Détails supplémentaires (optionnel)..." 
                    value={reponses.notes || ''}
                    onChangeText={t => setReponses({...reponses, notes: t})}
                  />
                </View>
              </>
            ) : (
              <View style={styles.emptyChecklist}>
                <CheckCircle2 color="#10b981" size={48} style={{ marginBottom: 16 }} />
                <Text style={styles.sectionTitle}>Aucune saisie requise</Text>
                <Text style={styles.sectionSub}>Ce marché ne demande qu'une simple validation de présence. Cliquez sur Enregistrer pour valider cet équipement.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Save color="#fff" size={20} />
            <Text style={styles.saveBtnText}>Enregistrer la fiche</Text>
          </TouchableOpacity>
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
