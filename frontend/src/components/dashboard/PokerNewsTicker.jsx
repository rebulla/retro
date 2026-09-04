import React, { useState, useEffect } from 'react';
import './DashboardComponents.css';
import { useSocket } from '../../contexts/SocketContext';

const FAKE_NEWS = [
  "Você sabia que estimaram um item fácil com 13 pontos? 🚀",
  "Alguém tentou votar com 'Café' em uma tarefa de 2 minutos! ☕",
  "A divergência da última rodada foi histórica: de 1 a 21 pontos! 😅",
  "O facilitador teve que intervir: não podemos colocar 100 pontos. 🙅",
  "Dizem que o Planning Poker está mais acirrado que final de campeonato. 🏆"
];

const PokerNewsTicker = () => {
  const socket = useSocket();
  const [news, setNews] = useState(FAKE_NEWS[0]);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomNews = FAKE_NEWS[Math.floor(Math.random() * FAKE_NEWS.length)];
      setNews(randomNews);
    }, 15000); // Change news every 15s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for ticker reactions
    socket.on('ticker_reaction', (reaction) => {
      const id = Date.now() + Math.random();
      setReactions(prev => [...prev, { id, emoji: reaction }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    });

    return () => {
      socket.off('ticker_reaction');
    };
  }, [socket]);

  const handleReact = (emoji) => {
    if (socket) {
      socket.emit('send_ticker_reaction', emoji);
    }
  };

  return (
    <div className="poker-ticker-container">
      <div className="ticker-label">BREAKING NEWS</div>
      <div className="ticker-content">
        <p className="ticker-text">{news}</p>
      </div>
      <div className="ticker-reactions-actions">
        <button onClick={() => handleReact('😂')}>😂</button>
        <button onClick={() => handleReact('😱')}>😱</button>
        <button onClick={() => handleReact('🔥')}>🔥</button>
      </div>
      
      {/* Floating Reactions overlay */}
      <div className="ticker-floating-zone">
        {reactions.map(r => (
          <span key={r.id} className="floating-reaction ticker-reaction" style={{ left: `${Math.random() * 80 + 10}%` }}>
            {r.emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PokerNewsTicker;
