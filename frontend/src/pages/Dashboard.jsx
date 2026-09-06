import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { useAuth } from '../contexts/AuthContext';
import { getActiveSprint } from '../services/sprintService';
import KudosCarousel from '../components/dashboard/KudosCarousel';
import PokerNewsTicker from '../components/dashboard/PokerNewsTicker';
import SprintSettingsModal from '../components/dashboard/SprintSettingsModal';
import { Columns, Spade } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, activeSquad } = useAuth();
  
  const [sprint, setSprint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSprint = async () => {
      try {
        const data = await getActiveSprint();
        setSprint(data);
      } catch (err) {
        console.error('Erro ao carregar a sprint ativa:', err);
      }
    };
    if (activeSquad) {
      fetchSprint();
    } else {
      setSprint(null);
    }
  }, [activeSquad]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  };

  return (
    <div className="page-container dashboard">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">{sprint ? sprint.name : 'Carregando...'}</h1>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1.2rem', fontWeight: '500' }}>
            {sprint ? `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}` : ''}
          </h3>
          <p>Visão geral da Sprint e atalhos.</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Configurar Sprint</button>
        )}
      </header>

      <div className="dashboard-ticker-wrapper" style={{ marginBottom: '16px' }}>
        <PokerNewsTicker />
      </div>

      <div className="dashboard-grid">
        <div 
          className="glass-card sprint-overview" 
          style={{ 
            gridColumn: 'span 2', 
            backgroundImage: sprint?.backgroundImage ? `linear-gradient(135deg, rgba(30,31,42,0.85), rgba(30,31,42,0.75)), url(${sprint.backgroundImage})` : '',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="sprint-theme">
            <span>Tema:</span>
            <strong>{sprint ? sprint.theme : ''}</strong>
          </div>
          {sprint?.themeResponsible && (
            <div className="sprint-responsible">
              <span>Responsável:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {sprint.themeResponsible.avatar && (
                  <img 
                    src={sprint.themeResponsible.avatar} 
                    alt={sprint.themeResponsible.name} 
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                <strong>{sprint.themeResponsible.name || sprint.themeResponsible}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-kudos-card" onClick={() => navigate('/kudos')}>
          <div className="card-overlay-hint">Ir para o Mural de Kudos</div>
          <KudosCarousel />
        </div>

        <div className="glass-card action-card" onClick={() => navigate('/roulette')} style={{ cursor: 'pointer' }}>
          <div className="icon-wrapper roulette-icon">🎡</div>
          <h3>Roleta do Tema</h3>
          <p>Sorteie o próximo responsável!</p>
        </div>

        <div className="glass-card action-card" onClick={() => navigate('/poker')} style={{ cursor: 'pointer' }}>
          <div className="icon-wrapper poker-icon">
            <Spade size={28} color="white" />
          </div>
          <h3>Planning Poker</h3>
          <p>Vote nas estimativas para a próxima Sprint.</p>
        </div>

        <div className="glass-card action-card" onClick={() => navigate('/retro')} style={{ cursor: 'pointer' }}>
          <div className="icon-wrapper retro-icon">
            <Columns size={28} color="white" />
          </div>
          <h3>Retrospectiva</h3>
          <p>Ir para o Quadro da Sprint</p>
        </div>
      </div>

      {isModalOpen && (
        <SprintSettingsModal 
          sprint={sprint} 
          onClose={() => setIsModalOpen(false)} 
          onUpdate={(updatedSprint) => setSprint(updatedSprint)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
