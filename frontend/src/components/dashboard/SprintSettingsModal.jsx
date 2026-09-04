import React, { useState, useEffect } from 'react';
import { updateSprint, createSprint, getAllSprints, activateSprint, deleteSprint } from '../../services/sprintService';
import { Trash2, CheckCircle, RefreshCw, X, Save, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import './SprintSettingsModal.css';

const SprintSettingsModal = ({ sprint, onClose, onUpdate }) => {
  const [mode, setMode] = useState('edit'); // 'edit', 'new', 'history'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // History State
  const [historySprints, setHistorySprints] = useState([]);

  // Helper para formatar data pro input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Edit State
  const [editName, setEditName] = useState(sprint?.name || '');
  const [theme, setTheme] = useState(sprint?.theme || '');
  
  // themeResponsible agora pode ser um objeto { name, avatar } ou string (antigo)
  const initialResponsibleName = typeof sprint?.themeResponsible === 'string' 
    ? sprint.themeResponsible 
    : sprint?.themeResponsible?.name || '';
  
  const [responsibleName, setResponsibleName] = useState(initialResponsibleName);
  const [startDate, setStartDate] = useState(formatDateForInput(sprint?.startDate));
  const [endDate, setEndDate] = useState(formatDateForInput(sprint?.endDate));
  const [backgroundImage, setBackgroundImage] = useState(sprint?.backgroundImage || '');
  const [isDragging, setIsDragging] = useState(false);

  // New State
  const [newName, setNewName] = useState(`Sprint #${parseInt((sprint?.name || '').replace(/\\D/g, '')) + 1 || ''}`);

  useEffect(() => {
    if (mode === 'history') {
      loadHistory();
    }
  }, [mode]);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem não pode ter mais de 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setBackgroundImage(event.target.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (mode !== 'edit') return;
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
  }, [mode]);

  const handleImageUpload = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  const handleRemoveImage = () => setBackgroundImage('');

  const loadHistory = async () => {
    try {
      const data = await getAllSprints();
      setHistorySprints(data);
    } catch (err) {
      setError('Erro ao carregar o histórico de Sprints.');
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    setError(null);
    try {
      let finalResponsible = null;
      if (responsibleName.trim()) {
        const isSameName = responsibleName.trim() === initialResponsibleName.trim();
        const avatarToUse = isSameName && sprint?.themeResponsible?.avatar 
          ? sprint.themeResponsible.avatar 
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${responsibleName.trim()}`;
          
        finalResponsible = {
          name: responsibleName.trim(),
          avatar: avatarToUse
        };
      }

      const data = { 
        name: editName,
        theme, 
        themeResponsible: finalResponsible,
        startDate,
        endDate,
        backgroundImage
      };
      const updated = await updateSprint(sprint._id, data);
      onUpdate(updated);
      onClose();
    } catch (err) {
      setError('Erro ao atualizar a sprint.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = { 
        name: newName,
        theme: 'Sem Tema', // Novo tema começa limpo
      };
      const created = await createSprint(data);
      onUpdate(created);
      onClose();
    } catch (err) {
      setError('Erro ao criar a nova sprint.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const activated = await activateSprint(id);
      onUpdate(activated);
      onClose();
    } catch (err) {
      setError('Erro ao ativar sprint.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta sprint? Esta ação não pode ser desfeita.')) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteSprint(id);
      
      // Se deletou a atual, é melhor apenas pedir pro dashboard recarregar
      if (sprint._id === id) {
        onUpdate(null); // isso pode acionar um reload no dashboard, ou podemos só recarregar a tela
        window.location.reload();
      } else {
        loadHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao excluir sprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="glass-panel sprint-modal settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Configurações da Sprint</h3>
          <button className="btn-icon" onClick={onClose}><X size={24}/></button>
        </div>
        
        <div className="modal-body">
          <div className="sprint-modal-tabs">
            <button className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>Editar Atual</button>
            <button className={mode === 'history' ? 'active' : ''} onClick={() => setMode('history')}>Histórico</button>
            <button className={mode === 'new' ? 'active danger' : ''} onClick={() => setMode('new')}>Nova Sprint</button>
          </div>

          {error && <div className="error-message">{error}</div>}

        {mode === 'edit' && (
          <div className="sprint-modal-content">
            <div className="form-group">
              <label>Nome da Sprint</label>
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Data de Início</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Data de Fim</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tema da Sprint</label>
              <input 
                type="text" 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                placeholder="Ex: A Vingança dos Bugs"
              />
            </div>
            <div className="form-group">
              <label>Responsável pelo Tema</label>
              <input 
                type="text" 
                value={responsibleName} 
                onChange={(e) => setResponsibleName(e.target.value)} 
                placeholder="Nome do Responsável"
              />
            </div>
            
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Plano de Fundo do Tema (Imagem)</label>
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
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <ImageIcon size={32} />
                    <span>Arraste uma imagem, cole (Ctrl+V) ou escolha abaixo</span>
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Upload size={16} /> Fazer Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer" style={{ padding: '16px 0 0 0', marginTop: '8px' }}>
              <button className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={loading}>
                <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}

        {mode === 'new' && (
          <div className="sprint-modal-content">
            <div className="warning-box">
              <strong>Atenção!</strong> Ao criar uma nova Sprint, a Sprint atual será encerrada.
              Novos quadros vazios de Retrospectiva e Kudos serão gerados.
            </div>
            <div className="form-group">
              <label>Nome da Nova Sprint</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Ex: Sprint #43"
              />
            </div>
            
            <div className="modal-footer" style={{ padding: '16px 0 0 0', marginTop: '8px' }}>
              <button className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button className="btn-primary danger" onClick={handleCreateNew} disabled={loading}>
                <Plus size={18} /> {loading ? 'Criando...' : 'Iniciar Nova Sprint'}
              </button>
            </div>
          </div>
        )}

        {mode === 'history' && (
          <div className="sprint-modal-content history-list">
            {historySprints.length === 0 ? (
              <p>Nenhuma sprint encontrada.</p>
            ) : (
              historySprints.map(s => (
                <div key={s._id} className={`history-item ${s.isActive ? 'active-sprint' : ''}`}>
                  <div className="history-info">
                    <h4>{s.name}</h4>
                    <span className={`status-badge ${s.isActive ? 'active' : ''}`}>
                      {s.isActive ? 'Em Andamento' : 'Encerrada'}
                    </span>
                  </div>
                  <div className="history-actions">
                    {!s.isActive && (
                      <button 
                        className="btn-icon" 
                        onClick={() => handleActivate(s._id)} 
                        title="Reativar Sprint"
                        disabled={loading}
                      >
                        <RefreshCw size={18} /> Reativar
                      </button>
                    )}
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDelete(s._id)} 
                      title="Excluir Sprint"
                      disabled={loading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SprintSettingsModal;
