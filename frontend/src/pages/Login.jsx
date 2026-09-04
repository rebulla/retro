import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const { user, loginWithGoogle, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [lastUser, setLastUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('lastGoogleUser');
    if (saved) {
      try {
        setLastUser(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  if (user) {
    return <Navigate to={user.role === 'guest' ? '/poker' : '/dashboard'} replace />;
  }

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (guestName.trim()) {
      loginAsGuest(guestName.trim());
      navigate('/poker');
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <div className="login-header">
          <div className="logo-icon-large">A</div>
          <h1>AgileFlow</h1>
          <p>O seu hub para gestão de cerimônias ágeis.</p>
        </div>
        
        <div className="login-methods">
          {lastUser ? (
            <div className="last-user-login">
              <button className="btn-google" onClick={() => loginWithGoogle(false, lastUser.email)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', justifyContent: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                <img src={lastUser.avatar} alt={lastUser.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>{lastUser.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>{lastUser.email}</div>
                </div>
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => loginWithGoogle(true)}
                style={{ width: '100%', marginTop: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
              >
                Entrar com outra conta Google
              </button>
            </div>
          ) : (
            <button className="btn-google" onClick={() => loginWithGoogle(false)}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" />
              <span>Entrar com o Google</span>
            </button>
          )}
          
          <div className="divider">
            <span>OU</span>
          </div>
          
          <form className="guest-form" onSubmit={handleGuestSubmit}>
            <p>Convidado para o Planning Poker?</p>
            <div className="guest-input-group">
              <input 
                type="text" 
                placeholder="Digite seu nome" 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Entrar na Sala</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Login;
