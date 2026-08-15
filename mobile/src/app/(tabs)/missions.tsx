import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { RefreshCw, MapPin, ChevronRight, Calendar, Building2, CheckCircle2, Clock } from 'lucide-react-native';
import { Link, useFocusEffect } from 'expo-router';
import syncService from '../../services/syncService';
import db from '../../services/dbService';

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  PLANIFIEE:    { bg: 'transparent', text: '#0284c7', label: 'Planifiée' },
  EN_COURS:     { bg: 'transparent', text: '#d97706', label: 'En cours' },
  TERMINEE:     { bg: 'transparent', text: '#16a34a', label: 'Terminée' },
  SYNCHRONISEE: { bg: 'transparent', text: '#15803d', label: 'Synchronisée' },
};

export default function MissionsScreen() {
  const [missions, setMissions] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const charger = useCallback(() => {
    try {
      const rows = db.getAllSync('SELECT * FROM missions ORDER BY date_planifiee ASC');
      setMissions(rows || []);
      const pending = db.getAllSync('SELECT COUNT(*) as cnt FROM interventions WHERE sync_en_attente = 1');
      const pendingMissions = db.getAllSync('SELECT COUNT(*) as cnt FROM missions WHERE sync_statut_en_attente = 1');
      setPendingCount((pending[0]?.cnt || 0) + (pendingMissions[0]?.cnt || 0));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const synchroniser = async () => {
    setSyncing(true);
    try {
      const result = await syncService.downloadMorningData();
      charger();
      Alert.alert('Synchronisé', `${result.missions} mission(s), ${result.equipements} équipement(s)`);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Synchronisation échouée');
    } finally {
      setSyncing(false);
    }
  };

  const uploaderSoir = async () => {
    if (pendingCount === 0) {
      Alert.alert('Info', 'Aucune donnée en attente.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncService.uploadEveningData();
      charger();
      Alert.alert('Envoyé', `${result.uploaded} intervention(s) et statuts mis à jour`);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Envoi échoué');
    } finally {
      setSyncing(false);
    }
  };

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{today}</Text>
        <Text style={styles.title}>Mes Missions</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnSync} onPress={synchroniser} disabled={syncing}>
            {syncing ? <ActivityIndicator color="#fff" size={16} /> : <RefreshCw color="#fff" size={16} />}
            <Text style={styles.btnText}>Sync matin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnUpload, pendingCount > 0 && styles.btnUploadActive]}
            onPress={uploaderSoir}
            disabled={syncing}
          >
            <Text style={styles.btnText}>
              Synchroniser{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste missions */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={charger} />}
      >
        {missions.length === 0 ? (
          <View style={styles.empty}>
            <MapPin color="#cbd5e1" size={48} />
            <Text style={styles.emptyTitle}>Aucune mission</Text>
            <Text style={styles.emptySub}>Appuyez sur "Sync matin" pour télécharger votre planning.</Text>
          </View>
        ) : (
          missions.map((m) => {
            const status = STATUS_COLOR[m.statut] || STATUS_COLOR.PLANIFIEE;
            const feuilles = m.feuilles ? (() => { try { return JSON.parse(m.feuilles); } catch { return null; } })() : null;
            return (
              <Link href={`/mission/${m.id}`} asChild key={m.id}>
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.badge]}>
                      <View style={[styles.statusDot, { backgroundColor: status.text }]} />
                      <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
                    </View>
                    {feuilles && (
                      <View style={styles.feuillesBadge}>
                        <Text style={styles.feuillesText}>{feuilles.length} onglet{feuilles.length > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {m.titre || m.description || 'Mission'}
                  </Text>

                  <View style={styles.cardMeta}>
                    <Building2 color="#334155" size={14} />
                    <Text style={styles.metaText}>{m.site_nom || '—'}</Text>
                    {m.site_ville ? <Text style={styles.metaCity}> • {m.site_ville}</Text> : null}
                  </View>

                  <View style={styles.cardFooter}>
                    <Calendar color="#475569" size={14} />
                    <Text style={styles.dateChip}>{m.date_planifiee}</Text>
                    <View style={{ flex: 1 }} />
                    <ChevronRight color="#475569" size={20} />
                  </View>
                </TouchableOpacity>
              </Link>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateText: { fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginTop: 2, marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnSync: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#22b5d8', paddingVertical: 14, borderRadius: 8, minHeight: 44,
  },
  btnUpload: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#475569', paddingVertical: 14, borderRadius: 8, minHeight: 44,
  },
  btnUploadActive: { backgroundColor: '#16a34a' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  list: { padding: 16, paddingBottom: 40 },
  empty: {
    alignItems: 'center', backgroundColor: '#fff', padding: 24,
    borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0',
    borderStyle: 'dashed', marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  feuillesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  feuillesText: { fontSize: 12, color: '#0284c7', fontWeight: '500' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  metaText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  metaCity: { fontSize: 14, color: '#475569' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  dateChip: { fontSize: 13, color: '#475569' },
});
