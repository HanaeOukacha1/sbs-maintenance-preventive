import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDB } from '../services/dbService';
import NetInfo from '@react-native-community/netinfo';
import syncService from '../services/syncService';

export default function Layout() {
  useEffect(() => {
    initDB();

    // Ecouteur réseau pour la synchro automatique (Phase Réconciliation Asynchrone)
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncService.uploadEveningData()
          .then(res => {
            if (res && res.uploaded > 0) {
              console.log(`[NetInfo] Synchro auto réussie : ${res.uploaded} élément(s)`);
            }
          })
          .catch(err => console.log("[NetInfo] Erreur synchro auto:", err));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login", headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
