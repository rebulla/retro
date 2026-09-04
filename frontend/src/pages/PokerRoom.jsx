import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './PokerRoom.css';

const MOCK_ROOM_ID = 'room-123';

const calculateSummary = (participants) => {
  const frequencies = {};
  let maxVote = -1;

  Object.values(participants).forEach(p => {
    if (p.vote) {
      frequencies[p.vote] = (frequencies[p.vote] || 0) + 1;
      
      const num = parseFloat(p.vote);
      if (!isNaN(num) && num > maxVote) {
        maxVote = num;
      }
    }
  });

  let maxFreq = 0;
  let mostFrequent = [];

  Object.entries(frequencies).forEach(([vote, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mostFrequent = [vote];
    } else if (freq === maxFreq) {
      mostFrequent.push(vote);
    }
  });

  return { 
    mostFrequent, 
    maxVote: maxVote > -1 ? maxVote.toString() : null,
    frequencies
  };
};

const PokerRoom = () => {
  const socket = useSocket();
  const { user } = useAuth();
  
  const [roomState, setRoomState] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [activeReactions, setActiveReactions] = useState([]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_room', { roomId: MOCK_ROOM_ID, user });

    socket.on('room_state_update', (newState) => {
      setRoomState(newState);
      
      if (newState && newState.status === 'voting') {
        const me = newState.participants[socket.id];
        if (me && me.vote === null) {
          setMyVote(null);
        }
      }
    });

    socket.on('reaction_received', ({ socketId, reaction }) => {
      const id = Date.now() + Math.random();
      setActiveReactions(prev => [...prev, { id, socketId, reaction }]);
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    });

    return () => {
      socket.off('room_state_update');
      socket.off('reaction_received');
    };
  }, [socket, user]);

  const handleVote = (vote) => {
    if (roomState?.status !== 'voting') return;
    setMyVote(vote);
    socket.emit('vote', { roomId: MOCK_ROOM_ID, voteValue: vote });
  };

  const handleReveal = () => {
    socket.emit('reveal_votes', { roomId: MOCK_ROOM_ID });
  };

  const handleReset = () => {
    socket.emit('reset_room', { roomId: MOCK_ROOM_ID });
  };

  const handleSetFinalVote = (vote) => {
    socket.emit('set_final_vote', { roomId: MOCK_ROOM_ID, vote });
  };

  const handleSeatClick = (seatIndex) => {
    socket.emit('change_seat', { roomId: MOCK_ROOM_ID, seatIndex });
  };

  const handleSendReaction = (reaction) => {
    socket.emit('send_reaction', { roomId: MOCK_ROOM_ID, reaction });
  };

  const summary = useMemo(() => {
    if (!roomState || roomState.status !== 'revealed') return null;
    return calculateSummary(roomState.participants);
  }, [roomState]);

  if (!roomState) return <div className="page-container">Conectando à mesa...</div>;

  const participants = Object.values(roomState.participants);
  const isRevealed = roomState.status === 'revealed';
  const hasDivergence = summary?.mostFrequent.length > 1;

  return (
    <div className="page-container poker-room">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Planning Poker</h1>
          <p>
            Status: <strong>{isRevealed ? 'Votos Revelados' : 'Votação em Andamento'}</strong>
          </p>
        </div>
        
        {user.role === 'admin' && (
          <div className="facilitator-controls">
            {!isRevealed ? (
              <button className="btn-primary" style={{ background: 'var(--accent-secondary)' }} onClick={handleReveal}>
                Revelar Votos
              </button>
            ) : (
              <button className="btn-primary" onClick={handleReset}>
                Nova Rodada
              </button>
            )}
          </div>
        )}
      </header>

      <div className="poker-area">
        
        {/* Mesa Central */}
        <div className="virtual-table">
          {isRevealed && summary && (
            <div className="table-results animate-fade-in">
              {roomState.finalAgreedVote ? (
                 <div className="final-result">
                    <span>Acordo Final:</span>
                    <strong className="agreed-badge">{roomState.finalAgreedVote}</strong>
                 </div>
              ) : hasDivergence ? (
                <div className="divergence-alert">
                  <span className="divergence-text">Divergência detectada!</span>
                  {user.role === 'admin' ? (
                     <div className="facilitator-decision">
                       <span>Facilitador, defina o acordo:</span>
                       <div className="decision-buttons">
                         {summary.mostFrequent.map(v => (
                           <button key={v} onClick={() => handleSetFinalVote(v)} className="decision-btn">{v}</button>
                         ))}
                       </div>
                     </div>
                  ) : (
                     <span style={{fontSize:'0.9rem'}}>Aguardando decisão do facilitador...</span>
                  )}
                </div>
              ) : summary.mostFrequent.length === 1 ? (
                <div className="consensus-result">
                  <span>Resultado da Equipe:</span>
                  <strong className="consensus-badge">{summary.mostFrequent[0]}</strong>
                </div>
              ) : (
                <div className="consensus-result">
                  <span>Nenhum voto numérico</span>
                </div>
              )}
            </div>
          )}
          
          <div className="participants-ring">
            {[...Array(12)].map((_, i) => {
               const style = getParticipantStyle(i, 12);
               // Identify if there is a participant at this seat (comparing seatIndex)
               // Note: Object.entries to get socketId from keys
               const occupantEntry = Object.entries(roomState.participants).find(([sId, p]) => p.seatIndex === i);
               
               if (occupantEntry) {
                 const [socketId, p] = occupantEntry;
                 const isMaxVote = isRevealed && summary && p.vote === summary.maxVote;
                 const reactionsForThisParticipant = activeReactions.filter(r => r.socketId === socketId);
                 
                 return (
                  <div key={p.id} className="participant" style={style}>
                    {reactionsForThisParticipant.map(r => (
                      <span key={r.id} className="floating-reaction">{r.reaction}</span>
                    ))}
                    <div className="participant-card-slot">
                      {p.vote ? (
                        <div className={`poker-card ${isRevealed ? 'revealed' : 'hidden'} ${isMaxVote ? 'pulsating-high-vote' : ''} animate-fade-in`}>
                          {isRevealed ? p.vote : '✅'}
                        </div>
                      ) : (
                        <div className="poker-card empty">?</div>
                      )}
                    </div>
                    <img src={p.avatar} alt={p.name} className="avatar" />
                    <span className="participant-name">{p.name}</span>
                  </div>
                );
               } else {
                 return (
                   <div key={`empty-${i}`} className="participant-slot empty" style={style} onClick={() => handleSeatClick(i)}>
                     <span>Sentar</span>
                   </div>
                 );
               }
            })}
          </div>
        </div>

        {/* Minhas Cartas e Ações */}
        <div className="my-cards-section">
          
          <div className="reaction-panel">
            {!isRevealed ? (
              <>
                <button className="reaction-btn" title="Pensando" onClick={() => handleSendReaction('🤔')}>🤔</button>
                <button className="reaction-btn" title="Não sei" onClick={() => handleSendReaction('🤷')}>🤷</button>
                <button className="reaction-btn" title="Suando Frio" onClick={() => handleSendReaction('😅')}>😅</button>
              </>
            ) : (
              <>
                <button className="reaction-btn" title="Comemorar" onClick={() => handleSendReaction('🎉')}>🎉</button>
                <button className="reaction-btn" title="Chorando" onClick={() => handleSendReaction('😭')}>😭</button>
                <button className="reaction-btn" title="Reclamar (Alto!)" onClick={() => handleSendReaction('😡')}>😡</button>
              </>
            )}
          </div>

          <h4>Escolha sua estimativa:</h4>
          <div className="cards-deck">
            {['1', '2', '3', '5', '8', '13', '21', '?', '☕'].map((card) => (
              <button 
                key={card} 
                className={`glass-card poker-card-btn ${myVote === card ? 'selected' : ''}`}
                onClick={() => handleVote(card)}
                disabled={isRevealed}
              >
                {card}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper for circular positioning around the table
function getParticipantStyle(index, total) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 180; // Distance from center
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  
  return {
    transform: `translate(${x}px, ${y}px)`
  };
}

export default PokerRoom;
