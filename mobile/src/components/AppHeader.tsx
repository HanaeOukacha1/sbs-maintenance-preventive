import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import db from '../services/dbService';

export default function AppHeader() {
  const [pendingCount, setPendingCount] = useState(0);

  const checkSyncStatus = useCallback(() => {
    try {
      const pendingInt = db.getAllSync('SELECT COUNT(*) as cnt FROM interventions WHERE sync_en_attente = 1');
      const pendingMis = db.getAllSync('SELECT COUNT(*) as cnt FROM missions WHERE sync_statut_en_attente = 1');
      setPendingCount((pendingInt[0]?.cnt || 0) + (pendingMis[0]?.cnt || 0));
    } catch (e) {
      console.log(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkSyncStatus();
      // Optional: set an interval to check periodically if needed
      const interval = setInterval(checkSyncStatus, 5000);
      return () => clearInterval(interval);
    }, [checkSyncStatus])
  );

  const isSynced = pendingCount === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={styles.logo}>SBS</Text>
        </View>
        <View style={styles.right}>
          <View style={styles.syncStatus}>
            <View style={[styles.dot, { backgroundColor: isSynced ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.syncText}>
              {isSynced ? 'Synchronisé' : `${pendingCount} en attente`}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0f172a', // Dark theme background for the header
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    color: '#22b5d8',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2, // Square-ish dot as requested
    marginRight: 6,
  },
  syncText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
});
