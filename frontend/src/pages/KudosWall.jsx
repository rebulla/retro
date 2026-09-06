import React, { useState, useEffect } from 'react';
import { Settings2, PlusCircle, Trash2, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import KudoCard from '../components/kudos/KudoCard';
import KudosSettingsModal from '../components/kudos/KudosSettingsModal';
import KudosAddModal from '../components/kudos/KudosAddModal';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import * as kudosService from '../services/kudosService';
import './KudosWall.css';

const KudosWall = () => {
  const { user, activeSquad } = useAuth();
  const socket = useSocket();
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeSquad) {
      fetchBoards();
    } else {
      setBoards([]);
      setCurrentBoard(null);
      setLoading(false);
    }
  }, [activeSquad]);

  useEffect(() => {
    if (!socket || !currentBoard) return;

    socket.emit('join_kudos', currentBoard._id);

    const handleKudosUpdated = (updatedBoard) => {
      if (updatedBoard._id === currentBoard._id) {
        setCurrentBoard(updatedBoard);
        setBoards(prev => prev.map(b => b._id === updatedBoard._id ? updatedBoard : b));
      }
    };

    socket.on('kudos_updated', handleKudosUpdated);

    return () => {
      socket.emit('leave_kudos', currentBoard._id);
      socket.off('kudos_updated', handleKudosUpdated);
    };
  }, [socket, currentBoard?._id]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const data = await kudosService.getKudosBoards();
      setBoards(data);
      if (data.length > 0) {
        setCurrentBoard(data[0]);
      } else {
        const newBoard = await kudosService.createKudosBoard({ title: 'Mural de Kudos Inicial' });
        setBoards([newBoard]);
        setCurrentBoard(newBoard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardSelect = async (e) => {
    const id = e.target.value;
    if (id === 'new') {
      const newBoard = await kudosService.createKudosBoard({ title: 'Novo Mural de Kudos' });
      setBoards([newBoard, ...boards]);
      setCurrentBoard(newBoard);
    } else {
      const selected = boards.find(b => b._id === id);
      setCurrentBoard(selected);
    }
  };

  const handleVoteKudo = async (kudoId) => {
    try {
      if (!user) return;
      const uid = user.id || user.uid;
      
      // Optimistic update
      setCurrentBoard(prev => {
        const updatedKudos = prev.kudos.map(k => {
          if (k._id === kudoId) {
            const hasVoted = k.voters?.some(v => v.uid === uid);
            const newVoters = hasVoted 
              ? k.voters.filter(v => v.uid !== uid)
              : [...(k.voters || []), { uid, name: user.name }];
            return { ...k, voters: newVoters, votes: newVoters.length };
          }
          return k;
        });
        return { ...prev, kudos: updatedKudos };
      });

      await kudosService.toggleVote(currentBoard._id, kudoId, user);
      // Socket will confirm the UI
    } catch (err) {
      console.error('Erro ao votar:', err);
      fetchBoards(); // Revert
    }
  };

  const handleUpdateKudo = async (kudoId, updatedData) => {
    try {
      // Optimistic update
      const updatedKudos = currentBoard.kudos.map(k => 
        k._id === kudoId ? { ...k, ...updatedData } : k
      );
      setCurrentBoard(prev => ({ ...prev, kudos: updatedKudos }));

      await kudosService.updateKudo(currentBoard._id, kudoId, {
        uid: user.id || user.uid,
        ...updatedData
      });
      // Socket will confirm the update
    } catch (err) {
      console.error('Erro ao atualizar kudo:', err);
      // Revert optimistic update (could refetch, but a simple alert is fine for now)
      alert('Não foi possível atualizar o Kudo. Tente novamente.');
      fetchBoards(); // Refetch to revert
    }
  };

  const handleDeleteKudo = async (kudoId) => {
    if (window.confirm("Deseja realmente excluir este Kudo?")) {
      try {
        // Optimistic update
        setCurrentBoard(prev => ({
          ...prev,
          kudos: prev.kudos.filter(k => k._id !== kudoId)
        }));

        await kudosService.deleteKudo(currentBoard._id, kudoId);
        // Socket will confirm the UI
      } catch (err) {
        console.error('Erro ao excluir:', err);
        fetchBoards(); // Revert
      }
    }
  };

  const handleDeleteBoard = async () => {
    if (currentBoard.kudos && currentBoard.kudos.length > 0) {
      alert("Não é possível excluir um mural que possui kudos.");
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir este mural?")) {
      try {
        await kudosService.deleteKudosBoard(currentBoard._id);
        const newBoards = boards.filter(b => b._id !== currentBoard._id);
        setBoards(newBoards);
        if (newBoards.length > 0) {
          setCurrentBoard(newBoards[0]);
        } else {
          const newBoard = await kudosService.createKudosBoard({ title: 'Mural de Kudos Inicial' });
          setBoards([newBoard]);
          setCurrentBoard(newBoard);
        }
      } catch (err) {
        console.error("Erro ao excluir mural:", err);
      }
    }
  };

  if (loading || !currentBoard) {
    return <div className="page-container"><p>Carregando mural...</p></div>;
  }

  const currentIndex = boards.findIndex(b => b._id === currentBoard._id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < boards.length - 1;

  // Sort kudos by date descending (newest first)
  const sortedKudos = [...(currentBoard.kudos || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="kudos-board-container">
      {currentBoard.backgroundImage && (
        <div 
          className="kudos-bg" 
          style={{ backgroundImage: `url(${currentBoard.backgroundImage})` }}
        />
      )}
      {!currentBoard.backgroundImage && <div className="kudos-bg no-image" />}

      <div className="kudos-content">
        <header className="kudos-header">
          <div className="kudos-title-section" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setCurrentBoard(boards[currentIndex + 1])} 
              disabled={!hasNext}
              className="btn-icon"
              style={{ background: 'transparent', border: 'none', cursor: hasNext ? 'pointer' : 'default', color: 'var(--text-primary)', opacity: hasNext ? 1 : 0.3, padding: '4px' }}
              title="Mural Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div style={{ textAlign: 'center', margin: '0 8px' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{currentBoard.title}</h1>
            </div>

            <button 
              onClick={() => setCurrentBoard(boards[currentIndex - 1])} 
              disabled={!hasPrevious}
              className="btn-icon"
              style={{ background: 'transparent', border: 'none', cursor: hasPrevious ? 'pointer' : 'default', color: 'var(--text-primary)', opacity: hasPrevious ? 1 : 0.3, padding: '4px' }}
              title="Próximo Mural"
            >
              <ChevronRight size={24} />
            </button>

            {hasPrevious && (
              <button 
                onClick={() => setCurrentBoard(boards[0])} 
                className="btn-icon"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
                title="Ir para o mais recente"
              >
                <ChevronsRight size={24} />
              </button>
            )}
          </div>

          <div className="kudos-actions">
            <select className="select-kudos" value={currentBoard._id} onChange={handleBoardSelect}>
              {boards.map(b => (
                <option key={b._id} value={b._id}>{b.title}</option>
              ))}
              <option value="new">+ Criar Novo</option>
            </select>
            
            {user?.role !== 'guest' && (
              <>
                <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
                  <Settings2 size={18} /> Configurar Mural
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleDeleteBoard}
                  disabled={currentBoard.kudos && currentBoard.kudos.length > 0}
                  title={currentBoard.kudos && currentBoard.kudos.length > 0 ? "Remova todos os kudos antes de excluir" : "Excluir Mural"}
                  style={{ color: currentBoard.kudos && currentBoard.kudos.length > 0 ? 'inherit' : 'var(--accent-danger)' }}
                >
                  <Trash2 size={18} /> Excluir
                </button>
              </>
            )}
          </div>
        </header>

        <div className="kudos-main">
          {currentBoard.introduction && (
            <div className="kudos-intro glass-panel">
              <p>{currentBoard.introduction}</p>
              {user?.role !== 'guest' && (
                <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
                  <PlusCircle size={18} /> Enviar Kudo
                </button>
              )}
            </div>
          )}

          <div className="kudos-grid">
            {sortedKudos.map(kudo => (
              <KudoCard 
                key={kudo._id} 
                kudo={kudo} 
                onVote={handleVoteKudo} 
                onUpdate={handleUpdateKudo}
                onDelete={handleDeleteKudo} 
              />
            ))}
            {sortedKudos.length === 0 && (
              <div className="no-kudos-message">
                <p>Nenhum Kudo enviado ainda. Seja o primeiro a reconhecer alguém da equipe!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <KudosSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        board={currentBoard}
        onSaved={(updated) => {
          setCurrentBoard(updated);
          setBoards(boards.map(b => b._id === updated._id ? updated : b));
        }}
      />

      <KudosAddModal 
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        boardId={currentBoard._id}
      />
    </div>
  );
};

export default KudosWall;
