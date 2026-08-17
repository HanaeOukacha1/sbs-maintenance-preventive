import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Cloud, CloudOff } from 'lucide-react-native';
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
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SBS</Text>
            <Text style={styles.logoDot}>.</Text>
          </View>
        </View>
        
        <View style={styles.right}>
          <View style={[styles.syncBadge, isSynced ? styles.syncBadgeSynced : styles.syncBadgePending]}>
            {isSynced ? (
              <Cloud size={14} color="#059669" strokeWidth={2.5} />
            ) : (
              <CloudOff size={14} color="#d97706" strokeWidth={2.5} />
            )}
            <Text style={[styles.syncText, isSynced ? styles.syncTextSynced : styles.syncTextPending]}>
              {isSynced ? 'À jour' : `${pendingCount} en attente`}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    color: '#0f172a', // Slate 900
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  logoDot: {
    color: '#0284c7', // Sky 600
    fontSize: 24,
    fontWeight: '900',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  syncBadgeSynced: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  syncBadgePending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  syncText: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncTextSynced: {
    color: '#059669',
  },
  syncTextPending: {
    color: '#d97706',
  },
});
