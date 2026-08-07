import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';

// ─── Types de champs disponibles selon checklist ─────────────────────────────
interface AddEquipmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (equipementData: any) => void;
  checklistType: string;
  feuilleActive?: string;
  siteId: number;
}

// ─── Champs selon checklistType ────────────────────────────────────────────────
const getFormFields = (checklistType: string, feuille?: string): Array<{
  key: string; label: string; placeholder?: string; required?: boolean;
  type?: 'text' | 'numeric'; half?: boolean;
}> => {
  const base = [
    { key: 'designation', label: 'Désignation / Type', placeholder: 'Ex: PC Portable, Imprimante...', required: true },
    { key: 'marque', label: 'Marque', placeholder: 'Ex: Dell, HP...', half: true },
    { key: 'modele', label: 'Modèle', placeholder: 'Ex: Latitude 5410', half: true },
    { key: 'numero_serie', label: 'N° Série', placeholder: 'Numéro de série', half: true },
  ];

  if (checklistType === 'ADM') return [
    { key: 'designation', label: 'Désignation', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série', half: true },
    { key: 'numero_inventaire', label: 'N° Inventaire', half: true },
    { key: 'direction', label: 'Direction' },
    { key: 'bureau', label: 'Bureau', half: true },
    { key: 'utilisateur_nom', label: 'Utilisateur', half: true },
    { key: 'cpu', label: 'CPU / Processeur', half: true },
    { key: 'ram', label: 'RAM', half: true },
    { key: 'disque_dur', label: 'Disque Dur', half: true },
    { key: 'systeme_exploitation', label: "Système d'Exploitation", half: true },
  ];

  if (checklistType === 'AMEE_MARRAKECH' || checklistType === 'AMEE_RABAT') {
    const feuilleU = (feuille || '').toUpperCase();
    if (feuilleU.includes('UC') || feuilleU.includes('PC')) return [
      { key: 'utilisateur_nom', label: 'Utilisateur', required: true },
      { key: 'designation', label: 'Type de poste', placeholder: 'UC, PC Portable...', required: true },
      { key: 'marque', label: 'Marque', half: true },
      { key: 'modele', label: 'Modèle', half: true },
      { key: 'numero_serie', label: 'N° Série', half: true },
      { key: 'numero_inventaire', label: 'N° Inventaire', half: true },
      { key: 'cpu', label: 'CPU', half: true },
      { key: 'ram', label: 'RAM', half: true },
      { key: 'disque_dur', label: 'Stockage', half: true },
      { key: 'systeme_exploitation', label: 'OS', half: true },
    ];
    if (feuilleU.includes('IMP')) return [
      { key: 'designation', label: 'Type', placeholder: 'Imprimante multifonction...', required: true },
      { key: 'marque', label: 'Marque', half: true },
      { key: 'modele', label: 'Modèle', half: true },
      { key: 'numero_serie', label: 'N° Série' },
    ];
    return base;
  }

  if (checklistType === 'ANCFCC') return [
    { key: 'designation', label: "Type d'onduleur", required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série', half: true },
    { key: 'puissance_kva', label: 'Puissance (KVA)', half: true, type: 'numeric' as const },
    { key: 'nb_batteries', label: 'Nb Batteries', half: true, type: 'numeric' as const },
    { key: 'capacite_batteries', label: 'Capacité Batt.', half: true },
    { key: 'nom_site', label: 'Nom du site', required: true },
  ];

  if (checklistType === 'ANP' || checklistType === 'AOH') return [
    { key: 'designation', label: 'Désignation', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série', half: true },
    { key: 'numero_inventaire', label: 'N° Inventaire', half: true },
  ];

  if (checklistType === 'INPPLC') {
    const feuilleU = (feuille || '').toUpperCase();
    if (feuilleU.includes('PC') || feuilleU.includes('PORTABLE')) return [
      { key: 'designation', label: 'Type', placeholder: 'PC Portable...', required: true },
      { key: 'marque', label: 'Marque', half: true },
      { key: 'modele', label: 'Modèle', half: true },
      { key: 'numero_serie', label: 'N° Série' },
    ];
    return [
      { key: 'designation', label: "Type d'imprimante", required: true },
      { key: 'marque', label: 'Marque', half: true },
      { key: 'modele', label: 'Modèle', half: true },
      { key: 'numero_serie', label: 'N° Série' },
    ];
  }

  if (checklistType === 'MARSA_MAROC') return [
    { key: 'designation', label: 'Désignation', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série', half: true },
    { key: 'numero_inventaire', label: 'N° Inventaire', half: true },
    { key: 'direction', label: 'Direction' },
    { key: 'bureau', label: 'Bureau', half: true },
    { key: 'utilisateur_nom', label: 'Utilisateur', half: true },
  ];

  if (checklistType === 'MHAI') return [
    { key: 'designation', label: 'Matériel / Type', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série', half: true },
    { key: 'numero_inventaire', label: 'N° Inventaire', half: true },
  ];

  if (checklistType === 'MSANTE_CAPM' || checklistType === 'MSANTE_DPRF' || checklistType === 'MSANTE_SIGNATURE') return [
    { key: 'designation', label: 'Désignation / Type', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série', half: true },
    { key: 'utilisateur_nom', label: 'Utilisateur', half: true },
  ];

  if (checklistType === 'ONP') return [
    { key: 'designation', label: 'Désignation / Type', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série' },
  ];

  if (checklistType.startsWith('CNDH_')) return [
    { key: 'entite', label: 'Entité / Article', required: true },
    { key: 'designation', label: 'Désignation', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série' },
    ...(checklistType === 'CNDH_G2' ? [
      { key: 'emplacement', label: 'Emplacement', half: true },
      { key: 'affectation', label: 'Affectation', half: true },
    ] : []),
  ];

  // MSANTE_STANDARD + fallback
  return [
    { key: 'designation', label: 'Désignation / Type', required: true },
    { key: 'marque', label: 'Marque', half: true },
    { key: 'modele', label: 'Modèle', half: true },
    { key: 'numero_serie', label: 'N° Série' },
  ];
};

// ─── Composant ────────────────────────────────────────────────────────────────
export default function AddEquipmentModal({
  visible, onClose, onAdd, checklistType, feuilleActive, siteId,
}: AddEquipmentModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const fields = getFormFields(checklistType, feuilleActive);

  const updateField = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    const missing = fields.filter(f => f.required && !formData[f.key]?.trim());
    if (missing.length > 0) {
      Alert.alert('Champs requis', `Veuillez remplir : ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    onAdd({ ...formData, site_id: siteId, is_local: 1 });
    setFormData({});
    onClose();
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  const renderFields = () => {
    const result: React.ReactElement[] = [];
    let i = 0;
    while (i < fields.length) {
      const field = fields[i];
      const nextField = i + 1 < fields.length ? fields[i + 1] : null;

      if (field.half && nextField?.half) {
        result.push(
          <View key={`row-${i}`} style={styles.row}>
            {[field, nextField].map(f => (
              <View key={f.key} style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  {f.label}{f.required ? <Text style={styles.required}> *</Text> : ''}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData[f.key] || ''}
                  onChangeText={v => updateField(f.key, v)}
                  placeholder={f.placeholder || f.label}
                  placeholderTextColor="#94a3b8"
                  keyboardType={f.type === 'numeric' ? 'numeric' : 'default'}
                />
              </View>
            ))}
          </View>
        );
        i += 2;
      } else {
        result.push(
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>
              {field.label}{field.required ? <Text style={styles.required}> *</Text> : ''}
            </Text>
            <TextInput
              style={styles.input}
              value={formData[field.key] || ''}
              onChangeText={v => updateField(field.key, v)}
              placeholder={field.placeholder || field.label}
              placeholderTextColor="#94a3b8"
              keyboardType={field.type === 'numeric' ? 'numeric' : 'default'}
            />
          </View>
        );
        i += 1;
      }
    }
    return result;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Plus color="#22b5d8" size={22} />
            <View>
              <Text style={styles.headerTitle}>Nouvel Équipement</Text>
              <Text style={styles.headerSub}>{checklistType}{feuilleActive ? ` • ${feuilleActive}` : ''}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X color="#64748b" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de l'équipement</Text>
            <Text style={styles.sectionSub}>
              Remplissez les informations de l'équipement découvert sur site. Il sera ajouté localement et synchronisé lors de la prochaine synchronisation.
            </Text>
            {renderFields()}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
            <Plus color="#fff" size={18} />
            <Text style={styles.saveBtnText}>Ajouter l'équipement</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingTop: 52,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  closeBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 20 },
  content: { flex: 1 },
  section: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  sectionSub: { fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#ef4444' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  footer: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center',
  },
  cancelText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#22b5d8', paddingVertical: 14, borderRadius: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
