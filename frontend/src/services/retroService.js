import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getRetrospectives = async () => {
  const response = await axios.get(`${API_URL}/retrospectives`);
  return response.data;
};

export const getRetrospectiveById = async (id) => {
  const response = await axios.get(`${API_URL}/retrospectives/${id}`);
  return response.data;
};

export const createRetrospective = async (data) => {
  const response = await axios.post(`${API_URL}/retrospectives`, data);
  return response.data;
};

export const updateRetrospectiveTheme = async (id, data) => {
  const response = await axios.put(`${API_URL}/retrospectives/${id}`, data);
  return response.data;
};

export const addCard = async (retroId, cardData) => {
  const response = await axios.post(`${API_URL}/retrospectives/${retroId}/cards`, cardData);
  return response.data;
};

export const updateCard = async (retroId, cardId, cardData) => {
  const response = await axios.put(`${API_URL}/retrospectives/${retroId}/cards/${cardId}`, cardData);
  return response.data;
};

export const deleteCard = async (retroId, cardId) => {
  const response = await axios.delete(`${API_URL}/retrospectives/${retroId}/cards/${cardId}`);
  return response.data;
};

export const deleteRetrospective = async (retroId) => {
  const response = await axios.delete(`${API_URL}/retrospectives/${retroId}`);
  return response.data;
};

export const toggleVote = async (retroId, cardId, user) => {
  const response = await axios.post(`${API_URL}/retrospectives/${retroId}/cards/${cardId}/vote`, {
    uid: user.id,
    name: user.name
  });
  return response.data;
};
