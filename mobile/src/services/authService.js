import api from './api';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

const authService = {
  // Fonction de connexion
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      const { access_token } = response.data;
      
      // On sauvegarde le token de manière sécurisée (chiffré sur l'appareil)
      await SecureStore.setItemAsync('token', access_token);
      
      return response.data;
    } catch (error) {
      console.error("Erreur login API:", error.response?.data || error.message);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  // Déconnexion
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
  },

  // Récupérer les infos de l'utilisateur connecté depuis le JWT
  getCurrentUser: async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded;
    } catch (error) {
      return null;
    }
  },

  // Vérifier si on est authentifié
  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync('token');
    return !!token;
  }
};

export default authService;
