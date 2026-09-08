import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './PokerRoom.css';

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

const playReactionSound = (reactionType) => {
  try {
    let audioSrc = '';
    
    switch (reactionType) {
      case '🎉':
        audioSrc = '/sounds/confetti.mp3';
        break;
      case '🔥':
        audioSrc = '/sounds/fire.mp3';
        break;
      case '❤️':
        audioSrc = '/sounds/heart.mp3';
        break;
      case '👍':
        audioSrc = '/sounds/thumbsup.mp3';
        break;
      case '☕':
        audioSrc = '/sounds/coffee.mp3';
        break;
      case '😡':
        audioSrc = '/sounds/complain.mp3';
        break;
      case '😭':
        audioSrc = '/sounds/cry.mp3';
        break;
      case '🤔':
        audioSrc = '/sounds/think.mp3';
        break;
      case '🤷':
        audioSrc = '/sounds/shrug.mp3';
        break;
      case '😅':
        audioSrc = '/sounds/sweat.mp3';
        break;
      default:
        audioSrc = '/sounds/generic.mp3';
        break;
    }

    const audio = new Audio(audioSrc);
    audio.volume = 0.5; // Ajuste o volume se necessário
    audio.play().catch(e => console.log('Audio autoplay blocked', e));
  } catch (e) {
    console.log('Error playing audio', e);
  }
};

const PokerRoom = () => {
  const socket = useSocket();
  const { user, activeSquad } = useAuth();
  
  const roomId = activeSquad ? `poker_${activeSquad._id}` : null;
  
  const [roomState, setRoomState] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [activeReactions, setActiveReactions] = useState([]);
  
  // Guest state
  const [activeRooms, setActiveRooms] = useState([]);
  const [guestRoomId, setGuestRoomId] = useState(null);
  const [guestStatus, setGuestStatus] = useState('lobby'); // lobby, requesting, approved, denied
  
  // Host state
  const [joinRequests, setJoinRequests] = useState([]);

  useEffect(() => {
    if (!socket || !user) return;

    if (user.role === 'guest') {
      socket.emit('get_active_rooms');
      socket.on('active_rooms_list', (rooms) => {
        setActiveRooms(rooms);
      });
      
      socket.on('guest_approved', ({ roomId: approvedRoomId }) => {
        setGuestStatus('approved');
        socket.emit('join_room', { roomId: approvedRoomId, user });
      });
      
      socket.on('guest_denied', () => {
        setGuestStatus('denied');
        alert("Seu pedido para entrar foi recusado.");
      });
    } else if (roomId) {
      socket.emit('join_room', { roomId, user: { ...user, squadName: activeSquad?.name } });
    }

    socket.on('room_state_update', (newState) => {
      setRoomState(newState);
      
      if (newState && newState.status === 'voting') {
        const me = newState.participants[socket.id];
        if (me && me.vote === null) {
          setMyVote(null);
        }
      }
    });

    socket.on('guest_join_request', ({ guestId, guestName, roomId: reqRoomId }) => {
      // Only host/admin of the room sees this
      if (user.role !== 'guest' && reqRoomId === roomId) {
        setJoinRequests(prev => [...prev, { guestId, guestName, reqRoomId }]);
      }
    });

    socket.on('reaction_received', ({ socketId, reaction }) => {
      const id = Date.now() + Math.random();
      playReactionSound(reaction);
      setActiveReactions(prev => [...prev, { id, socketId, reaction }]);
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    });

    return () => {
      if (roomId) {
        socket.emit('leave_room', { roomId });
      } else if (guestRoomId) {
        socket.emit('leave_room', { roomId: guestRoomId });
      }
      socket.off('active_rooms_list');
      socket.off('guest_approved');
      socket.off('guest_denied');
      socket.off('room_state_update');
      socket.off('guest_join_request');
      socket.off('reaction_received');
    };
  }, [socket, user, roomId, activeSquad]);

  const getCurrentRoomId = () => {
    return user.role === 'guest' ? guestRoomId : roomId;
  };

  const [coffeeClickCount, setCoffeeClickCount] = useState(0);
  const [lastCoffeeClick, setLastCoffeeClick] = useState(0);

  const handleVote = (vote) => {
    if (roomState?.status !== 'voting') return;
    
    // Coffee Easter Egg Logic
    if (vote === '☕') {
      const now = Date.now();
      if (now - lastCoffeeClick < 800) {
        const newCount = coffeeClickCount + 1;
        setCoffeeClickCount(newCount);
        if (newCount === 5) {
          // Trigger Easter Egg
          document.body.classList.add('caffeine-shake');
          setTimeout(() => document.body.classList.remove('caffeine-shake'), 3000);
          socket.emit('send_reaction', { roomId: getCurrentRoomId(), reaction: '☕' });
          setCoffeeClickCount(0); // reset
        }
      } else {
        setCoffeeClickCount(1);
      }
      setLastCoffeeClick(now);
    } else {
      setCoffeeClickCount(0);
    }

    setMyVote(vote);
    socket.emit('vote', { roomId: getCurrentRoomId(), voteValue: vote });
  };

  const handleReveal = () => {
    socket.emit('reveal_votes', { roomId: getCurrentRoomId() });
  };

  const handleReset = () => {
    socket.emit('reset_room', { roomId: getCurrentRoomId() });
  };

  const handleSetFinalVote = (vote) => {
    socket.emit('set_final_vote', { roomId: getCurrentRoomId(), vote });
  };

  const handleSeatClick = (seatIndex) => {
    socket.emit('change_seat', { roomId: getCurrentRoomId(), seatIndex });
  };

  const handleSendReaction = (reaction) => {
    socket.emit('send_reaction', { roomId: getCurrentRoomId(), reaction });
  };

  const handleRequestJoin = (rId) => {
    setGuestRoomId(rId);
    setGuestStatus('requesting');
    socket.emit('request_join', { roomId: rId, guestName: user.name });
  };

  const approveGuest = (req) => {
    socket.emit('approve_guest', { guestId: req.guestId, roomId: req.reqRoomId });
    setJoinRequests(prev => prev.filter(r => r.guestId !== req.guestId));
  };

  const denyGuest = (req) => {
    socket.emit('deny_guest', { guestId: req.guestId, roomId: req.reqRoomId });
    setJoinRequests(prev => prev.filter(r => r.guestId !== req.guestId));
  };

  const summary = useMemo(() => {
    if (!roomState || roomState.status !== 'revealed') return null;
    return calculateSummary(roomState.participants);
  }, [roomState]);

  if (user.role === 'guest' && guestStatus !== 'approved') {
    return (
      <div className="page-container poker-lobby">
        <h2>Salas Ativas de Planning Poker</h2>
        {guestStatus === 'requesting' ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Aguardando aprovação do anfitrião...</p>
            <div className="spinner" style={{ margin: '1rem auto' }}></div>
          </div>
        ) : (
          <div className="active-rooms-list">
            {activeRooms.length === 0 ? (
              <p>Nenhuma sala ativa no momento.</p>
            ) : (
              activeRooms.map(r => (
                <div key={r.id} className="room-card glass-panel" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{r.squadName}</h3>
                    <p>{r.participantCount} participantes</p>
                  </div>
                  <button className="btn-primary" onClick={() => handleRequestJoin(r.id)}>Solicitar Entrada</button>
                </div>
              ))
            )}
            <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => socket.emit('get_active_rooms')}>Atualizar Lista</button>
          </div>
        )}
      </div>
    );
  }

  if (!roomState) return <div className="page-container">Conectando à mesa...</div>;

  const participants = Object.values(roomState.participants);
  const isRevealed = roomState.status === 'revealed';
  const hasDivergence = summary?.mostFrequent.length > 1;

  return (
    <div className="page-container poker-room">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Planning Poker {activeSquad && `- ${activeSquad.name}`}</h1>
          <p>
            Status: <strong>{isRevealed ? 'Votos Revelados' : 'Votação em Andamento'}</strong>
          </p>
        </div>
        
        {user.role !== 'guest' && (
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

      {joinRequests.length > 0 && (
        <div className="join-requests glass-panel" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <h3 style={{ color: '#ffc107', marginTop: 0 }}>Pedidos de Entrada</h3>
          {joinRequests.map(req => (
            <div key={req.guestId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span><strong>{req.guestName}</strong> deseja entrar na sala.</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" onClick={() => approveGuest(req)}>Aprovar</button>
                <button className="btn-secondary" onClick={() => denyGuest(req)}>Recusar</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
