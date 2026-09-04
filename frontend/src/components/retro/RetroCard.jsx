import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ThumbsUp, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const RetroCard = ({ card, onVote, onDelete, onEdit }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.text);

  useEffect(() => {
    setEditValue(card.text);
  }, [card.text]);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._id, data: { ...card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const voteCount = card.voters?.length ?? card.votes ?? 0;
  const votersList = card.voters && card.voters.length > 0 
    ? card.voters.map(v => v.name).join(', ') 
    : "Ninguém curtiu ainda";
  
  const hasVoted = user && card.voters?.some(v => v.uid === user.id);

  const handleSave = () => {
    if (editValue.trim() !== card.text) {
      onEdit && onEdit(card._id, editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`retro-card ${isDragging ? 'dragging' : ''}`}
      {...attributes} 
      {...listeners}
    >
      {isEditing ? (
        <textarea
          value={editValue}
          autoFocus
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when focusing
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          style={{ 
            width: '100%', 
            minHeight: '60px',
            border: '1px solid var(--border-color)', 
            borderRadius: '4px',
            background: 'var(--bg-tertiary)', 
            resize: 'none', 
            color: 'var(--text-primary)', 
            fontFamily: 'inherit', 
            outline: 'none',
            padding: '4px'
          }}
        />
      ) : (
        <div 
          className="card-text" 
          onPointerDown={(e) => { 
            // We shouldn't stopPropagation entirely or dnd won't work, 
            // but we can rely on onClick or onDoubleClick to edit
          }}
          onClick={(e) => {
            if (!isDragging) {
              setIsEditing(true);
            }
          }}
          style={{ cursor: 'text' }}
        >
          {card.text}
        </div>
      )}
      <div className="card-footer">
        <button 
          className={`vote-btn ${hasVoted ? 'voted' : ''}`} 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); onVote(card._id); }}
          title={votersList}
          style={{ color: hasVoted ? 'var(--accent-primary)' : 'inherit', fontWeight: hasVoted ? 'bold' : 'normal' }}
        >
          <ThumbsUp size={14} /> {voteCount}
        </button>
        {user?.role !== 'guest' && (
          <button 
            className="delete-btn" 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (window.confirm("Tem certeza que deseja excluir este card?")) {
                onDelete(card._id); 
              }
            }}
            title="Excluir card"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default RetroCard;
