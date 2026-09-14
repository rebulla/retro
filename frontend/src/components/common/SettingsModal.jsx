import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Save, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUserName } = useAuth();
  const { soundEnabled, updateSoundEnabled, volume, updateVolume } = useSettings();
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);
  const [localVolume, setLocalVolume] = useState(volume);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sincronizar estado inicial
  useEffect(() => {
    if (user) setName(user.name || '');
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    setLocalSoundEnabled(soundEnabled);
    setLocalVolume(volume);
  }, [user, isOpen, soundEnabled, volume]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      // Atualizar tema no HTML
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      updateSoundEnabled(localSoundEnabled);
      updateVolume(localVolume);
      
      // Atualizar nome no Firebase/Convidado
      if (name.trim() !== user.name) {
        await updateUserName(name.trim());
      }
      
      setSuccessMsg('Configurações salvas!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel settings-modal animate-fade-in">
        <div className="modal-header">
          <h3>Configurações</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Seu Apelido</label>
            <input 
              type="text" 
              className="input-field"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Como quer ser chamado?"
            />
          </div>

          <div className="form-group">
            <label>Tema da Interface</label>
            <div className="theme-options">
              <button 
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={20} /> Claro
              </button>
              <button 
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={20} /> Escuro
              </button>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Efeitos Sonoros (Sons do Sistema)</label>
            <div className="theme-options">
              <button 
                className={`theme-btn ${localSoundEnabled ? 'active' : ''}`}
                onClick={() => setLocalSoundEnabled(true)}
              >
                <Volume2 size={20} /> Ativado
              </button>
              <button 
                className={`theme-btn ${!localSoundEnabled ? 'active' : ''}`}
                onClick={() => setLocalSoundEnabled(false)}
              >
                <VolumeX size={20} /> Desativado
              </button>
            </div>
          </div>

          {localSoundEnabled && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Volume dos Sons</span>
                <span>{localVolume}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={localVolume} 
                onChange={(e) => setLocalVolume(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', marginTop: '8px' }}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          {successMsg && <span className="success-msg">{successMsg}</span>}
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
