import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://104.252.111.131/api'; // Замени на IP твоего VDS

const api = axios.create({
  baseURL: API_URL,
});

// Перехватчик: добавляем токен к каждому запросу
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик: обрабатываем 401 (токен истёк)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      // Здесь позже можно добавить редирект на экран логина
    }
    return Promise.reject(error);
  }
);

export default api;