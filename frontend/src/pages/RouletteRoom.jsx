import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './RouletteRoom.css';
import Confetti from 'react-confetti';

const RouletteRoom = () => {
  const socket = useSocket();
  const { user } = useAuth();
  
  const [participants, setParticipants] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [funnyPhrase, setFunnyPhrase] = useState("");

  const winnerPhrases = [
    "Ok, vou dar o meu melhor! 💪",
    "Pode deixar comigo! 🚀",
    "Nasci para isso! 😎",
    "Lá vou eu salvar a sprint! 🦸"
  ];

  const loserPhrases = [
    "Nem queria mesmo... 😒",
    "Ufa, escapei dessa! 😅",
    "Foi quase! 😮‍💨",
    "Na próxima eu ganho (ou não)! 🤫"
  ];

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_roulette', user);

    socket.on('roulette_state_update', ({ participants, isSpinning }) => {
      setParticipants(participants);
      setIsSpinning(isSpinning);
    });

    socket.on('roulette_spin_start', ({ winnerIndex }) => {
      setIsSpinning(true);
      setWinner(null);
      // Calcula a rotação para cair no índice selecionado.
      // O segmento de cada participante é 360 / participants.length.
      // Adicionamos algumas voltas completas (ex: 5 voltas = 1800 graus)
      const numParticipants = participants.length || 1;
      const sliceAngle = 360 / numParticipants;
      // Para o ponteiro no topo (que geralmente aponta pra 270 deg ou 0 deg dependendo do desenho)
      // Ajuste: o segmento 0 começa no eixo X e vai descendo, se giramos... vamos simplificar:
      // Apenas fazemos um giro aleatório dentro do segmento do winner.
      const spinRotations = 360 * 5; // 5 voltas
      
      // Ajuste básico: a roda css vai usar conic-gradient onde index 0 é 0-X deg
      const targetAngle = 360 - (winnerIndex * sliceAngle) - (sliceAngle / 2);
      
      setRotationDegrees(prev => prev + spinRotations + targetAngle - (prev % 360));
    });

    socket.on('roulette_spin_end', ({ winner }) => {
      setIsSpinning(false);
      setWinner(winner);
      
      const isMe = user && (winner.id === (user.id || user.uid));
      const phrases = isMe ? winnerPhrases : loserPhrases;
      setFunnyPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      setShowWinnerModal(true);
    });

    return () => {
      socket.emit('leave_roulette');
      socket.off('roulette_state_update');
      socket.off('roulette_spin_start');
      socket.off('roulette_spin_end');
    };
  }, [socket, user, participants.length]);

  const handleSpin = () => {
    if (participants.length === 0 || isSpinning) return;
    socket.emit('spin_roulette');
  };

  const colors = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', 
    '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
    '#10b981', '#22c55e'
  ];

  // Helper para criar o gradient da roda
  const getConicGradient = () => {
    if (participants.length === 0) return 'conic-gradient(#333 0 360deg)';
    const slice = 360 / participants.length;
    let gradient = 'conic-gradient(';
    participants.forEach((p, i) => {
      const color = colors[i % colors.length];
      const start = i * slice;
      const end = (i + 1) * slice;
      gradient += `${color} ${start}deg ${end}deg${i === participants.length - 1 ? '' : ', '}`;
    });
    gradient += ')';
    return gradient;
  };

  return (
    <div className="page-container roulette-room">
      {winner && <Confetti recycle={false} numberOfPieces={500} gravity={0.2} />}
      
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Roleta Temática</h1>
          <p>Sorteie o próximo responsável por puxar o tema da Sprint!</p>
        </div>
      </header>

      <div className="roulette-area">
        <div className="roulette-container">
          <div className="roulette-pointer"></div>
          <div 
            className="roulette-wheel" 
            style={{ 
              background: getConicGradient(), 
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
            }}
          >
            {participants.map((p, i) => {
              const slice = 360 / participants.length;
              const rotation = (i * slice) + (slice / 2);
              return (
                <div 
                  key={p.id} 
                  className="roulette-participant-label"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <span className="label-content">
                    <img src={p.avatar} alt={p.name} className="roulette-avatar"/>
                    {p.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="roulette-controls">
          <button 
            className="btn-primary spin-btn" 
            onClick={handleSpin} 
            disabled={isSpinning || participants.length === 0}
          >
            {isSpinning ? 'Girando...' : 'GIRAR A ROLETA!'}
          </button>
        </div>

        {showWinnerModal && winner && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowWinnerModal(false)}>
            <div className="glass-panel winner-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowWinnerModal(false)}>✕</button>
              
              <h2>Temos um Responsável! 🎉</h2>
              <div className="winner-card">
                <img src={winner.avatar} alt={winner.name} />
                <h3>{winner.name}</h3>
                <p>É com você, arrase no próximo tema da retrospectiva!</p>
              </div>

              <button className="btn-primary funny-ok-btn" onClick={() => setShowWinnerModal(false)}>
                {funnyPhrase}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouletteRoom;
