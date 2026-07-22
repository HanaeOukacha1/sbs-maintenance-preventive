import api from './api';

const authService = {
  /**
   * Tente de connecter l'utilisateur avec son email et mot de passe.
   * @param {string} email 
   * @param {string} password 
   * @returns Les données de l'utilisateur si succès
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Si la requête réussit, le backend nous renvoie un token et les infos user
      if (response.data.access_token) {
        // On sauvegarde le token pour les futures requêtes
        localStorage.setItem('token', response.data.access_token);
        
        // On sauvegarde les infos de l'utilisateur (nom, rôle...)
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // On propage l'erreur pour pouvoir l'afficher sur l'interface
      if (error.response && error.response.data) {
        throw new Error(error.response.data.detail || "Erreur de connexion");
      }
      throw new Error("Impossible de se connecter au serveur");
    }
  },

  /**
   * Déconnecte l'utilisateur en vidant le stockage local
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Vérifie si un utilisateur est actuellement connecté
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Récupère les informations de l'utilisateur connecté
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};

export default authService;
