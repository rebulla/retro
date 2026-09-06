import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AdminArea.css';

const AdminArea = () => {
  const auth = useAuth();
  const { user, refreshUser } = auth;
  const [users, setUsers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [newSquadName, setNewSquadName] = useState('');
  const [editingSquad, setEditingSquad] = useState(null);
  const [editSquadName, setEditSquadName] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, squadsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`),
        fetch(`${API_URL}/squads`)
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (squadsRes.ok) setSquads(await squadsRes.json());
    } catch (error) {
      console.error("Erro ao buscar dados admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSquad = async (e) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSquadName, description: '' })
      });
      if (res.ok) {
        setNewSquadName('');
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao criar squad:", error);
    }
  };

  const approveUser = async (userId, squadId, role) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squads: [{ squad: squadId, role }]
        })
      });
      if (res.ok) {
        if (userId === user.dbId) {
          await refreshUser();
        }
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
    }
  };

  const rejectUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao rejeitar usuário:", error);
    }
  };

  const removeSquad = async (userId, squadId) => {
    if (!window.confirm("Deseja realmente remover esta Squad do usuário?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/squads/${squadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (userId === user.dbId) {
          await refreshUser();
        }
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao remover squad do usuário:", error);
    }
  };

  const updateSquadName = async (squadId) => {
    if (!editSquadName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/squads/${squadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSquadName, description: '' })
      });
      if (res.ok) {
        setEditingSquad(null);
        fetchData();
        // optionally refresh user if they are in that squad and it changed name,
        // but not strictly necessary for simple name changes as we can rely on next reload
      }
    } catch (error) {
      console.error("Erro ao atualizar squad:", error);
    }
  };

  if (loading) {
    return <div className="admin-loading">Carregando painel admin...</div>;
  }

  return (
    <div className="admin-area">
      <header className="admin-header">
        <h1><Shield size={28} /> Administração do Sistema</h1>
      </header>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Usuários
        </button>
        <button 
          className={`tab-btn ${activeTab === 'squads' ? 'active' : ''}`}
          onClick={() => setActiveTab('squads')}
        >
          <Briefcase size={18} /> Squads
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>Gestão de Acessos</h2>
            <div className="users-list">
              {users.map(u => (
                <div key={u._id} className="user-card glass-panel">
                  <div className="user-info">
                    <img src={u.avatar} alt={u.name} />
                    <div>
                      <h3>{u.name}</h3>
                      <p>{u.email}</p>
                      <span className={`status-badge ${u.status}`}>{u.status}</span>
                    </div>
                  </div>
                  
                  {u.status === 'pending' && (
                    <div className="user-actions">
                      <select id={`squad-${u._id}`} className="admin-select">
                        <option value="">Selecione a Squad...</option>
                        {squads.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                      <select id={`role-${u._id}`} className="admin-select">
                        <option value="dev">Dev</option>
                        <option value="po">PO</option>
                        <option value="qa">QA</option>
                        <option value="scrum_master">Scrum Master</option>
                        <option value="admin">Squad Admin</option>
                      </select>
                      <button 
                        className="btn-success"
                        onClick={() => {
                          const squadId = document.getElementById(`squad-${u._id}`).value;
                          const role = document.getElementById(`role-${u._id}`).value;
                          if (squadId) approveUser(u._id, squadId, role);
                          else alert('Selecione uma Squad!');
                        }}
                      >
                        <Check size={18} /> Aprovar
                      </button>
                      <button className="btn-danger" onClick={() => rejectUser(u._id)}>
                        <X size={18} /> Rejeitar
                      </button>
                    </div>
                  )}

                  {u.status === 'approved' && (
                    <div className="user-approved-info">
                      <p>Global Role: <strong>{u.globalRole}</strong></p>
                      <div style={{ marginBottom: '8px' }}>
                        {u.squads.map((sq, idx) => (
                          <span key={idx} className="squad-tag" style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {sq.squad?.name} ({sq.role})
                            <button 
                              onClick={() => removeSquad(u._id, sq.squad._id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: 0, display: 'flex' }}
                              title="Remover"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      {/* Allow adding to another squad */}
                      <div className="user-actions" style={{ marginTop: '12px' }}>
                        <select id={`squad-add-${u._id}`} className="admin-select">
                          <option value="">Atribuir a outra Squad...</option>
                          {squads.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                        <select id={`role-add-${u._id}`} className="admin-select">
                          <option value="dev">Dev</option>
                          <option value="po">PO</option>
                          <option value="qa">QA</option>
                          <option value="scrum_master">Scrum Master</option>
                          <option value="admin">Squad Admin</option>
                        </select>
                        <button 
                          className="btn-success"
                          onClick={() => {
                            const squadId = document.getElementById(`squad-add-${u._id}`).value;
                            const role = document.getElementById(`role-add-${u._id}`).value;
                            if (squadId) approveUser(u._id, squadId, role);
                            else alert('Selecione uma Squad!');
                          }}
                        >
                          <Check size={18} /> Atribuir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'squads' && (
          <div className="admin-section">
            <h2>Gestão de Squads</h2>
            <form onSubmit={createSquad} className="create-squad-form glass-panel">
              <input 
                type="text" 
                placeholder="Nome da nova Squad" 
                value={newSquadName}
                onChange={(e) => setNewSquadName(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Criar Squad</button>
            </form>

            <div className="squads-list">
              {squads.map(s => (
                <div key={s._id} className="squad-card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {editingSquad === s._id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input 
                        type="text" 
                        value={editSquadName} 
                        onChange={e => setEditSquadName(e.target.value)} 
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                      />
                      <button className="btn-success" onClick={() => updateSquadName(s._id)}>Salvar</button>
                      <button className="btn-secondary" onClick={() => setEditingSquad(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {s.name}
                        </h3>
                        <p>Criado em: {new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button className="btn-secondary" onClick={() => {
                        setEditingSquad(s._id);
                        setEditSquadName(s.name);
                      }}>
                        Editar Nome
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArea;
