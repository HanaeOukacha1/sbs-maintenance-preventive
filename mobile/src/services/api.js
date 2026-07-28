import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// L'adresse IP locale de ton PC (à changer si ton IP change)
// Remarque : Sur le réseau local, le téléphone ne peut pas utiliser "localhost" ou "127.0.0.1" 
// car cela pointerait vers le téléphone lui-même.
// URL Localtunnel pour contourner le pare-feu
export const API_URL = 'https://easy-pumas-slide.loca.lt/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'bypass-tunnel-reminder': 'true', // double format pour compatibilité
  },
  // 30s pour laisser le temps au tunnel (localtunnel peut être lent)
  timeout: 30000,
});

// Intercepteur pour injecter le Token JWT automatiquement dans chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
