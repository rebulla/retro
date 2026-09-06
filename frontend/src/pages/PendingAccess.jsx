import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PendingAccess.css';

const PendingAccess = () => {
  const { user, logout } = useAuth();

  return (
    <div className="pending-container">
      <div className="glass-card pending-card">
        <div className="pending-header">
          <div className="logo-icon-large">A</div>
          <h1>Aguardando Liberação</h1>
        </div>
        
        <div className="pending-content">
          <p>Olá, <strong>{user?.name}</strong>!</p>
          <p>Sua conta foi criada com sucesso, mas você ainda não possui permissão para acessar nenhuma Squad.</p>
          <p>Por favor, aguarde até que um administrador aprove seu acesso e vincule você a uma equipe.</p>
          
          <div className="status-badge pending">Status: Pendente</div>
        </div>

        <div className="pending-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {user?.role === 'admin' && (
            <button 
              className="btn-primary" 
              onClick={() => window.location.href = '/admin'}
            >
              Acessar Painel Admin
            </button>
          )}
          <button className="btn-secondary" onClick={logout}>Sair</button>
        </div>
      </div>
    </div>
  );
};

export default PendingAccess;
