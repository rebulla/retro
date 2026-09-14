import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './RouletteRoom.css';
import Confetti from 'react-confetti';

const RouletteRoom = () => {
  const socket = useSocket();
  const { user, activeSquad } = useAuth();
  
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

  const stateRef = useRef({ user, participants, activeSquad });
  useEffect(() => {
    stateRef.current = { user, participants, activeSquad };
  }, [user, participants, activeSquad]);

  useEffect(() => {
    if (!socket || !user || !activeSquad) return;
    const squadId = activeSquad._id;

    const handleConnect = () => {
      const state = stateRef.current;
      if (state.user && state.activeSquad) {
        socket.emit('join_roulette', { user: state.user, squadId: state.activeSquad._id });
      }
    };

    socket.on('connect', handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    const onStateUpdate = ({ participants, isSpinning }) => {
      setParticipants(participants);
      setIsSpinning(isSpinning);
    };
    socket.on('roulette_state_update', onStateUpdate);

    const onSpinStart = ({ winnerIndex }) => {
      setIsSpinning(true);
      setWinner(null);
      
      const currentParticipants = stateRef.current.participants;
      const numParticipants = currentParticipants.length || 1;
      const sliceAngle = 360 / numParticipants;
      const spinRotations = 360 * 5; // 5 voltas
      
      const targetAngle = 360 - (winnerIndex * sliceAngle) - (sliceAngle / 2);
      
      setRotationDegrees(prev => prev + spinRotations + targetAngle - (prev % 360));
    };
    socket.on('roulette_spin_start', onSpinStart);

    const onSpinEnd = ({ winner }) => {
      setIsSpinning(false);
      setWinner(winner);
      
      const currentUser = stateRef.current.user;
      const isMe = currentUser && (winner.id === (currentUser.id || currentUser.uid));
      const phrases = isMe ? winnerPhrases : loserPhrases;
      setFunnyPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      setShowWinnerModal(true);
    };
    socket.on('roulette_spin_end', onSpinEnd);

    return () => {
      socket.emit('leave_roulette', { squadId });
      socket.off('connect', handleConnect);
      socket.off('roulette_state_update', onStateUpdate);
      socket.off('roulette_spin_start', onSpinStart);
      socket.off('roulette_spin_end', onSpinEnd);
    };
  }, [socket, user?.id, user?.uid, activeSquad?._id]);

  const handleSpin = () => {
    if (participants.length === 0 || isSpinning || !activeSquad) return;
    socket.emit('spin_roulette', { squadId: activeSquad._id });
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
