import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const activeSquadId = localStorage.getItem('activeSquadId');
  if (activeSquadId) {
    config.headers['x-squad-id'] = activeSquadId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
