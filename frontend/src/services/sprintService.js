import api from './api';

export const getActiveSprint = async () => {
  const response = await api.get('/sprints/active');
  return response.data;
};

export const updateSprint = async (id, data) => {
  const response = await api.put(`/${id}`, data);
  return response.data;
};

export const createSprint = async (sprintData) => {
  const response = await api.post('/sprints', sprintData);
  return response.data;
};

export const getAllSprints = async () => {
  const response = await api.get('/sprints');
  return response.data;
};

export const activateSprint = async (id) => {
  const response = await api.put(`/sprints/${id}/activate`);
  return response.data;
};

export const deleteSprint = async (id) => {
  const response = await api.delete(`/sprints/${id}`);
  return response.data;
};
