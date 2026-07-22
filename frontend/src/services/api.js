import axios from 'axios';

// ============================================================
// CONFIGURATION AXIOS (Communication avec FastAPI)
// ============================================================

// On crée une instance Axios configurée pour pointer vers notre backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTEUR DE REQUÊTE :
// Avant chaque requête envoyée au backend, cette fonction s'exécute.
api.interceptors.request.use(
  (config) => {
    // On cherche si un token JWT est sauvegardé dans le navigateur
    const token = localStorage.getItem('token');
    
    if (token) {
      // Si oui, on l'ajoute dans les headers (Authorization: Bearer <token>)
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTEUR DE RÉPONSE :
// Si le backend répond avec une erreur 401 (Non autorisé / Token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si le token est invalide, on déconnecte l'utilisateur
      // et on le renvoie vers la page de Login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
