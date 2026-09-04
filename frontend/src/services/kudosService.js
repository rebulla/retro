import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/kudos`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const getKudosBoards = async () => {
  const response = await api.get('/');
  return response.data;
};

export const getKudosBoardById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const createKudosBoard = async (data) => {
  const response = await api.post('/', data);
  return response.data;
};

export const updateKudosBoardTheme = async (id, data) => {
  const response = await api.put(`/${id}`, data);
  return response.data;
};

export const deleteKudosBoard = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const addKudo = async (id, kudoData) => {
  const response = await api.post(`/${id}/kudos`, kudoData);
  return response.data;
};

export const updateKudo = async (id, kudoId, data) => {
  const response = await api.put(`/${id}/kudos/${kudoId}`, data);
  return response.data;
};

export const deleteKudo = async (id, kudoId) => {
  const response = await api.delete(`/${id}/kudos/${kudoId}`);
  return response.data;
};

export const toggleVote = async (id, kudoId, user) => {
  const response = await api.post(`/${id}/kudos/${kudoId}/vote`, {
    uid: user.id || user.uid,
    name: user.name
  });
  return response.data;
};
