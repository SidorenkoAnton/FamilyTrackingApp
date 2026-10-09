import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';
import { User, AuthResponse } from '../types';
import {
  ensureTracking,
  stopBackgroundTracking,
} from '../services/BackgroundLocationService';

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // При запуске приложения проверяем, есть ли сохранённый токен
  useEffect(() => {
    loadStoredToken();
  }, []);

  // При возврате приложения в foreground перепроверяем, нужен ли трекинг:
  // роль «ребёнок» могла появиться уже после запуска приложения
  // (например, участника добавили с другого устройства).
  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        ensureTracking();
      }
    });

    return () => subscription.remove();
  }, [user]);

  const loadStoredToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('access_token');
      if (storedToken) {
        setToken(storedToken);
        const response = await api.get('/auth/me');
        setUser(response.data);
        await ensureTracking();
      }
    } catch (error) {
      console.log('Ошибка загрузки токена:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token } = response.data;
    
    await SecureStore.setItemAsync('access_token', access_token);
    setToken(access_token);
    
    const meResponse = await api.get('/auth/me');
    setUser(meResponse.data);
    await ensureTracking();
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password, name });
    const { access_token } = response.data;
    
    await SecureStore.setItemAsync('access_token', access_token);
    setToken(access_token);
    
    const meResponse = await api.get('/auth/me');
    setUser(meResponse.data);
    await ensureTracking();
  };

  const logout = async () => {
    await stopBackgroundTracking();
    await SecureStore.deleteItemAsync('access_token');
    setToken(null);
    setUser(null);
  };
  

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);