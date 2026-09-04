import React, { useState, useEffect } from 'react';
import { Settings2, PlusCircle, ChevronLeft, ChevronRight, ChevronsRight, Trash2, Copy, PauseCircle } from 'lucide-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import RetroColumn from '../components/retro/RetroColumn';
import RetroSettingsModal from '../components/retro/RetroSettingsModal';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import * as retroService from '../services/retroService';
import './RetroBoard.css';

const RetroBoard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [retros, setRetros] = useState([]);
  const [currentRetro, setCurrentRetro] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchRetros();
  }, []);

  useEffect(() => {
    if (!socket || !currentRetro) return;

    socket.emit('join_retro', currentRetro._id);

    const handleRetroUpdated = (updatedRetro) => {
      // Update local state without losing focus or UI state heavily
      if (updatedRetro._id === currentRetro._id) {
        setCurrentRetro(updatedRetro);
        setRetros(prev => prev.map(r => r._id === updatedRetro._id ? updatedRetro : r));
      }
    };

    socket.on('retro_updated', handleRetroUpdated);

    return () => {
      socket.emit('leave_retro', currentRetro._id);
      socket.off('retro_updated', handleRetroUpdated);
    };
  }, [socket, currentRetro?._id]);

  const fetchRetros = async () => {
    try {
      setLoading(true);
      const data = await retroService.getRetrospectives();
      setRetros(data);
      if (data.length > 0) {
        setCurrentRetro(data[0]);
      } else {
        // Create initial if none exists
        const newRetro = await retroService.createRetrospective({ title: 'Retrospectiva Inicial' });
        setRetros([newRetro]);
        setCurrentRetro(newRetro);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetroSelect = async (e) => {
    const id = e.target.value;
    if (id === 'new') {
      const newRetro = await retroService.createRetrospective({ title: 'Nova Retrospectiva' });
      setRetros([newRetro, ...retros]);
      setCurrentRetro(newRetro);
    } else {
      const selected = retros.find(r => r._id === id);
      setCurrentRetro(selected);
    }
  };

  const handleAddCard = async (columnId, text) => {
    try {
      const newCard = await retroService.addCard(currentRetro._id, { columnId, text });
      setCurrentRetro(prev => {
        if (prev.cards.some(c => c._id === newCard._id)) return prev;
        return {
          ...prev,
          cards: [...prev.cards, newCard]
        };
      });
    } catch (err) {
      console.error('Erro ao adicionar card:', err);
    }
  };

  const handleVoteCard = async (cardId) => {
    try {
      if (!user) return;
      const updatedCard = await retroService.toggleVote(currentRetro._id, cardId, user);
      setCurrentRetro(prev => ({
        ...prev,
        cards: prev.cards.map(c => c._id === cardId ? updatedCard : c)
      }));
    } catch (err) {
      console.error('Erro ao votar:', err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await retroService.deleteCard(currentRetro._id, cardId);
      setCurrentRetro(prev => ({
        ...prev,
        cards: prev.cards.filter(c => c._id !== cardId)
      }));
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleEditCard = async (cardId, newText) => {
    try {
      const updatedCard = await retroService.updateCard(currentRetro._id, cardId, { text: newText });
      // Optimistic update, although socket will sync too
      setCurrentRetro(prev => ({
        ...prev,
        cards: prev.cards.map(c => c._id === cardId ? updatedCard : c)
      }));
    } catch (err) {
      console.error('Erro ao editar:', err);
    }
  };

  const handleDeleteRetro = async () => {
    if (currentRetro.cards && currentRetro.cards.length > 0) {
      alert("Não é possível excluir um board que possui cards.");
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir esta retrospectiva?")) {
      try {
        await retroService.deleteRetrospective(currentRetro._id);
        const newRetros = retros.filter(r => r._id !== currentRetro._id);
        setRetros(newRetros);
        if (newRetros.length > 0) {
          setCurrentRetro(newRetros[0]);
        } else {
          const newRetro = await retroService.createRetrospective({ title: 'Retrospectiva Inicial' });
          setRetros([newRetro]);
          setCurrentRetro(newRetro);
        }
      } catch (err) {
        console.error("Erro ao excluir retrospectiva:", err);
      }
    }
  };

  const updateRetroStatus = async (status) => {
    try {
      const updated = await retroService.updateRetrospectiveTheme(currentRetro._id, { status });
      setCurrentRetro(updated);
      setRetros(retros.map(r => r._id === updated._id ? updated : r));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleExportMarkdown = async () => {
    if (!currentRetro) return;
    
    let md = `# ${currentRetro.title}\n`;
    md += `**Data da Exportação:** ${new Date().toLocaleDateString()}\n\n`;

    currentRetro.columns.forEach(col => {
      md += `## ${col.name}\n`;
      const colCards = currentRetro.cards.filter(c => c.columnId === col._id);
      
      const sortedCards = [...colCards].sort((a, b) => {
        const votesA = a.voters?.length ?? a.votes ?? 0;
        const votesB = b.voters?.length ?? b.votes ?? 0;
        return votesB - votesA;
      });

      if (sortedCards.length === 0) {
        md += `- *(Nenhum item)*\n`;
      } else {
        sortedCards.forEach(card => {
          const votes = card.voters?.length ?? card.votes ?? 0;
          md += `- ${card.text} (👍 ${votes})\n`;
        });
      }
      md += `\n`;
    });

    try {
      await navigator.clipboard.writeText(md);
      alert('Markdown copiado para a área de transferência com sucesso!');
    } catch (err) {
      console.error('Falha ao copiar:', err);
      alert('Não foi possível copiar para a área de transferência.');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find card
    const activeCard = currentRetro.cards.find(c => c._id === activeId);
    if (!activeCard) return;

    // Determine target column
    // `over` can be a column (over.id === column._id) or another card (over.id === card._id)
    let targetColumnId = null;
    const overColumn = currentRetro.columns.find(col => col._id === overId);
    
    if (overColumn) {
      targetColumnId = overColumn._id;
    } else {
      const overCard = currentRetro.cards.find(c => c._id === overId);
      if (overCard) {
        targetColumnId = overCard.columnId;
      }
    }

    if (targetColumnId && activeCard.columnId !== targetColumnId) {
      // Optimistic update
      setCurrentRetro(prev => ({
        ...prev,
        cards: prev.cards.map(c => c._id === activeId ? { ...c, columnId: targetColumnId } : c)
      }));

      // Persist
      try {
        await retroService.updateCard(currentRetro._id, activeId, { columnId: targetColumnId });
      } catch (err) {
        console.error('Erro ao mover card:', err);
        // Revert on error could be implemented here
      }
    }
  };

  if (loading || !currentRetro) {
    return <div className="page-container"><p>Carregando retrospectiva...</p></div>;
  }

  const currentIndex = retros.findIndex(r => r._id === currentRetro._id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < retros.length - 1;

  if (currentRetro.status === 'waiting') {
    return (
      <div className="retro-board-container">
        {currentRetro.backgroundImage && (
          <div 
            className="retro-bg" 
            style={{ backgroundImage: `url(${currentRetro.backgroundImage})` }}
          />
        )}
        {!currentRetro.backgroundImage && <div className="retro-bg no-image" />}
        
        <div className="retro-welcome-screen" style={{
          position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px'
        }}>
          <div className="glass-panel" style={{
            padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', maxWidth: '600px', width: '100%'
          }}>
            <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px' }}>{currentRetro.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
              Aguardando o facilitador iniciar a retrospectiva...
            </p>
            {user?.role !== 'guest' && (
              <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '16px 32px' }} onClick={() => updateRetroStatus('active')}>
                Iniciar Retrospectiva
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-board-container">
      {currentRetro.backgroundImage && (
        <div 
          className="retro-bg" 
          style={{ backgroundImage: `url(${currentRetro.backgroundImage})` }}
        />
      )}
      {!currentRetro.backgroundImage && <div className="retro-bg no-image" />}

      <div className="retro-content">
        <header className="retro-header">
          <div className="retro-title-section" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setCurrentRetro(retros[currentIndex + 1])} 
              disabled={!hasNext}
              className="btn-icon"
              style={{ background: 'transparent', border: 'none', cursor: hasNext ? 'pointer' : 'default', color: 'var(--text-primary)', opacity: hasNext ? 1 : 0.3, padding: '4px' }}
              title="Retrospectiva Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div style={{ textAlign: 'center', margin: '0 8px' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{currentRetro.title}</h1>
            </div>

            <button 
              onClick={() => setCurrentRetro(retros[currentIndex - 1])} 
              disabled={!hasPrevious}
              className="btn-icon"
              style={{ background: 'transparent', border: 'none', cursor: hasPrevious ? 'pointer' : 'default', color: 'var(--text-primary)', opacity: hasPrevious ? 1 : 0.3, padding: '4px' }}
              title="Próxima Retrospectiva"
            >
              <ChevronRight size={24} />
            </button>

            {hasPrevious && (
              <button 
                onClick={() => setCurrentRetro(retros[0])} 
                className="btn-icon"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
                title="Ir para a mais recente"
              >
                <ChevronsRight size={24} />
              </button>
            )}
          </div>

          <div className="retro-actions">
            <select className="select-retro" value={currentRetro._id} onChange={handleRetroSelect}>
              {retros.map(r => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
              <option value="new">+ Criar Nova</option>
            </select>
            
            {user?.role !== 'guest' && (
              <>
                <button className="btn-secondary" onClick={handleExportMarkdown} title="Copiar para o clipboard">
                  <Copy size={18} /> Exportar MD
                </button>
                <button className="btn-secondary" onClick={() => updateRetroStatus('waiting')} title="Pausar Visão">
                  <PauseCircle size={18} /> Pausar Visão
                </button>
                <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
                  <Settings2 size={18} /> Tema & Colunas
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleDeleteRetro}
                  disabled={currentRetro.cards && currentRetro.cards.length > 0}
                  title={currentRetro.cards && currentRetro.cards.length > 0 ? "Remova todos os cards antes de excluir" : "Excluir Retrospectiva"}
                  style={{ color: currentRetro.cards && currentRetro.cards.length > 0 ? 'inherit' : 'var(--accent-danger)' }}
                >
                  <Trash2 size={18} /> Excluir
                </button>
              </>
            )}
          </div>
        </header>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {currentRetro.columns.map(col => {
              const colCards = currentRetro.cards.filter(c => c.columnId === col._id);
              return (
                <RetroColumn 
                  key={col._id} 
                  column={col} 
                  cards={colCards} 
                  onAddCard={handleAddCard}
                  onVoteCard={handleVoteCard}
                  onDeleteCard={handleDeleteCard}
                  onEditCard={handleEditCard}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      <RetroSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        retro={currentRetro}
        onSaved={(updated) => {
          setCurrentRetro(updated);
          setRetros(retros.map(r => r._id === updated._id ? updated : r));
        }}
      />
    </div>
  );
};

export default RetroBoard;
