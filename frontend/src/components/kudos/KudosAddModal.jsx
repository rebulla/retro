import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as kudosService from '../../services/kudosService';
import CustomSelect from '../common/CustomSelect';

const KudosAddModal = ({ isOpen, onClose, boardId }) => {
  const { user } = useAuth();
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [badge, setBadge] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const BADGES = [
    'Trabalho em Equipe',
    'Resolução de Problemas',
    'Inovação',
    'Mão na Massa',
    'Boa Ideia',
    'Salvou o Dia!'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!to.trim() || !message.trim()) return;

    try {
      setLoading(true);
      await kudosService.addKudo(boardId, {
        from: {
          uid: user.id || user.uid,
          name: user.name,
          avatar: user.avatar
        },
        to: to.trim(),
        message: message.trim(),
        badge
      });
      setTo('');
      setMessage('');
      setBadge('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar Kudo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="settings-modal glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Novo Kudo</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Para quem é esse Kudo?</label>
            <input 
              type="text" 
              className="input-field" 
              value={to} 
              onChange={e => setTo(e.target.value)}
              placeholder="Ex: Maria da Silva"
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Mensagem</label>
            <textarea 
              className="input-field" 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Escreva seu agradecimento aqui..."
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Badge (Opcional)</label>
            <CustomSelect 
              value={badge} 
              onChange={e => setBadge(e.target.value)}
              options={BADGES.map(b => ({ value: b, label: b }))}
              placeholder="Selecione uma categoria..."
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || !to.trim() || !message.trim()}>
              {loading ? 'Enviando...' : <><Send size={18} /> Enviar Kudo</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KudosAddModal;
