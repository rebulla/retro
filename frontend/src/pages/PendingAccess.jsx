import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PendingAccess.css';

const PendingAccess = () => {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const requestAccessAgain = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/request-access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.id })
      });
      if (res.ok) {
        await refreshUser();
      } else {
        alert("Erro ao solicitar acesso novamente.");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pending-container">
      <div className="glass-card pending-card">
        <div className="pending-header">
          <div className="logo-icon-large">A</div>
          <h1>{user?.status === 'rejected' ? 'Acesso Rejeitado' : 'Aguardando Liberação'}</h1>
        </div>
        
        <div className="pending-content">
          <p>Olá, <strong>{user?.name}</strong>!</p>
          {user?.status === 'rejected' ? (
            <>
              <p>Sua solicitação de acesso foi rejeitada por um administrador.</p>
              <p>Se você acha que foi um engano ou deseja tentar novamente, clique no botão abaixo.</p>
              <div className="status-badge rejected">Status: Rejeitado</div>
            </>
          ) : (
            <>
              <p>Sua conta foi criada com sucesso, mas você ainda não possui permissão para acessar nenhuma Squad.</p>
              <p>Por favor, aguarde até que um administrador aprove seu acesso e vincule você a uma equipe.</p>
              <div className="status-badge pending">Status: Pendente</div>
            </>
          )}
        </div>

        <div className="pending-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {user?.status === 'rejected' && (
            <button 
              className="btn-success" 
              onClick={requestAccessAgain}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Solicitar Acesso Novamente'}
            </button>
          )}
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
