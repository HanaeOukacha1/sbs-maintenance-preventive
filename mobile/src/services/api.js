import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Auto-détection de l'IP : on utilise l'IP du PC qui lance Expo (pas besoin de changer manuellement)
// En production (APK/build), fallback sur l'IP fixe définie dans l'app.json ou ici
const getBaseUrl = () => {
  // Sur le simulateur/device via Expo Go, hostUri = "192.168.x.x:8081"
  // On extrait l'IP et on remplace le port par 8000 (backend FastAPI)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api/v1`;
  }
  // Fallback si hostUri n'est pas disponible (ex: build de production)
  return 'http://192.168.100.149:8000/api/v1';
};

export const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'bypass-tunnel-reminder': 'true'
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
