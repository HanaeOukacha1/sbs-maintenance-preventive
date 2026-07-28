import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDB } from '../services/dbService';

export default function Layout() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login", headerShown: false }} />
    </Stack>
  );
}
