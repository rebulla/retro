import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Music, Play, Pause, Settings, Check } from 'lucide-react';
import './RetroRadio.css';

const extractYouTubeId = (url) => {
  if (!url) return null;
  
  // Handle Playlist
  const listMatch = url.match(/[?&]list=([^#\&\?]*)/);
  if (listMatch && listMatch[1]) {
    return { type: 'playlist', id: listMatch[1] };
  }
  
  // Handle Video
  const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (videoMatch && videoMatch[1]) {
    return { type: 'video', id: videoMatch[1] };
  }
  
  return null;
};

const RetroRadio = ({ retroId }) => {
  const socket = useSocket();
  const { user } = useAuth();
  
  const [radioState, setRadioState] = useState({
    url: '',
    isPlaying: false,
    timestamp: 0,
    timeAtUpdate: Date.now()
  });
  
  const [localUrl, setLocalUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'scrum_master';

  useEffect(() => {
    if (!socket || !retroId) return;
    
    const handleRadioState = (newState) => {
      setRadioState(newState);
      
      if (!playerRef.current) return;
      
      const player = playerRef.current;
      if (!player) return;

      try {
        if (newState.isPlaying) {
          // Calculate estimated timestamp
          const elapsed = (Date.now() - newState.timeAtUpdate) / 1000;
          const targetTime = newState.timestamp + elapsed;
          
          player.seekTo(targetTime, true);
          player.playVideo();
        } else {
          player.pauseVideo();
          player.seekTo(newState.timestamp, true);
        }
      } catch (e) {
        console.warn('Error syncing player', e);
      }
    };

    socket.on('radio_state', handleRadioState);

    return () => {
      socket.off('radio_state', handleRadioState);
    };
  }, [socket, retroId]);

  const handleReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    
    // If state already implies playing, seek and play
    if (radioState.isPlaying) {
      const elapsed = (Date.now() - radioState.timeAtUpdate) / 1000;
      event.target.seekTo(radioState.timestamp + elapsed, true);
      event.target.playVideo();
    } else {
      event.target.seekTo(radioState.timestamp, true);
    }
  };

  const handleUpdateRadio = async (isPlaying) => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    
    let currentTime = 0;
    try {
      currentTime = await player.getCurrentTime();
    } catch (e) {
      console.warn('Could not get current time');
    }
    
    const newState = {
      url: radioState.url,
      isPlaying,
      timestamp: currentTime,
      timeAtUpdate: Date.now()
    };
    
    setRadioState(newState);
    socket.emit('radio_update', { retroId, state: newState });
    
    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  };

  const handleSetUrl = () => {
    if (!localUrl.trim()) return;
    const newState = {
      url: localUrl,
      isPlaying: false,
      timestamp: 0,
      timeAtUpdate: Date.now()
    };
    setRadioState(newState);
    socket.emit('radio_update', { retroId, state: newState });
    setShowSettings(false);
  };

  const ytInfo = extractYouTubeId(radioState.url);
  
  const opts = {
    height: '100',
    width: '200',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      rel: 0,
      modestbranding: 1,
      ...(ytInfo?.type === 'playlist' ? { listType: 'playlist', list: ytInfo.id } : {})
    },
  };

  return (
    <div className="retro-radio-container">
      {(isAdmin || radioState.url) && (
        <div className="retro-radio-card glass-panel">
          <div className="radio-header">
            <div className="radio-title">
              <Music size={20} className={radioState.isPlaying ? 'animate-pulse' : ''} />
              <span>Rádio da Squad</span>
            </div>
            {isAdmin && (
              <button 
                className="radio-btn radio-btn-small" 
                onClick={() => setShowSettings(!showSettings)}
                title="Configurar Rádio"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
          
          {showSettings && isAdmin && (
            <div className="radio-settings">
              <div className="radio-input-group">
                <input
                  type="text"
                  placeholder="URL do Youtube"
                  className="radio-input"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                />
                <button className="btn-primary" onClick={handleSetUrl} style={{ padding: '8px' }}>
                  <Check size={16} />
                </button>
              </div>
            </div>
          )}

          {radioState.url && isAdmin && playerReady && (
            <div className="radio-controls">
              {radioState.isPlaying ? (
                <button className="radio-btn" onClick={() => handleUpdateRadio(false)}>
                  <Pause size={24} fill="currentColor" />
                </button>
              ) : (
                <button className="radio-btn" onClick={() => handleUpdateRadio(true)}>
                  <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                </button>
              )}
            </div>
          )}
          
          {radioState.url && !isAdmin && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
              {radioState.isPlaying ? 'Música tocando...' : 'Rádio pausada'}
            </div>
          )}
        </div>
      )}

      {/* Hidden YouTube Player */}
      {ytInfo && (
        <div className="youtube-player-hidden">
          <YouTube 
            videoId={ytInfo.type === 'video' ? ytInfo.id : undefined}
            opts={opts}
            onReady={handleReady}
            onStateChange={(e) => {
              // Automatically sync pausing if it happens outside React controls
              if (isAdmin && e.data === YouTube.PlayerState.PAUSED && radioState.isPlaying) {
                 handleUpdateRadio(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RetroRadio;
