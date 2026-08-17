import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import authService from '../services/authService';
import '../index.css'; 

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); 
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
      const data = await authService.login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container d-flex">
      {/* Panneau gauche : Branding institutionnel */}
      <div className="login-branding d-flex flex-col justify-center p-4">
        <div className="branding-content">
          <h1 className="branding-title">SBS</h1>
          <h2 className="branding-subtitle">Maintenance Préventive</h2>
          <p className="branding-text">
            Outil de terrain technique. <br />
            Substancium Business Services.
          </p>
        </div>
      </div>

      {/* Panneau droit : Formulaire */}
      <div className="login-form-section d-flex items-center justify-center">
        <div className="login-box">
          <div className="login-header mb-4">
            <h1 className="text-h1">Connexion</h1>
            <p className="text-muted">Veuillez vous identifier pour accéder au portail.</p>
          </div>

          {error && (
            <div className="error-message d-flex items-center gap-2 mb-4">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

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
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: var(--bg-app);
        }
        
        .login-branding {
          flex: 0 0 60%;
          background-color: #0f172a; /* Anthracite très sombre */
          color: #f8fafc;
          position: relative;
          overflow: hidden;
        }

        /* Texture géométrique technique */
        .login-branding::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.3;
          pointer-events: none;
        }

        .branding-content {
          position: relative;
          z-index: 10;
          max-width: 500px;
          margin: 0 auto;
          width: 100%;
          padding: 2rem;
        }

        .branding-title {
          font-size: 4rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 0.5rem;
          line-height: 1;
        }

        .branding-subtitle {
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: #e2e8f0;
        }

        .branding-text {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.6;
        }

        .login-form-section {
          flex: 0 0 40%;
          background-color: var(--bg-panel);
          border-left: 1px solid var(--border-light);
        }

        .login-box {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
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
          border-left: 3px solid var(--danger);
          padding: 0.75rem 1rem;
          border-radius: 4px;
          color: var(--danger);
          font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .login-container {
            flex-direction: column;
          }
          .login-branding {
            flex: 0 0 auto;
            padding: 3rem 2rem;
          }
          .login-form-section {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
