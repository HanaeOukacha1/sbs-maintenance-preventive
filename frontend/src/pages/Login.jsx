import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import authService from '../services/authService';
import '../index.css'; // S'assurer que les styles globaux sont chargés

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // On efface l'erreur dès que l'utilisateur re-tape
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      // Appel à notre API via le authService
      const data = await authService.login(formData.email, formData.password);
      
      // Si on arrive ici, le login est réussi
      console.log("Connecté avec succès:", data.user.nom);
      
      // Redirection vers le tableau de bord
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container d-flex items-center justify-center animate-fade-in">
      <div className="glass-panel login-box">
        
        {/* En-tête du formulaire */}
        <div className="login-header text-center mb-4">
          <div className="logo-circle mx-auto d-flex items-center justify-center mb-3">
            <Lock size={32} color="var(--primary)" />
          </div>
          <h1 className="text-h1">Portail SBS</h1>
          <p className="text-muted">Gestion de la Maintenance Préventive</p>
        </div>

        {/* Affichage des erreurs éventuelles */}
        {error && (
          <div className="error-message d-flex items-center gap-2 mb-4">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-col gap-3">
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Adresse Email</label>
            <div className="input-wrapper relative">
              <div className="input-icon absolute">
                <Mail size={18} color="var(--text-muted)" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input with-icon"
                placeholder="admin@sbs.ma"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <div className="input-wrapper relative">
              <div className="input-icon absolute">
                <Lock size={18} color="var(--text-muted)" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input with-icon"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4" 
            disabled={isLoading}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

      </div>

      {/* Styles spécifiques à la page de Login */}
      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          /* Un fond dynamique avec des gradients subtils */
          background: radial-gradient(circle at top right, var(--bg-panel) 0%, var(--bg-app) 50%, #08090d 100%);
          position: relative;
          overflow: hidden;
        }
        
        /* Effet de lumière en arrière-plan */
        .login-container::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 50%;
          height: 50%;
          background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
          opacity: 0.1;
          filter: blur(80px);
        }

        .login-box {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          position: relative;
          z-index: 10;
        }

        .logo-circle {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.1);
          margin-left: auto;
          margin-right: auto;
        }

        .input-wrapper.relative { position: relative; }
        .input-icon.absolute {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
        }
        .form-input.with-icon {
          padding-left: 2.75rem;
        }

        .error-message {
          background-color: var(--danger-bg);
          border-left: 4px solid var(--danger);
          padding: 0.75rem 1rem;
          border-radius: 4px;
          color: #fca5a5;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
