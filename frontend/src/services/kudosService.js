import api from './api';

export const getKudosBoards = async () => {
  const response = await api.get('/kudos');
  return response.data;
};

export const getKudosBoardById = async (id) => {
  const response = await api.get(`/kudos/${id}`);
  return response.data;
};

export const createKudosBoard = async (data) => {
  const response = await api.post('/kudos', data);
  return response.data;
};

export const updateKudosBoardTheme = async (id, data) => {
  const response = await api.put(`/kudos/${id}`, data);
  return response.data;
};

export const deleteKudosBoard = async (id) => {
  const response = await api.delete(`/kudos/${id}`);
  return response.data;
};

export const addKudo = async (id, kudoData) => {
  const response = await api.post(`/kudos/${id}/kudos`, kudoData);
  return response.data;
};

export const updateKudo = async (id, kudoId, data) => {
  const response = await api.put(`/kudos/${id}/kudos/${kudoId}`, data);
  return response.data;
};

export const deleteKudo = async (id, kudoId) => {
  const response = await api.delete(`/kudos/${id}/kudos/${kudoId}`);
  return response.data;
};

export const toggleVote = async (id, kudoId, user) => {
  const response = await api.post(`/kudos/${id}/kudos/${kudoId}/vote`, {
    uid: user.id || user.uid,
    name: user.name
  });
  return response.data;
};
