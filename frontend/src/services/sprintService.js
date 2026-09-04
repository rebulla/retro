import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sprints`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const getActiveSprint = async () => {
  const response = await api.get('/active');
  return response.data;
};

export const updateSprint = async (id, data) => {
  const response = await api.put(`/${id}`, data);
  return response.data;
};

export const createSprint = async (data) => {
  const response = await api.post('/', data);
  return response.data;
};

export const getAllSprints = async () => {
  const response = await api.get('/');
  return response.data;
};

export const activateSprint = async (id) => {
  const response = await api.put(`/${id}/activate`);
  return response.data;
};

export const deleteSprint = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};
