import React, { useState, useRef, useEffect } from 'react';
import { Heart, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './KudoCard.css';

const BADGE_EMOJIS = {
  'Trabalho em Equipe': '🤝',
  'Resolução de Problemas': '🧠',
  'Inovação': '💡',
  'Mão na Massa': '🛠️',
  'Boa Ideia': '🎯',
  'Salvou o Dia!': '🦸'
};

const KudoCard = ({ kudo, onVote, onUpdate, onDelete, readOnly = false }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(kudo.message);
  const [editBadge, setEditBadge] = useState(kudo.badge || '');
  
  const textareaRef = useRef(null);
  const cardRef = useRef(null);
  const currentUserId = user?.id || user?.uid;
  const hasVoted = kudo.voters?.some(v => v.uid === currentUserId);
  const isOwner = kudo.from.uid === currentUserId;
  const canDelete = !readOnly && (user?.role === 'admin' || isOwner);
  const canEdit = !readOnly && isOwner;

  const emoji = kudo.badge ? (BADGE_EMOJIS[kudo.badge] || '🌟') : null;

  useEffect(() => {
    setEditMessage(kudo.message);
    setEditBadge(kudo.badge || '');
  }, [kudo.message, kudo.badge]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && cardRef.current && !cardRef.current.contains(event.target)) {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, kudo.message, kudo.badge]);

  const handleSave = () => {
    const hasMessageChange = editMessage.trim() !== kudo.message;
    const hasBadgeChange = editBadge !== (kudo.badge || '');

    if (editMessage.trim() && (hasMessageChange || hasBadgeChange)) {
      onUpdate(kudo._id, { 
        message: editMessage.trim(),
        badge: editBadge
      });
    } else {
      setEditMessage(kudo.message);
      setEditBadge(kudo.badge || '');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditMessage(kudo.message);
    setEditBadge(kudo.badge || '');
    setIsEditing(false);
  };

  return (
    <div className="glass-card kudo-card" ref={cardRef}>
      <div className="kudo-actions-top">
        {canEdit && !isEditing && (
          <button className="kudo-action-btn edit" onClick={() => setIsEditing(true)} title="Editar Kudo">
            <Edit2 size={16} />
          </button>
        )}
        {canDelete && !isEditing && (
          <button className="kudo-action-btn delete" onClick={() => onDelete(kudo._id)} title="Excluir Kudo">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      <div className="kudo-header" style={{ marginRight: readOnly ? '0' : undefined }}>
        <div className="kudo-avatar-container">
          <img src={kudo.from.avatar} alt={kudo.from.name} className="kudo-avatar" />
          {emoji && (
            <div className="kudo-badge-emoji" title={kudo.badge}>
              {emoji}
            </div>
          )}
        </div>
        
        <div className="kudo-meta">
          <div className="kudo-to">Para: <strong>{kudo.to}</strong></div>
          <div className="kudo-from">De: {kudo.from.name.split(' ')[0]}</div>
        </div>
      </div>
      
      <div className="kudo-body">
        {isEditing ? (
          <div className="kudo-edit-container">
            <select 
              className="kudo-edit-input"
              value={editBadge}
              onChange={(e) => setEditBadge(e.target.value)}
            >
              <option value="">Nenhum badge</option>
              {Object.keys(BADGE_EMOJIS).map(b => (
                <option key={b} value={b}>{BADGE_EMOJIS[b]} {b}</option>
              ))}
            </select>
            <textarea
              ref={textareaRef}
              className="kudo-edit-input"
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              rows={3}
            />
            <div className="kudo-edit-actions">
              <button className="kudo-btn-save" onClick={handleSave}><Check size={16} /></button>
              <button className="kudo-btn-cancel" onClick={handleCancel}><X size={16} /></button>
            </div>
          </div>
        ) : (
          <p onClick={() => canEdit && setIsEditing(true)} style={{ cursor: canEdit ? 'text' : 'default' }}>
            "{kudo.message}"
          </p>
        )}
      </div>
      
      {!readOnly && (
        <div className="kudo-footer">
          <button 
            className={`kudo-vote-btn ${hasVoted ? 'voted' : ''}`}
            onClick={() => onVote(kudo._id)}
          >
            <Heart size={16} className={hasVoted ? 'fill-current' : ''} />
            <span>{kudo.votes || 0}</span>
          </button>
          {kudo.voters?.length > 0 && (
            <div className="voters-tooltip">
              {kudo.voters.map(v => v.name).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KudoCard;
