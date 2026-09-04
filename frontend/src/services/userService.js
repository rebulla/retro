import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const getAllUsers = async () => {
  const response = await api.get('/');
  return response.data;
};
