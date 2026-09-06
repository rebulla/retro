import api from './api';

export const getRetrospectives = async () => {
  const response = await api.get(`/retrospectives`);
  return response.data;
};

export const getRetrospectiveById = async (id) => {
  const response = await api.get(`/retrospectives/${id}`);
  return response.data;
};

export const createRetrospective = async (data) => {
  const response = await api.post(`/retrospectives`, data);
  return response.data;
};

export const updateRetrospectiveTheme = async (id, data) => {
  const response = await api.put(`/retrospectives/${id}`, data);
  return response.data;
};

export const addCard = async (id, cardData) => {
  const response = await api.post(`/retrospectives/${id}/cards`, cardData);
  return response.data;
};

export const updateCard = async (id, cardId, data) => {
  const response = await api.put(`/retrospectives/${id}/cards/${cardId}`, data);
  return response.data;
};

export const deleteCard = async (id, cardId) => {
  const response = await api.delete(`/retrospectives/${id}/cards/${cardId}`);
  return response.data;
};

export const deleteRetrospective = async (id) => {
  const response = await api.delete(`/retrospectives/${id}`);
  return response.data;
};

export const toggleVote = async (id, cardId, user) => {
  const response = await api.post(`/retrospectives/${id}/cards/${cardId}/vote`, {
    uid: user.id,
    name: user.name
  });
  return response.data;
};
