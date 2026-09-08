import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, Briefcase, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CustomSelect from '../components/common/CustomSelect';
import './AdminArea.css';

const ROLE_LABELS = {
  dev: 'Dev',
  po: 'PO',
  qa: 'QA',
  scrum_master: 'SM',
  admin: 'Admin'
};

const formatRole = (role) => ROLE_LABELS[role] || role;

const AdminArea = () => {
  const auth = useAuth();
  const { user, refreshUser } = auth;
  const [users, setUsers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState(null);
  const [assignSquadId, setAssignSquadId] = useState('');
  const [assignRole, setAssignRole] = useState('dev');
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

  const openAssignModal = (u) => {
    setUserToAssign(u);
    setAssignSquadId('');
    setAssignRole('dev');
    setIsAssignModalOpen(true);
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
      }
    } catch (error) {
      console.error("Erro ao atualizar squad:", error);
    }
  };

  const deleteSquad = async (squadId) => {
    if (!window.confirm("Deseja realmente remover esta Squad?")) return;
    try {
      const res = await fetch(`${API_URL}/squads/${squadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao deletar squad');
      }
    } catch (error) {
      console.error("Erro ao remover squad:", error);
      alert('Erro ao remover squad');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Deseja realmente excluir este usuário permanentemente?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
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
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Status</th>
                    <th>Squads & Role</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-info-cell">
                          <img src={u.avatar} alt={u.name} />
                          <div>
                            <h3>{u.name}</h3>
                            <p>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${u.status}`}>{u.status}</span>
                      </td>
                      <td>
                        {u.status === 'approved' ? (
                          <>
                            <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {u.squads.map((sq, idx) => (
                                <span key={idx} className="squad-tag">
                                  {sq.squad?.name} ({formatRole(sq.role)})
                                  <button onClick={() => removeSquad(u._id, sq.squad._id)} title="Remover"><X size={14} /></button>
                                </span>
                              ))}
                            </div>
                          </>
                        ) : u.status === 'pending' ? (
                          <span style={{ color: 'var(--text-secondary)' }}>Aguardando atribuição</span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div className="user-actions">
                          {u.status === 'pending' && (
                            <>
                              <button className="btn-success" onClick={() => openAssignModal(u)}><Check size={16}/> Aprovar</button>
                              <button className="btn-danger" onClick={() => rejectUser(u._id)}><X size={16}/> Rejeitar</button>
                            </>
                          )}
                          {u.status === 'approved' && (
                            <>
                              <button className="btn-primary" onClick={() => openAssignModal(u)}><PlusCircle size={16}/> Squad</button>
                              <button className="btn-danger" onClick={() => rejectUser(u._id)}><X size={16}/> Restringir</button>
                              <button className="btn-secondary" onClick={() => deleteUser(u._id)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={16}/> Excluir</button>
                            </>
                          )}
                          {u.status === 'rejected' && (
                            <>
                              <button className="btn-danger" onClick={() => deleteUser(u._id)}><Trash2 size={16}/> Excluir</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div key={s._id} className="squad-card glass-panel">
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
                      <div className="squad-card-header">
                        <div>
                          <h3>
                            {s.name}
                            <span className="user-count-pill" title={`${s.userCount || 0} pessoa(s) vinculada(s)`}>{s.userCount || 0}</span>
                          </h3>
                          <p>Criado em: {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="squad-card-actions">
                        <button className="btn-secondary" onClick={() => {
                          setEditingSquad(s._id);
                          setEditSquadName(s.name);
                        }}>
                          Editar Nome
                        </button>
                        <button className="btn-danger" onClick={() => deleteSquad(s._id)}>
                          <Trash2 size={16} /> Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isAssignModalOpen && userToAssign && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Atribuir Squad & Role</h2>
              <button className="btn-icon" onClick={() => setIsAssignModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p>Adicionar squad para <strong>{userToAssign.name}</strong>:</p>
              
              <div className="form-group">
                <label>Squad</label>
                <CustomSelect 
                  value={assignSquadId} 
                  onChange={(e) => setAssignSquadId(e.target.value)}
                  options={squads.map(s => ({ value: s._id, label: s.name }))}
                  placeholder="Selecione uma Squad..."
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <CustomSelect 
                  value={assignRole} 
                  onChange={(e) => setAssignRole(e.target.value)}
                  options={[
                    { value: 'dev', label: 'Dev' },
                    { value: 'po', label: 'PO' },
                    { value: 'qa', label: 'QA' },
                    { value: 'scrum_master', label: 'SM' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  placeholder="Selecione a Role..."
                />
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => {
                if (!assignSquadId) return alert('Selecione uma Squad!');
                approveUser(userToAssign._id, assignSquadId, assignRole);
                setIsAssignModalOpen(false);
              }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArea;
