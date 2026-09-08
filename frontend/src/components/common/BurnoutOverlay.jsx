import React, { useState, useEffect } from 'react';
import './BurnoutOverlay.css';

const BurnoutOverlay = () => {
  const [isActive, setIsActive] = useState(false);
  const [flames, setFlames] = useState([]);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    const handleTrigger = () => {
      if (isActive) return;
      setIsActive(true);
      setIsResolved(false);
      
      // Generate 15 random flames
      const newFlames = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        top: Math.random() * 70 + 15, // 15% to 85%
        left: Math.random() * 70 + 15,
        scale: Math.random() * 0.5 + 0.8
      }));
      setFlames(newFlames);
    };

    window.addEventListener('trigger-burnout', handleTrigger);
    return () => window.removeEventListener('trigger-burnout', handleTrigger);
  }, [isActive]);

  const extinguishFlame = (id) => {
    try {
      const audio = new Audio('/sounds/fire-whooshing.mp3');
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    } catch (e) {
      console.log('Error playing audio', e);
    }

    setFlames(prev => {
      const remaining = prev.filter(f => f.id !== id);
      if (remaining.length === 0 && isActive) {
        handleSuccess();
      }
      return remaining;
    });
  };

  const handleSuccess = () => {
    setIsResolved(true);
    
    // Play fine.mp3
    try {
      const audio = new Audio('/sounds/fine.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    } catch (e) {
      console.log('Error playing audio', e);
    }

    // Reset after 4 seconds
    setTimeout(() => {
      setIsActive(false);
      setIsResolved(false);
    }, 4500);
  };

  if (!isActive) return null;

  return (
    <div className={`burnout-overlay ${isResolved ? 'resolved' : ''}`}>
      {!isResolved && (
        <div className="flames-container">
          {flames.map(flame => (
            <div
              key={flame.id}
              className="flame"
              style={{
                top: `${flame.top}%`,
                left: `${flame.left}%`,
                transform: `scale(${flame.scale})`
              }}
              onMouseEnter={() => extinguishFlame(flame.id)}
              onTouchStart={(e) => {
                e.preventDefault();
                extinguishFlame(flame.id);
              }}
            >
              🔥
            </div>
          ))}
        </div>
      )}

      {isResolved && (
        <div className="fine-modal animate-fade-in">
          <img src="/img/this_is_fine.gif" alt="This is fine" />
          <h2 style={{ color: 'white', marginTop: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Burnout evitado! 😅</h2>
        </div>
      )}
    </div>
  );
};

export default BurnoutOverlay;
