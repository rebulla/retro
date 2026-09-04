import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Type, AlignLeft, Trash2, Upload } from 'lucide-react';
import { updateRetrospectiveTheme } from '../../services/retroService';

const RetroSettingsModal = ({ isOpen, onClose, retro, onSaved }) => {
  const [title, setTitle] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (retro && isOpen) {
      setTitle(retro.title || '');
      setBackgroundImage(retro.backgroundImage || '');
      // Deep copy columns so we can edit locally
      setColumns(JSON.parse(JSON.stringify(retro.columns || [])));
    }
  }, [retro, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const items = e.clipboardData?.items;
        let hasImage = false;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) hasImage = true;
          }
        }
        if (!hasImage) return; 
      }

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          handleFile(file);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const checkChanges = () => {
    if (!retro) return false;
    if (title !== (retro.title || '')) return true;
    if (backgroundImage !== (retro.backgroundImage || '')) return true;
    if (JSON.stringify(columns) !== JSON.stringify(retro.columns || [])) return true;
    return false;
  };

  const handleClose = () => {
    if (checkChanges()) {
      if (!window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?")) {
        return;
      }
    }
    onClose();
  };

  const handleColumnChange = (index, field, value) => {
    const newCols = [...columns];
    newCols[index][field] = value;
    setColumns(newCols);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackgroundImage(reader.result);
      setUploadingImage(false);
    };
    reader.onerror = (err) => {
      console.error("Erro ao ler arquivo da imagem local", err);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleRemoveImage = () => {
    setBackgroundImage('');
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateRetrospectiveTheme(retro._id, {
        title,
        backgroundImage,
        columns
      });
      onSaved(updated);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel settings-modal animate-fade-in" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>Personalizar Retrospectiva</h3>
          <button className="close-btn" onClick={handleClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label><Type size={16} style={{display:'inline', verticalAlign:'middle'}}/> Título do Board</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Retrospectiva Peaky Blinders"
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

          <h4 style={{ marginTop: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Colunas</h4>
          
          {columns.map((col, index) => (
            <div key={col._id || index} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Título da Coluna</label>
                  <input 
                    type="text" 
                    value={col.name} 
                    onChange={(e) => handleColumnChange(index, 'name', e.target.value)} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label><AlignLeft size={16} style={{display:'inline', verticalAlign:'middle'}}/> Texto de Introdução (Opcional)</label>
                <textarea 
                  value={col.description || ''} 
                  onChange={(e) => handleColumnChange(index, 'description', e.target.value)} 
                  placeholder="Ex: Planejamento certeiro, entregas pontuais..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
            </div>
          ))}

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Tema'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetroSettingsModal;
