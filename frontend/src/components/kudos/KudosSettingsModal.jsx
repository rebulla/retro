import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
import * as kudosService from '../../services/kudosService';

const KudosSettingsModal = ({ isOpen, onClose, board, onSaved }) => {
  const [title, setTitle] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (board) {
      setTitle(board.title || '');
      setIntroduction(board.introduction || '');
      setBackgroundImage(board.backgroundImage || '');
      setHasChanges(false);
    }
  }, [board, isOpen]);


  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const handleIntroductionChange = (e) => {
    setIntroduction(e.target.value);
    setHasChanges(true);
  };

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem não pode ter mais de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target.result);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (!isOpen) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          processFile(file);
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleImageUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setBackgroundImage('');
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await kudosService.updateKudosBoardTheme(board._id, {
        title,
        introduction,
        backgroundImage
      });
      onSaved(updated);
      setHasChanges(false);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?")) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="settings-modal glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Configurações do Mural</h2>
          <button className="close-btn" onClick={handleClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          <div className="form-group">
            <label>Título do Mural</label>
            <input 
              type="text" 
              className="input-field" 
              value={title} 
              onChange={handleTitleChange}
              placeholder="Ex: Mural de Kudos - Sprint 12"
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Texto de Introdução</label>
            <textarea 
              className="input-field" 
              value={introduction} 
              onChange={handleIntroductionChange}
              rows={3}
              placeholder="Ex: Reconheça o esforço do time..."
            />
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label>Plano de Fundo (Imagem)</label>
            <div 
              className="image-upload-area" 
              style={{ 
                border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color)'}`, 
                borderRadius: '8px', 
                padding: '16px', 
                textAlign: 'center', 
                marginTop: '8px',
                backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {backgroundImage ? (
                <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                  <img src={backgroundImage} alt="Background" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                  <button 
                    onClick={handleRemoveImage}
                    title="Remover Imagem"
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(4px)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <ImageIcon size={32} />
                  <span>Arraste uma imagem, cole (Ctrl+V) ou escolha abaixo</span>
                  <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={16} /> Fazer Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading || !hasChanges}>
            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KudosSettingsModal;
