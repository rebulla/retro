import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import RetroCard from './RetroCard';

const RetroColumn = ({ column, cards, onAddCard, onVoteCard, onDeleteCard, onEditCard }) => {
  const [newCardText, setNewCardText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column._id,
  });

  const handleAdd = () => {
    if (newCardText.trim()) {
      onAddCard(column._id, newCardText.trim());
      setNewCardText('');
      setIsAdding(false);
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    const votesA = a.voters?.length ?? a.votes ?? 0;
    const votesB = b.voters?.length ?? b.votes ?? 0;
    return votesB - votesA;
  });

  return (
    <div className="retro-column" ref={setNodeRef}>
      <div className="column-header">
        <h3 style={{ color: `var(--accent-${column.color || 'primary'})` }}>{column.name}</h3>
        {column.description && <p className="column-desc">{column.description}</p>}
      </div>

      <div className="cards-container">
        <SortableContext items={sortedCards.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {sortedCards.map(card => (
            <RetroCard 
              key={card._id} 
              card={card} 
              onVote={onVoteCard}
              onDelete={onDeleteCard}
              onEdit={onEditCard}
            />
          ))}
        </SortableContext>
      </div>

      {isAdding ? (
        <div className="new-card-input" style={{ marginTop: '16px' }}>
          <textarea 
            autoFocus
            placeholder="Digite sua ideia..." 
            value={newCardText}
            onChange={(e) => setNewCardText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <div className="new-card-actions">
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsAdding(false)}>Cancelar</button>
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleAdd}>Salvar</button>
          </div>
        </div>
      ) : (
        <button className="add-card-btn" style={{ marginTop: '16px' }} onClick={() => setIsAdding(true)}>
          + Adicionar Card
        </button>
      )}
    </div>
  );
};

export default RetroColumn;
